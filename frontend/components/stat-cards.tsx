"use client"

import { Wallet, ArrowDownToLine, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useBalances, useEscrows } from "@/hooks/use-xrpl-data"

export function StatCards() {
  const { data: balances, isLoading: balancesLoading } = useBalances()
  const { data: escrows, isLoading: escrowsLoading } = useEscrows()

  const pendingCount = escrows?.filter((e) => e.status !== "Released").length ?? 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardContent className="flex items-center gap-4 pt-0">
          <div className="flex items-center justify-center size-11 rounded-lg bg-primary/10">
            <Wallet className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Treasury Balance</p>
            {balancesLoading ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {balances?.treasury ?? "0"} <span className="text-sm font-medium text-muted-foreground">XRP</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 pt-0">
          <div className="flex items-center justify-center size-11 rounded-lg bg-chart-2/10">
            <ArrowDownToLine className="size-5 text-chart-2" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Receiver Balance</p>
            {balancesLoading ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {balances?.receiver ?? "0"} <span className="text-sm font-medium text-muted-foreground">XRP</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 pt-0">
          <div className="flex items-center justify-center size-11 rounded-lg bg-chart-3/10">
            <Clock className="size-5 text-chart-3" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Pending Escrows</p>
            {escrowsLoading ? (
              <Skeleton className="h-7 w-12 mt-1" />
            ) : (
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {pendingCount}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
