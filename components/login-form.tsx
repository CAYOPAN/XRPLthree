"use client"

import { Shield, ArrowRight, ArrowLeft, Copy, Loader2 } from "lucide-react"
import { useToast } from "@/components/toast-provider"

interface LoginFormProps {
  step: "address" | "verify"
  address: string
  setAddress: (v: string) => void
  challenge: string
  signature: string
  setSignature: (v: string) => void
  loading: boolean
  onRequestChallenge: () => void
  onVerify: () => void
  onBack: () => void
}

export function LoginForm({
  step,
  address,
  setAddress,
  challenge,
  signature,
  setSignature,
  loading,
  onRequestChallenge,
  onVerify,
  onBack,
}: LoginFormProps) {
  const { toast } = useToast()

  function copyChallenge() {
    navigator.clipboard.writeText(challenge)
    toast({ title: "Challenge copied to clipboard", variant: "success" })
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            XRPL Governance
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Multi-signature treasury management on the XRP Ledger
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          {step === "address" ? (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-medium text-card-foreground">
                  Connect Wallet
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your XRPL address to begin authentication
                </p>
              </div>
              <div>
                <label
                  htmlFor="xrpl-address"
                  className="block text-sm font-medium text-card-foreground mb-1.5"
                >
                  XRPL Address
                </label>
                <input
                  id="xrpl-address"
                  type="text"
                  placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onRequestChallenge()}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-shadow"
                  disabled={loading}
                />
              </div>
              <button
                onClick={onRequestChallenge}
                disabled={loading || !address.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Login with Wallet
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-medium text-card-foreground">
                  Sign Challenge
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Sign the challenge below with your XRPL wallet
                </p>
              </div>

              {/* Challenge display */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1.5">
                  Challenge
                </label>
                <div className="relative">
                  <pre className="w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all">
                    {challenge}
                  </pre>
                  <button
                    onClick={copyChallenge}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-card border border-border hover:bg-accent transition-colors"
                    aria-label="Copy challenge"
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Signature input */}
              <div>
                <label
                  htmlFor="signature"
                  className="block text-sm font-medium text-card-foreground mb-1.5"
                >
                  Signature
                </label>
                <textarea
                  id="signature"
                  placeholder="Paste your signed challenge here..."
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-shadow resize-none"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onBack}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card text-card-foreground px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  onClick={onVerify}
                  disabled={loading || !signature.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Verify & Login
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Connected to XRPL Testnet
        </p>
      </div>
    </main>
  )
}
