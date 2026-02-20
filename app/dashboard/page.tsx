"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { useAuth } from "@/lib/auth-context"
import { getBalances, getProposals } from "@/lib/api"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatsCards } from "@/components/stats-cards"
import { ProposalTable } from "@/components/proposal-table"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, address, role } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  const {
    data: balanceData,
    isLoading: balanceLoading,
  } = useSWR(isAuthenticated ? "/balances" : null, () => getBalances(), {
    refreshInterval: 10000,
  })

  const {
    data: proposalData,
    isLoading: proposalLoading,
    mutate: mutateProposals,
  } = useSWR(isAuthenticated ? "/proposals" : null, () => getProposals(), {
    refreshInterval: 10000,
  })

  if (!isAuthenticated) return null

  const proposals = proposalData?.proposals || []
  const treasuryBalance = balanceData?.treasuryBalanceXrp || "0"
  const treasuryAddress = balanceData?.treasuryAddress || ""

  const totalProposals = proposals.length
  const readyProposals = proposals.filter((p) => p.status === "READY").length
  const releasedProposals = proposals.filter(
    (p) => p.status === "RELEASED"
  ).length

  const isLoading = balanceLoading || proposalLoading

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader address={address} role={role} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <StatsCards
              treasuryBalance={treasuryBalance}
              totalProposals={totalProposals}
              readyProposals={readyProposals}
              releasedProposals={releasedProposals}
            />
            <ProposalTable
              proposals={proposals}
              role={role}
              treasuryAddress={treasuryAddress}
              onRefresh={mutateProposals}
            />
          </div>
        )}
      </main>
    </div>
  )
}
