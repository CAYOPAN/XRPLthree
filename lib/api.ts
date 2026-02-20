const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("xrpl_token") : null

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed with status ${res.status}`)
  }

  return res.json()
}

// Auth
export function login(address: string) {
  return request<{ challenge: string; expiresInMs: number }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ address }),
  })
}

export function verify(address: string, signature: string) {
  return request<{
    token: string
    user: { address: string; role: string }
  }>("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ address, signature }),
  })
}

// Health
export function getHealth() {
  return request<{
    status: string
    xrplConnected: boolean
    treasuryAddress: string
    verifierCount: number
  }>("/health")
}

// Balances
export function getBalances() {
  return request<{
    treasuryAddress: string
    treasuryBalanceXrp: string
  }>("/balances")
}

// Proposals
export interface Proposal {
  id: string
  amount: string
  destination: string
  offerSequence: number
  signatures: { address: string; tx_blob: string }[]
  requiredSignatures: number
  status: "PENDING" | "READY" | "RELEASED"
  createdAt: string
  releasedAt: string | null
}

export function getProposals() {
  return request<{ proposals: Proposal[] }>("/proposals")
}

export function createProposal(amount: string, destination: string) {
  return request<{ proposal: Proposal; xrplResult: string }>("/proposals", {
    method: "POST",
    body: JSON.stringify({ amount, destination }),
  })
}

export function signProposal(id: string, txBlob: string) {
  return request<{ proposal: Proposal }>(`/proposals/${id}/sign`, {
    method: "POST",
    body: JSON.stringify({ tx_blob: txBlob }),
  })
}

export function releaseProposal(id: string) {
  return request<{
    proposal: Proposal
    xrplResult: string
    txHash: string | null
  }>(`/proposals/${id}/release`, {
    method: "POST",
  })
}
