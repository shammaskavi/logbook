import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ChevronDown, ChevronUp, MoreHorizontal, Pencil, Trash2,
  Plus, FileText, Search, ClipboardList, SlidersHorizontal, X
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import StatusBadge from "@/components/StatusBadge";
import DCList from "@/components/DCList";
import { getWorkOrderTotals, getWorkOrderStatus } from "@/types";
import { useWorkOrders, useDeleteWorkOrder, useDeleteWorkOrders, useParties, useJobWorkTypes, useDeliveryChallans } from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";

type Tab = "orders" | "dc";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function WorkOrderList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("orders");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const [confirmState, setConfirmState] = useState<{ open: boolean; ids: string[] }>({
    open: false,
    ids: [],
  });

  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterParty, setFilterParty] = useState<string>("all");
  const [filterWorkType, setFilterWorkType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: workOrders = [], isLoading: loadingOrders } = useWorkOrders();
  const { data: parties = [] } = useParties();
  const { data: jobTypes = [] } = useJobWorkTypes();
  const { data: dcs = [] } = useDeliveryChallans();
  const deleteWO = useDeleteWorkOrder();
  const deleteWOs = useDeleteWorkOrders();

  const activeFiltersCount = [filterMonth, filterParty, filterWorkType, filterStatus]
    .filter(v => v !== "all").length;

  const filteredOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!wo.party_name.toLowerCase().includes(q) && !wo.work_order_number.toLowerCase().includes(q)) return false;
      }
      if (filterMonth !== "all") {
        const m = new Date(wo.received_date).getMonth();
        if (m !== parseInt(filterMonth)) return false;
      }
      if (filterParty !== "all" && wo.party_id !== filterParty) return false;
      if (filterWorkType !== "all") {
        if (!wo.items.some(i => i.job_work_type_id === filterWorkType)) return false;
      }
      if (filterStatus !== "all") {
        if (getWorkOrderStatus(wo) !== filterStatus) return false;
      }
      return true;
    });
  }, [workOrders, searchQuery, filterMonth, filterParty, filterWorkType, filterStatus]);

  const totalQty = filteredOrders.reduce((s, wo) => s + getWorkOrderTotals(wo).total_quantity, 0);
  const totalPending = filteredOrders.reduce((s, wo) => s + getWorkOrderTotals(wo).total_pending, 0);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const handleDelete = (id: string) => setConfirmState({ open: true, ids: [id] });
  const handleBulkDelete = () => setConfirmState({ open: true, ids: Array.from(selectedIds) });

  const confirmDeletion = () => {
    if (confirmState.ids.length === 1) {
      deleteWO.mutate(confirmState.ids[0], {
        onSuccess: () => toast({ title: "Work order deleted successfully" }),
        onError: (err: any) => toast({ title: "Delete failed", description: err?.message }),
      });
    } else {
      deleteWOs.mutate(confirmState.ids, {
        onSuccess: () => {
          setSelectedIds(new Set());
          toast({ title: `${confirmState.ids.length} work orders deleted successfully` });
        },
        onError: (err: any) => toast({ title: "Bulk delete failed", description: err?.message }),
      });
    }
    setConfirmState({ open: false, ids: [] });
  };

  const clearFilters = () => {
    setFilterMonth("all");
    setFilterParty("all");
    setFilterWorkType("all");
    setFilterStatus("all");
  };

  // Shared filter selects (used in both desktop bar and mobile sheet)
  const FilterSelects = () => (
    <>
      <Select value={filterMonth} onValueChange={setFilterMonth}>
        <SelectTrigger className="w-full h-10 bg-card">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Months</SelectItem>
          {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filterParty} onValueChange={setFilterParty}>
        <SelectTrigger className="w-full h-10 bg-card">
          <SelectValue placeholder="Party" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Parties</SelectItem>
          {parties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filterWorkType} onValueChange={setFilterWorkType}>
        <SelectTrigger className="w-full h-10 bg-card">
          <SelectValue placeholder="Work Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {jobTypes.filter(j => j.active).map(j => <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-full h-10 bg-card">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="Not Yet Started">Not Yet Started</SelectItem>
          <SelectItem value="In Progress">In Progress</SelectItem>
          <SelectItem value="Completed">Completed</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="p-4 md:p-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Work Orders</h1>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4 md:mr-1" />
              <span className="hidden md:inline">Delete ({selectedIds.size})</span>
              <span className="md:hidden">({selectedIds.size})</span>
            </Button>
          )}
          <Button size="sm" onClick={() => navigate("/work-order/new")} className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create WO</span>
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/dc/new")} className="gap-1.5">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Create DC</span>
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-4 border-b border-border mb-4">
        <button
          onClick={() => setTab("orders")}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${tab === "orders" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          All Orders ({workOrders.length})
        </button>
        <button
          onClick={() => setTab("dc")}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${tab === "dc" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          DC Generated ({dcs.length})
        </button>
      </div>

      {tab === "dc" ? (
        <DCList />
      ) : (
        <>
          {/* ── Filters Row ── */}
          <div className="flex items-center gap-2 mb-4">
            {/* Search — always visible */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search party or WO#..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-card w-full"
              />
            </div>

            {/* Desktop filter dropdowns */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">Filter</span>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-[110px] h-9 bg-card"><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterParty} onValueChange={setFilterParty}>
                <SelectTrigger className="w-[130px] h-9 bg-card"><SelectValue placeholder="Party" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Parties</SelectItem>
                  {parties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterWorkType} onValueChange={setFilterWorkType}>
                <SelectTrigger className="w-[130px] h-9 bg-card"><SelectValue placeholder="Work Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {jobTypes.filter(j => j.active).map(j => <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] h-9 bg-card"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Not Yet Started">Not Yet Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mobile: Filter Sheet trigger */}
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden relative shrink-0 h-9 gap-1.5">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filter
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl max-h-[75vh]">
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-left">Filter Work Orders</SheetTitle>
                </SheetHeader>
                <div className="space-y-3 pb-6">
                  <FilterSelects />
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground" onClick={clearFilters}>
                      <X className="w-4 h-4" />
                      Clear all filters
                    </Button>
                  )}
                  <Button className="w-full" onClick={() => setFilterSheetOpen(false)}>
                    Show {filteredOrders.length} results
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* ── Loading Skeletons ── */}
          {loadingOrders ? (
            <div className="space-y-3">
              {/* Mobile skeleton cards */}
              <div className="md:hidden space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-3.5 w-48" />
                    <div className="flex gap-4">
                      <Skeleton className="h-3.5 w-16" />
                      <Skeleton className="h-3.5 w-16" />
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop skeleton table */}
              <div className="hidden md:block bg-card rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[950px] px-4 py-3 border-b border-border">
                    <Skeleton className="h-4 w-full" />
                  </div>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="min-w-[950px] grid grid-cols-[40px_130px_1fr_140px_90px_120px_120px_120px_80px] items-center px-4 py-3.5 border-b border-border last:border-b-0">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-28 mx-auto" />
                      <Skeleton className="h-4 w-8 mx-auto" />
                      <Skeleton className="h-4 w-12 mx-auto" />
                      <Skeleton className="h-4 w-12 mx-auto" />
                      <Skeleton className="h-5 w-20 rounded-md" />
                      <Skeleton className="h-6 w-6 ml-auto" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center bg-card rounded-xl border border-border">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No work orders found</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or create a new work order.</p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Mobile: Card View ── */}
              <div className="md:hidden space-y-3">
                {filteredOrders.map((wo) => {
                  const { total_quantity, total_pending } = getWorkOrderTotals(wo);
                  const status = getWorkOrderStatus(wo);
                  const isExpanded = expandedId === wo.id;

                  return (
                    <div key={wo.id} className="bg-card rounded-xl border border-border overflow-hidden">
                      <div
                        className="p-4 cursor-pointer active:bg-muted/30 transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : wo.id)}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{wo.party_name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {wo.work_order_number} · {format(new Date(wo.received_date), "d MMM yyyy")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <StatusBadge status={status} />
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span><span className="font-medium text-foreground">{total_quantity}</span> qty</span>
                          <span><span className="font-medium text-foreground">{total_pending}</span> pending</span>
                          <span><span className="font-medium text-foreground">{wo.items.length}</span> {wo.items.length === 1 ? "job" : "jobs"}</span>
                        </div>
                      </div>

                      {/* Expanded items + actions */}
                      {isExpanded && (
                        <div className="border-t border-border">
                          {/* Items */}
                          <div className="divide-y divide-border">
                            {wo.items.map(item => (
                              <div key={item.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                                <span className="text-foreground">{item.job_work_type_name}</span>
                                <div className="flex gap-4 text-xs text-muted-foreground">
                                  <span>Qty: <span className="font-medium text-foreground">{item.quantity}</span></span>
                                  <span>Pending: <span className="font-medium text-foreground">{item.pending_quantity}</span></span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Action buttons */}
                          {status !== "Completed" && (
                            <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-muted/20">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="flex-1 gap-1.5 text-xs h-9"
                                onClick={() => navigate(`/work-order/${wo.id}/edit`)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="flex-1 gap-1.5 text-xs h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(wo.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Desktop: Table View ── */}
              <div className="hidden md:block bg-card rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[950px] grid grid-cols-[40px_130px_1fr_140px_90px_120px_120px_120px_80px] items-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                    <div>
                      <Checkbox
                        checked={selectedIds.size === filteredOrders.length && filteredOrders.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </div>
                    <div>Received Date</div>
                    <div>Party Name</div>
                    <div>Work Order No.</div>
                    <div className="text-center">Job Work</div>
                    <div className="text-center">Qty ({totalQty})</div>
                    <div className="text-center">Pending ({totalPending})</div>
                    <div>Status</div>
                    <div></div>
                  </div>

                  {filteredOrders.map((wo) => {
                    const { total_quantity, total_pending } = getWorkOrderTotals(wo);
                    const status = getWorkOrderStatus(wo);
                    const isExpanded = expandedId === wo.id;
                    const isSelected = selectedIds.has(wo.id);

                    return (
                      <div key={wo.id} className={`border-b border-border last:border-b-0 ${isExpanded ? "bg-muted/40" : ""}`}>
                        <div className="min-w-[950px] grid grid-cols-[40px_130px_1fr_140px_90px_120px_120px_120px_80px] items-center px-4 py-3.5 text-sm hover:bg-muted/30 transition-colors">
                          <div>
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(wo.id)} />
                          </div>
                          <div className="text-foreground">{format(new Date(wo.received_date), "d MMM yyyy")}</div>
                          <div className="text-foreground font-medium">{wo.party_name}</div>
                          <div className="text-foreground text-center">{wo.work_order_number}</div>
                          <div className="text-center text-foreground">{wo.items.length}</div>
                          <div className="text-center text-foreground font-medium">{total_quantity}</div>
                          <div className="text-center text-foreground font-medium">{total_pending}</div>
                          <div><StatusBadge status={status} /></div>
                          <div className="flex items-center gap-1 justify-end">
                            {status !== "Completed" && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1 rounded hover:bg-muted transition-colors">
                                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {/* <DropdownMenuItem onClick={() => navigate(`/work-order/${wo.id}/edit`)}>
                                    <Pencil className="w-4 h-4 mr-2" />Edit Work Order
                                  </DropdownMenuItem> */}
                                  <DropdownMenuItem onClick={() => handleDelete(wo.id)} className="text-destructive">
                                    <Trash2 className="w-4 h-4 mr-2" />Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : wo.id)}
                              className="p-1 rounded hover:bg-muted transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 ml-10">
                            <div className="bg-card rounded-lg border border-border overflow-hidden">
                              <div className="grid grid-cols-[1fr_120px_120px] px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                                <div>Job Work</div>
                                <div className="text-center">Quantity</div>
                                <div className="text-center">Pending</div>
                              </div>
                              {wo.items.map(item => (
                                <div key={item.id} className="grid grid-cols-[1fr_120px_120px] px-4 py-2.5 text-sm border-b border-border last:border-b-0">
                                  <div className="text-foreground">{item.job_work_type_name}</div>
                                  <div className="text-center text-foreground">{item.quantity}</div>
                                  <div className="text-center font-medium text-foreground">{item.pending_quantity}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmState.open}
        title="Warning!"
        description={
          confirmState.ids.length === 1
            ? "Deleting this Work Order will permanently remove all linked Delivery Challans. This action cannot be undone."
            : `Deleting ${confirmState.ids.length} Work Orders will permanently remove all linked Delivery Challans. This action cannot be undone.`
        }
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDeletion}
        onCancel={() => setConfirmState({ open: false, ids: [] })}
      />
    </div>
  );
}
