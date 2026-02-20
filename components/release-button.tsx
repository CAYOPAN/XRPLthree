"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import type { Proposal } from "@/lib/api"
import { releaseProposal } from "@/lib/api"
import { useToast } from "@/components/toast-provider"

interface ReleaseButtonProps {
  proposal: Proposal
  onSuccess: () => void
}

export function ReleaseButton({ proposal, onSuccess }: ReleaseButtonProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  async function handleRelease() {
    setLoading(true)
    try {
      const data = await releaseProposal(proposal.id)
      toast({
        title: "Funds released!",
        description: data.txHash
          ? `Transaction hash: ${data.txHash.slice(0, 12)}...`
          : "Escrow finalized successfully.",
        variant: "success",
      })
      onSuccess()
    } catch (err: unknown) {
      toast({
        title: "Release failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRelease}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-md bg-chart-3 text-primary-foreground px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        "Release Funds"
      )}
    </button>
  )
}
