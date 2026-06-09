# Demo

## Mock UI Preview

The web UI is a mock-only preview. It must not be used as proof of a real Aleo transaction.

Start it only when you intentionally want a local web server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/checkout/ord_demo_private_credits
```

The UI badge should show:

```text
MOCK UI PREVIEW - NO REAL ALEO TRANSACTIONS
```

## Click Path

1. Checkout page: verify order ID, Credits amount, merchant identifier, and `pending` status.
2. Click `Initiate payment`.
3. Progress page: verify mocked transaction submission, mocked scanner, and mocked confirmation states.
4. Merchant orders page: verify the mock order moved to `paid`.
5. Receipt page: verify receipt ID, order ID, confirmation status, disclosed fields, and privacy notice.

## What The Local Demo Uses

- `MockStablecoinPaymentAdapter`
- `MockRecordScannerAdapter`
- `MockRecordDecryptionAdapter`
- `MockSelectiveDisclosureAdapter`
- in-memory order repository

Mock adapters throw when `ALEO_ADAPTER_MODE=testnet-credits-local`.

## Real Credits PoC

The real PoC is CLI-driven:

```bash
npm run poc:testnet-credits
```

It requires owner-created `.env.local` values and faucet-funded public testnet Credits.

Expected public artifact:

```text
artifacts/testnet-credits-poc-result.json
```

## Suggested 3-Minute Script

1. "This project demonstrates a minimal private Credits checkout receipt on Aleo testnet."
2. "The web UI is intentionally a Mock UI Preview; the verified path is the CLI Credits PoC."
3. "The customer starts with faucet-funded public testnet Credits."
4. "The PoC creates or finds a private `credits.aleo` record, then submits `transfer_private` to the merchant."
5. "The scanner searches only a narrow recent block range and decrypts only merchant-owned records."
6. "The confirmation step validates amount, merchant ownership, real transaction ID, program ID, and duplicate rejection."
7. "The public receipt artifact is redacted and does not include secrets or raw record plaintext."
8. "USDCx, Dynamic, RSS, and deterministic on-chain order references are optional future extensions, not required for this receipt."

## Grant Integration Target

Grant-funded implementation should connect the verified Credits testnet flow to this web app so the browser checkout becomes the single primary end-to-end flow. Until then, the browser experience remains a Mock UI Preview and the verified evidence remains CLI-driven.
