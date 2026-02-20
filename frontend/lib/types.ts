export type EscrowStatus = "Pending" | "Ready" | "Released"

export interface Escrow {
  id: string
  amount: number
  department: string
  signatures: string[]
  status: EscrowStatus
  sequence: number
  createdAt: string
}

export interface Balances {
  treasury: string
  receiver: string
}
