import { useState } from "react";
import { useParties } from "@/hooks/use-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PartyFormModal from "@/components/settings/PartyFormModal";
import { Pencil, Users, Plus, Search } from "lucide-react";

export default function PartiesPage() {
    const { data: parties = [], isLoading } = useParties();
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [mode, setMode] = useState<"create" | "edit">("create");
    const [selectedParty, setSelectedParty] = useState<any>(null);

    const filtered = parties.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search parties..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Button
                    onClick={() => {
                        setMode("create");
                        setSelectedParty(null);
                        setModalOpen(true);
                    }}
                    className="gap-2 shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    Add Party
                </Button>
            </div>

            {/* Content */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/30">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Party Name</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone Number</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">GST Number</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-8 w-8" /></td>
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={4}>
                                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                            <Users className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                {search ? "No parties match your search" : "No parties yet"}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {search ? "Try adjusting your search." : "Add your first party to get started."}
                                            </p>
                                        </div>
                                        {!search && (
                                            <Button size="sm" className="gap-1.5 mt-1" onClick={() => { setMode("create"); setSelectedParty(null); setModalOpen(true); }}>
                                                <Plus className="w-3.5 h-3.5" />
                                                Add Party
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(party => (
                                <tr key={party.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 font-medium text-foreground">{party.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {party.phone_number || <span className="text-muted-foreground/40">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {party.gstin || <span className="text-muted-foreground/40">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => {
                                                setMode("edit");
                                                setSelectedParty(party);
                                                setModalOpen(true);
                                            }}
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                            <span className="sr-only">Edit {party.name}</span>
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <PartyFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                mode={mode}
                initialData={selectedParty}
            />
        </div>
    );
}