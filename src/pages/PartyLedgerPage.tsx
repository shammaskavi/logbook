import { useNavigate, useParams } from "react-router-dom";
import {
    IndianRupee, ClipboardList, Package, Wallet,
    ArrowLeft, Phone, Hash, TrendingUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { usePartyLedgerSummary } from "@/hooks/use-party-ledger";
import {
    useParties, useWorkOrders, useDeliveryChallans, useInvoices,
} from "@/hooks/use-data";
import PartyWorkOrdersList from "@/components/party-ledger/PartyWorkOrdersList";
import PartyDeliveryChallansList from "@/components/party-ledger/PartyDeliveryChallansList";
import PartyInvoicesList from "@/components/party-ledger/PartyInvoicesList";
import { useState } from "react";
import { cn } from "@/lib/utils";

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value || 0);
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-IN").format(value || 0);
}

// ── Metric Card ──────────────────────────────────────────────────────────────
type MetricCardProps = {
    title: string;
    value: number;
    isCurrency?: boolean;
    accentClass: string;      // e.g. "bg-green-100 text-green-700"
    iconBg: string;           // e.g. "bg-green-50"
    icon: React.ReactNode;
};

function MetricCard({ title, value, isCurrency, accentClass, iconBg, icon }: MetricCardProps) {
    return (
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
                <span className={cn("w-5 h-5", accentClass)}>{icon}</span>
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">{title}</p>
                <p className="text-xl font-bold text-foreground mt-0.5 truncate">
                    {isCurrency ? formatCurrency(value) : formatNumber(value)}
                </p>
            </div>
        </div>
    );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function PageSkeleton() {
    return (
        <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-6 w-28" />
                    </div>
                </div>
            ))}
        </div>
    );
}

type Tab = "overview" | "work-orders" | "delivery-challans" | "invoices";

const TABS: { value: Tab; label: string }[] = [
    { value: "overview",           label: "Overview" },
    { value: "work-orders",        label: "Work Orders" },
    { value: "delivery-challans",  label: "Challans" },
    { value: "invoices",           label: "Invoices" },
];

// ── Page ─────────────────────────────────────────────────────────────────────
export default function PartyLedgerPage() {
    const { id: partyId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>("overview");

    const { data: parties = [] } = useParties();
    const { data: workOrders = [],        isLoading: workOrdersLoading }    = useWorkOrders();
    const { data: deliveryChallans = [],  isLoading: deliveryChallansLoading } = useDeliveryChallans();
    const { data: invoices = [],          isLoading: invoicesLoading }       = useInvoices();

    const party = parties.find(p => p.id === partyId);
    const partyWorkOrders       = workOrders.filter(wo => wo.party_id === partyId);
    const partyDeliveryChallans = deliveryChallans.filter(dc => dc.party_id === partyId);
    const partyInvoices         = invoices.filter(inv => inv.party_id === partyId);

    const { data, isLoading, error } = usePartyLedgerSummary(partyId);
    const summary = data ?? {
        total_work_orders: 0,
        total_quantity: 0,
        total_invoiced: 0,
        outstanding_amount: 0,
    };

    return (
        <div className="p-4 md:p-6 space-y-5">

            {/* ── Back button ── */}
            <Button variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4" />
                Back
            </Button>

            {/* ── Party Identity Card ── */}
            <div className="bg-card rounded-xl border border-border p-4 md:p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
                            {party?.name || "Party Ledger"}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Financial and operational summary
                        </p>
                        <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
                            {party?.phone_number && (
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Phone className="h-3.5 w-3.5 shrink-0" />
                                    <span>{party.phone_number}</span>
                                </div>
                            )}
                            {party?.gstin && (
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Hash className="h-3.5 w-3.5 shrink-0" />
                                    <span className="font-mono text-xs">{party.gstin}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <TrendingUp className="w-5 h-5 text-muted-foreground" />
                    </div>
                </div>
            </div>

            {/* ── Metric Cards ── */}
            {isLoading ? <PageSkeleton /> : error ? (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive">
                    {(error as Error).message || "Failed to load party ledger."}
                </div>
            ) : (
                <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        title="Work Orders"
                        value={summary.total_work_orders}
                        accentClass="text-blue-600"
                        iconBg="bg-blue-50"
                        icon={<ClipboardList className="w-5 h-5" />}
                    />
                    <MetricCard
                        title="Total Quantity"
                        value={summary.total_quantity}
                        accentClass="text-violet-600"
                        iconBg="bg-violet-50"
                        icon={<Package className="w-5 h-5" />}
                    />
                    <MetricCard
                        title="Total Invoiced"
                        value={summary.total_invoiced}
                        isCurrency
                        accentClass="text-green-600"
                        iconBg="bg-green-50"
                        icon={<IndianRupee className="w-5 h-5" />}
                    />
                    <MetricCard
                        title="Outstanding"
                        value={summary.outstanding_amount}
                        isCurrency
                        accentClass="text-amber-600"
                        iconBg="bg-amber-50"
                        icon={<Wallet className="w-5 h-5" />}
                    />
                </div>
            )}

            {/* ── Tabs — same underline pattern as rest of app ── */}
            <div className="border-b border-border">
                <nav className="flex gap-1 overflow-x-auto scrollbar-none">
                    {TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={cn(
                                "pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0",
                                activeTab === tab.value
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* ── Tab Panels ── */}
            {activeTab === "overview" && (
                <div className="space-y-4">
                    <PartyWorkOrdersList workOrders={partyWorkOrders} isLoading={workOrdersLoading} previewCount={3} />
                    <PartyDeliveryChallansList deliveryChallans={partyDeliveryChallans} isLoading={deliveryChallansLoading} previewCount={3} />
                    <PartyInvoicesList invoices={partyInvoices} isLoading={invoicesLoading} previewCount={3} />
                </div>
            )}
            {activeTab === "work-orders" && (
                <PartyWorkOrdersList workOrders={partyWorkOrders} isLoading={workOrdersLoading} />
            )}
            {activeTab === "delivery-challans" && (
                <PartyDeliveryChallansList deliveryChallans={partyDeliveryChallans} isLoading={deliveryChallansLoading} />
            )}
            {activeTab === "invoices" && (
                <PartyInvoicesList invoices={partyInvoices} isLoading={invoicesLoading} />
            )}
        </div>
    );
}