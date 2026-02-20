"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import { createProposal } from "@/lib/api"
import { useToast } from "@/components/toast-provider"

interface CreateProposalModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function CreateProposalModal({
  onClose,
  onSuccess,
}: CreateProposalModalProps) {
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [destination, setDestination] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !destination) {
      toast({ title: "All fields are required", variant: "error" })
      return
    }
    if (Number(amount) <= 0) {
      toast({ title: "Amount must be greater than 0", variant: "error" })
      return
    }
    setLoading(true)
    try {
      const data = await createProposal(amount, destination.trim())
      toast({
        title: "Proposal created",
        description: `Escrow for ${data.proposal.amount} XRP submitted successfully.`,
        variant: "success",
      })
      onSuccess()
    } catch (err: unknown) {
      toast({
        title: "Failed to create proposal",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative bg-card rounded-xl border border-border shadow-xl w-full max-w-md mx-4 p-6 animate-in zoom-in-95 fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            Create Proposal
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-accent transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-card-foreground mb-1.5"
            >
              Amount (XRP)
            </label>
            <input
              id="amount"
              type="number"
              step="any"
              min="0"
              placeholder="50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-shadow"
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="destination"
              className="block text-sm font-medium text-card-foreground mb-1.5"
            >
              Destination Address
            </label>
            <input
              id="destination"
              type="text"
              placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-shadow"
              disabled={loading}
            />
          </div>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center rounded-lg border border-border bg-card text-card-foreground px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !amount || !destination}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create Proposal"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
