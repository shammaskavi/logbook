import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Plus, Trash2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  useDeliveryChallans,
  useAddManualDeliveryChallan,
  useParties,
  useJobWorkTypes,
} from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type ManualItem = {
  id: string;
  /** Free text: each line can reference a different work order. */
  manual_wo_number: string;
  job_work_type_id: string;
  quantity: number;
};

/**
 * Free-form delivery challan: items are typed in rather than drawn from a work
 * order's pending quantities. Nothing is decremented anywhere, and the work
 * order number is captured as plain text since there is no work order to link.
 */
export default function ManualDCForm() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: allDCs = [] } = useDeliveryChallans();
  const { data: parties = [] } = useParties();
  const { data: jobTypes = [] } = useJobWorkTypes();
  const activeJobTypes = jobTypes.filter(j => j.active);

  const addManualDC = useAddManualDeliveryChallan();

  const generateNextDCNumber = () => {
    const numeric = allDCs.map(dc => Number(dc.dc_number)).filter(n => !isNaN(n));
    if (numeric.length === 0) return "001";
    return String(Math.max(...numeric) + 1).padStart(3, "0");
  };

  const [generatedDate, setGeneratedDate] = useState<Date | undefined>(new Date());
  const [partyId, setPartyId] = useState("");
  const [dcNumber, setDcNumber] = useState(generateNextDCNumber());
  const [transporterName, setTransporterName] = useState("");
  const [items, setItems] = useState<ManualItem[]>([
    { id: generateId(), manual_wo_number: "", job_work_type_id: "", quantity: 0 },
  ]);

  // Lines on one challan usually share a work order number, so carry the last
  // one forward. It stays editable per line.
  const addItem = () =>
    setItems([
      ...items,
      {
        id: generateId(),
        manual_wo_number: items[items.length - 1]?.manual_wo_number ?? "",
        job_work_type_id: "",
        quantity: 0,
      },
    ]);

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ManualItem, value: string | number) =>
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));

  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const handleSave = async () => {
    if (!generatedDate) {
      toast({ title: "Date is required", variant: "destructive" });
      return;
    }
    if (!partyId) {
      toast({ title: "Select a party", variant: "destructive" });
      return;
    }
    if (!dcNumber.trim()) {
      toast({ title: "DC number is required", variant: "destructive" });
      return;
    }

    if (allDCs.some(dc => dc.dc_number === dcNumber.trim())) {
      toast({
        title: "Duplicate DC number",
        description: "DC number already exists.",
        variant: "destructive",
      });
      return;
    }

    const validItems = items.filter(i => i.job_work_type_id && i.quantity > 0);
    if (validItems.length === 0) {
      toast({ title: "Add at least one item with quantity > 0", variant: "destructive" });
      return;
    }

    // The work order number is what appears in the invoice's WO No. column,
    // so a blank one would bill as "-".
    if (validItems.some(i => !i.manual_wo_number.trim())) {
      toast({
        title: "Work order number is required on every item",
        variant: "destructive",
      });
      return;
    }

    try {
      await addManualDC.mutateAsync({
        dc_number: dcNumber.trim(),
        generated_date: format(generatedDate, "yyyy-MM-dd"),
        party_id: partyId,
        party_name: parties.find(p => p.id === partyId)?.name || "",
        transporter_name: transporterName.trim(),
        items: validItems.map(i => ({
          job_work_type_name:
            activeJobTypes.find(j => j.id === i.job_work_type_id)?.name || "",
          quantity: i.quantity,
          manual_wo_number: i.manual_wo_number.trim(),
        })),
      });

      toast({ title: "Delivery challan created" });
      navigate("/dc");
    } catch (e) {
      toast({
        title: "Error saving delivery challan",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manual Delivery Challan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            For goods with no work order in the system. Pending quantities are not affected.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => navigate("/dc")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={addManualDC.isPending}>
            {addManualDC.isPending ? "Saving..." : "Create DC"}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <div className="grid grid-cols-1 gap-6 mb-4 md:grid-cols-2">
          <div>
            <Label className="mb-2 block text-sm font-medium">Generated Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !generatedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {generatedDate ? format(generatedDate, "dd - MMM - yyyy") : "DD - MMM - YYYY"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={generatedDate}
                  onSelect={setGeneratedDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium">Party Name</Label>
            <Select value={partyId} onValueChange={setPartyId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Party" />
              </SelectTrigger>
              <SelectContent>
                {parties.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label className="mb-2 block text-sm font-medium">DC Number</Label>
            <Input
              placeholder="Enter DC Number"
              value={dcNumber}
              onChange={e => setDcNumber(e.target.value)}
            />
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium">Transporter Name</Label>
            <Input
              placeholder="Enter Transporter Name (optional)"
              value={transporterName}
              onChange={e => setTransporterName(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="hidden md:grid grid-cols-[200px_1fr_160px_60px] px-6 py-3 text-xs font-medium text-muted-foreground border-b border-border">
          <div>Work Order No.</div>
          <div>Job Work</div>
          <div>Quantity</div>
          <div></div>
        </div>

        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 px-6 py-4 border-b border-border md:grid md:grid-cols-[200px_1fr_160px_60px] md:items-center md:gap-3"
          >
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground md:hidden">Work Order No.</span>
              <Input
                placeholder="WO Number"
                value={item.manual_wo_number}
                onChange={e => updateItem(index, "manual_wo_number", e.target.value)}
                className="w-full md:w-[180px]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground md:hidden">Job Work</span>
              <Select
                value={item.job_work_type_id}
                onValueChange={v => updateItem(index, "job_work_type_id", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Job Work" />
                </SelectTrigger>
                <SelectContent>
                  {activeJobTypes.map(j => (
                    <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1 md:items-start">
              <span className="text-xs text-muted-foreground md:hidden">Quantity</span>
              <Input
                type="number"
                placeholder="Add Quantity"
                value={item.quantity || ""}
                onChange={e => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                className="w-full md:w-[140px]"
                min={1}
              />
            </div>

            <button
              onClick={() => removeItem(index)}
              className="self-end md:self-auto text-destructive hover:text-destructive/80 transition-colors p-2"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        <div className="flex items-center justify-between px-6 py-3">
          <button
            onClick={addItem}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" /> Add New Item
          </button>
          <span className="text-sm text-muted-foreground">
            Total Quantity: <span className="font-medium text-foreground">{totalQuantity}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
