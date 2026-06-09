# Credits Testnet Discovery

Last updated: 2026-06-09

This document records the exact Aleo Credits path used by the minimal verified PoC. Evidence comes from official Aleo documentation, the live `credits.aleo` source fetched from the official Provable Explorer API, and installed `@provablehq/sdk@0.11.0` package declarations.

## Official Sources

- Aleo Credits docs: `https://developer.aleo.org/concepts/fundamentals/credits/`
- Aleo Quick Start faucet docs: `https://developer.aleo.org/guides/introduction/quick_start/`
- Aleo Transaction Fees docs: `https://developer.aleo.org/concepts/fundamentals/transaction_fees/`
- Live program source fetched from: `https://api.explorer.provable.com/v2/testnet/program/credits.aleo`
- Installed SDK declarations:
  - `node_modules/@provablehq/sdk/dist/testnet/program-manager.d.ts`
  - `node_modules/@provablehq/sdk/dist/testnet/network-client.d.ts`
  - `node_modules/@provablehq/sdk/dist/testnet/record-provider.d.ts`
  - `node_modules/@provablehq/sdk/dist/testnet/account.d.ts`

## Verified Network

- Network identifier: `testnet`
- SDK import path: `@provablehq/sdk/testnet.js`
- API host used by the PoC: `https://api.provable.com/v2`

## Verified Program Interface

Program:

```text
credits.aleo
```

Record:

```text
record credits:
    owner as address.private;
    microcredits as u64.private;
```

Public balance mapping:

```text
mapping account:
    key owner as address.public;
    value microcredits as u64.public;
```

## Public Credits To Private Record

Transition:

```text
credits.aleo/transfer_public_to_private
```

Inputs from the live program source:

```text
input r0 as address.private;
input r1 as u64.public;
```

Outputs from the live program source:

```text
output r2 as credits.record;
output r3 as credits.aleo/transfer_public_to_private.future;
```

Purpose: converts faucet-funded public Credits into a private `credits.record` owned by the customer.

## Private Credits Transfer

Transition:

```text
credits.aleo/transfer_private
```

Inputs from the live program source and official Aleo Credits docs:

```text
input r0 as credits.record;
input r1 as address.private;
input r2 as u64.private;
```

Outputs from the live program source:

```text
output r4 as credits.record; # recipient record
output r5 as credits.record; # sender change record
```

The PoC treats the merchant-owned recipient record as payment evidence.

## Fee Mechanism

Official fee docs state every transaction contains a fee transition, public fees are deducted from the payer's public `account`, and public-fee accounts must have sufficient balance at verification time.

The live `credits.aleo` source includes:

```text
fee_public
fee_private
```

The PoC uses public fees through:

```text
ProgramManager.transfer(..., privateFee = false)
```

A separate fee record is not required for the PoC public-fee path. A private fee would require a private Credits record.

## Verified SDK Methods

`ProgramManager`:

- `setAccount(account)`
- `transfer(amount, recipient, transferType, priorityFee, privateFee, recordSearchParams, amountRecord, feeRecord, privateKey, offlineQuery)`
- `buildTransferTransaction(...)`

Supported transfer type names are documented in the installed declaration as:

```text
private
privateToPublic
public
publicToPrivate
```

`AleoNetworkClient`:

- `getLatestHeight()`
- `getPublicBalance(address)`
- `getConfirmedTransaction(transactionId)`
- `getTransactionObject(transactionId)`
- `getTransactions(blockHeight)`
- `submitTransaction(transaction)`
- `findRecords(startHeight, endHeight, unspent, programs, amounts, maxMicrocredits, nonces, privateKey)`
- `findUnspentRecords(startHeight, endHeight, programs, amounts, maxMicrocredits, nonces, privateKey)`

`NetworkRecordProvider`:

- `findCreditsRecord(microcredits, searchParameters)`
- `findCreditsRecords(microcredits[], searchParameters)`

`Account`:

