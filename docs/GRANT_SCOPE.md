# Grant Scope

## Completed Before Proposal Submission

- Credits-based PoC design using `credits.aleo`.
- TypeScript monorepo scaffold.
- Checkout domain model and in-memory order repository.
- Credits-specific order confirmation rules.
- Duplicate record/receipt rejection.
- Mock adapters retained for local UI development only.
- Testnet Credits adapter mode with fail-fast environment validation.
- Local Credits payment adapter using installed SDK methods.
- Local Credits record scanner for narrow PoC block ranges.
- Local merchant Credits decryptor.
- Redacted receipt artifact writer.
- Unit tests for mock separation, testnet validation, confirmation failures, scanner failures, transaction rejection, and artifact redaction.
- Minimal UI copy and badge updates.
- Earlier USDCx technical discovery retained as optional extension research.

## Verified `READY` Evidence

- Owner created dedicated customer and merchant testnet accounts.
- Owner funded the customer with public testnet Credits from the official faucet.
- Public Credits were converted into a private `credits.aleo` record.
- Actual private transfer transaction ID was returned: `at1krauefj77d4nlvczq6m8audyyggpf2lutm60gsls6qdg83c97qgsyxjnjp`.
- Transaction status was accepted.
- Accepted transaction was located at block `17092360`.
- Actual merchant-owned Credits record was discovered: `credits_record_4a17d1800531a35ba0710434`.
- Actual merchant-owned record was decrypted.
- Amount was validated at `1000000` microcredits.
- Order confirmation returned `verified`.
- Duplicate confirmation was rejected.
- `artifacts/testnet-credits-poc-result.json` was generated.

## Funded Scope After The Minimal Receipt

- Connect the verified Credits testnet payment flow to the web checkout so the browser flow becomes the primary end-to-end user path.
- Deterministic on-chain order-reference binding through a Leo wrapper.
- Durable repository, likely SQLite.
- Production-oriented record indexing, including optional Provable RSS.
- Real USDCx or other token adapter once public records and required proofs are available.
- Optional Dynamic embedded-wallet UX.
- Optional DPS/Feemaster route if desired for wallet UX or sponsored execution.
- Integration tests against funded testnet accounts in a controlled CI or operator environment.
- Operator-grade evidence capture and grant proposal packaging.

## Future Production Work Outside This Grant

- Mainnet payment gateway.
- Custody or merchant account management.
- Production auth, RBAC, KYB/KYC, fraud controls, and compliance workflows.
- Settlement reporting and accounting integrations.
- Secrets management and key custody architecture.
- High availability scanner operations.
- Formal audit of wrapper programs.
- Refunds, disputes, reconciliation, and support workflows.
