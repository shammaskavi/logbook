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
    setRows({});
    setStep(1);
  };

  type DCFormItem = {
    work_order_id: string;
    work_order_item_id: string;
    job_work_type_name: string;
    pending_quantity: number;
    dc_quantity: number;
  };

  const [rows, setRows] = useState<Record<string, {
    selected: boolean;
    pending_quantity: number;
    dc_quantity: number;
    work_order_id: string;
    work_order_item_id: string;
    job_work_type_name: string;
    wo_number?: string;
  }>>({});

  const dueWorkOrders = workOrders.filter(
    wo => wo.party_id === partyId && wo.items.some(i => i.pending_quantity > 0)
  );

  const selectableItems = dueWorkOrders.flatMap(wo =>
    wo.items
      .filter(i => i.pending_quantity > 0)
      .map(i => ({
        work_order_id: wo.id,
        work_order_item_id: i.id,
        job_work_type_name: i.job_work_type_name,
        pending_quantity: i.pending_quantity,
        wo_number: wo.work_order_number
      }))
  );

  const toggleRow = (item: any) => {
    setRows(prev => ({
      ...prev,
      [item.work_order_item_id]: {
        selected: !prev[item.work_order_item_id]?.selected,
        pending_quantity: item.pending_quantity,
        dc_quantity: prev[item.work_order_item_id]?.dc_quantity ?? item.pending_quantity,
        work_order_id: item.work_order_id,
        work_order_item_id: item.work_order_item_id,
        job_work_type_name: item.job_work_type_name,
        wo_number: item.wo_number
      }
    }));
  };

  const toggleAllRows = (checked: boolean) => {
    const updated: any = {};

    selectableItems.forEach(item => {
      updated[item.work_order_item_id] = {
        selected: checked,
        pending_quantity: item.pending_quantity,
        dc_quantity: item.pending_quantity,
        work_order_id: item.work_order_id,
        work_order_item_id: item.work_order_item_id,
        job_work_type_name: item.job_work_type_name,
        wo_number: item.wo_number
      };
    });

    setRows(updated);
  };

  const allSelected = selectableItems.length > 0 &&
    selectableItems.every(item => rows[item.work_order_item_id]?.selected);

  const buildItemsFromSelection = () => {
    const selected = Object.values(rows).filter(r => r.selected);

    if (selected.length === 0) {
      toast({ title: "Select at least one item", variant: "destructive" });
      return;
    }

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

    const selectedRows = Object.values(rows).filter(r => r.selected && r.dc_quantity > 0);

    if (selectedRows.length === 0) {
      toast({ title: "Enter at least one DC quantity", variant: "destructive" });
      return;
    }

    const dcData = {
      dc_number: dcNumber.trim(),
      generated_date: format(generatedDate, "yyyy-MM-dd"),
      party_id: partyId,
      party_name: parties.find(p => p.id === partyId)?.name || "",
      transporter_name: transporterName.trim(),
      items: selectedRows.map(i => ({
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
      navigate("/dc");
    } catch (e: any) {
      toast({ title: "Error saving DC", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{isEdit ? "Edit DC" : "New Delivery Challan"}</h1>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          {step === 1 ? (
            <Button
              onClick={buildItemsFromSelection}
              disabled={Object.values(rows).filter(r => r.selected).length === 0}
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
        <div className="grid grid-cols-1 gap-6 mb-4 md:grid-cols-2">
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
              <SelectTrigger className="w-full"><SelectValue placeholder="Select Party" /></SelectTrigger>
              <SelectContent>
                {parties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
            Select Work Order Items
          </div>

          {/* Party not selected */}
          {!partyId && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Select a party to view pending work order items
            </div>
          )}

          {/* Party selected but no items */}
          {partyId && selectableItems.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No pending work order items available for this party
            </div>
          )}

          {/* Table when items exist */}
          {partyId && selectableItems.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="w-12 text-center py-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={e => toggleAllRows(e.target.checked)}
                      />
                    </th>
                    <th className="w-28 text-left py-3">WO</th>
                    <th className="text-left py-3">Item</th>
                    <th className="w-32 text-right pr-6 py-3">Pending</th>
                  </tr>
                </thead>

                <tbody>
                  {selectableItems.map((item, index) => {
                    const row = rows[item.work_order_item_id];

                    return (
                      <tr
                        key={item.work_order_item_id}
                        className={`border-b transition-colors hover:bg-muted/40 ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                      >
                        <td className="text-center py-3">
                          <input
                            type="checkbox"
                            checked={row?.selected || false}
                            onChange={() => toggleRow(item)}
                          />
                        </td>

                        <td className="font-medium py-3">
                          {item.wo_number}
                        </td>

                        <td className="py-3">
                          {item.job_work_type_name}
                        </td>

                        <td className="text-right pr-6 tabular-nums font-medium py-3">
                          {item.pending_quantity}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_150px_150px] px-6 py-3 text-xs font-medium text-muted-foreground border-b">
            <div>Job Work</div>
            <div>Pending</div>
            <div>DC Qty</div>
          </div>

          {Object.values(rows)
            .filter(r => r.selected)
            .map((item, idx) => (
              <div
                key={item.work_order_item_id}
                className="flex flex-col gap-3 px-6 py-4 border-t md:grid md:grid-cols-[1fr_150px_150px] md:items-center md:gap-0"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground md:hidden">Job Work</span>
                  <div>{item.job_work_type_name}</div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground md:hidden">Pending</span>
                  <div>{item.pending_quantity}</div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground md:hidden">DC Quantity</span>
                  <Input
                    type="number"
                    min={1}
                    max={item.pending_quantity}
                    value={item.dc_quantity || ""}
                    onChange={e =>
                      setRows(prev => ({
                        ...prev,
                        [item.work_order_item_id]: {
                          ...item,
                          dc_quantity: Number(e.target.value) || 0
                        }
                      }))
                    }
                    className="w-full md:w-32"
                  />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
