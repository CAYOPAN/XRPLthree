"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createEscrow } from "@/lib/api"
import { useEscrows, useBalances } from "@/hooks/use-xrpl-data"

export function CreateEscrowDialog() {
  const [open, setOpen] = useState(false)
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
      toast.success(`Budget request created for ${parsedAmount} XRP`)
      setAmount("")
      setDepartment("")
      setOpen(false)
      mutateEscrows()
      mutateBalances()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create escrow")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New Request
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Budget Request</DialogTitle>
          <DialogDescription>
            Submit a new escrow request. Funds will be locked until 2 of 3 verifiers approve.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
