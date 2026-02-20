"use client"

import { useState } from "react"
import type { Proposal } from "@/lib/api"
import type { Role } from "@/lib/auth-context"
import { StatusBadge } from "@/components/status-badge"
import { CreateProposalModal } from "@/components/create-proposal-modal"
import { SignProposalModal } from "@/components/sign-proposal-modal"
import { ReleaseButton } from "@/components/release-button"
import { Plus, FileText } from "lucide-react"

interface ProposalTableProps {
  proposals: Proposal[]
  role: Role | null
  treasuryAddress: string
  onRefresh: () => void
}

export function ProposalTable({
  proposals,
  role,
  treasuryAddress,
  onRefresh,
}: ProposalTableProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [signProposal, setSignProposal] = useState<Proposal | null>(null)

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Proposals</h2>
        {role === "TREASURY" && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            New Proposal
          </button>
        )}
      </div>

      {/* Table */}
      {proposals.length === 0 ? (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 flex flex-col items-center gap-3">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No proposals yet. {role === "TREASURY" && "Create the first one."}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    ID
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                    Destination
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Signatures
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {p.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 font-medium text-card-foreground">
                      {p.amount} XRP
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">
                      {p.destination.slice(0, 8)}...{p.destination.slice(-4)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-card-foreground font-medium">
                        {p.signatures.length}
                      </span>
                      <span className="text-muted-foreground">
                        /{p.requiredSignatures}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {role === "VERIFIER" && p.status === "PENDING" && (
                        <button
                          onClick={() => setSignProposal(p)}
                          className="inline-flex items-center rounded-md bg-chart-2 text-primary-foreground px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity"
                        >
                          Sign
                        </button>
                      )}
                      {role === "TREASURY" && p.status === "READY" && (
                        <ReleaseButton proposal={p} onSuccess={onRefresh} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateProposalModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false)
            onRefresh()
          }}
        />
      )}

      {/* Sign Modal */}
      {signProposal && (
        <SignProposalModal
          proposal={signProposal}
          treasuryAddress={treasuryAddress}
          onClose={() => setSignProposal(null)}
          onSuccess={() => {
            setSignProposal(null)
            onRefresh()
          }}
        />
      )}
    </div>
  )
}
