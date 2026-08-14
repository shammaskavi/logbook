import { useMemo, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import { DCPreview, type DCPreviewItem } from "./DCPreview";
import { useDeliveryChallans, useWorkOrders } from "@/hooks/use-data";
import { useReactToPrint } from "react-to-print";

type DCPreviewModalProps = {
    dcId: string | null;
    open: boolean;
    onClose: () => void;
};

export function DCPreviewModal({ dcId, open, onClose }: DCPreviewModalProps) {
    const { data: dcs = [] } = useDeliveryChallans();
    const { data: workOrders = [] } = useWorkOrders();
    const contentRef = useRef<HTMLDivElement>(null);

    const dc = useMemo(() => dcs.find(d => d.id === dcId), [dcs, dcId]);

    // Browser print is also the PDF path: "Save as PDF" in the print dialog
    // produces real vector text with the page breaks we laid out, which a
    // canvas-based export cannot match.
    const handlePrint = useReactToPrint({
        contentRef,
        documentTitle: `DC_${dc?.dc_number || "draft"}`,
    });

    const items = useMemo<DCPreviewItem[]>(() => {
        if (!dc) return [];

        const itemToWONumber = new Map<string, string>();
        workOrders.forEach(wo => {
            wo.items.forEach(item => {
                itemToWONumber.set(item.id, wo.work_order_number);
            });
        });

        return dc.items.map(item => ({
            work_order_number: itemToWONumber.get(item.work_order_item_id) || "-",
            job_work_type_name: item.job_work_type_name,
            quantity: item.quantity,
        }));
    }, [dc, workOrders]);

    if (!dc) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-none w-screen h-screen p-0 overflow-hidden [&>button]:hidden flex flex-col border-none rounded-none">

                <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b bg-background sticky top-0 z-10 print:hidden">
                    <div className="text-sm md:text-lg font-medium tracking-tight truncate max-w-[180px] md:max-w-none">
                        DC — <span className="font-bold">{dc.dc_number}</span>
                    </div>

                    <div className="flex gap-2">
                        <Button size="sm" onClick={() => handlePrint()}>
                            <Printer className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">Print / Save as PDF</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="overflow-auto flex-grow bg-slate-100/50 flex flex-col items-center">
                    <div className="py-4 md:py-12 w-full flex justify-center">
                        <div className="relative w-full flex justify-center px-4">
                            {/* `print-scale-host` is unset during print so the sheet
                                prints at true A4 size regardless of viewport scaling. */}
                            <div
                                ref={contentRef}
                                className="print-scale-host origin-top scale-[0.45] sm:scale-[0.6] md:scale-[0.85] lg:scale-100"
                            >
                                <DCPreview
                                    dcNumber={dc.dc_number}
                                    dcDate={dc.generated_date}
                                    partyName={dc.party_name}
                                    partyGstin={dc.party_gstin}
                                    transporterName={dc.transporter_name}
                                    items={items}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Lets mobile users scroll past the visually scaled sheet. */}
                    <div className="h-[550px] md:hidden" aria-hidden="true" />
                </div>
            </DialogContent>
        </Dialog>
    );
}
