import type { Escrow, Balances } from "./types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }))
    throw new Error(error.message || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function fetchBalances(): Promise<Balances> {
  const res = await fetch(`${API_BASE}/balances`)
  return handleResponse<Balances>(res)
}

export async function fetchEscrows(): Promise<Escrow[]> {
  const res = await fetch(`${API_BASE}/escrows`)
  return handleResponse<Escrow[]>(res)
}

export async function createEscrow(amount: number, department: string): Promise<{ success: boolean; escrowId: string }> {
  const res = await fetch(`${API_BASE}/create-escrow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, department }),
  })
  return handleResponse(res)
}

export async function signEscrow(escrowId: string, verifier: string): Promise<{ success: boolean; signatures: number }> {
  const res = await fetch(`${API_BASE}/sign-escrow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ escrowId, verifier }),
  })
  return handleResponse(res)
}

export async function releaseEscrow(escrowId: string): Promise<{ success: boolean; txHash: string }> {
  const res = await fetch(`${API_BASE}/release-escrow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ escrowId }),
  })
  return handleResponse(res)
}
