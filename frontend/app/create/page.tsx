"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Send } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createEscrow } from "@/lib/api"
import { useEscrows, useBalances } from "@/hooks/use-xrpl-data"

export default function CreateRequestPage() {
  const [amount, setAmount] = useState("")
  const [department, setDepartment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mutate: mutateEscrows } = useEscrows()
  const { mutate: mutateBalances } = useBalances()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount greater than 0")
      return
    }
    if (!department.trim()) {
      toast.error("Please enter a department name")
      return
    }

    setIsSubmitting(true)
    try {
      await createEscrow(parsedAmount, department.trim())
      toast.success(`Budget request created for ${parsedAmount} XRP to ${department.trim()}`)
      setAmount("")
      setDepartment("")
      mutateEscrows()
      mutateBalances()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create escrow")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Create Request</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Submit a new budget request to lock funds in escrow
          </p>
        </div>

        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>New Budget Request</CardTitle>
            <CardDescription>
              Funds will be locked in an XRPL escrow until 2 of 3 verifiers approve the release.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="amount">Amount (XRP)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.000001"
                  min="0"
                  placeholder="e.g. 100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Specify the amount in XRP to be escrowed
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  type="text"
                  placeholder="e.g. Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  The receiving department for this budget allocation
                </p>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
