import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    BusinessSettings,
    useBusinessSettings,
    useUpdateBusinessSettings,
} from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";

function Section({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold">{title}</h2>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            {children}
        </div>
    );
}

function Field({
    label,
    required,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
                {label}
                {required && <span className="text-destructive"> *</span>}
            </label>
            {children}
        </div>
    );
}

export default function BusinessSettingsPage() {
    const { toast } = useToast();

    const { data: settings, isLoading } = useBusinessSettings();
    const updateMutation = useUpdateBusinessSettings();

    const defaultValues = useMemo(
        () => ({
            business_name: settings?.business_name ?? "",
            business_address: settings?.business_address ?? "",
            gstin: settings?.gstin ?? "",
            pan: settings?.pan ?? "",
            phone: settings?.phone ?? "",
            email: settings?.email ?? "",

            bank_name: settings?.bank_name ?? "",
            bank_branch: settings?.bank_branch ?? "",
            account_name: settings?.account_name ?? "",
            account_number: settings?.account_number ?? "",
            ifsc_code: settings?.ifsc_code ?? "",

            work_order_prefix: settings?.work_order_prefix ?? "WO",
            dc_prefix: settings?.dc_prefix ?? "DC",
            invoice_prefix: settings?.invoice_prefix ?? "INV",
        }),
        [settings]
    );

    const form = useForm({
        values: defaultValues,
    });

    const onSubmit = async (values: Omit<BusinessSettings, "organization_id">) => {
        if (!settings?.organization_id) return;

        try {
            await updateMutation.mutateAsync({
                organization_id: settings.organization_id,
                ...values,
            });

            toast({
                title: "Settings saved",
                description: "Business settings updated successfully.",
            });
        } catch (error: any) {
            toast({
                title: "Save failed",
                description: error?.message || "Unable to save settings.",
                variant: "destructive",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="bg-card rounded-lg border border-border p-6">
                <p className="text-sm text-muted-foreground">Loading business settings...</p>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="bg-card rounded-lg border border-border p-6">
                <p className="text-sm text-muted-foreground">
                    No business settings found.
                </p>
            </div>
        );
    }

    return (
        <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="bg-card rounded-lg border border-border p-6 space-y-8 max-w-6xl"
        >
            <Section
                title="Company Information"
                description="Details that appear on invoices and delivery challans."
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Business Name" required>
                        <Input
                            {...form.register("business_name", { required: true })}
                        />
                    </Field>

                    <Field label="GSTIN">
                        <Input {...form.register("gstin")} />
                    </Field>

                    <div className="md:col-span-2">
                        <Field label="Business Address">
                            <Textarea
                                rows={3}
                                {...form.register("business_address")}
                            />
                        </Field>
                    </div>

                    <Field label="PAN">
                        <Input {...form.register("pan")} />
                    </Field>

                    <Field label="Phone">
                        <Input {...form.register("phone")} />
                    </Field>

                    <Field label="Email" >
                        <Input
                            type="email"
                            {...form.register("email")}
                        />
                    </Field>
                </div>
            </Section>

            <Section
                title="Bank Details"
                description="Displayed in the payment section of the invoice."
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Bank Name">
                        <Input {...form.register("bank_name")} />
                    </Field>

                    <Field label="Branch">
                        <Input {...form.register("bank_branch")} />
                    </Field>

                    <Field label="Account Name">
                        <Input {...form.register("account_name")} />
                    </Field>

                    <Field label="Account Number">
                        <Input {...form.register("account_number")} />
                    </Field>

                    <Field label="IFSC Code">
                        <Input {...form.register("ifsc_code")} />
                    </Field>
                </div>
            </Section>

            <Section
                title="Document Numbering"
                description="Prefixes used when generating document numbers."
            >
                <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Work Order Prefix">
                        <Input {...form.register("work_order_prefix")} />
                    </Field>

                    <Field label="Delivery Challan Prefix">
                        <Input {...form.register("dc_prefix")} />
                    </Field>

                    <Field label="Invoice Prefix">
                        <Input {...form.register("invoice_prefix")} />
                    </Field>
                </div>
            </Section>

            <div className="flex justify-end pt-2 border-t border-border">
                <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    );
}