import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ChevronDown, ChevronUp, MoreHorizontal, Pencil, Trash2,
  Download, Eye, Search, FileText, SlidersHorizontal, X
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
import { useDeliveryChallans, useDeleteDeliveryChallan, useDeleteDeliveryChallans, useParties } from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";
import { DCPreviewModal } from "@/components/dc/DCPreviewModal";
import ConfirmDialog from "./ConfirmDialog";


const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function DCList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterParty, setFilterParty] = useState<string>("all");
  const [previewDcId, setPreviewDcId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    ids: string[];
  }>({
    open: false,
    ids: [],
  });

  const { data: dcs = [], isLoading } = useDeliveryChallans();
  const { data: parties = [] } = useParties();
  const deleteDC = useDeleteDeliveryChallan();
  const deleteDCs = useDeleteDeliveryChallans();

  const filtered = useMemo(() => {
    return dcs.filter(dc => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!dc.party_name.toLowerCase().includes(q) && !dc.dc_number.toLowerCase().includes(q)) return false;
      }
      if (filterMonth !== "all") {
        if (new Date(dc.generated_date).getMonth() !== parseInt(filterMonth)) return false;
      }
      if (filterParty !== "all" && dc.party_id !== filterParty) return false;
      return true;
    });
  }, [dcs, searchQuery, filterMonth, filterParty]);

  const totalQty = filtered.reduce((s, dc) => s + dc.items.reduce((ss, i) => ss + i.quantity, 0), 0);
  const activeFiltersCount = [filterMonth, filterParty].filter(v => v !== "all").length;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(d => d.id)));
  };

  const handleDelete = useCallback((id: string) => {
    setConfirmState({ open: true, ids: [id] });
  }, []);

  const handleBulkDelete = () => {
    setConfirmState({
      open: true,
      ids: Array.from(selectedIds),
    });
  };

  const confirmDeletion = () => {
    const ids = confirmState.ids;

    if (ids.length === 1) {
      deleteDC.mutate(ids[0], {
        onSuccess: () => {
          toast({ title: "Delivery Challan deleted successfully" });
        },
        onError: (err: any) => {
          toast({
            title: "Delete failed",
            description: err?.message || "Failed to delete delivery challan.",
            variant: "destructive",
          });
        },
      });
    } else {
      deleteDCs.mutate(ids, {
        onSuccess: () => {
          setSelectedIds(new Set());
          toast({
            title: `${ids.length} delivery challan${ids.length > 1 ? "s" : ""} deleted successfully`,
          });
        },
        onError: (err: any) => {
          toast({
            title: "Bulk delete failed",
            description: err?.message || "Failed to delete selected delivery challans.",
            variant: "destructive",
          });
        },
      });
    }

    setConfirmState({ open: false, ids: [] });
  };

  const openPreview = (id: string) => {
    setPreviewDcId(id);
    setPreviewOpen(true);
  };

  const clearFilters = () => {
    setFilterMonth("all");
    setFilterParty("all");
  };

  if (isLoading) return (
    <div>
      {/* Mobile skeleton */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        ))}
      </div>
      {/* Desktop skeleton */}
      <div className="hidden md:block bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[950px] px-4 py-3 border-b border-border"><Skeleton className="h-4 w-full" /></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="min-w-[950px] grid grid-cols-[40px_130px_1fr_130px_90px_120px_1fr_80px] items-center px-4 py-3.5 border-b border-border last:border-b-0">
              <Skeleton className="h-4 w-4" /><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24 mx-auto" /><Skeleton className="h-4 w-8 mx-auto" />
              <Skeleton className="h-4 w-12 mx-auto" /><Skeleton className="h-4 w-28" /><Skeleton className="h-6 w-6 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Filters Row ── */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search party or DC#..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-card w-full"
          />
        </div>

        {/* Desktop filters */}
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
        </div>

        {selectedIds.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            className="shrink-0"
            disabled={deleteDC.isPending || deleteDCs.isPending}
          >
            <Trash2 className="w-4 h-4 md:mr-1" />
            <span className="hidden md:inline">Delete ({selectedIds.size})</span>
            <span className="md:hidden">({selectedIds.size})</span>
          </Button>
        )}

        {/* Mobile filter sheet */}
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
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[60vh]">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-left">Filter Delivery Challans</SheetTitle>
            </SheetHeader>
            <div className="space-y-3 pb-6">
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-full h-10 bg-card"><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterParty} onValueChange={setFilterParty}>
                <SelectTrigger className="w-full h-10 bg-card"><SelectValue placeholder="Party" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Parties</SelectItem>
                  {parties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground" onClick={clearFilters}>
                  <X className="w-4 h-4" />Clear filters
                </Button>
              )}
              <Button className="w-full" onClick={() => setFilterSheetOpen(false)}>
                Show {filtered.length} results
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Empty State ── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center bg-card rounded-xl border border-border">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No delivery challans found</p>
            <p className="text-xs text-muted-foreground mt-1">Create a delivery challan from a work order to get started.</p>
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <>
          {/* ── Mobile: Card View ── */}
          <div className="md:hidden space-y-3">
            {filtered.map(dc => {
              const isExpanded = expandedId === dc.id;
              const qty = dc.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <div key={dc.id} className="bg-card rounded-xl border border-border overflow-hidden">
                  <div
                    className="p-4 cursor-pointer active:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : dc.id)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{dc.party_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          DC# {dc.dc_number} · {format(new Date(dc.generated_date), "d MMM yyyy")}
                        </p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span><span className="font-medium text-foreground">{qty}</span> qty</span>
                      <span><span className="font-medium text-foreground">{dc.items.length}</span> {dc.items.length === 1 ? "item" : "items"}</span>
                      {dc.transporter_name && <span className="truncate">{dc.transporter_name}</span>}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border">
                      <div className="divide-y divide-border">
                        {dc.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                            <span className="text-foreground">{item.job_work_type_name}</span>
                            <span className="text-xs text-muted-foreground">Qty: <span className="font-medium text-foreground">{item.quantity}</span></span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-muted/20">
                        <Button size="sm" variant="ghost" className="flex-1 gap-1.5 text-xs h-9" onClick={() => openPreview(dc.id)}>
                          <Eye className="w-3.5 h-3.5" />Preview
                        </Button>
                        <Button size="sm" variant="ghost" className="flex-1 gap-1.5 text-xs h-9" onClick={() => navigate(`/dc/${dc.id}/edit`)}>
                          <Pencil className="w-3.5 h-3.5" />Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="flex-1 gap-1.5 text-xs h-9 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(dc.id)}>
                          <Trash2 className="w-3.5 h-3.5" />Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Desktop: Table View ── */}
          <div className="hidden md:block bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[950px] grid grid-cols-[40px_130px_1fr_130px_90px_120px_1fr_80px] items-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                <div><Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={toggleSelectAll} /></div>
                <div>Generated Date</div>
                <div>Party Name</div>
                <div>DC No.</div>
                <div className="text-center">Job Work</div>
                <div className="text-center">Qty ({totalQty})</div>
                <div>Transporter</div>
                <div></div>
              </div>

              {filtered.map(dc => {
                const isExpanded = expandedId === dc.id;
                const isSelected = selectedIds.has(dc.id);
                const qty = dc.items.reduce((s, i) => s + i.quantity, 0);
                return (
                  <div key={dc.id} className={`border-b border-border last:border-b-0 ${isExpanded ? "bg-muted/40" : ""}`}>
                    <div className="min-w-[950px] grid grid-cols-[40px_130px_1fr_130px_90px_120px_1fr_80px] items-center px-4 py-3.5 text-sm hover:bg-muted/30 transition-colors">
                      <div><Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(dc.id)} /></div>
                      <div>{format(new Date(dc.generated_date), "d MMM yyyy")}</div>
                      <div className="font-medium">{dc.party_name}</div>
                      <div className="text-center">{dc.dc_number}</div>
                      <div className="text-center">{dc.items.length}</div>
                      <div className="text-center font-medium">{qty}</div>
                      <div className="text-muted-foreground">{dc.transporter_name || "—"}</div>
                      <div className="flex items-center gap-1 justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded hover:bg-muted transition-colors">
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openPreview(dc.id)}><Eye className="w-4 h-4 mr-2" />Preview</DropdownMenuItem>
                            {/* Saving a PDF goes through the preview's print dialog, which
                                is the only path that produces correct page breaks. */}
                            <DropdownMenuItem onClick={() => openPreview(dc.id)}><Download className="w-4 h-4 mr-2" />Print / Save as PDF</DropdownMenuItem>
                            {/* <DropdownMenuItem onClick={() => navigate(`/dc/${dc.id}/edit`)}><Pencil className="w-4 h-4 mr-2" />Edit DC</DropdownMenuItem> */}
                            <DropdownMenuItem onClick={() => handleDelete(dc.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <button onClick={() => setExpandedId(isExpanded ? null : dc.id)} className="p-1 rounded hover:bg-muted transition-colors">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 ml-10">
                        <div className="bg-card rounded-lg border border-border overflow-hidden">
                          <div className="min-w-[400px] grid grid-cols-[1fr_120px] px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                            <div>Job Work</div><div className="text-center">Quantity</div>
                          </div>
                          {dc.items.map(item => (
                            <div key={item.id} className="min-w-[400px] grid grid-cols-[1fr_120px] px-4 py-2.5 text-sm border-b border-border last:border-b-0">
                              <div>{item.job_work_type_name}</div>
                              <div className="text-center font-medium">{item.quantity}</div>
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

      <DCPreviewModal
        dcId={previewDcId}
        open={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewDcId(null); }}
      />
      <ConfirmDialog
        open={confirmState.open}
        title="Delete Delivery Challan?"
        description={
          confirmState.ids.length === 1
            ? "Deleting this Delivery Challan will restore quantities to the linked Work Order. If this challan has already been invoiced, deletion will be blocked. This action cannot be undone."
            : `Deleting ${confirmState.ids.length} Delivery Challans will restore quantities to their linked Work Orders. Any invoiced challans will be skipped with an error. This action cannot be undone.`
        }
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDeletion}
        onCancel={() => setConfirmState({ open: false, ids: [] })}
      />
    </>
  );
}
