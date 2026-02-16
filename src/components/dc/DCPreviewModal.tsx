

import { useEffect, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import { DCPreview } from "./DCPreview";
import { useDeliveryChallans, useWorkOrders } from "@/hooks/use-data";

type DCPreviewModalProps = {
    dcId: string | null;
    open: boolean;
    onClose: () => void;
};

export function DCPreviewModal({ dcId, open, onClose }: DCPreviewModalProps) {
    const { data: dcs = [] } = useDeliveryChallans();
    const { data: workOrders = [] } = useWorkOrders();

    const dc = useMemo(
        () => dcs.find(d => d.id === dcId),
        [dcs, dcId]
    );

    const items = useMemo(() => {
        if (!dc) return [];

        // Map work_order_item_id -> work_order_number
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
            <DialogContent className="max-w-none w-screen h-screen p-0 overflow-hidden [&>button]:hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="font-medium">
                        Delivery Challan Preview — {dc.dc_number}
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print / Download
                        </Button>
                        <Button variant="ghost" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Preview Body */}
                <div className="overflow-auto h-[calc(100vh-64px)] bg-muted flex justify-center">
                    <div className="bg-white my-8 shadow">
                        <DCPreview
                            businessName="Kamil Jamal"
                            businessAddress={`#18/2, 2nd Cross, Vinayaka Nagar,\nOld Guddadahalli, Bangalore - 560 - 026`}
                            businessGSTIN="29AEDPJ848L1ZU"
                            businessPhones={["+91 98453 43015", "+91 93793 54380"]}
                            dcNumber={dc.dc_number}
                            dcDate={dc.generated_date}
                            partyName={dc.party_name}
                            transporterName={dc.transporter_name}
                            items={items}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}