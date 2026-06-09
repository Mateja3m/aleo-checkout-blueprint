# Real Testnet Preflight

Last updated: 2026-06-09

Historical note: this is the earlier USDCx/stablecoin preflight. It is superseded for the minimal executable PoC by `docs/CREDITS_TESTNET_DISCOVERY.md`, `docs/CREDITS_VERIFIED_EVIDENCE.md`, and `docs/OWNER_SETUP_GUIDE.md`.

Verdict: `REQUIRES EXTERNAL TEAM ACCESS`

This report verifies what is required to execute one real Aleo testnet private stablecoin checkout flow without mocked values. It uses only official Aleo, Provable, and Dynamic documentation plus installed package source in this repository.

## Sources Checked

- Aleo private stablecoin standard: https://developer.aleo.org/guides/standards/stablecoin
- Aleo SDK getting started and network selection: https://developer.aleo.org/sdk/guides/getting_started/
- Aleo quick start faucet reference: https://developer.aleo.org/guides/introduction/quick_start
- Aleo credits and fees: https://developer.aleo.org/concepts/fundamentals/credits and https://developer.aleo.org/concepts/fundamentals/transaction_fees
- Provable Explorer API v2: https://developer.aleo.org/apis/v2/provable-api/
- Provable testnet program source endpoint: `https://api.explorer.provable.com/v2/testnet/program/test_usdcx_stablecoin.aleo/2`
- Provable testnet token metadata endpoint: `https://api.explorer.provable.com/v2/testnet/program/test_usdcx_stablecoin.aleo/mapping/token_info/true`
- Provable Record Scanning Service: https://developer.aleo.org/sdk/record-scanning/record_scanning/
- Provable RecordScanner API: https://developer.aleo.org/sdk/api-specification/record_scanner/
- Provable Delegated Proving Service: https://developer.aleo.org/sdk/delegate-proving/delegate_proving/
- Dynamic Aleo wallet docs: https://dynamic-docs.mintlify.app/react/wallets/using-wallets/aleo/aleo-wallets
- Dynamic embedded wallet docs: https://docs.dynamic.xyz/wallets/embedded-wallets/create-embedded-wallets
- Dynamic public site signup statement: https://www.dynamic.xyz/
- Installed package source:
  - `node_modules/@provablehq/sdk/dist/testnet/account.d.ts`
  - `node_modules/@provablehq/sdk/dist/testnet/record-scanner.d.ts`
  - `node_modules/@provablehq/sdk/dist/testnet/program-manager.d.ts`
  - `node_modules/@dynamic-labs/aleo/src/types.d.ts`

## Direct Answers

1. Can a real private testnet stablecoin transfer be executed with publicly available tools?
   - The program interface and SDK tooling are public. A real end-to-end checkout is not publicly executable from this repo today because no verified public self-service path was found for obtaining a private `test_usdcx_stablecoin.aleo/Token` record, and RSS/DPS credentials require Provable API key plus consumer ID with no verified browser self-service flow in the checked docs.
2. Which exact stablecoin program and transition should be used?
   - Network: `testnet`
   - Program: `test_usdcx_stablecoin.aleo`
   - Edition: `2`
   - Private transfer transition: `transfer_private`
3. Are public testnet stablecoin tokens or private token records available?
   - The testnet program has nonzero supply in the official mapping endpoint. No verified public faucet or self-service method was found for obtaining public test USDCx or private `Token` records.
4. Is a public faucet available?
   - Public Aleo testnet credits faucet: `https://faucet.aleo.org/`, verified in the official Aleo quick start docs. No verified public stablecoin faucet was found.
5. Are testnet credits required for fees?
   - Yes, unless a verified Feemaster sponsorship path covers the exact transaction. Aleo fees are paid in Aleo Credits.
6. Is DPS required?
   - Not strictly by the SDK. Local proving with `ProgramManager` is a public SDK path. DPS is required if using Provable delegated proving or Dynamic embedded Aleo operations.
