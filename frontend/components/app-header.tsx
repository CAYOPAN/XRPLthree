"use client"

import { Hexagon, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBalances, useEscrows } from "@/hooks/use-xrpl-data"

export function AppHeader() {
  const { mutate: mutateBalances } = useBalances()
  const { mutate: mutateEscrows } = useEscrows()

  function handleRefresh() {
    mutateBalances()
    mutateEscrows()
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <div className="flex items-center gap-3 md:hidden">
        <div className="flex items-center justify-center size-8 rounded-lg bg-primary">
          <Hexagon className="size-4 text-primary-foreground" />
        </div>
        <h1 className="text-sm font-semibold tracking-tight text-balance">
          XRPL Company Spending Tracker
        </h1>
      </div>
      <h1 className="hidden md:block text-lg font-semibold tracking-tight text-foreground">
        XRPL Company Spending Tracker
      </h1>
      <Button variant="outline" size="sm" onClick={handleRefresh}>
        <RefreshCw className="size-4" />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
    </header>
  )
}