- `isValidAddress(address)`
- `privateKey()`
- `viewKey()`
- `address()`
- `ownsRecordCiphertext(ciphertext)`
- `decryptRecord(ciphertext)`
- `decryptRecords(ciphertexts)`

## Direct Record Scanning Decision

`findRecords(...)` and `findUnspentRecords(...)` can discover account-owned records by block range and program when supplied the account key path, but they return record plaintext objects rather than the full transaction/ciphertext context needed for the receipt artifact.

The PoC scanner therefore:

1. captures `getLatestHeight()` before payment submission;
2. submits `credits.aleo/transfer_private`;
3. checks the submitted transaction object directly with `getTransactionObject(transactionId)`;
4. locates the accepted transaction block by searching `getTransactions(height)` for the known transaction ID;
5. scans a small nearby block range around the located transaction block;
6. inspects transaction `records()`, `outputs(true)`, and `summary()` for record ciphertexts;
7. falls back to merchant-owned `findUnspentRecords(...)` in the transaction block window;
8. tests merchant ownership using `Account.ownsRecordCiphertext(...)` where ciphertext is available;
9. decrypts inside the adapter boundary with `Account.decryptRecord(...)` or normalizes the SDK-returned merchant plaintext from `findUnspentRecords(...)`;
10. returns only redacted normalized data to checkout-core.

This is workshop/proposal PoC logic, not production indexing.

## Spent Detection

Source-verified options:

- `findUnspentRecords(...)`
- `findRecords(..., unspent = true, ...)`
- `NetworkRecordProvider.findCreditsRecord(s)(..., { unspent: true })`

The direct transaction scanner can identify created merchant-owned records in a narrow range. It does not provide a production wallet index or global spent-state history. The PoC prevents replay at the checkout layer by tracking consumed record identifiers and rejecting duplicate receipts.

## Local Proving

The installed SDK exposes local transaction construction and transfer submission through `ProgramManager.transfer(...)` and `buildTransferTransaction(...)`. The PoC uses `buildTransferTransaction(...)` followed by `AleoNetworkClient.submitTransaction(...)` so the CLI can report proof/submission progress.

Live proving and submission have not been executed in this Codex environment because the owner must keep private keys and funded testnet accounts local.

## DPS, Feemaster, RSS, Dynamic

- DPS: not required for the local Credits path unless local proving fails during owner execution.
- Feemaster: optional; public-fee customer Credits are used instead.
- Provable RSS: not required; direct local scanner is used for the narrow PoC.
- Dynamic: not required; it remains optional embedded-wallet UX scope.

## Verified Answers

1. Exact network: `testnet`.
2. Program ID: `credits.aleo`.
3. Public-to-private conversion: `transfer_public_to_private`.
4. Private transfer: `transfer_private`.
5. Private transfer input record type: `credits.record`.
6. Recipient output record type: `credits.record`.
7. Fee mechanism: public fee with `fee_public` via SDK `privateFee = false`.
8. Separate fee record: not for public-fee path.
9. Local proving: SDK source supports it; live run still owner-dependent.
10. Transaction submission: `ProgramManager.transfer(...)`, backed by network submission APIs.
11. Transaction status: `getConfirmedTransaction(...)` and `getTransactionObject(...)`.
12. Current height: `getLatestHeight()`.
13. Direct scanning: `getTransactions(...)` and `getTransactionObject(...).records()`.
14. Record decryption: `Account.ownsRecordCiphertext(...)` and `Account.decryptRecord(...)`.
15. Public faucet: official docs point to `https://faucet.aleo.org/`; faucet Credits are public.
16. Dynamic: optional for this PoC.

## Remaining Assumptions

- Actual local proof generation runtime performance is not measured until the owner runs the funded testnet command.
- Direct scanner behavior against the accepted transaction must be confirmed by the owner run and documented in `docs/CREDITS_VERIFIED_EVIDENCE.md`.
- Fee sufficiency depends on current network fee requirements and the faucet balance available to the customer account.
