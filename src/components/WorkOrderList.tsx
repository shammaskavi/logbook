import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, MoreHorizontal, Pencil, Trash2, Plus, FileText, Search } from "lucide-react";
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
import StatusBadge from "@/components/StatusBadge";
import DCList from "@/components/DCList";
import { getWorkOrderTotals, getWorkOrderStatus } from "@/types";
import { useWorkOrders, useDeleteWorkOrder, useDeleteWorkOrders, useParties, useJobWorkTypes, useDeliveryChallans } from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";

type Tab = "orders" | "dc";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function WorkOrderList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("orders");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
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

  const handleDelete = useCallback((id: string) => {
    deleteWO.mutate(id, { onSuccess: () => toast({ title: "Work order deleted" }) });
  }, [deleteWO, toast]);

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    deleteWOs.mutate(ids, {
      onSuccess: () => {
        setSelectedIds(new Set());
        toast({ title: `${ids.length} work orders deleted` });
      },
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Work Order</h1>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete ({selectedIds.size})
            </Button>
          )}
          <Button onClick={() => navigate("/work-order/new")}>
            <Plus className="w-4 h-4 mr-1" />
            Create WO
          </Button>
          <Button variant="outline" onClick={() => navigate("/dc/new")}>
            <FileText className="w-4 h-4 mr-1" />
            Create DC
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border mb-4">
        <button
          onClick={() => setTab("orders")}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${tab === "orders" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          All Orders ({workOrders.length})
        </button>
        <button
          onClick={() => setTab("dc")}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${tab === "dc" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          DC Generated ({dcs.length})
        </button>
      </div>

      {tab === "dc" ? (
        <DCList />
      ) : (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">Filter</span>
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
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Not Yet Started">Not Yet Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px] h-9 bg-card"
              />
            </div>
          </div>

          {/* Table */}
          {loadingOrders ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[40px_130px_1fr_140px_90px_120px_120px_120px_80px] items-center px-4 py-3 text-xs font-medium text-muted-foreground border-b border-border">
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
                <div className="text-center">Quantity ({totalQty})</div>
                <div className="text-center">Pending DC ({totalPending})</div>
                <div>Status</div>
                <div></div>
              </div>

              {/* Rows */}
              {filteredOrders.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">No work orders found</div>
              )}
              {filteredOrders.map((wo) => {
                const { total_quantity, total_pending } = getWorkOrderTotals(wo);
                const status = getWorkOrderStatus(wo);
                const isExpanded = expandedId === wo.id;
                const isSelected = selectedIds.has(wo.id);

                return (
                  <div key={wo.id} className={`border-b border-border last:border-b-0 ${isExpanded ? "bg-muted/40" : ""}`}>
                    <div className="grid grid-cols-[40px_130px_1fr_140px_90px_120px_120px_120px_80px] items-center px-4 py-3.5 text-sm hover:bg-muted/30 transition-colors">
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
                              <DropdownMenuItem onClick={() => navigate(`/work-order/${wo.id}/edit`)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit Work Order
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(wo.id)} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
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

                    {/* Expanded detail */}
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
          )}
        </>
      )}
    </div>
  );
}
