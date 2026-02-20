"use client"

import { DashboardShell } from "@/components/dashboard-shell"
import { StatCards } from "@/components/stat-cards"
import { EscrowTable } from "@/components/escrow-table"
import { CreateEscrowDialog } from "@/components/create-escrow-dialog"

export default function DashboardPage() {
  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Overview of your XRPL treasury and escrow activity
            </p>
          </div>
          <CreateEscrowDialog />
        </div>
        <StatCards />
        <EscrowTable />
      </div>
    </DashboardShell>
  )
}
