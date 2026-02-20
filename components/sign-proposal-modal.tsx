"use client"

import { useState } from "react"
import { X, Loader2, Copy } from "lucide-react"
import type { Proposal } from "@/lib/api"
import { signProposal } from "@/lib/api"
import { useToast } from "@/components/toast-provider"

interface SignProposalModalProps {
  proposal: Proposal
  treasuryAddress: string
  onClose: () => void
  onSuccess: () => void
}

export function SignProposalModal({
  proposal,
  treasuryAddress,
  onClose,
  onSuccess,
}: SignProposalModalProps) {
  const { toast } = useToast()
  const [txBlob, setTxBlob] = useState("")
  const [loading, setLoading] = useState(false)

  const payload = JSON.stringify(
    {
      TransactionType: "EscrowFinish",
      Account: treasuryAddress,
      Owner: treasuryAddress,
      OfferSequence: proposal.offerSequence,
    },
    null,
    2
  )

  function copyPayload() {
    navigator.clipboard.writeText(payload)
    toast({ title: "Payload copied to clipboard", variant: "success" })
  }

  async function handleSign() {
    if (!txBlob.trim()) {
      toast({ title: "Please paste the signed tx_blob", variant: "error" })
      return
    }
    setLoading(true)
    try {
      await signProposal(proposal.id, txBlob.trim())
      toast({
        title: "Signature submitted",
        description: "Your signature has been recorded.",
        variant: "success",
      })
      onSuccess()
    } catch (err: unknown) {
      toast({
        title: "Signing failed",
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
      <div className="relative bg-card rounded-xl border border-border shadow-xl w-full max-w-lg mx-4 p-6 animate-in zoom-in-95 fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            Sign Proposal
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-accent transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Info */}
          <div className="bg-muted rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">
              Proposal:{" "}
              <span className="font-mono text-foreground">
                {proposal.id.slice(0, 8)}...
              </span>
            </p>
            <p className="text-muted-foreground mt-1">
              Amount:{" "}
              <span className="font-medium text-foreground">
                {proposal.amount} XRP
              </span>
            </p>
          </div>

          {/* Payload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-card-foreground">
                EscrowFinish Payload
              </label>
              <button
                onClick={copyPayload}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copy className="h-3 w-3" />
                Copy
              </button>
            </div>
            <pre className="w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-xs font-mono text-muted-foreground overflow-x-auto">
              {payload}
            </pre>
            <p className="text-xs text-muted-foreground mt-1.5">
              Sign this payload with your wallet (set SigningPubKey to empty
              string, adjust Fee for multisign), then paste the resulting
              tx_blob below.
            </p>
          </div>

          {/* tx_blob input */}
          <div>
            <label
              htmlFor="tx-blob"
              className="block text-sm font-medium text-card-foreground mb-1.5"
            >
              Signed tx_blob
            </label>
            <textarea
              id="tx-blob"
              placeholder="Paste the multisigned tx_blob here..."
              value={txBlob}
              onChange={(e) => setTxBlob(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-shadow resize-none"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center rounded-lg border border-border bg-card text-card-foreground px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSign}
              disabled={loading || !txBlob.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-chart-2 text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Submit Signature"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
