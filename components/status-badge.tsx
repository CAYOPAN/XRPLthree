const statusStyles: Record<string, string> = {
  PENDING: "bg-status-pending text-status-pending-text",
  READY: "bg-status-ready text-status-ready-text",
  RELEASED: "bg-status-released text-status-released-text",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusStyles[status] || "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  )
}
