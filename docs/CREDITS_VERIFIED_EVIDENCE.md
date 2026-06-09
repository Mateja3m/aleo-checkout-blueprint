# Credits Verified Evidence

Last updated: 2026-06-09

This file is the evidence ledger for the real Credits testnet PoC. It contains only redacted public evidence and must not include private keys, view keys, raw record plaintext, seeds, API keys, or `.env.local` values.

## 1. Exact Tested Network

```text
testnet
```

## 2. Exact `credits.aleo` Transition

Private payment transition:

```text
credits.aleo/transfer_private
```

Public-to-private setup transition:

```text
credits.aleo/transfer_public_to_private
```

Fee path:

```text
credits.aleo/fee_public
```

## 3. Exact Executed Commands

The following commands were executed locally by the repository owner with dedicated testnet-only accounts and faucet-funded public Credits:

```bash
npm run poc:validate-env
npm run poc:check-credits
npm run poc:create-private-credits-record
npm run poc:list-customer-credit-records
npm run poc:transfer-private-credits
npm run poc:transaction-status
npm run poc:scan-merchant-local
npm run poc:decrypt-merchant-record
npm run poc:confirm-order
```

Verification commands run by Codex after scanner fixes:

```bash
npm test
npm run typecheck
npm run build
```

## 4. Actual Redacted Transaction ID

Actual private payment transaction:

```text
at1krauefj77d4nlvczq6m8audyyggpf2lutm60gsls6qdg83c97qgsyxjnjp
```

Transaction status:

```text
accepted
```

Public-to-private setup transaction:

```text
at1ttuyfkwgxqgulxtfshndtxwyyv78hpm2wgnuxpgrlccvzgqhjypq6ytm97
```

## 5. Block Range Scanned

Private transfer start height recorded before local proving:

```text
17092301
```

Accepted transaction located at block:

```text
17092360
```

Scanner evidence:

```text
Checked submitted transaction directly.
Located accepted transaction block height.
Scanned nearby records around block 17092360.
Used merchant-owned unspent credits record scan through the official SDK.
```

## 6. Merchant Record Discovery

Result:

```text
succeeded
```

Record identifier:

```text
credits_record_4a17d1800531a35ba0710434
```

Amount discovered:

```text
1000000 microcredits
```

## 7. Merchant Record Decryption

Result:

```text
succeeded
```

Verified fields:

```text
programId: credits.aleo
ownerMatchesMerchant: true
amountMinor: 1000000
transactionId: at1krauefj77d4nlvczq6m8audyyggpf2lutm60gsls6qdg83c97qgsyxjnjp
```

## 8. Amount Validation

Expected:

```text
1000000 microcredits
```

Actual:

```text
1000000 microcredits
```

Result:

```text
amountValidated: true
```

## 9. Order Status

Result:

```text
verified
```

PoC order:

```text
ord_testnet_credits
```

Receipt:

```text
rcpt_ec85c02623ca4e87ad
```

Correlation model:

```text
documented-off-chain-poc-correlation
```

## 10. Duplicate Confirmation

Expected:

```text
rejected
```

Actual:

```text
duplicateConfirmationRejected: true
```

## 11. Generated Artifact Path

```text
artifacts/testnet-credits-poc-result.json
```

Generated artifact:

```json
{
  "status": "verified",
  "adapterMode": "testnet-credits-local",
  "network": "testnet",
  "programId": "credits.aleo",
  "transactionId": "at1krauefj77d4nlvczq6m8audyyggpf2lutm60gsls6qdg83c97qgsyxjnjp",
  "orderId": "ord_testnet_credits",
  "receiptId": "rcpt_ec85c02623ca4e87ad",
  "correlationMode": "documented-off-chain-poc-correlation",
  "recordDiscovered": true,
  "recordDecrypted": true,
  "amountValidated": true,
  "duplicateConfirmationRejected": true,
  "confirmedAt": "2026-06-09T14:10:31.225Z"
}
```

## 12. Screenshots To Capture

Capture only redacted screens:

1. `ALEO TESTNET - VERIFIED CREDITS MODE` badge.
2. Submitted transaction ID.
3. Scanner block location at `17092360`.
4. Merchant record discovery status.
5. Decryption status.
6. Order verification output.
7. Receipt artifact path.
8. Duplicate confirmation rejection.

Do not capture private keys, view keys, seed phrases, raw record plaintext, or `.env.local`.

## 13. Short Demo-Video Sequence

1. Show `.env.local` exists without revealing values.
2. Run `npm run poc:validate-env`.
3. Run `npm run poc:check-credits`.
4. Run `npm run poc:list-customer-credit-records`.
5. Run `npm run poc:transfer-private-credits`.
6. Run `npm run poc:transaction-status`.
7. Run `npm run poc:scan-merchant-local`.
8. Run `npm run poc:decrypt-merchant-record`.
9. Run `npm run poc:confirm-order`.
10. Open the redacted JSON artifact.

## 14. Verified Claims

- A real Aleo testnet private Credits transfer completed using `credits.aleo/transfer_private`.
- The actual transaction ID was returned and accepted.
- The customer private Credits record was created or found through the official SDK path.
- The merchant-owned Credits record was discovered locally without Provable RSS.
- The merchant record was decrypted locally.
- The received amount matched the expected order amount.
- The PoC confirmation produced a verified receipt artifact.
- Duplicate confirmation was rejected.
- Mock adapters are refused in `testnet-credits-local`.
- The public artifact is redacted and does not include private keys, view keys, seeds, API keys, or raw record plaintext.

## 15. Unverified Claims

Do not claim:

- production-grade record indexing;
- deterministic on-chain order-reference binding;
- USDCx readiness;
- Dynamic embedded-wallet integration;
- Provable RSS integration;
- DPS or Feemaster sponsorship;
- mainnet readiness.

## 16. Optional Future Extensions

- USDCx adapter.
- Provable RSS-backed scanner.
- Dynamic embedded-wallet UX.
- DPS or Feemaster execution path.
- Leo wrapper with deterministic on-chain order references.

## 17. Final Proposal-Readiness Verdict

Current verdict:

```text
READY
```
