# Security Notes

## Testnet Only

Use Aleo testnet only. Never use mainnet, production funds, or a wallet that contains real assets.

## Secrets

Never commit, paste into chat, screenshot, or log:

- `ALEO_CUSTOMER_PRIVATE_KEY`
- `ALEO_CUSTOMER_VIEW_KEY`
- `ALEO_MERCHANT_PRIVATE_KEY`
- `ALEO_MERCHANT_VIEW_KEY`
- mnemonic phrases or seeds
- raw record plaintext
- raw sensitive record ciphertexts when not intentionally stored in ignored private artifacts
- API keys, JWTs, or future service credentials

`.env.example` contains placeholders only. Real values belong in `.env.local`.

## Ignored Sensitive Paths

Git ignore rules include:

```text
.env
.env.*
!.env.example
secrets/
wallet-data/
private-keys/
*.pem
*.key
artifacts/private/
```

## Runtime Modes

`ALEO_ADAPTER_MODE=mock` is local UI development only.

`ALEO_ADAPTER_MODE=testnet-credits-local` must never instantiate mock adapters, use fake transaction IDs, use fixture records, or auto-confirm orders.

## Public Artifacts

Safe public evidence is limited to redacted metadata such as:

- adapter mode;
- network;
- program ID;
- actual transaction ID;
- order ID;
- receipt ID;
- booleans for discovery, decryption, amount validation, and duplicate rejection;
- timestamp.

Do not save private keys, view keys, raw record plaintext, seeds, API keys, or full wallet history in public artifacts.

## Record Handling

The local scanner and decryptor may handle sensitive record data inside the adapter boundary. Any transient raw candidate data is stored under `artifacts/private/`, which is ignored by git.

## Current Dependency Risk

`npm install` on 2026-06-07 reported transitive vulnerabilities:

- 14 moderate
- 12 high
- 1 critical

This is acceptable for a technical PoC only. Production work must run `npm audit`, evaluate dependency trees, and upgrade or replace vulnerable packages before handling production assets.

## Production Gaps

The Credits PoC does not provide production key custody, merchant onboarding, fraud controls, durable ledgering, production record indexing, refunds, disputes, or audited smart contracts.
