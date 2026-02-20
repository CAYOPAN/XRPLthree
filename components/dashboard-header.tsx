"use client"

import { useRouter } from "next/navigation"
import { useAuth, type Role } from "@/lib/auth-context"
import { Shield, LogOut } from "lucide-react"
import { RoleBadge } from "@/components/role-badge"

interface DashboardHeaderProps {
  address: string | null
  role: Role | null
}

export function DashboardHeader({ address, role }: DashboardHeaderProps) {
  const router = useRouter()
  const { logout } = useAuth()

  function handleLogout() {
    logout()
    router.push("/")
  }

  return (
    <header className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-semibold text-card-foreground">
              XRPL Governance
            </span>
          </div>
          <div className="flex items-center gap-4">
            {role && <RoleBadge role={role} />}
            {address && (
              <span className="hidden sm:block text-xs font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
