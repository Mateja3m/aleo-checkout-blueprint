# Decisions

Last updated: 2026-06-09

## D1. Product Positioning

Rename the technical PoC to `Aleo Private Payments Checkout Blueprint`.

The minimal verified path uses Aleo Testnet Credits through `credits.aleo`. The earlier USDCx discovery remains optional extension research and must not be required for the critical receipt path.

## D2. Runtime Modes

Support exactly two adapter modes for the current scope:

- `mock`: Mock UI Preview only.
- `testnet-credits-local`: real Aleo testnet Credits operations only.

Mock adapters must throw in `testnet-credits-local`. The browser app currently previews UX with mock data; the verified testnet payment path is CLI-driven until funded web integration work connects the real Credits flow to the UI.

## D3. Testnet Program

Use:

- Network: `testnet`
- Program: `credits.aleo`
- Public-to-private conversion transition: `transfer_public_to_private`
- Private payment transition: `transfer_private`
- Record: `credits.record` with `owner` and `microcredits`

This is verified against official Aleo Credits documentation, the live `credits.aleo` program source fetched from the official Provable Explorer API, and installed `@provablehq/sdk` package declarations.

## D4. Fees

Use user-paid public Credits fees for the minimal PoC.

Reason: official fee docs state public fee payment deducts from the payer's public `account` balance. The installed SDK `ProgramManager.transfer` exposes `privateFee`; this PoC calls it with `false`.

DPS and Feemaster sponsorship are optional future paths, not required for the Credits PoC.

## D5. Private Credits Record Creation

Faucet Credits arrive as public Credits. A private payment needs a private `credits.record`, so the PoC creates one with `credits.aleo/transfer_public_to_private` when no suitable customer record is found.

## D6. Scanner

Do not require Provable RSS for the minimal PoC.

Use direct local scanning through installed SDK network-client methods. The scanner first checks the submitted transaction, then locates the accepted transaction block by transaction ID, scans a small nearby block window, and falls back to merchant-owned `findUnspentRecords(...)` in that same window. This is acceptable for a workshop/proposal PoC and is explicitly not a production indexing strategy.

## D7. Decryption

Decrypt only merchant-owned record candidates inside `packages/aleo-client`.

Use the installed SDK account methods `ownsRecordCiphertext` and `decryptRecord`. Do not expose the merchant private key, merchant view key, or raw record plaintext outside ignored private artifacts.

## D8. Order Correlation

Use a documented off-chain PoC correlation model:

- one active test order;
- expected merchant address;
- expected Credits amount;
- actual transaction ID;
- actual merchant record identifier;
- payment timestamp;
- consumed-record tracking;
- duplicate-confirmation prevention.

Do not claim raw `credits.aleo/transfer_private` carries an on-chain order reference.

## D9. Artifacts

Public proposal evidence is written to:

```text
artifacts/testnet-credits-poc-result.json
```

Private transient record data is written only under:

```text
artifacts/private/
```

`artifacts/private/` is ignored by git.

## D10. Optional Extension Paths

Keep these out of the critical PoC:

- USDCx stablecoin adapter;
- deterministic Leo wrapper order references;
- Provable RSS-backed production indexing;
- Dynamic embedded-wallet UX;
- DPS/Feemaster sponsored execution.
