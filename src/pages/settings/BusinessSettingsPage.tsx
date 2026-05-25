import { useMemo, useRef, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { ImagePlus, Trash2, Loader2 } from "lucide-react";

// ─── Shared layout helpers ────────────────────────────────────────────────────
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

// ─── Logo upload helper ───────────────────────────────────────────────────────
const BUCKET = "business-logos";
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

function getLogoPublicUrl(path: string): string {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BusinessSettingsPage() {
    const { toast } = useToast();
    const { organizationId } = useCurrentOrganization();

    const { data: settings, isLoading } = useBusinessSettings();
    const updateMutation = useUpdateBusinessSettings();

    // Logo upload state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [logoUploading, setLogoUploading] = useState(false);
    const [logoRemoving, setLogoRemoving] = useState(false);

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

    const form = useForm({ values: defaultValues });

    // ── Handle logo file selection ──
    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !organizationId || !settings?.organization_id) return;

        // Validate type
        if (!ALLOWED_TYPES.includes(file.type)) {
            toast({
                title: "Unsupported file type",
                description: "Please upload a PNG, JPG, WebP, or SVG file.",
                variant: "destructive",
            });
            return;
        }

        // Validate size
        if (file.size > MAX_SIZE_BYTES) {
            toast({
                title: "File too large",
                description: "Maximum logo size is 2 MB.",
                variant: "destructive",
            });
            return;
        }


        setLogoUploading(true);
        try {
            const ext = file.name.split(".").pop() ?? "png";
            // Timestamp in filename = unique URL every upload = no browser cache stale issue
            const storagePath = `${settings.organization_id}/logo_${Date.now()}.${ext}`;

            // If there's an existing logo, delete it first so the bucket doesn't
            // accumulate orphaned files every time the logo is changed
            if (settings.logo_url) {
                await supabase.storage.from(BUCKET).remove([settings.logo_url]);
            }

            // Upload new logo
            const { error: uploadError } = await supabase.storage
                .from(BUCKET)
                .upload(storagePath, file, { contentType: file.type });

            if (uploadError) throw uploadError;

            // Save the new unique path to business_settings
            await updateMutation.mutateAsync({
                organization_id: settings.organization_id,
                logo_url: storagePath,
            });

            toast({ title: "Logo uploaded", description: "Your business logo has been saved." });
        } catch (err: any) {
            toast({
                title: "Upload failed",
                description: err?.message ?? "Could not upload logo. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLogoUploading(false);
            // Reset input so the same file can be re-selected after removal
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // ── Handle logo removal ──
    const handleRemoveLogo = async () => {
        if (!settings?.organization_id || !settings.logo_url) return;

        setLogoRemoving(true);
        try {
            // Remove from storage
            await supabase.storage.from(BUCKET).remove([settings.logo_url]);

            // Clear the reference in DB
            await updateMutation.mutateAsync({
                organization_id: settings.organization_id,
                logo_url: null,
            });

            toast({ title: "Logo removed" });
        } catch (err: any) {
            toast({
                title: "Remove failed",
                description: err?.message ?? "Could not remove logo.",
                variant: "destructive",
            });
        } finally {
            setLogoRemoving(false);
        }
    };

    // ── Handle form save ──
    const onSubmit = async (values: Omit<BusinessSettings, "organization_id" | "logo_url">) => {
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
                <p className="text-sm text-muted-foreground">No business settings found.</p>
            </div>
        );
    }

    const currentLogoUrl = settings.logo_url ? getLogoPublicUrl(settings.logo_url) : null;

    // Smart initials fallback — same logic used in InvoicePreview
    const initials = (settings.business_name || "BZ")
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="bg-card rounded-lg border border-border p-4 md:p-6 space-y-8 max-w-6xl"
        >
            {/* ── Brand / Logo Section ── */}
            <Section
                title="Brand"
                description="Your logo appears in the header of every invoice."
            >
                <div className="flex items-center gap-5">
                    {/* Preview box — same proportions as the invoice header cell */}
                    <div className="w-20 h-20 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {currentLogoUrl ? (
                            <img
                                src={currentLogoUrl}
                                alt="Business logo"
                                className="w-full h-full object-contain p-1"
                            />
                        ) : (
                            <span className="text-2xl font-bold text-muted-foreground select-none">
                                {initials}
                            </span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={ALLOWED_TYPES.join(",")}
                                className="hidden"
                                onChange={handleLogoChange}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                disabled={logoUploading}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {logoUploading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <ImagePlus className="w-4 h-4" />
                                )}
                                {logoUploading ? "Uploading…" : currentLogoUrl ? "Change Logo" : "Upload Logo"}
                            </Button>

                            {currentLogoUrl && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    disabled={logoRemoving}
                                    onClick={handleRemoveLogo}
                                >
                                    {logoRemoving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    {logoRemoving ? "Removing…" : "Remove"}
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            PNG, JPG, WebP or SVG · Max 2 MB
                        </p>
                    </div>
                </div>
            </Section>

            <Section
                title="Company Information"
                description="Details that appear on invoices and delivery challans."
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Business Name" required>
                        <Input {...form.register("business_name", { required: true })} />
                    </Field>

                    <Field label="GSTIN">
                        <Input {...form.register("gstin")} />
                    </Field>

                    <div className="md:col-span-2">
                        <Field label="Business Address">
                            <Textarea rows={3} {...form.register("business_address")} />
                        </Field>
                    </div>

                    <Field label="PAN">
                        <Input {...form.register("pan")} />
                    </Field>

                    <Field label="Phone">
                        <Input {...form.register("phone")} />
                    </Field>

                    <Field label="Email">
                        <Input type="email" {...form.register("email")} />
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