7. Can Feemaster sponsorship be used?
   - The Provable SDK exposes `useFeeMaster` in `ProvingRequestOptions`, and Dynamic exposes sponsorship checks. Coverage for `test_usdcx_stablecoin.aleo/transfer_private` was not verified as public and must not be assumed.
8. Are Provable RSS credentials required?
   - Yes for merchant-side record scanning through Provable RSS. A single transaction can be manually inspected if the ciphertext is known, but merchant discovery via scanner requires RSS credentials or a valid JWT.
9. Can RSS credentials be obtained through a public self-service flow?
   - Not verified. Docs mention registering a consumer through `POST https://api.provable.com/consumers`, but the exact public signup body, dashboard path, and approval status were not verified.
10. Can Dynamic WaaS be used through a public self-service flow?
   - Dynamic publicly says developers can create an environment in the Dynamic Dashboard and create a free account. Aleo embedded-wallet operational readiness for this PoC still depends on a Dynamic environment and supported Aleo wallet methods. Dynamic is optional for the minimal PoC.
11. Which manual steps must the repository owner complete?
   - Create dedicated customer and merchant testnet accounts.
   - Fund customer testnet credits from the public Aleo faucet.
   - Obtain a real `test_usdcx_stablecoin.aleo/Token` private record or public balance plus a supported shield path.
   - Obtain Provable RSS credentials if scanner-based merchant discovery is required.
   - Obtain DPS credentials if using delegated proving.
   - Add all secrets locally to `.env.local`.
12. Which secrets and environment variables are required?
   - Required for real testnet PoC: `ALEO_CUSTOMER_PRIVATE_KEY`, `ALEO_CUSTOMER_VIEW_KEY`, `ALEO_CUSTOMER_ADDRESS`, `ALEO_MERCHANT_VIEW_KEY`, `ALEO_MERCHANT_ADDRESS`, and stablecoin record material obtained by scanning or wallet record listing.
   - Required for RSS/DPS path: `PROVABLE_API_KEY`, `PROVABLE_CONSUMER_ID`, `PROVABLE_SCANNER_BASE_URL`, `PROVABLE_PROVER_BASE_URL`, `PROVABLE_SCANNER_UUID`.
   - Required only if merchant must spend/deploy later: `ALEO_MERCHANT_PRIVATE_KEY`.
13. Which steps can Codex implement immediately after access is provided?
   - Config validator, account validator, RSS registration command, scanner status command, record scan command, record decryption command, DPS or local-proving payment command, transaction status command, receipt artifact generation, and a final `poc:testnet` orchestration script.
14. Is a real end-to-end test feasible without private assistance from Aleo, Provable, or Dynamic?
   - Not verified. External access is required unless the owner already has a private test USDCx record and Provable RSS/DPS credentials from a public path not found in the checked docs.
15. If external team assistance is required, what exact request should the owner send?
   - See `docs/EXTERNAL_ACCESS_REQUESTS.md`.
16. What is the shortest path from the current PoC to one verified private-payment receipt?
   - Owner obtains private test USDCx record and credits.
   - Owner obtains Provable RSS credentials.
   - Codex implements real commands behind env gates.
   - Owner runs one `transfer_private` testnet payment to the merchant.
   - Merchant scans, decrypts, verifies amount/address/reference strategy, and generates receipt evidence.

## Required Preflight Table

