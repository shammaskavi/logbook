

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useJobWorks } from "@/hooks/use-jobWorks";
import JobWorkFormModal from "@/components/settings/JobWorkFormModal";

export default function JobWorksPage() {
    const { data: jobWorks = [], isLoading } = useJobWorks();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [mode, setMode] = useState<"create" | "edit">("create");
    const [selectedJobWork, setSelectedJobWork] = useState<any>(null);

    const filtered = jobWorks.filter((jw: any) =>
        jw.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <Input
                    placeholder="Search job works..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />

                <Button
                    onClick={() => {
                        setMode("create");
                        setSelectedJobWork(null);
                        setModalOpen(true);
                    }}
                >
                    + Add Job Work
                </Button>
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium">Name</th>
                            <th className="text-left px-4 py-3 font-medium">Status</th>
                            <th className="text-left px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                                    Loading job works...
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                                    No job works found
                                </td>
                            </tr>
                        ) : (
                            filtered.map((jw: any) => (
                                <tr key={jw.id} className="border-t border-border">
                                    <td className="px-4 py-3">{jw.name}</td>
                                    <td className="px-4 py-3">
                                        {jw.active ? (
                                            <Badge variant="default">Active</Badge>
                                        ) : (
                                            <Badge variant="secondary">Inactive</Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setMode("edit");
                                                setSelectedJobWork(jw);
                                                setModalOpen(true);
                                            }}
                                        >
                                            Edit
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <JobWorkFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                mode={mode}
                initialData={selectedJobWork}
            />
        </div>
    );
}