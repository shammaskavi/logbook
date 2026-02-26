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

    // 1. Create the reference for the printable content
    const contentRef = useRef<HTMLDivElement>(null);

    const dc = useMemo(
        () => dcs.find(d => d.id === dcId),
        [dcs, dcId]
    );

    // 2. Set up the print hook
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
            work_order_number:
                itemToWONumber.get(item.work_order_item_id) || "-",
            job_work_type_name: item.job_work_type_name,
            quantity: item.quantity,
        }));
    }, [dc, workOrders]);

    if (!dc) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-none w-screen h-screen p-0 overflow-hidden [&>button]:hidden flex flex-col">
                {/* Header - Stays hidden during print */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-background print:hidden">
                    <div className="font-medium tracking-tight">
                        Delivery Challan Preview — <span className="font-bold">{dc.dc_number}</span>
                    </div>

                    <div className="flex gap-2">
                        {/* 3. Trigger handlePrint instead of window.print() */}
                        <Button
                            onClick={() => handlePrint()}
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            Print Challan
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Preview Body */}
                <div className="overflow-auto flex-grow bg-muted/40 p-8 print:bg-white print:p-0">
                    <div className="flex justify-center">
                        {/* 4. Attach the ref to the wrapper of DCPreview */}
                        <div ref={contentRef} className="bg-white shadow-2xl print:shadow-none">
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
                                // Ensure bundles information is passed if available in your DC object
                                noOfBundles={dc.no_of_bundles}
                                items={items}
                            />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}