| Requirement | Needed? | Publicly obtainable? | Exact source or docs path | Manual owner action | Current blocker |
| --- | --- | --- | --- | --- | --- |
| Customer testnet account | Yes | Yes | `node_modules/@provablehq/sdk/dist/testnet/account.d.ts`, `Account` constructor | Generate a dedicated testnet account locally with the SDK or official wallet. | Not blocked |
| Merchant testnet account | Yes | Yes | `node_modules/@provablehq/sdk/dist/testnet/account.d.ts`, `Account` constructor | Generate a separate dedicated merchant account locally. | Not blocked |
| Customer private key | Yes | Yes, generated locally | `Account.privateKey()` in `node_modules/@provablehq/sdk/dist/testnet/account.d.ts` | Store only in `.env.local` as `ALEO_CUSTOMER_PRIVATE_KEY`. | Blocks payment signing if missing |
| Customer view key | Yes | Yes, generated locally | `Account.viewKey()` in `node_modules/@provablehq/sdk/dist/testnet/account.d.ts` | Store only in `.env.local` as `ALEO_CUSTOMER_VIEW_KEY`. | Blocks customer record verification if missing |
| Customer address | Yes | Yes, generated locally | `Account.address()` and `Account.isValidAddress()` in installed SDK source | Store in `.env.local` as `ALEO_CUSTOMER_ADDRESS`; safe to share if needed. | Blocks funding and payment request if missing |
| Merchant private key | No for receiving; yes for wrapper deployment or merchant-paid actions | Yes, generated locally | `Account.privateKey()` in installed SDK source | Store in `.env.local` as `ALEO_MERCHANT_PRIVATE_KEY` only if needed. | Not a blocker for receiving; blocks deployment if wrapper is used |
| Merchant view key | Yes | Yes, generated locally | `Account.viewKey()` and `RecordCiphertext.decrypt(viewKey)` paths in SDK | Store in `.env.local` as `ALEO_MERCHANT_VIEW_KEY`. | Blocks merchant decryption and RSS registration |
| Merchant address | Yes | Yes, generated locally | `Account.address()` and `Account.isValidAddress()` in installed SDK source | Store in `.env.local` as `ALEO_MERCHANT_ADDRESS`; use as transfer recipient. | Blocks payment request |
| Testnet stablecoin private record | Yes | Not verified | Stablecoin docs plus `https://api.explorer.provable.com/v2/testnet/program/test_usdcx_stablecoin.aleo/2` | Obtain a `test_usdcx_stablecoin.aleo/Token` record from Aleo/Provable or a verified official faucet/path. | Blocks real private payment |
| Testnet credits for fees | Yes unless Feemaster covers exact call | Yes for public credits | Aleo quick start faucet docs: `https://faucet.aleo.org/`; credits docs say fees are paid in Aleo Credits | Submit customer testnet address to official faucet. Merchant credits are required only for merchant-paid actions or deployment. | Blocks user-paid transaction fees if missing |
| DPS access | Optional for local proving; required for delegated proving and Dynamic embedded path | Not verified self-service | Provable DPS docs: `https://developer.aleo.org/sdk/delegate-proving/delegate_proving/` | Obtain `PROVABLE_API_KEY` and `PROVABLE_CONSUMER_ID` or confirm local proving path. | Blocks DPS path |
| Feemaster sponsorship | Optional | Not verified for this exact transfer | Provable SDK `useFeeMaster` in `program-manager.d.ts`; Dynamic `isFeemasterSponsored` docs | Ask Provable/Dynamic whether `test_usdcx_stablecoin.aleo/transfer_private` is sponsored on testnet. | Blocks gasless claim only |
| Provable RSS API key | Yes for RSS | Not verified self-service | RSS docs: `https://developer.aleo.org/sdk/record-scanning/record_scanning/`; SDK `RecordScannerOptions.apiKey` | Obtain and store as `PROVABLE_API_KEY`. | Blocks scanner registration/query |
| Provable consumer ID | Yes for RSS/DPS JWT refresh | Not verified self-service | RSS and DPS docs mention consumer registration and JWT refresh | Obtain and store as `PROVABLE_CONSUMER_ID`. | Blocks authenticated RSS/DPS path |
| Scanner UUID | Yes after RSS registration | Generated by RSS after credentials | RSS docs `POST /register/encrypted`; SDK `registerEncrypted(viewKey, startBlock)` | Register merchant view key encrypted; store returned UUID as `PROVABLE_SCANNER_UUID`. | Blocks scanner queries until registered |
| Dynamic environment ID | No for minimal PoC | Yes for a Dynamic project generally, but Aleo runtime still optional | Dynamic setup docs and public site Dashboard signup | If using Dynamic later, create Dynamic environment and store `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`. | Not a blocker for minimal PoC |
| Dynamic wallet ID | No for minimal PoC | Not required for current repo | Dynamic wallet access docs; installed `@dynamic-labs/aleo` wallet types do not require app env var | Do not configure for minimal PoC. | Not a blocker |
| Wallet approval step | Yes if using browser wallet or Dynamic; no for local SDK signing | Yes, manual user action | Dynamic `proveTransaction` docs and installed `IAleoAdapter.requestTransaction` type | Approve the testnet transaction in the selected wallet, or sign locally with the test account. | Blocks browser-wallet flow only |
| Leo wrapper deployment | No for raw transfer; yes for deterministic order reference | Public tools yes; deploy requires credits and working program | Local `leo/private_checkout`; stablecoin source supports program calls | Decide whether to deploy wrapper after first raw payment. Fund deployer account if yes. | Blocks deterministic on-chain order-reference correlation |
| Order-reference correlation | Yes for checkout-grade receipt | Not solved by raw USDCx transfer | `transfer_private` live source outputs `Token` records without an order field; local `docs/DECISIONS.md` D3 | Use a wrapper receipt record or accept a one-off manual evidence receipt based on tx ID, amount, merchant address, and timestamp. | Blocks deterministic automated payment matching |

