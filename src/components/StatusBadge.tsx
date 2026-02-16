import { WorkOrderStatus } from "@/types";

interface StatusBadgeProps {
  status: WorkOrderStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<WorkOrderStatus, string> = {
    Completed: "bg-status-completed-bg text-status-completed",
    "In Progress": "bg-status-in-progress-bg text-status-in-progress",
    "Not Yet Started": "bg-status-not-started-bg text-status-not-started border border-current",
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${styles[status]}`}>
      {status === "Not Yet Started" ? "Not Yet Started" : status}
    </span>
  );
}
