import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, MoreHorizontal, Pencil, Trash2, Download, Eye, Search } from "lucide-react";
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
import { useDeliveryChallans, useDeleteDeliveryChallan, useDeleteDeliveryChallans, useParties } from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";
import { DCPreviewModal } from "@/components/dc/DCPreviewModal";

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
    deleteDC.mutate(id, { onSuccess: () => toast({ title: "DC deleted" }) });
  }, [deleteDC, toast]);

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    deleteDCs.mutate(ids, {
      onSuccess: () => {
        setSelectedIds(new Set());
        toast({ title: `${ids.length} DCs deleted` });
      },
    });
  };

  const openPreview = (id: string) => {
    setPreviewDcId(id);
    setPreviewOpen(true);
  };

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <span className="text-sm font-medium text-muted-foreground">Filter</span>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-full sm:w-[110px] h-9 bg-card"><SelectValue placeholder="Month" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterParty} onValueChange={setFilterParty}>
          <SelectTrigger className="w-full sm:w-[130px] h-9 bg-card"><SelectValue placeholder="Party" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Parties</SelectItem>
            {parties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {selectedIds.size > 0 && (
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="w-full sm:w-auto">
            <Trash2 className="w-4 h-4 mr-1" />
            Delete ({selectedIds.size})
          </Button>
        )}
        <div className="relative w-full sm:ml-auto sm:w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-full h-9 bg-card" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[950px] grid grid-cols-[40px_130px_1fr_130px_90px_120px_1fr_80px] items-center px-4 py-3 text-xs font-medium text-muted-foreground border-b border-border">
            <div><Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={toggleSelectAll} /></div>
            <div>Generated Date</div>
            <div>Party Name</div>
            <div>DC No.</div>
            <div className="text-center">Job Work</div>
            <div className="text-center">Quantity ({totalQty})</div>
            <div>Transporter</div>
            <div></div>
          </div>

          {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">No delivery challans found</div>}

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
                        <DropdownMenuItem><Download className="w-4 h-4 mr-2" />Download</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openPreview(dc.id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/dc/${dc.id}/edit`)}><Pencil className="w-4 h-4 mr-2" />Edit DC</DropdownMenuItem>
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
                        <div>Job Work</div>
                        <div className="text-center">Quantity</div>
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
      <DCPreviewModal
        dcId={previewDcId}
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewDcId(null);
        }}
      />
    </>
  );
}
