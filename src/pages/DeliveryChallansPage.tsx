import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import DCList from "@/components/DCList";

/**
 * Delivery Challans as a top-level module. `DCList` holds the filtering,
 * table and delete behaviour; this page only supplies the header, matching
 * the layout of the Work Orders and Invoices pages.
 */
export default function DeliveryChallansPage() {
    const navigate = useNavigate();

    return (
        <div className="p-4 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                    Delivery Challans
                </h1>
                <Button size="sm" onClick={() => navigate("/dc/new")} className="gap-1.5">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Create DC</span>
                    <span className="sm:hidden">New</span>
                </Button>
            </div>

            <DCList />
        </div>
    );
}
