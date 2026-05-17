
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobWorks } from "@/hooks/use-jobWorks";
import JobWorkFormModal from "@/components/settings/JobWorkFormModal";
import { Wrench, Plus, Search, Pencil } from "lucide-react";

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
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search job works..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Button
                    onClick={() => {
                        setMode("create");
                        setSelectedJobWork(null);
                        setModalOpen(true);
                    }}
                    className="gap-2 shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    Add Job Work
                </Button>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/30">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-8 w-14" /></td>
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={3}>
                                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                            <Wrench className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                {search ? "No job works match your search" : "No job works yet"}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {search ? "Try adjusting your search." : "Add job work types to use in work orders."}
                                            </p>
                                        </div>
                                        {!search && (
                                            <Button size="sm" className="gap-1.5 mt-1" onClick={() => { setMode("create"); setSelectedJobWork(null); setModalOpen(true); }}>
                                                <Plus className="w-3.5 h-3.5" />
                                                Add Job Work
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((jw: any) => (
                                <tr key={jw.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 font-medium text-foreground">{jw.name}</td>
                                    <td className="px-4 py-3">
                                        {jw.active ? (
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 text-xs font-medium">
                                                Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-xs font-medium">
                                                Inactive
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="gap-1.5 text-muted-foreground hover:text-foreground"
                                            onClick={() => {
                                                setMode("edit");
                                                setSelectedJobWork(jw);
                                                setModalOpen(true);
                                            }}
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
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