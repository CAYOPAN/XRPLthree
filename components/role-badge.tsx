import type { Role } from "@/lib/auth-context"

const roleStyles: Record<Role, string> = {
  TREASURY: "bg-role-treasury text-role-treasury-text",
  VERIFIER: "bg-role-verifier text-role-verifier-text",
  VIEWER: "bg-role-viewer text-role-viewer-text",
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${roleStyles[role]}`}
    >
      {role}
    </span>
  )
}