## Exact Stablecoin Path Verification

1. Exact network name: `testnet`.
2. Exact stablecoin program ID: `test_usdcx_stablecoin.aleo`.
3. Exact edition: `2`, verified by the official source endpoint path `.../program/test_usdcx_stablecoin.aleo/2`.
4. Exact private-transfer transition name: `transfer_private`.
5. Exact input types from live source:
   - `r0 as address.private`
   - `r1 as u128.private`
   - `r2 as Token.record`
   - `r3 as [MerkleProof; 2u32].private`
6. Exact output record types from live source:
   - `ComplianceRecord.record`
   - sender remaining `Token.record`
   - recipient `Token.record`
   - `test_usdcx_stablecoin.aleo/transfer_private.future`
7. Fee mechanism:
   - Aleo fees are paid in Aleo Credits.
   - SDK `ExecuteOptions` and `ProvingRequestOptions` expose `priorityFee`, `privateFee`, `feeRecord`, and `useFeeMaster`.
   - Public testnet credits are required unless Feemaster sponsorship is verified for the exact call.
8. Freeze-list proof requirements:
   - `MerkleProof` is `siblings as [field; 16u32]` plus `leaf_index as u32`.
   - `transfer_private` requires two proofs as `[MerkleProof; 2u32].private`.
   - The stablecoin docs say senders must prove non-membership in the freeze list.
9. DPS requirements:
   - DPS is required only if using Provable delegated proving or Dynamic embedded operations.
   - Local SDK proving is available in `ProgramManager`, but this repo does not yet include a real testnet payment command.
10. Whether Feemaster sponsorship is optional or required:
   - Optional. It can replace fee authorization only when supported. Coverage for this exact transfer was not verified.
11. Whether public testnet tokens exist:
   - The official `token_info[true]` mapping returns nonzero supply, currently `183680017472u128` with `decimals: 6u8`.
   - This proves the testnet token exists, not that it is publicly obtainable.
12. Whether private testnet records can be obtained through a faucet or another self-service mechanism:
   - Not verified. No official Aleo, Provable, or Dynamic self-service private USDCx record faucet was found.
13. Whether a customer must first convert a public balance into a private record:
   - If the owner receives public test USDCx, yes. Use `transfer_public_to_private(address.private, u128.public)` to create a private `Token.record`.
   - No verified public path to obtain public test USDCx was found.
14. Whether merchant-side record scanning requires RSS:
   - For independent merchant discovery, yes. Provable RSS returns owned records by UUID after encrypted view-key registration.
   - If the transaction ID and ciphertext are manually supplied, record-specific decryption can be tested without RSS.
