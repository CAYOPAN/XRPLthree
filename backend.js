const xrpl = require("xrpl")

const TESTNET_URL = "wss://s.altnet.rippletest.net:51233"
const ESCROW_XRP = "50"
const ESCROW_WAIT_SECONDS = 65

function txResult(response) {
  return (
    response?.result?.meta?.TransactionResult ||
    response?.result?.engine_result ||
    "unknown"
  )
}

async function main() {
  const client = new xrpl.Client(TESTNET_URL)

  try {
    console.log("Connecting to XRPL Testnet...")
    await client.connect()
    console.log("Connected.\n")

    // 1) Create and fund Treasury, Receiver, and three Verifier wallets.
    console.log("Funding wallets from Testnet faucet...")
    const treasuryWallet = (await client.fundWallet()).wallet
    const receiverWallet = (await client.fundWallet()).wallet
    const verifier1Wallet = (await client.fundWallet()).wallet
    const verifier2Wallet = (await client.fundWallet()).wallet
    const verifier3Wallet = (await client.fundWallet()).wallet

    console.log("Treasury :", treasuryWallet.address)
    console.log("Receiver :", receiverWallet.address)
    console.log("Verifier1:", verifier1Wallet.address)
    console.log("Verifier2:", verifier2Wallet.address)
    console.log("Verifier3:", verifier3Wallet.address)

    // Create escrow first so we can store OfferSequence for EscrowFinish.
    const finishAfterIso = new Date(Date.now() + 60 * 1000).toISOString()
    const finishAfterRipple = xrpl.isoTimeToRippleTime(finishAfterIso)

    const escrowCreateTx = {
      TransactionType: "EscrowCreate",
      Account: treasuryWallet.address,
      Destination: receiverWallet.address,
      Amount: xrpl.xrpToDrops(ESCROW_XRP),
      FinishAfter: finishAfterRipple,
    }

    console.log("\nSubmitting EscrowCreate...")
    const preparedEscrowCreate = await client.autofill(escrowCreateTx)
    const signedEscrowCreate = treasuryWallet.sign(preparedEscrowCreate)
    const escrowCreateResponse = await client.submitAndWait(signedEscrowCreate.tx_blob)

    const escrowCreateResult = txResult(escrowCreateResponse)
    const offerSequence = preparedEscrowCreate.Sequence

    console.log("EscrowCreate result:", escrowCreateResult)
    console.log("OfferSequence:", offerSequence)

    // 2) Set up Treasury multisign (quorum=2, each verifier weight=1).
    const signerListSetTx = {
      TransactionType: "SignerListSet",
      Account: treasuryWallet.address,
      SignerQuorum: 2,
      SignerEntries: [
        { SignerEntry: { Account: verifier1Wallet.address, SignerWeight: 1 } },
        { SignerEntry: { Account: verifier2Wallet.address, SignerWeight: 1 } },
        { SignerEntry: { Account: verifier3Wallet.address, SignerWeight: 1 } },
      ],
    }

    console.log("\nSubmitting SignerListSet...")
    const preparedSignerListSet = await client.autofill(signerListSetTx)
    const signedSignerListSet = treasuryWallet.sign(preparedSignerListSet)
    const signerListSetResponse = await client.submitAndWait(signedSignerListSet.tx_blob)
    console.log("SignerListSet result:", txResult(signerListSetResponse))

    // 8) Log balances before EscrowFinish.
    const treasuryBefore = await client.getXrpBalance(treasuryWallet.address)
    const receiverBefore = await client.getXrpBalance(receiverWallet.address)

    console.log("\nBalances BEFORE EscrowFinish:")
    console.log("Treasury:", treasuryBefore, "XRP")
    console.log("Receiver:", receiverBefore, "XRP")

    // 3) Wait for FinishAfter time to pass.
    console.log(`\nWaiting ${ESCROW_WAIT_SECONDS} seconds for escrow to mature...`)
    await new Promise((resolve) => setTimeout(resolve, ESCROW_WAIT_SECONDS * 1000))

    // 4) Prepare EscrowFinish using stored OfferSequence.
    const escrowFinishTx = {
      TransactionType: "EscrowFinish",
      Account: treasuryWallet.address,
      Owner: treasuryWallet.address,
      OfferSequence: offerSequence,
    }

    console.log("\nPreparing EscrowFinish...")
    const preparedEscrowFinish = await client.autofill(escrowFinishTx)
    preparedEscrowFinish.SigningPubKey = ""

    // Increase fee for multisign: base fee * (1 + number of signers).
    preparedEscrowFinish.Fee = String(Number(preparedEscrowFinish.Fee) * 3)

    // 5) Get multisign signatures from at least 2 verifier wallets.
    const sig1 = verifier1Wallet.sign(preparedEscrowFinish, true)
    const sig2 = verifier2Wallet.sign(preparedEscrowFinish, true)

    // 6) Combine partial multisign signatures.
    const multisignedBlob = xrpl.multisign([sig1.tx_blob, sig2.tx_blob])

    // 7) Submit multisigned EscrowFinish and log result.
    console.log("Submitting multisigned EscrowFinish...")
    const escrowFinishResponse = await client.submitAndWait(multisignedBlob)
    console.log("EscrowFinish result:", txResult(escrowFinishResponse))

    // 8) Log balances after EscrowFinish.
    const treasuryAfter = await client.getXrpBalance(treasuryWallet.address)
    const receiverAfter = await client.getXrpBalance(receiverWallet.address)

    console.log("\nBalances AFTER EscrowFinish:")
    console.log("Treasury:", treasuryAfter, "XRP")
    console.log("Receiver:", receiverAfter, "XRP")
    console.log("Escrow released:", xrpl.dropsToXrp(xrpl.xrpToDrops(ESCROW_XRP)), "XRP")
  } catch (error) {
    console.error("\nError in multisign escrow flow:", error)
  } finally {
    if (client.isConnected()) {
      await client.disconnect()
      console.log("\nDisconnected from XRPL Testnet.")
    }
  }
}

main()
