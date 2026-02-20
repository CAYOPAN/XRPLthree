const express = require("express")
const cors = require("cors")
const crypto = require("crypto")
const xrpl = require("xrpl")

const PORT = Number(process.env.PORT || 5000)
const XRPL_TESTNET_URL = process.env.XRPL_TESTNET_URL || "wss://s.altnet.rippletest.net:51233"
const TREASURY_SEED = process.env.TREASURY_SEED || ""
const TREASURY_ADDRESS_ENV = process.env.TREASURY_ADDRESS || ""
const VERIFIER_ADDRESSES = new Set(
  (process.env.VERIFIER_ADDRESSES || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
)
const REQUIRED_SIGNATURES = Number(process.env.REQUIRED_SIGNATURES || 2)
const CHALLENGE_TTL_MS = Number(process.env.CHALLENGE_TTL_MS || 5 * 60 * 1000)
const FINISH_AFTER_SECONDS = Number(process.env.FINISH_AFTER_SECONDS || 60)

const app = express()
app.use(cors())
app.use(express.json())

const client = new xrpl.Client(XRPL_TESTNET_URL)

// In-memory stores (replace with DB/cache in production).
const loginChallenges = new Map() // address -> { challenge, expiresAt }
const sessions = new Map() // token -> { address, role, createdAt }
const users = new Map() // address -> { address, role }
const proposals = []

let treasuryWallet = null
let treasuryAddress = TREASURY_ADDRESS_ENV

function nowMs() {
  return Date.now()
}

function txResult(response) {
  return (
    response?.result?.meta?.TransactionResult ||
    response?.result?.engine_result ||
    "unknown"
  )
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex")
}

function normalizeAddress(address) {
  return typeof address === "string" ? address.trim() : ""
}

function determineRole(address) {
  if (!address) return "VIEWER"
  if (treasuryAddress && address === treasuryAddress) return "TREASURY"
  if (VERIFIER_ADDRESSES.has(address)) return "VERIFIER"
  return "VIEWER"
}

function parseBearerToken(authHeader) {
  if (!authHeader || typeof authHeader !== "string") return null
  const [scheme, token] = authHeader.split(" ")
  if (scheme !== "Bearer" || !token) return null
  return token.trim()
}

function requireAuth(req, res, next) {
  const token = parseBearerToken(req.headers.authorization)
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const session = sessions.get(token)
  req.user = { ...session, token }
  return next()
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Forbidden: requires role ${role}` })
    }
    return next()
  }
}

function verifyChallengeSignature(challenge, signatureInput) {
  const xrplVerify = xrpl.verify || xrpl.verifyKeypairSignature

  if (!xrplVerify) {
    return false
  }

  // Supports `signature` as string or object. Common object shape:
  // { signature: "...", publicKey: "..." }
  const parsed =
    typeof signatureInput === "string"
      ? (() => {
          try {
            return JSON.parse(signatureInput)
          } catch (_err) {
            return signatureInput
          }
        })()
      : signatureInput

  try {
    if (typeof parsed === "string") {
      // Works with libs that can infer key/account from signature payload.
      return Boolean(
        xrplVerify(challenge, parsed) ||
          xrplVerify({ message: challenge, signature: parsed }),
      )
    }

    if (parsed && typeof parsed === "object") {
      if (parsed.message && parsed.signature && parsed.publicKey) {
        return Boolean(xrplVerify(parsed.message, parsed.signature, parsed.publicKey))
      }

      if (parsed.signature && parsed.publicKey) {
        return Boolean(xrplVerify(challenge, parsed.signature, parsed.publicKey))
      }

      if (parsed.signature) {
        return Boolean(
          xrplVerify(challenge, parsed.signature) ||
            xrplVerify({ message: challenge, signature: parsed.signature }),
        )
      }
    }
  } catch (_err) {
    return false
  }

  return false
}

function decodeSignedTx(txBlob) {
  try {
    return xrpl.decode(txBlob)
  } catch (_err) {
    return null
  }
}

function extractSignerAddressFromMultisignedBlob(txBlob) {
  const decoded = decodeSignedTx(txBlob)
  if (!decoded || !Array.isArray(decoded.Signers) || decoded.Signers.length !== 1) {
    return { decoded, signerAddress: null }
  }

  const signerAddress = decoded.Signers?.[0]?.Signer?.Account || null
  return { decoded, signerAddress }
}

function expectedEscrowFinishTx(proposal) {
  return {
    TransactionType: "EscrowFinish",
    Account: treasuryAddress,
    Owner: treasuryAddress,
    OfferSequence: proposal.offerSequence,
  }
}

function proposalById(id) {
  return proposals.find((proposal) => proposal.id === id)
}

function sanitizeProposal(proposal) {
  return {
    id: proposal.id,
    amount: proposal.amount,
    destination: proposal.destination,
    offerSequence: proposal.offerSequence,
    signatures: proposal.signatures,
    requiredSignatures: proposal.requiredSignatures,
    status: proposal.status,
    createdAt: proposal.createdAt,
    releasedAt: proposal.releasedAt || null,
  }
}

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    xrplConnected: client.isConnected(),
    treasuryAddress,
    verifierCount: VERIFIER_ADDRESSES.size,
  })
})

// Auth Step 1: create challenge (no password, wallet-driven login).
app.post("/auth/login", (req, res) => {
  const address = normalizeAddress(req.body?.address)

  if (!address || !xrpl.isValidClassicAddress(address)) {
    return res.status(400).json({ error: "Valid XRPL classic address is required" })
  }

  const challenge = `xrpl-login:${address}:${nowMs()}:${crypto.randomBytes(16).toString("hex")}`
  loginChallenges.set(address, {
    challenge,
    expiresAt: nowMs() + CHALLENGE_TTL_MS,
  })

  console.log(`[AUTH] Challenge issued for ${address}`)
  return res.json({ challenge, expiresInMs: CHALLENGE_TTL_MS })
})

// Auth Step 2: verify challenge signature, then mint in-memory session token.
app.post("/auth/verify", (req, res) => {
  const address = normalizeAddress(req.body?.address)
  const signature = req.body?.signature

  if (!address || !signature) {
    return res.status(400).json({ error: "address and signature are required" })
  }

  const pending = loginChallenges.get(address)
  if (!pending) {
    return res.status(400).json({ error: "No active challenge for address" })
  }

  if (pending.expiresAt < nowMs()) {
    loginChallenges.delete(address)
    return res.status(400).json({ error: "Challenge expired" })
  }

  const signatureValid = verifyChallengeSignature(pending.challenge, signature)
  if (!signatureValid) {
    return res.status(401).json({ error: "Invalid signature" })
  }

  const role = determineRole(address)
  const user = { address, role }
  const token = generateToken()

  users.set(address, user)
  sessions.set(token, {
    address,
    role,
    createdAt: new Date().toISOString(),
  })
  loginChallenges.delete(address)

  console.log(`[AUTH] Login success for ${address} as ${role}`)
  return res.json({ token, user })
})

// Create escrow proposal; treasury signs/submits EscrowCreate.
app.post("/proposals", requireAuth, requireRole("TREASURY"), async (req, res) => {
  try {
    const amount = String(req.body?.amount || "").trim()
    const destination = normalizeAddress(req.body?.destination)

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "amount must be a positive XRP value" })
    }

    if (!destination || !xrpl.isValidClassicAddress(destination)) {
      return res.status(400).json({ error: "Valid destination address is required" })
    }

    const finishAfterIso = new Date(Date.now() + FINISH_AFTER_SECONDS * 1000).toISOString()
    const finishAfterRipple = xrpl.isoTimeToRippleTime(finishAfterIso)

    const escrowCreateTx = {
      TransactionType: "EscrowCreate",
      Account: treasuryAddress,
      Destination: destination,
      Amount: xrpl.xrpToDrops(amount),
      FinishAfter: finishAfterRipple,
    }

    const prepared = await client.autofill(escrowCreateTx)
    const signed = treasuryWallet.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    const outcome = txResult(result)
    if (outcome !== "tesSUCCESS") {
      console.error(`[PROPOSAL] EscrowCreate failed: ${outcome}`)
      return res.status(400).json({ error: "EscrowCreate failed", outcome, result: result.result })
    }

    const proposal = {
      id: crypto.randomUUID(),
      amount,
      destination,
      offerSequence: prepared.Sequence,
      signatures: [],
      requiredSignatures: REQUIRED_SIGNATURES,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      releasedAt: null,
    }

    proposals.push(proposal)

    console.log(
      `[PROPOSAL] Created id=${proposal.id} offerSequence=${proposal.offerSequence} amount=${amount} destination=${destination}`,
    )

    return res.status(201).json({ proposal: sanitizeProposal(proposal), xrplResult: outcome })
  } catch (error) {
    console.error("[PROPOSAL] Error creating proposal:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
})

app.get("/proposals", requireAuth, (_req, res) => {
  res.json({ proposals: proposals.map(sanitizeProposal) })
})

// Verifiers submit pre-signed EscrowFinish tx_blob generated on client side.
app.post("/proposals/:id/sign", requireAuth, requireRole("VERIFIER"), (req, res) => {
  try {
    const proposal = proposalById(req.params.id)
    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" })
    }

    if (proposal.status === "RELEASED") {
      return res.status(400).json({ error: "Proposal already released" })
    }

    const txBlob = req.body?.tx_blob
    if (!txBlob || typeof txBlob !== "string") {
      return res.status(400).json({ error: "tx_blob is required" })
    }

    const { decoded, signerAddress } = extractSignerAddressFromMultisignedBlob(txBlob)
    if (!decoded) {
      return res.status(400).json({ error: "Invalid tx_blob format" })
    }

    if (!signerAddress) {
      return res.status(400).json({ error: "tx_blob must contain exactly one multisign signer" })
    }

    if (req.user.address !== signerAddress) {
      return res.status(403).json({ error: "Signer address must match authenticated verifier" })
    }

    const expected = expectedEscrowFinishTx(proposal)
    const txMatchesProposal =
      decoded.TransactionType === expected.TransactionType &&
      decoded.Account === expected.Account &&
      decoded.Owner === expected.Owner &&
      Number(decoded.OfferSequence) === Number(expected.OfferSequence)

    if (!txMatchesProposal) {
      return res.status(400).json({ error: "tx_blob does not match expected EscrowFinish payload" })
    }

    const alreadySigned = proposal.signatures.some((sig) => sig.address === signerAddress)
    if (alreadySigned) {
      return res.status(409).json({ error: "Verifier has already signed this proposal" })
    }

    proposal.signatures.push({
      address: signerAddress,
      tx_blob: txBlob,
    })

    if (proposal.signatures.length >= proposal.requiredSignatures) {
      proposal.status = "READY"
    }

    console.log(
      `[PROPOSAL] Signature collected id=${proposal.id} signer=${signerAddress} count=${proposal.signatures.length}/${proposal.requiredSignatures}`,
    )

    return res.json({ proposal: sanitizeProposal(proposal) })
  } catch (error) {
    console.error("[PROPOSAL] Error saving signature:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
})

// Treasury combines stored partial signatures and submits multisigned EscrowFinish.
app.post("/proposals/:id/release", requireAuth, requireRole("TREASURY"), async (req, res) => {
  try {
    const proposal = proposalById(req.params.id)
    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" })
    }

    if (proposal.status === "RELEASED") {
      return res.status(400).json({ error: "Proposal already released" })
    }

    if (proposal.status !== "READY") {
      return res.status(400).json({ error: "Proposal not ready for release" })
    }

    if (proposal.signatures.length < proposal.requiredSignatures) {
      return res.status(400).json({ error: "Not enough signatures" })
    }

    const partials = proposal.signatures
      .slice(0, proposal.requiredSignatures)
      .map((signature) => signature.tx_blob)

    const multisignedBlob = xrpl.multisign(partials)
    const releaseResult = await client.submitAndWait(multisignedBlob)
    const outcome = txResult(releaseResult)

    if (outcome !== "tesSUCCESS") {
      console.error(`[PROPOSAL] EscrowFinish failed id=${proposal.id} outcome=${outcome}`)
      return res.status(400).json({
        error: "EscrowFinish failed",
        outcome,
        result: releaseResult.result,
      })
    }

    proposal.status = "RELEASED"
    proposal.releasedAt = new Date().toISOString()

    console.log(`[PROPOSAL] Released id=${proposal.id} outcome=${outcome}`)
    return res.json({
      proposal: sanitizeProposal(proposal),
      xrplResult: outcome,
      txHash: releaseResult?.result?.hash || null,
    })
  } catch (error) {
    console.error("[PROPOSAL] Error releasing proposal:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
})

app.get("/balances", requireAuth, async (_req, res) => {
  try {
    const treasuryBalance = await client.getXrpBalance(treasuryAddress)
    return res.json({
      treasuryAddress,
      treasuryBalanceXrp: treasuryBalance,
    })
  } catch (error) {
    console.error("[BALANCE] Error fetching treasury balance:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
})

async function startServer() {
  try {
    if (!TREASURY_SEED) {
      throw new Error("TREASURY_SEED is required")
    }

    treasuryWallet = xrpl.Wallet.fromSeed(TREASURY_SEED)
    treasuryAddress = treasuryWallet.address

    if (!TREASURY_ADDRESS_ENV) {
      console.log(`[CONFIG] TREASURY_ADDRESS not provided; using seed-derived ${treasuryAddress}`)
    } else if (TREASURY_ADDRESS_ENV !== treasuryAddress) {
      throw new Error("TREASURY_ADDRESS does not match TREASURY_SEED")
    }

    if (!VERIFIER_ADDRESSES.size) {
      console.warn("[CONFIG] VERIFIER_ADDRESSES is empty; no user can get VERIFIER role")
    }

    console.log("[XRPL] Connecting to Testnet...")
    await client.connect()
    console.log("[XRPL] Connected")

    app.listen(PORT, () => {
      console.log(`[API] Server running on http://localhost:${PORT}`)
      console.log(`[API] Treasury address: ${treasuryAddress}`)
    })
  } catch (error) {
    console.error("[BOOT] Failed to start server:", error)
    process.exit(1)
  }
}

process.on("SIGINT", async () => {
  try {
    console.log("\n[SHUTDOWN] Disconnecting XRPL client...")
    if (client.isConnected()) {
      await client.disconnect()
    }
  } finally {
    process.exit(0)
  }
})

process.on("SIGTERM", async () => {
  try {
    console.log("\n[SHUTDOWN] Disconnecting XRPL client...")
    if (client.isConnected()) {
      await client.disconnect()
    }
  } finally {
    process.exit(0)
  }
})

startServer()
