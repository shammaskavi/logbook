import { useState } from "react";
import { useParties } from "@/hooks/use-parties";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PartyFormModal from "@/components/settings/PartyFormModal";

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
        <div>
            <div className="flex items-center justify-between mb-6">
                <Input
                    placeholder="Search parties..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />

                <Button
                    onClick={() => {
                        setMode("create");
                        setSelectedParty(null);
                        setModalOpen(true);
                    }}
                >
                    + Add Party
                </Button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div>Loading…</div>
            ) : filtered.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                    No parties found
                </div>
            ) : (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium">Party Name</th>
                                <th className="text-left px-4 py-3 font-medium">Phone Number</th>
                                <th className="text-left px-4 py-3 font-medium">GST Number</th>
                                <th className="text-left px-4 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(party => (
                                <tr key={party.id} className="border-t border-border">
                                    <td className="px-4 py-2">{party.name}</td>
                                    <td className="px-4 py-2">
                                        {party.phone_number || "N/A"}
                                    </td>
                                    <td className="px-4 py-2">
                                        {party.gstin || "N/A"}
                                    </td>
                                    <td className="px-4 py-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setMode("edit");
                                                setSelectedParty(party);
                                                setModalOpen(true);
                                            }}
                                        >
                                            Edit
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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