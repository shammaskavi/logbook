import { useMemo, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import { DCPreview } from "./DCPreview";
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

    const dc = useMemo(
        () => dcs.find(d => d.id === dcId),
        [dcs, dcId]
    );

    const handlePrint = useReactToPrint({
        contentRef,
        documentTitle: `DC_${dc?.dc_number || 'draft'}`,
    });

    const items = useMemo(() => {
        if (!dc) return [];
        const itemToWONumber = new Map<string, string>();
        workOrders.forEach(wo => {
            wo.items.forEach(i => {
                itemToWONumber.set(i.id, wo.work_order_number);
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
            {/* Added 'border-none' and 'rounded-none' for a cleaner mobile fullscreen feel */}
            <DialogContent className="max-w-none w-screen h-screen p-0 overflow-hidden [&>button]:hidden flex flex-col border-none rounded-none">

                {/* Header - Optimized for Mobile Padding and Text Truncation */}
                <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b bg-background sticky top-0 z-10 print:hidden">
                    <div className="text-sm md:text-lg font-medium tracking-tight truncate max-w-[180px] md:max-w-none">
                        DC — <span className="font-bold">{dc.dc_number}</span>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="bg-slate-900 hover:bg-slate-800 text-white h-9 px-3 md:px-4"
                            onClick={() => handlePrint()}
                        >
                            <Printer className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">Print Challan</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Preview Body with Responsive Scaling */}
                <div className="overflow-auto flex-grow bg-slate-100/50 flex flex-col items-center">
                    <div className="py-4 md:py-12 w-full flex justify-center">
                        {/* Container applies scale transform on mobile. 
                            'origin-top' keeps it anchored to the top of the scroll area.
                        */}
                        <div className="relative w-full flex justify-center px-4">
                            <div
                                ref={contentRef}
                                className="bg-white shadow-2xl origin-top 
                                           scale-[0.45] sm:scale-[0.6] md:scale-[0.85] lg:scale-100 
                                           print:scale-100 print:shadow-none print:m-0"
                            >
                                <DCPreview
                                    businessName="Kamil Jamal"
                                    businessAddress={`18/2, 2nd Cross, Vinayaka Nagar Extn,\nOld Guddadahalli, Bangalore - 560026`}
                                    businessGSTIN="29AEDPJ8482L1ZU"
                                    businessPhones={["+91 93793 54380", "+91 98453 43015"]}
                                    dcNumber={dc.dc_number}
                                    dcDate={dc.generated_date}
                                    partyName={dc.party_name}
                                    partyGSTIN={dc.party_gstin}
                                    transporterName={dc.transporter_name}
                                    noOfBundles={dc.no_of_bundles}
                                    items={items}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Visual spacer to ensure mobile users can scroll effectively past the scaled container */}
                    <div className="h-[550px] md:hidden" aria-hidden="true" />
                </div>
            </DialogContent>
        </Dialog>
    );
}