import { useState } from "react";
import { useParties } from "@/hooks/use-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PartyFormModal from "@/components/settings/PartyFormModal";
import { Pencil, Users, Plus, Search, Phone, Hash } from "lucide-react";

export default function PartiesPage() {
    const { data: parties = [], isLoading } = useParties();
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [mode, setMode] = useState<"create" | "edit">("create");
    const [selectedParty, setSelectedParty] = useState<any>(null);

    const filtered = parties.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    const openCreate = () => { setMode("create"); setSelectedParty(null); setModalOpen(true); };
    const openEdit = (party: any) => { setMode("edit"); setSelectedParty(party); setModalOpen(true); };

    return (
        <div className="space-y-4">
            {/* ── Search + Add button ── */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search parties..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 h-10 bg-card"
                    />
                </div>
                <Button onClick={openCreate} className="gap-2 shrink-0 h-10">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Party</span>
                    <span className="sm:hidden">Add</span>
                </Button>
            </div>

            {/* ── Loading ── */}
            {isLoading ? (
                <div>
                    {/* Mobile skeleton */}
                    <div className="md:hidden space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-2">
                                <Skeleton className="h-4 w-36" />
                                <Skeleton className="h-3.5 w-28" />
                            </div>
                        ))}
                    </div>
                    {/* Desktop skeleton table */}
                    <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
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
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-8 w-8" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                /* ── Empty state ── */
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center bg-card rounded-xl border border-border">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {search ? "No parties match your search" : "No parties yet"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {search ? "Try a different name." : "Add your first party to get started."}
                        </p>
                    </div>
                    {!search && (
                        <Button size="sm" className="gap-1.5 mt-1" onClick={openCreate}>
                            <Plus className="w-3.5 h-3.5" />Add Party
                        </Button>
                    )}
                </div>
            ) : (
                <>
                    {/* ── Mobile: Card View ── */}
                    <div className="md:hidden space-y-3">
                        {filtered.map(party => (
                            <div
                                key={party.id}
                                className="bg-card rounded-xl border border-border overflow-hidden"
                            >
                                <div className="flex items-center justify-between p-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-foreground truncate">{party.name}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                                            {party.phone_number && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Phone className="w-3 h-3 shrink-0" />
                                                    <span>{party.phone_number}</span>
                                                </div>
                                            )}
                                            {party.gstin && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Hash className="w-3 h-3 shrink-0" />
                                                    <span className="font-mono">{party.gstin}</span>
                                                </div>
                                            )}
                                            {!party.phone_number && !party.gstin && (
                                                <span className="text-xs text-muted-foreground/50">No contact info</span>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 w-9 p-0 shrink-0 ml-3"
                                        onClick={() => openEdit(party)}
                                    >
                                        <Pencil className="w-4 h-4" />
                                        <span className="sr-only">Edit {party.name}</span>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Desktop: Table View ── */}
                    <div className="hidden md:block bg-card rounded-xl border border-border shadow-sm overflow-hidden">
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
                                {filtered.map(party => (
                                    <tr key={party.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3 font-medium text-foreground">{party.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {party.phone_number || <span className="text-muted-foreground/40">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                                            {party.gstin || <span className="text-muted-foreground/40 font-sans text-sm">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => openEdit(party)}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                <span className="sr-only">Edit {party.name}</span>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <PartyFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                mode={mode}
                initialData={selectedParty}
            />
        </div>
    );
}