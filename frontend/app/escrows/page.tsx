"use client"

import { DashboardShell } from "@/components/dashboard-shell"
import { EscrowTable } from "@/components/escrow-table"
import { CreateEscrowDialog } from "@/components/create-escrow-dialog"

export default function EscrowsPage() {
  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Escrows</h2>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage all escrow transactions
            </p>
          </div>
          <CreateEscrowDialog />
        </div>
        <EscrowTable />
      </div>
    </DashboardShell>
  )
}
