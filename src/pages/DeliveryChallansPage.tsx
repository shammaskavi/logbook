import { useNavigate } from "react-router-dom";
import { ChevronDown, ClipboardList, Plus, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" className="gap-1.5">
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Create DC</span>
                            <span className="sm:hidden">New</span>
                            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuItem
                            onClick={() => navigate("/dc/new")}
                            className="flex-col items-start gap-0.5 py-2"
                        >
                            <span className="flex items-center gap-2 font-medium">
                                <ClipboardList className="w-4 h-4" />
                                From Work Order
                            </span>
                            <span className="text-xs text-muted-foreground pl-6">
                                Pick pending items, reduces balance
                            </span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => navigate("/dc/new/manual")}
                            className="flex-col items-start gap-0.5 py-2"
                        >
                            <span className="flex items-center gap-2 font-medium">
                                <PencilLine className="w-4 h-4" />
                                Manual Entry
                            </span>
                            <span className="text-xs text-muted-foreground pl-6">
                                Type items in, no work order needed
                            </span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <DCList />
        </div>
    );
}
