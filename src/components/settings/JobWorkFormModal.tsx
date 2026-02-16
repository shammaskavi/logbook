

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    useCreateJobWork,
    useUpdateJobWork,
} from "@/hooks/use-jobWorks";

interface JobWorkFormModalProps {
    open: boolean;
    onClose: () => void;
    mode: "create" | "edit";
    initialData?: {
        id: string;
        name: string;
        active: boolean | null;
    };
}

export default function JobWorkFormModal({
    open,
    onClose,
    mode,
    initialData,
}: JobWorkFormModalProps) {
    const { mutateAsync: createJobWork, isPending: creating } =
        useCreateJobWork();
    const { mutateAsync: updateJobWork, isPending: updating } =
        useUpdateJobWork();

    const isSubmitting = creating || updating;

    const [name, setName] = useState("");
    const [active, setActive] = useState(true);

    useEffect(() => {
        if (mode === "edit" && initialData) {
            setName(initialData.name);
            setActive(initialData.active ?? true);
        } else {
            setName("");
            setActive(true);
        }
    }, [mode, initialData, open]);

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("Job Work Name is required");
            return;
        }

        try {
            if (mode === "create") {
                await createJobWork({
                    name,
                    active,
                });
                toast.success("Job Work created successfully");
            } else if (mode === "edit" && initialData) {
                await updateJobWork({
                    id: initialData.id,
                    data: {
                        name,
                        active,
                    },
                });
                toast.success("Job Work updated successfully");
            }

            onClose();
        } catch (err: any) {
            if (err?.message?.includes("job_work_types_name_key")) {
                toast.error("Job Work name already exists");
            } else {
                toast.error("Something went wrong");
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Add Job Work" : "Edit Job Work"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium">Job Work Name *</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter job work name"
                        />
                    </div>

                    <div className="flex items-center justify-between border rounded-md px-4 py-3">
                        <div>
                            <Label className="text-sm font-medium">Active</Label>
                            <p className="text-xs text-muted-foreground">
                                Inactive job works cannot be selected in new work orders
                            </p>
                        </div>
                        <Switch checked={active} onCheckedChange={setActive} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting
                                ? "Saving..."
                                : mode === "create"
                                    ? "Save"
                                    : "Update"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}