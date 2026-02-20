"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/toast-provider"
import { login as apiLogin, verify as apiVerify } from "@/lib/api"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [step, setStep] = useState<"address" | "verify">("address")
  const [address, setAddress] = useState("")
  const [challenge, setChallenge] = useState("")
  const [signature, setSignature] = useState("")
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    router.push("/dashboard")
    return null
  }

  async function handleRequestChallenge() {
    if (!address.trim()) {
      toast({ title: "Please enter your XRPL address", variant: "error" })
      return
    }
    setLoading(true)
    try {
      const data = await apiLogin(address.trim())
      setChallenge(data.challenge)
      setStep("verify")
      toast({ title: "Challenge received", description: "Sign the challenge with your wallet and paste the signature below.", variant: "success" })
    } catch (err: unknown) {
      toast({ title: "Login failed", description: err instanceof Error ? err.message : "Unknown error", variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    if (!signature.trim()) {
      toast({ title: "Please enter your signature", variant: "error" })
      return
    }
    setLoading(true)
    try {
      const data = await apiVerify(address.trim(), signature.trim())
      login(data.token, data.user.address, data.user.role as "TREASURY" | "VERIFIER" | "VIEWER")
      toast({ title: "Welcome!", description: `Logged in as ${data.user.role}`, variant: "success" })
      router.push("/dashboard")
    } catch (err: unknown) {
      toast({ title: "Verification failed", description: err instanceof Error ? err.message : "Unknown error", variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginForm
      step={step}
      address={address}
      setAddress={setAddress}
      challenge={challenge}
      signature={signature}
      setSignature={setSignature}
      loading={loading}
      onRequestChallenge={handleRequestChallenge}
      onVerify={handleVerify}
      onBack={() => {
        setStep("address")
        setChallenge("")
        setSignature("")
      }}
    />
  )
}
