# Aleo Private Payments Checkout Blueprint

Minimal verified PoC for a private Aleo testnet Credits checkout receipt.

## Status

`READY`

The PoC completed one real Aleo testnet private Credits payment:

- program: `credits.aleo`
- transition: `transfer_private`
- network: `testnet`
- transaction status: `accepted`
- merchant record discovery: succeeded
- merchant record decryption: succeeded
- amount validation: succeeded
- duplicate confirmation rejection: succeeded
- receipt artifact: generated

Evidence is documented in [docs/CREDITS_VERIFIED_EVIDENCE.md](docs/CREDITS_VERIFIED_EVIDENCE.md).

## What This Repo Demonstrates

1. A customer starts with faucet-funded public Aleo testnet Credits.
2. The PoC creates or finds a private `credits.aleo` record.
3. The customer submits a real private Credits transfer to the merchant.
4. The accepted transaction is located on testnet.
5. The merchant-owned Credits record is discovered locally through the official SDK.
6. The merchant record is decrypted locally.
7. The checkout core validates merchant ownership, amount, program ID, transaction ID, and duplicate prevention.
8. A redacted receipt artifact is written.

The web app is currently a **Mock UI Preview** only. It uses mocked adapters and mock data to show the intended checkout UX. The verified path is CLI-driven.

## Repository Layout

```text
apps/web                 Next.js Mock UI Preview
packages/aleo-client     Aleo SDK adapters for mock and testnet Credits paths
packages/checkout-core   Checkout domain logic and Credits confirmation
packages/shared-types    Shared TypeScript contracts
scripts/poc.mjs          CLI orchestration for the verified Credits PoC
docs/                    Discovery, setup, evidence, and security notes
tests/                   Unit and safety tests
```

## Runtime Modes

```text
ALEO_ADAPTER_MODE=mock
ALEO_ADAPTER_MODE=testnet-credits-local
```

`mock` exists only so the Next.js Mock UI Preview can be opened without funded testnet accounts. It is not part of the verified payment evidence.

`testnet-credits-local` uses real Aleo testnet operations and refuses mock adapters.

For proposal or evidence claims, use only `testnet-credits-local` and the `npm run poc:*` commands.

## Setup

```bash
npm install
cp .env.example .env.local
npm test
npm run typecheck
npm run build
```

Never use wallets with real funds. Never commit `.env.local`.

## Real Testnet PoC Commands

These commands require dedicated testnet-only account values in `.env.local`.

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

The combined runner is:

```bash
npm run poc:testnet-credits
```

## Mock UI Preview

Start the web demo only when you intentionally want a local server:

```bash
npm run dev
```

The dev command clears the ignored Next.js cache before startup. If an old dev process is already running, stop it with `Ctrl+C` before rerunning the command.

Open:

```text
http://localhost:3000/checkout/ord_demo_private_credits
```

The UI badge should show:

```text
MOCK UI PREVIEW - NO REAL ALEO TRANSACTIONS
```

This preview is intentionally separate from the verified CLI flow. Grant-funded work should connect the real Credits payment flow to the web app so the web checkout becomes the primary end-to-end product path.

## Security

- Testnet only.
- No mainnet transactions.
- No production payment gateway.
- No committed secrets.
- No private keys, view keys, seeds, API keys, JWTs, raw record plaintext, or full wallet history in logs or artifacts.
- Private runtime files belong only in ignored local paths.

Review [docs/SECURITY_NOTES.md](docs/SECURITY_NOTES.md) and [docs/OWNER_SETUP_GUIDE.md](docs/OWNER_SETUP_GUIDE.md) before rerunning the testnet flow.

## Non-Goals

- Mainnet payments.
- Production custody or merchant operations.
- Deterministic on-chain order-reference binding.
- USDCx as the critical PoC token.
- Provable RSS as a required dependency.
- Dynamic embedded wallets as a required dependency.
- DPS or Feemaster sponsorship as a required dependency.

Future scope is documented in [docs/GRANT_SCOPE.md](docs/GRANT_SCOPE.md).
