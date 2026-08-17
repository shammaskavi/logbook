import { useState } from "react";
import PartyFormModal from "@/components/settings/PartyFormModal";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { Plus, Trash2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { WorkOrderItem } from "@/types";
import { useWorkOrders, useAddWorkOrder, useUpdateWorkOrder, useParties, useJobWorkTypes } from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";
import ScanSlipCard from "@/components/work-order/ScanSlipCard";
import JobWorkFormModal from "@/components/settings/JobWorkFormModal";
import { useExtractWorkOrder } from "@/hooks/use-extraction";
import { prepareWorkOrder } from "@/lib/extraction/applyExtraction";

/**
 * A form row. `extracted_text` is what a scan read off the slip for this line —
 * kept so the user can see what to correct when it didn't match a job work.
 */
type FormItem = Partial<WorkOrderItem> & { extracted_text?: string };

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function WorkOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdit = !!id;

  const { data: workOrders = [] } = useWorkOrders();
  const { data: parties = [] } = useParties();
  const { data: jobTypes = [] } = useJobWorkTypes();
  const activeJobTypes = jobTypes.filter(j => j.active);
  const addWO = useAddWorkOrder();
  const updateWO = useUpdateWorkOrder();

  const existingOrder = isEdit ? workOrders.find(w => w.id === id) : null;

  const [receivedDate, setReceivedDate] = useState<Date | undefined>(
    existingOrder
      ? new Date(existingOrder.received_date)
      : new Date()
  );
  const [partyId, setPartyId] = useState(existingOrder?.party_id || "");
  const [workOrderNumber, setWorkOrderNumber] = useState(existingOrder?.work_order_number || "");
  const [items, setItems] = useState<FormItem[]>(
    existingOrder?.items || [{ id: generateId(), job_work_type_id: "", quantity: 0, pending_quantity: 0 }]
  );

  const [partyModalOpen, setPartyModalOpen] = useState(false);

  // ── Scanning a slip ──
  const extract = useExtractWorkOrder();
  const [scanWarnings, setScanWarnings] = useState<string[]>([]);
  const [scannedFrom, setScannedFrom] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [jobWorkModal, setJobWorkModal] = useState<{ index: number; name: string } | null>(null);

  const handleScan = async (file: File) => {
    setScanError(null);

    try {
      const { extracted, model } = await extract.mutateAsync(file);
      const prepared = prepareWorkOrder(extracted, parties, activeJobTypes);

      if (prepared.receivedDate) setReceivedDate(prepared.receivedDate);
      if (prepared.partyId) setPartyId(prepared.partyId);
      if (prepared.workOrderNumber) setWorkOrderNumber(prepared.workOrderNumber);

      if (prepared.items.length > 0) {
        setItems(
          prepared.items.map(item => ({
            id: generateId(),
            job_work_type_id: item.jobWorkTypeId ?? "",
            job_work_type_name: "",
            quantity: item.quantity,
            pending_quantity: item.quantity,
            extracted_text: item.extractedText,
          }))
        );
      }

      setScanWarnings(prepared.warnings);
      setScannedFrom(model);
    } catch (e) {
      setScanError(e instanceof Error ? e.message : "Something went wrong.");
      setScannedFrom(null);
      setScanWarnings([]);
    }
  };

  const dismissScan = () => {
    setScanError(null);
    setScannedFrom(null);
    setScanWarnings([]);
  };

  const addItem = () => {
    setItems([...items, { id: generateId(), job_work_type_id: "", quantity: 0, pending_quantity: 0 }]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: string | number) => {
    setItems(items.map((item, i) => {
      if (i !== idx) return item;
      const updated: FormItem = { ...item, [field]: value };
      if (field === "quantity" && !isEdit) {
        updated.pending_quantity = value as number;
      }
      return updated;
    }));
  };

  const handleSave = async () => {
    if (!receivedDate) { toast({ title: "Received date is required", variant: "destructive" }); return; }
    if (!workOrderNumber.trim()) { toast({ title: "Work order number is required", variant: "destructive" }); return; }

    if (!partyId) {
      toast({ title: "Select a party", variant: "destructive" });
      return;
    }

    const finalPartyName = parties.find(p => p.id === partyId)?.name || "";

    const validItems = items.filter(i => i.job_work_type_id && (i.quantity || 0) > 0);
    if (validItems.length === 0) { toast({ title: "Add at least one job work with quantity > 0", variant: "destructive" }); return; }

    const finalItems = validItems.map(i => ({
      id: i.id || generateId(),
      job_work_type_id: i.job_work_type_id!,
      job_work_type_name: activeJobTypes.find(j => j.id === i.job_work_type_id)?.name || "",
      quantity: i.quantity!,
      pending_quantity: Math.min(i.pending_quantity ?? i.quantity!, i.quantity!),
    }));

    try {
      if (isEdit && id) {
        await updateWO.mutateAsync({
          id,
          work_order_number: workOrderNumber.trim(),
          received_date: format(receivedDate, "yyyy-MM-dd"),
          party_id: partyId,
          party_name: finalPartyName,
          items: finalItems,
        });
        toast({ title: "Work order updated" });
      } else {
        await addWO.mutateAsync({
          work_order_number: workOrderNumber.trim(),
          received_date: format(receivedDate, "yyyy-MM-dd"),
          party_id: partyId,
          party_name: finalPartyName,
          items: finalItems,
        });
        toast({ title: "Work order created" });
      }
      navigate("/");
    } catch (e: any) {
      toast({ title: "Error saving work order", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{isEdit ? "Edit Work Order" : "New Work Order"}</h1>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => navigate("/")}>Cancel</Button>
          <Button onClick={handleSave} disabled={addWO.isPending || updateWO.isPending}>
            {(addWO.isPending || updateWO.isPending) ? "Saving..." : "Save Work Order"}
          </Button>
        </div>
      </div>

      {!isEdit && (
        <ScanSlipCard
          isScanning={extract.isPending}
          warnings={scanWarnings}
          scannedFrom={scannedFrom}
          error={scanError}
          onPickFile={handleScan}
          onDismiss={dismissScan}
        />
      )}

      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <Label className="mb-2 block text-sm font-medium">Received Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !receivedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {receivedDate ? format(receivedDate, "dd - MMM - yyyy") : "DD - MMM - YYYY"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={receivedDate} onSelect={setReceivedDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium">Party Name</Label>
            <div className="flex gap-2">
              <Select value={partyId} onValueChange={setPartyId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Party Name" />
                </SelectTrigger>
                <SelectContent>
                  {parties.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setPartyModalOpen(true)}
                title="Add new party"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium">Work Order Number</Label>
            <Input placeholder="Enter Number" value={workOrderNumber} onChange={e => setWorkOrderNumber(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_200px_60px] px-6 py-3 text-xs font-medium text-muted-foreground border-b border-border">
          <div>Job Work</div>
          <div>Quantity</div>
          <div></div>
        </div>

        {items.map((item, idx) => (
          <div key={item.id || idx} className="flex flex-col gap-3 px-6 py-4 border-b border-border md:grid md:grid-cols-[1fr_200px_60px] md:items-center md:gap-0">
            <div className="flex flex-col gap-1 md:pr-4">
              <span className="text-xs text-muted-foreground md:hidden">Job Work</span>
              <div className="flex gap-2">
                <Select value={item.job_work_type_id || ""} onValueChange={v => updateItem(idx, "job_work_type_id", v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select Job Work" /></SelectTrigger>
                  <SelectContent>
                    {activeJobTypes.map(j => <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                {/* Only offered for a scanned row that matched nothing — the slip
                    wording is the obvious name for the job work being created. */}
                {item.extracted_text && !item.job_work_type_id && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    title={`Add "${item.extracted_text}" as a job work`}
                    onClick={() => setJobWorkModal({ index: idx, name: item.extracted_text! })}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* What the slip actually said, so the user can correct rather than
                  reopen the photo. Shown until the row resolves to a job work. */}
              {item.extracted_text && !item.job_work_type_id && (
                <p className="text-xs text-amber-700 mt-0.5">
                  Slip reads &ldquo;{item.extracted_text}&rdquo; — pick the closest, or add it.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1 md:items-start">
              <span className="text-xs text-muted-foreground md:hidden">Quantity</span>
              <Input
                type="number"
                placeholder="Add Quantity"
                value={item.quantity || ""}
                onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 0)}
                className="w-full md:w-40"
                min={1}
              />
            </div>
            <button onClick={() => removeItem(idx)} className="self-end md:self-auto text-destructive hover:text-destructive/80 transition-colors p-2">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        <button onClick={addItem} className="flex items-center gap-2 px-6 py-3 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
          <Plus className="w-4 h-4" /> Add New Item
        </button>
      </div>

      <JobWorkFormModal
        open={jobWorkModal !== null}
        onClose={() => setJobWorkModal(null)}
        mode="create"
        initialName={jobWorkModal?.name}
        onSuccess={(created) => {
          if (jobWorkModal) {
            updateItem(jobWorkModal.index, "job_work_type_id", created.id);
          }
          setJobWorkModal(null);
        }}
      />

      <PartyFormModal
        open={partyModalOpen}
        onClose={() => setPartyModalOpen(false)}
        mode="create"
        onSuccess={(party) => {
          setPartyId(party.id);
          setPartyModalOpen(false);
        }}
      />
    </div>
  );
}
