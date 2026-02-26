import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/components/ui/use-toast";
import { useParties } from "@/hooks/use-parties";
import { useBillableDCItems, useCreateInvoice } from "@/hooks/use-data";
import type { InvoiceGSTType } from "@/types";

export default function InvoiceForm() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const { data: parties = [] } = useParties();

    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [partyId, setPartyId] = useState<string | undefined>();
    const [gstType, setGstType] = useState<InvoiceGSTType>("cgst_sgst");
    const [cgstPercent, setCgstPercent] = useState(2.5);
    const [sgstPercent, setSgstPercent] = useState(2.5);
    const [igstPercent, setIgstPercent] = useState(0);

    useEffect(() => {
        if (gstType === "cgst_sgst") {
            setCgstPercent(2.5);
            setSgstPercent(2.5);
            setIgstPercent(0);
        }

        if (gstType === "igst") {
            setIgstPercent(5);
            setCgstPercent(0);
            setSgstPercent(0);
        }

        if (gstType === "none") {
            setCgstPercent(0);
            setSgstPercent(0);
            setIgstPercent(0);
        }
    }, [gstType]);

    const { data: billableItems = [], isLoading } = useBillableDCItems(partyId);
    const createInvoiceMutation = useCreateInvoice();

    const [rows, setRows] = useState<Record<string, { selected: boolean; quantity: number; rate: number }>>({});

    useEffect(() => {
        if (!invoiceNumber) {
            setInvoiceNumber(`INV-${Date.now()}`);
        }
    }, [invoiceNumber]);

    const toggleRow = (id: string) => {
        setRows(prev => ({
            ...prev,
            [id]: {
                selected: !prev[id]?.selected,
                quantity: prev[id]?.quantity ?? 0,
                rate: prev[id]?.rate ?? 0,
            },
        }));
    };

    const updateQuantity = (id: string, qty: number, max: number) => {
        const safeQty = Math.min(qty, max);
        setRows(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                selected: true,
                quantity: safeQty,
                rate: prev[id]?.rate ?? 0,
            },
        }));
    };

    const updateRate = (id: string, rate: number) => {
        setRows(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                selected: true,
                quantity: prev[id]?.quantity ?? 0,
                rate,
            },
        }));
    };

    const selectedParty = parties.find((p: any) => p.id === partyId);

    const selectedItems = useMemo(() => {
        return billableItems
            .map((item: any) => {
                const row = rows[item.dc_item_id];
                if (!row?.selected || row.quantity <= 0 || row.rate <= 0) return null;
                return { ...item, quantity: row.quantity, rate: row.rate };
            })
            .filter(Boolean);
    }, [billableItems, rows]);

    const subtotal = selectedItems.reduce((sum: number, item: any) => sum + item.quantity * item.rate, 0);

    const taxAmount = useMemo(() => {
        if (gstType === "none") return 0;

        if (gstType === "cgst_sgst") {
            return (subtotal * (cgstPercent + sgstPercent)) / 100;
        }

        if (gstType === "igst") {
            return (subtotal * igstPercent) / 100;
        }

        return 0;
    }, [subtotal, gstType, cgstPercent, sgstPercent, igstPercent]);

    const grandTotal = subtotal + taxAmount;

    const handleSubmit = async () => {
        if (!partyId || !selectedParty) {
            toast({ title: "Please select a party", variant: "destructive" });
            return;
        }

        if (selectedItems.length === 0) {
            toast({ title: "Select at least one delivery item", variant: "destructive" });
            return;
        }

        try {
            await createInvoiceMutation.mutateAsync({
                invoice_number: invoiceNumber,
                invoice_date: invoiceDate,
                party_id: partyId,
                party_name: selectedParty.name,
                party_gstin: selectedParty.gstin ?? null,
                gst_type: gstType,
                cgst_percent: cgstPercent,
                sgst_percent: sgstPercent,
                igst_percent: igstPercent,
                items: selectedItems.map((item: any) => ({
                    dc_item_id: item.dc_item_id,
                    work_order_id: item.work_order_id,
                    wo_number: item.wo_number,
                    dc_number: item.dc_number,
                    particulars: item.job_work_type_name,
                    quantity: item.quantity,
                    rate: item.rate,
                })),
            });

            toast({ title: "Invoice created successfully" });
            navigate("/invoices");
        } catch (err: any) {
            const message = err?.message || "Error creating invoice";
            toast({ title: "Error creating invoice", description: message, variant: "destructive" });
        }
    };

    return (
        <div className="p-6 space-y-8">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Create Invoice</h1>
                    <p className="text-sm text-muted-foreground">Generate invoice from delivered work</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate("/invoices")}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={createInvoiceMutation.isPending}>
                        {createInvoiceMutation.isPending ? "Generating..." : "Generate Invoice"}
                    </Button>
                </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                    <div>
                        <Label className="mb-2 block text-sm font-medium">Invoice Number</Label>
                        <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                    </div>

                    <div>
                        <Label className="mb-2 block text-sm font-medium">Invoice Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(new Date(invoiceDate), "dd MMM yyyy")}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={new Date(invoiceDate)}
                                    onSelect={(date) => date && setInvoiceDate(format(date, "yyyy-MM-dd"))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div>
                        <Label className="mb-2 block text-sm font-medium">Party</Label>
                        <Select value={partyId} onValueChange={setPartyId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select party" />
                            </SelectTrigger>
                            <SelectContent>
                                {parties.map((party: any) => (
                                    <SelectItem key={party.id} value={party.id}>{party.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="mb-2 block text-sm font-medium">GST Type</Label>
                        <Select value={gstType} onValueChange={(val: InvoiceGSTType) => setGstType(val)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cgst_sgst">CGST + SGST</SelectItem>
                                <SelectItem value="igst">IGST</SelectItem>
                                <SelectItem value="none">No GST</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Dynamic GST Inputs */}
                    {gstType === "cgst_sgst" && (
                        <>
                            <div>
                                <Label className="mb-2 block text-sm font-medium">CGST %</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={cgstPercent}
                                    onChange={(e) => setCgstPercent(Number(e.target.value))}
                                />
                            </div>

                            <div>
                                <Label className="mb-2 block text-sm font-medium">SGST %</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={sgstPercent}
                                    onChange={(e) => setSgstPercent(Number(e.target.value))}
                                />
                            </div>
                        </>
                    )}

                    {gstType === "igst" && (
                        <div>
                            <Label className="mb-2 block text-sm font-medium">IGST %</Label>
                            <Input
                                type="number"
                                min={0}
                                value={igstPercent}
                                onChange={(e) => setIgstPercent(Number(e.target.value))}
                            />
                        </div>
                    )}

                </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6 space-y-6">
                <h2 className="text-lg font-medium">Billable Delivery Items</h2>

                {isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading billable items...</p>
                ) : billableItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No billable items available.</p>
                ) : (
                    <div className="space-y-4">
                        {billableItems.map((item: any) => {
                            const row = rows[item.dc_item_id] || { selected: false, quantity: 0, rate: 0 };
                            const amount = row.quantity * row.rate;

                            return (
                                <div key={item.dc_item_id} className="border rounded-md p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 accent-primary"
                                                checked={row.selected}
                                                onChange={() => toggleRow(item.dc_item_id)}
                                            />
                                            <div>
                                                <p className="text-sm font-medium">WO {item.wo_number} · DC {item.dc_number}</p>
                                                <p className="text-xs text-muted-foreground">{item.job_work_type_name}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm text-muted-foreground">Remaining: {item.remaining_qty}</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Quantity</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={item.remaining_qty}
                                                value={row.quantity}
                                                onChange={(e) => updateQuantity(item.dc_item_id, Number(e.target.value), item.remaining_qty)}
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs text-muted-foreground">Rate</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={row.rate}
                                                onChange={(e) => updateRate(item.dc_item_id, Number(e.target.value))}
                                            />
                                        </div>

                                        <div className="flex items-end">
                                            <div className="w-full text-right">
                                                <Label className="text-xs text-muted-foreground">Amount</Label>
                                                <p className="text-sm font-medium">₹{amount.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="bg-card rounded-lg border border-border p-6 max-w-md ml-auto space-y-3">

                <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                </div>

                {gstType === "cgst_sgst" && (
                    <>
                        <div className="flex justify-between text-sm">
                            <span>CGST ({cgstPercent}%)</span>
                            <span>₹{((subtotal * cgstPercent) / 100).toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span>SGST ({sgstPercent}%)</span>
                            <span>₹{((subtotal * sgstPercent) / 100).toFixed(2)}</span>
                        </div>
                    </>
                )}

                {gstType === "igst" && (
                    <div className="flex justify-between text-sm">
                        <span>IGST ({igstPercent}%)</span>
                        <span>₹{((subtotal * igstPercent) / 100).toFixed(2)}</span>
                    </div>
                )}

                {gstType === "none" && (
                    <div className="flex justify-between text-sm">
                        <span>Tax</span>
                        <span>₹0.00</span>
                    </div>
                )}

                <div className="flex justify-between font-semibold pt-3 border-t">
                    <span>Total</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                </div>

            </div>

        </div>
    );
}