15. Whether record-specific disclosure can be tested independently of Dynamic:
   - Yes. Installed SDK source exposes account/view-key record decryption and record view key APIs used by `packages/aleo-client/src/real/disclosure.ts`.
16. Whether Dynamic is optional for the minimal PoC:
   - Yes. Dynamic is not required for a local SDK plus Provable RSS/DPS path. Dynamic remains optional funded-scope embedded-wallet UX.

## Environment Variables

| Variable | Purpose | Where owner obtains it | Required? | Safe in `.env.local`? | Must never appear in logs? | Can omit in minimal PoC? |
| --- | --- | --- | --- | --- | --- | --- |
| `ALEO_NETWORK` | Force testnet mode | Static value `testnet` | Yes | Yes | No | No |
| `ALEO_EXPLORER_API_BASE` | Explorer API base for testnet reads | Official Provable API docs | Yes | Yes | No | No |
| `ALEO_STABLECOIN_PROGRAM_ID` | Stablecoin program to execute | Official Provable program source | Yes | Yes | No | No |
| `ALEO_STABLECOIN_PROGRAM_EDITION` | Stablecoin edition | Official Provable program source endpoint | Yes | Yes | No | No |
| `ALEO_FREEZELIST_PROGRAM_ID` | Companion freeze-list program | Official program imports | Yes | Yes | No | No |
| `ALEO_CUSTOMER_PRIVATE_KEY` | Sign customer transaction | Locally generated test account | Yes | Yes | Yes | No |
| `ALEO_CUSTOMER_VIEW_KEY` | Verify customer records | Locally generated test account | Yes for record validation | Yes | Yes | No |
| `ALEO_CUSTOMER_ADDRESS` | Faucet, sender identity, validation | Locally generated test account | Yes | Yes | No | No |
| `ALEO_MERCHANT_PRIVATE_KEY` | Merchant deploy/spend actions | Locally generated merchant account | Optional for receiving | Yes | Yes | Yes if not deploying/spending |
| `ALEO_MERCHANT_VIEW_KEY` | RSS registration and record decryption | Locally generated merchant account | Yes | Yes | Yes | No |
| `ALEO_MERCHANT_ADDRESS` | Payment recipient | Locally generated merchant account | Yes | Yes | No | No |
| `PROVABLE_API_KEY` | RSS/DPS auth and JWT refresh | Provable consumer registration or support | Yes for RSS/DPS | Yes | Yes | No for RSS/DPS; yes for manual ciphertext-only test |
| `PROVABLE_CONSUMER_ID` | RSS/DPS JWT refresh | Provable consumer registration or support | Yes for RSS/DPS | Yes | Yes | No for RSS/DPS; yes for manual ciphertext-only test |
| `PROVABLE_SCANNER_BASE_URL` | RSS base URL | Official RSS docs, `https://api.provable.com/scanner` | Yes for RSS | Yes | No | No for RSS path |
| `PROVABLE_PROVER_BASE_URL` | DPS base URL | Official DPS docs, `https://api.provable.com/prove` | Yes for DPS | Yes | No | Yes if local proving works |
| `PROVABLE_SCANNER_UUID` | Registered scanner job/account UUID | RSS registration output | Yes after registration | Yes | No, but treat as sensitive metadata | No for RSS path |
| `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` | Optional Dynamic React SDK environment | Dynamic Dashboard | Optional | Yes, public client config | No | Yes |

## Feasibility Verdict

The real testnet transfer is technically plausible with the official program and SDK surface, but the current public path is incomplete. The shortest path requires external or already-held access to:

- a private `test_usdcx_stablecoin.aleo/Token` record or official path to mint/shield test USDCx;
- Provable API key plus consumer ID for RSS, and probably DPS if local proving is not used;
- official confirmation of Feemaster coverage only if gasless execution is claimed.

Dynamic is not required for the minimal real-testnet PoC.
