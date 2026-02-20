const xrpl = require("xrpl")

async function main() {
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233")

  try {
    // 1) Connect to XRPL Testnet.
    await client.connect()
    console.log("Connected to XRPL Testnet")

    // 2) Create and fund wallets: Treasury, Receiver, and 3 Verifiers.
    const treasuryWallet = (await client.fundWallet()).wallet
    const receiverWallet = (await client.fundWallet()).wallet
    const verifier1Wallet = (await client.fundWallet()).wallet
    const verifier2Wallet = (await client.fundWallet()).wallet
    const verifier3Wallet = (await client.fundWallet()).wallet

    console.log("\n=== Wallets ===")
    console.log("Treasury:", treasuryWallet.address)
    console.log("Receiver:", receiverWallet.address)
    console.log("Verifier1:", verifier1Wallet.address)
    console.log("Verifier2:", verifier2Wallet.address)
    console.log("Verifier3:", verifier3Wallet.address)

    // 3) Configure multisign on Treasury:
    // quorum = 2, each verifier weight = 1.
    const signerListSetTx = {
      TransactionType: "SignerListSet",
      Account: treasuryWallet.address,
      SignerQuorum: 2,
      SignerEntries: [
        {
          SignerEntry: {
            Account: verifier1Wallet.address,
            SignerWeight: 1,
          },
        },
        {
          SignerEntry: {
            Account: verifier2Wallet.address,
            SignerWeight: 1,
          },
        },
        {
          SignerEntry: {
            Account: verifier3Wallet.address,
            SignerWeight: 1,
          },
        },
      ],
    }

    const preparedSignerListSet = await client.autofill(signerListSetTx)
    const signedSignerListSet = treasuryWallet.sign(preparedSignerListSet)
    const signerListSetResult = await client.submitAndWait(signedSignerListSet.tx_blob)
    const signerListTxResult =
      signerListSetResult.result?.meta?.TransactionResult ||
      signerListSetResult.result?.engine_result ||
      "unknown"

    console.log("\n=== SignerListSet Result ===")
    console.log("Transaction result:", signerListTxResult)

    // 4) Create time-based EscrowCreate:
    // lock 50 XRP for receiver, finishable only after 60 seconds.
    const finishAfterIso = new Date(Date.now() + 60 * 1000).toISOString()
    const finishAfterRipple = xrpl.isoTimeToRippleTime(finishAfterIso)

    const escrowAmountDrops = xrpl.xrpToDrops("50")
    const escrowCreateTx = {
      TransactionType: "EscrowCreate",
      Account: treasuryWallet.address,
      Destination: receiverWallet.address,
      Amount: escrowAmountDrops,
      FinishAfter: finishAfterRipple,
    }

    // 5) Autofill, sign, and submit EscrowCreate.
    const preparedEscrowCreate = await client.autofill(escrowCreateTx)
    const signedEscrowCreate = treasuryWallet.sign(preparedEscrowCreate)
    const escrowCreateResult = await client.submitAndWait(signedEscrowCreate.tx_blob)

    const escrowCreateTxResult =
      escrowCreateResult.result?.meta?.TransactionResult ||
      escrowCreateResult.result?.engine_result ||
      "unknown"
    const offerSequence = preparedEscrowCreate.Sequence

    console.log("\n=== Escrow Create Result ===")
    console.log("Transaction result:", escrowCreateTxResult)
    console.log("Escrow sequence (OfferSequence):", offerSequence)
    console.log(
      "Confirmation:",
      xrpl.dropsToXrp(escrowAmountDrops),
      "XRP is locked in escrow until FinishAfter."
    )

    // 6) Get balances before EscrowFinish.
    const treasuryBalanceBeforeFinish = await client.getXrpBalance(treasuryWallet.address)
    const receiverBalanceBeforeFinish = await client.getXrpBalance(receiverWallet.address)

    console.log("\n=== Balances Before EscrowFinish ===")
    console.log("Treasury:", treasuryBalanceBeforeFinish, "XRP")
    console.log("Receiver:", receiverBalanceBeforeFinish, "XRP")

    // 7) Wait until FinishAfter has passed (65 seconds).
    console.log("\nWaiting 65 seconds for escrow to become finishable...")
    await new Promise((resolve) => setTimeout(resolve, 65 * 1000))

    // 8) Prepare EscrowFinish transaction.
    const escrowFinishTx = {
      TransactionType: "EscrowFinish",
      Account: treasuryWallet.address,
      Owner: treasuryWallet.address,
      OfferSequence: offerSequence,
    }

    // Autofill for multisign and ensure SigningPubKey is empty.
    const preparedEscrowFinish = await client.autofill(escrowFinishTx)
    preparedEscrowFinish.SigningPubKey = ""

    // Increase fee for multisign (base fee * (1 + number of signers)).
    const baseFeeDrops = Number(preparedEscrowFinish.Fee)
    preparedEscrowFinish.Fee = String(baseFeeDrops * 3)

    // 9) Collect at least 2 verifier signatures.
    const verifier1Signed = verifier1Wallet.sign(preparedEscrowFinish, true)
    const verifier2Signed = verifier2Wallet.sign(preparedEscrowFinish, true)

    // 10) Combine signatures into one multisigned transaction blob.
    const multisignedTxBlob = xrpl.multisign([verifier1Signed.tx_blob, verifier2Signed.tx_blob])

    // 11) Submit multisigned EscrowFinish and wait for validation.
    const escrowFinishResult = await client.submitAndWait(multisignedTxBlob)
    const escrowFinishTxResult =
      escrowFinishResult.result?.meta?.TransactionResult ||
      escrowFinishResult.result?.engine_result ||
      "unknown"

    console.log("\n=== Escrow Finish Result ===")
    console.log("Transaction result:", escrowFinishTxResult)

    // 12) Get balances after EscrowFinish.
    const treasuryBalanceAfterFinish = await client.getXrpBalance(treasuryWallet.address)
    const receiverBalanceAfterFinish = await client.getXrpBalance(receiverWallet.address)

    console.log("\n=== Balances After EscrowFinish ===")
    console.log("Treasury:", treasuryBalanceAfterFinish, "XRP")
    console.log("Receiver:", receiverBalanceAfterFinish, "XRP")
  } finally {
    // 13) Disconnect from XRPL client at the end.
    await client.disconnect()
    console.log("\nDisconnected from XRPL Testnet")
  }
}

main().catch((error) => {
  console.error("Error in escrow multisign flow:", error)
})
//asdadad
//change 2
//fhfh