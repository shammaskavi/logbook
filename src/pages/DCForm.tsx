import { useState } from "react";
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
import { useDeliveryChallans, useAddDeliveryChallan, useUpdateDeliveryChallan, useParties, useWorkOrders } from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";

export default function DCForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdit = !!id;
  const [step, setStep] = useState<1 | 2>(1);

  const { data: allDCs = [] } = useDeliveryChallans();
  const { data: parties = [] } = useParties();
  const { data: workOrders = [] } = useWorkOrders();

  const activeJobTypes = []; // removed useJobWorkTypes, so no activeJobTypes

  const addDC = useAddDeliveryChallan();
  const updateDC = useUpdateDeliveryChallan();

  const existing = isEdit ? allDCs.find(d => d.id === id) : null;

  // Auto-generate next DC number (numeric increment)
  const generateNextDCNumber = () => {
    const numericDCs = allDCs
      .map(dc => Number(dc.dc_number))
      .filter(n => !isNaN(n));

    if (numericDCs.length === 0) return "001";

    const max = Math.max(...numericDCs);
    return String(max + 1).padStart(3, "0");
  };

  const [generatedDate, setGeneratedDate] = useState<Date | undefined>(
    existing
      ? new Date(existing.generated_date)
      : new Date()
  );
  const [partyId, setPartyId] = useState(existing?.party_id || "");
  const [dcNumber, setDcNumber] = useState(
    existing?.dc_number || (isEdit ? "" : generateNextDCNumber())
  );
  const [transporterName, setTransporterName] = useState(existing?.transporter_name || "");

  const handlePartyChange = (val: string) => {
    setPartyId(val);
    setItems([]);
    setStep(1);
  };

  type DCFormItem = {
    work_order_id: string;
    work_order_item_id: string;
    job_work_type_name: string;
    pending_quantity: number;
    dc_quantity: number;
  };

  const [items, setItems] = useState<DCFormItem[]>([]);
  const [selectedWorkOrders, setSelectedWorkOrders] = useState<string[]>([]);

  const dueWorkOrders = workOrders.filter(
    wo => wo.party_id === partyId && wo.items.some(i => i.pending_quantity > 0)
  );

  const toggleWorkOrder = (workOrderId: string) => {
    setSelectedWorkOrders(prev =>
      prev.includes(workOrderId)
        ? prev.filter(id => id !== workOrderId)
        : [...prev, workOrderId]
    );
  };

  const buildItemsFromSelection = () => {
    const nextItems = dueWorkOrders
      .filter(wo => selectedWorkOrders.includes(wo.id))
      .flatMap(wo =>
        wo.items
          .filter(i => i.pending_quantity > 0)
          .map(i => ({
            work_order_id: wo.id,
            work_order_item_id: i.id,
            job_work_type_name: i.job_work_type_name,
            pending_quantity: i.pending_quantity,
            dc_quantity: 0,
          }))
      );

    setItems(nextItems);
    setStep(2);
  };

  const handleSave = async () => {
    if (!generatedDate) { toast({ title: "Date is required", variant: "destructive" }); return; }
    if (!partyId) { toast({ title: "Select a party", variant: "destructive" }); return; }
    if (!dcNumber.trim()) { toast({ title: "DC number is required", variant: "destructive" }); return; }

    const duplicate = allDCs.find(
      d => d.dc_number === dcNumber.trim() && d.id !== id
    );

    if (duplicate) {
      toast({
        title: "Duplicate DC number",
        description: "DC number already exists.",
        variant: "destructive",
      });
      return;
    }

    if (items.filter(i => i.dc_quantity > 0).length === 0) {
      toast({ title: "Enter at least one DC quantity", variant: "destructive" });
      return;
    }

    const dcData = {
      dc_number: dcNumber.trim(),
      generated_date: format(generatedDate, "yyyy-MM-dd"),
      party_id: partyId,
      party_name: parties.find(p => p.id === partyId)?.name || "",
      transporter_name: transporterName.trim(),
      items: items
        .filter(i => i.dc_quantity > 0)
        .map(i => ({
          work_order_id: i.work_order_id,
          work_order_item_id: i.work_order_item_id,
          job_work_type_name: i.job_work_type_name,
          dc_quantity: i.dc_quantity,
        })),
    };

    try {
      if (isEdit && id) {
        await updateDC.mutateAsync({ id, ...dcData });
        toast({ title: "DC updated" });
      } else {
        await addDC.mutateAsync(dcData);
        toast({ title: "DC created" });
      }
      navigate("/");
    } catch (e: any) {
      toast({ title: "Error saving DC", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">{isEdit ? "Edit DC" : "New Delivery Challan"}</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          {step === 1 ? (
            <Button
              onClick={buildItemsFromSelection}
              disabled={selectedWorkOrders.length === 0}
            >
              Next
            </Button>
          ) : (
            <Button onClick={handleSave}>
              Create DC
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div>
            <Label className="mb-2 block text-sm font-medium">Generated Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !generatedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {generatedDate ? format(generatedDate, "dd - MMM - yyyy") : "DD - MMM - YYYY"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={generatedDate} onSelect={setGeneratedDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium">Party Name</Label>
            <Select value={partyId} onValueChange={handlePartyChange}>
              <SelectTrigger><SelectValue placeholder="Select Party" /></SelectTrigger>
              <SelectContent>
                {parties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label className="mb-2 block text-sm font-medium">DC Number</Label>
            <Input placeholder="Enter DC Number" value={dcNumber} onChange={e => setDcNumber(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium">Transporter Name</Label>
            <Input placeholder="Enter Transporter Name (optional)" value={transporterName} onChange={e => setTransporterName(e.target.value)} />
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border font-medium">
            Select Work Orders
          </div>

          <div className="divide-y">
            {dueWorkOrders.map(wo => {
              const selected = selectedWorkOrders.includes(wo.id);
              return (
                <div key={wo.id} className={selected ? "bg-muted" : ""}>
                  <div className="flex items-center justify-between px-6 py-4">
                    <div className="space-x-4">
                      <span className="font-medium">{wo.work_order_number}</span>
                      <span className="text-sm text-muted-foreground">
                        Pending: {wo.items.reduce((s, i) => s + i.pending_quantity, 0)}
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleWorkOrder(wo.id)}
                    />
                  </div>

                  {selected && (
                    <div className="px-6 pb-4 text-sm text-muted-foreground">
                      {wo.items.map(i => (
                        <div key={i.id} className="flex justify-between">
                          <span>{i.job_work_type_name}</span>
                          <span>Pending: {i.pending_quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_150px_150px] px-6 py-3 text-xs font-medium text-muted-foreground border-b">
            <div>Job Work</div>
            <div>Pending</div>
            <div>DC Qty</div>
          </div>

          {items.map((item, idx) => (
            <div
              key={item.work_order_item_id}
              className="grid grid-cols-[1fr_150px_150px] px-6 py-3 items-center border-t"
            >
              <div>{item.job_work_type_name}</div>
              <div>{item.pending_quantity}</div>
              <Input
                type="number"
                min={1}
                max={item.pending_quantity}
                value={item.dc_quantity || ""}
                onChange={e =>
                  setItems(items.map((it, i) =>
                    i === idx
                      ? { ...it, dc_quantity: Number(e.target.value) || 0 }
                      : it
                  ))
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
