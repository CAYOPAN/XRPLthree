"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Send, CheckCircle2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useEscrows } from "@/hooks/use-xrpl-data"
import { signEscrow, releaseEscrow } from "@/lib/api"
import type { EscrowStatus } from "@/lib/types"

const verifiers = ["Verifier 1", "Verifier 2", "Verifier 3"]

function StatusBadge({ status }: { status: EscrowStatus }) {
  const variants: Record<EscrowStatus, string> = {
    Pending: "bg-amber-100 text-amber-800 border-amber-200",
    Ready: "bg-blue-100 text-blue-800 border-blue-200",
    Released: "bg-emerald-100 text-emerald-800 border-emerald-200",
  }

  return (
    <Badge variant="outline" className={variants[status]}>
      {status}
    </Badge>
  )
}

export function EscrowTable() {
  const { data: escrows, isLoading, mutate } = useEscrows()
  const [signingId, setSigningId] = useState<string | null>(null)
  const [releasingId, setReleasingId] = useState<string | null>(null)
  const [selectedVerifiers, setSelectedVerifiers] = useState<Record<string, string>>({})

  async function handleSign(escrowId: string) {
    const verifier = selectedVerifiers[escrowId]
    if (!verifier) {
      toast.error("Please select a verifier")
      return
    }

    setSigningId(escrowId)
    try {
      await signEscrow(escrowId, verifier)
      toast.success(`Escrow signed by ${verifier}`)
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign escrow")
    } finally {
      setSigningId(null)
    }
  }

  async function handleRelease(escrowId: string) {
    setReleasingId(escrowId)
    try {
      const result = await releaseEscrow(escrowId)
      toast.success(`Funds released! TX: ${result.txHash?.slice(0, 12)}...`)
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to release escrow")
    } finally {
      setReleasingId(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Escrows</CardTitle>
          <CardDescription>Loading escrow data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Escrows</CardTitle>
        <CardDescription>
          {escrows?.length
            ? `${escrows.length} escrow${escrows.length === 1 ? "" : "s"} found`
            : "No escrows yet. Create a budget request to get started."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {escrows && escrows.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Escrow ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Signatures</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verifier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {escrows.map((escrow) => {
                const sigCount = escrow.signatures?.length ?? 0
                const isReady = sigCount >= 2
                const isReleased = escrow.status === "Released"

                return (
                  <TableRow key={escrow.id}>
                    <TableCell className="font-mono text-xs">
                      {escrow.id.length > 10
                        ? `${escrow.id.slice(0, 6)}...${escrow.id.slice(-4)}`
                        : escrow.id}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {escrow.amount} XRP
                    </TableCell>
                    <TableCell>{escrow.department}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {sigCount}/2
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={escrow.status} />
                    </TableCell>
                    <TableCell>
                      {!isReleased && (
                        <Select
                          value={selectedVerifiers[escrow.id] ?? ""}
                          onValueChange={(val) =>
                            setSelectedVerifiers((prev) => ({ ...prev, [escrow.id]: val }))
                          }
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {verifiers.map((v) => (
                              <SelectItem
                                key={v}
                                value={v}
                                disabled={escrow.signatures?.includes(v)}
                              >
                                {v}
                                {escrow.signatures?.includes(v) ? " (signed)" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isReleased && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSign(escrow.id)}
                            disabled={
                              signingId === escrow.id ||
                              !selectedVerifiers[escrow.id] ||
                              escrow.signatures?.includes(selectedVerifiers[escrow.id])
                            }
                          >
                            {signingId === escrow.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="size-3.5" />
                            )}
                            Sign
                          </Button>
                        )}
                        {isReady && !isReleased && (
                          <Button
                            size="sm"
                            onClick={() => handleRelease(escrow.id)}
                            disabled={releasingId === escrow.id}
                          >
                            {releasingId === escrow.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Send className="size-3.5" />
                            )}
                            Release
                          </Button>
                        )}
                        {isReleased && (
                          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="size-3.5" />
                            Completed
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Send className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No escrows found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
