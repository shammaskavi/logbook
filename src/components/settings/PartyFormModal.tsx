

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAddParty } from "@/hooks/use-data";
import { useUpdateParty } from "@/hooks/use-parties";

interface PartyFormModalProps {
    open: boolean;
    onClose: () => void;
    mode: "create" | "edit";
    initialData?: {
        id: string;
        name: string;
        phone_number: string | null;
        gstin: string | null;
    };
    onSuccess?: (party: any) => void;
}

export default function PartyFormModal({
    open,
    onClose,
    mode,
    initialData,
    onSuccess,
}: PartyFormModalProps) {
    const { mutateAsync: createParty, isPending: creating } = useAddParty();
    const { mutateAsync: updateParty, isPending: updating } = useUpdateParty();

    const isSubmitting = creating || updating;

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [gstin, setGstin] = useState("");

    useEffect(() => {
        if (mode === "edit" && initialData) {
            setName(initialData.name);
            setPhone(initialData.phone_number || "");
            setGstin(initialData.gstin || "");
        } else {
            setName("");
            setPhone("");
            setGstin("");
        }
    }, [mode, initialData, open]);

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("Party Name is required");
            return;
        }

        try {
            if (mode === "create") {
                const created = await createParty({
                    name,
                    phone_number: phone || null,
                    gstin: gstin || null,
                });
                toast.success("Party created successfully");

                if (onSuccess) {
                    onSuccess(created);
                }
            } else if (mode === "edit" && initialData) {
                await updateParty({
                    id: initialData.id,
                    data: {
                        name,
                        phone_number: phone || null,
                        gstin: gstin || null,
                    },
                });
                toast.success("Party updated successfully");
            }

            onClose();
        } catch (err: any) {
            if (err?.message?.includes("parties_name_key")) {
                toast.error("Party name already exists");
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
                        {mode === "create" ? "Add New Party" : "Edit Party"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Party Name *</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter party name"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Phone Number</label>
                        <Input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Enter phone number"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">GST Number</label>
                        <Input
                            value={gstin}
                            onChange={(e) => setGstin(e.target.value)}
                            placeholder="Enter GST number"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
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