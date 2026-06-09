# Technical Discovery

Last updated: 2026-06-07

This discovery was completed before implementation. It uses official Aleo/Provable documentation, official package metadata, the Provable Explorer API, and Dynamic documentation. The implementation must not claim a production payment gateway or a completed mainnet payment flow.

## Sources Checked

- Aleo Private Stablecoin Program: https://developer.aleo.org/guides/standards/stablecoin/
- Provable API v2 OpenAPI documentation: https://developer.aleo.org/apis/v2/provable-api/
- Provable Explorer API source endpoint:
  - `https://api.explorer.provable.com/v2/mainnet/program/usdcx_stablecoin.aleo/1`
  - `https://api.explorer.provable.com/v2/testnet/program/test_usdcx_stablecoin.aleo/2`
- Aleo Record Scanning Service: https://developer.aleo.org/sdk/record-scanning/record_scanning/
- Aleo RecordScanner API: https://developer.aleo.org/sdk/api-specification/record_scanner/
- Aleo RecordCiphertext WASM API: https://developer.aleo.org/sdk/wasm/record_ciphertext/
- Aleo EncryptionToolkit WASM API: https://developer.aleo.org/sdk/wasm/encryption_toolkit/
- Aleo Records concept page: https://developer.aleo.org/concepts/fundamentals/records/
- Dynamic Aleo wallet documentation: https://dynamic-docs.mintlify.app/react/wallets/using-wallets/aleo/aleo-wallets
- Dynamic/Aleo announcement: https://aleo.org/post/dynamic-aleo-announcement/
- npm registry checks run on 2026-06-07.

## Current Package Names and Versions

Verified with `npm view` on 2026-06-07:

- `@provablehq/sdk`: `0.11.0`
- `@dynamic-labs/aleo`: `4.88.1`
- `@dynamic-labs/sdk-react-core`: `4.88.1`

The project uses `@provablehq/sdk` as the only official Aleo SDK dependency for Aleo operations. Dynamic remains optional and is represented through a wallet adapter abstraction.

## USDCx Program Interface

Mainnet:

- Program ID: `usdcx_stablecoin.aleo`
- Latest verified edition from Provable API: `1`
- Explorer API source endpoint: `https://api.explorer.provable.com/v2/mainnet/program/usdcx_stablecoin.aleo/1`

Testnet:

- Program ID: `test_usdcx_stablecoin.aleo`
- Latest verified edition from Provable API: `2`
- Explorer API source endpoint: `https://api.explorer.provable.com/v2/testnet/program/test_usdcx_stablecoin.aleo/2`

### Records

```aleo
record Token:
    owner as address.private;
    amount as u128.private;

record ComplianceRecord:
    owner as address.private;
    amount as u128.private;
    sender as address.private;
    recipient as address.private;

record Credentials:
    owner as address.private;
    freeze_list_root as field.private;
```

### Structs

- `ChecksumEdition`
- `TokenInfo`
- `TokenAllowance`
- `MerkleProof`
- `WalletEcdsaSigner`
- `WalletSigningOpId`
- `AdminOp`

The private-transfer proof type is:

```aleo
struct MerkleProof:
    siblings as [field; 16u32];
    leaf_index as u32;
```

### Mappings

- `token_info: boolean => TokenInfo`
- `balances: address => u128`
- `allowances: field => u128`
- `address_to_role: address => u16`
- `pause: boolean => boolean`

Testnet token metadata read through the official API:

```text
token_info[true] =
{
  name: 366469202808u128,
  symbol: 366469202808u128,
  decimals: 6u8,
  supply: 183529947472u128,
  max_supply: 340282366920938463463374607431768211455u128
}
```

### Functions

Mainnet edition 1 function surface:

- `get_signing_op_id_for_deploy`
- `update_role`
- `initialize`
- `get_credentials`
- `mint_public`
- `mint_private`
- `burn_public`
- `burn_private`
- `transfer_public`
- `transfer_public_as_signer`
- `approve_public`
- `unapprove_public`
- `transfer_from_public`
- `transfer_public_to_private`
- `transfer_from_public_to_private`
- `transfer_private`
- `transfer_private_to_public`
- `set_pause_status`
- `join`
- `split`
- `transfer_private_with_creds`

Testnet edition 2 adds:

- `update_token_info`

## Supported Private Transfer Transitions

The private stablecoin docs identify `transfer_private`, `transfer_public_to_private`, and `transfer_private_to_public` as the relevant private/public boundary transitions. The live source confirms these signatures.

### `get_credentials`

```aleo
function get_credentials:
    input r0 as [MerkleProof; 2u32].private;
    ...
    output ... as Credentials.record;
    output ... as usdcx_stablecoin.aleo/get_credentials.future;
```

This transition proves the signer is not on the freeze list and returns a `Credentials` record.

### `transfer_private`

```aleo
function transfer_private:
    input r0 as address.private;
    input r1 as u128.private;
    input r2 as Token.record;
    input r3 as [MerkleProof; 2u32].private;
    ...
    output ... as ComplianceRecord.record;
    output ... as Token.record;
    output ... as Token.record;
    output ... as usdcx_stablecoin.aleo/transfer_private.future;
```

The current mainnet source emits a `ComplianceRecord` plus sender/recipient `Token` records and a future.

### `transfer_private_with_creds`

```aleo
function transfer_private_with_creds:
    input r0 as address.private;
    input r1 as u128.private;
    input r2 as Token.record;
    input r3 as Credentials.record;
    ...
    output ... as ComplianceRecord.record;
    output ... as Token.record;
    output ... as Token.record;
    output ... as Credentials.record;
    output ... as usdcx_stablecoin.aleo/transfer_private_with_creds.future;
```

This is useful when a caller already has a `Credentials` record from `get_credentials`.

### `transfer_public_to_private`

```aleo
function transfer_public_to_private:
    input r0 as address.private;
    input r1 as u128.public;
    ...
    output ... as ComplianceRecord.record;
    output ... as Token.record;
    output ... as usdcx_stablecoin.aleo/transfer_public_to_private.future;
```

This is the shield flow from public balance into a private `Token` record.

## Testnet USDCx Availability

The official stablecoin docs describe USDCx and USAD as live on mainnet. The Provable Explorer API also exposes a testnet program named `test_usdcx_stablecoin.aleo` with the same transfer family and token metadata. This is the closest officially visible development stablecoin flow found during discovery.

Important limitation: having a testnet stablecoin program does not by itself mean the PoC can mint arbitrary test USDCx. Minting requires roles. The current PoC therefore supports:

- verified program/interface discovery;
- env-gated adapter calls against `test_usdcx_stablecoin.aleo`;
- mock isolated adapter flow for local UI and domain tests;
- documentation of what credentials/funds are required to run a real end-to-end transfer.

## Freeze List and Credentials

Private transfers require freeze-list Merkle proofs. The stablecoin docs specify:

```text
GET https://api.explorer.provable.com/v2/programs/{programID}/compliance/freeze-list
```

The live testnet companion program `test_usdcx_freezelist.aleo` exposes these mappings:

- `freeze_list`
- `freeze_list_index`
- `freeze_list_last_index`
- `freeze_list_root`
- `root_updated_height`
- `block_height_window`
- `address_to_role`

The PoC does not hand-roll Merkle proof generation unless official SDK support is verified in package source or docs.

## Record Scanning

Official Record Scanning Service base:

```text
https://api.provable.com/scanner/{network}
```

SDK usage:

```ts
import { Account, RecordScanner } from "@provablehq/sdk/mainnet.js";

const scanner = new RecordScanner({ url: "https://api.provable.com/scanner" });
await scanner.setApiKey(process.env.RECORD_SCANNER_API_KEY);
await scanner.setConsumerId(process.env.RECORD_SCANNER_CONSUMER_ID);
const registration = await scanner.registerEncrypted(account.viewKey(), 0);
const records = await scanner.findRecords({
  uuid: registration.data.uuid,
  unspent: true,
  filter: { program: "test_usdcx_stablecoin.aleo", record: "Token" },
});
```

The scanner can also be accessed over HTTP:

- `GET /pubkey`
- `POST /register/encrypted`
- `POST /records/owned`

Blocker: the scanner requires Provable API credentials or a JWT. This repo must not commit those secrets.

## Record Decryption

Official decryption API:

```ts
import { RecordCiphertext, ViewKey } from "@provablehq/sdk/mainnet.js";

const ciphertext = RecordCiphertext.fromString(recordCiphertext);
const plaintext = ciphertext.decrypt(viewKey);
```

The SDK also documents `RecordCiphertext.isOwner(viewKey)` and `Account.decryptRecord(ciphertext)`.

## Record-Specific Selective Disclosure

Aleo record v1 supports record view keys. Official APIs:

```ts
const recordViewKey = recordCiphertext.recordViewKey(viewKey);
const plaintext = recordCiphertext.decryptWithRecordViewKey(recordViewKey);
```

The `EncryptionToolkit` also documents:

- `generateRecordViewKey(view_key, record_ciphertext)`
- `decryptRecordWithRVk(record_vk, record_ciphertext)`
- `decryptSenderWithRvk(record_view_key, sender_ciphertext)`

Conclusion: record-specific disclosure is practical for a discovered record ciphertext. The PoC can generate a disclosure artifact containing the record ciphertext, record view key, decrypted fields selected for the receipt, and a warning that this reveals only that record.

## Transition-Level Selective Disclosure

The `EncryptionToolkit` documents:

- `generateTvk(view_key, tpk)`
- `decryptTransitionWithVk(transition, transition_vk)`

This indicates transition-level disclosure is possible in principle when the transition public key and transition payload are available. However, this PoC does not yet prove a production-grade transition-disclosure UX for USDCx payments. It will label transition-level disclosure as `not-yet-supported` unless a real transition view key artifact is generated and verified during adapter integration.

## Dynamic Aleo Wallet Integration

Dynamic currently documents Aleo support as embedded-only for the private Aleo methods. Verified package versions:

- `@dynamic-labs/aleo`: `4.88.1`
- `@dynamic-labs/sdk-react-core`: `4.88.1`

Documented wallet methods include:

- `signMessage`
- `listOwnedRecords`
- `proveTransaction`
- `canShieldToken`
- `isShieldSponsored`
- `shieldToken`
- `joinRecords`
- `isFeemasterSponsored`

Dynamic's docs say embedded-only operations route through an iframe using Aleo Feemaster and Provable DPS; Wallet Adapter Aleo wallets expose a separate `requestTransaction` / `requestRecords` API. Because this requires Dynamic configuration and likely a real Dynamic environment ID, the PoC keeps Dynamic optional and adapter-based.

## Custom Leo Checkout Wrapper Feasibility

Raw USDCx `transfer_private` does not include an order reference. Therefore a raw transfer is not deterministically linked to an off-chain order unless the server relies on amount/address/timing correlation, which is not strong enough for a technical claim.

A custom program can compose with USDCx by importing `test_usdcx_stablecoin.aleo` and calling:

```aleo
call test_usdcx_stablecoin.aleo/transfer_private ...;
```

This is verified by existing public testnet programs such as `kloak_protocol_v7.aleo` and `stealthap_payment.aleo`, which call `test_usdcx_stablecoin.aleo/transfer_private` and emit payment receipt records with references. The PoC includes a local Leo wrapper design but does not claim it is deployed unless a deployment transaction is actually run.

## Selected Implementation Path

Selected path for this spike:

1. Build a TypeScript monorepo with strict shared domain types.
2. Implement checkout/order/receipt logic with deterministic matching against a decrypted payment record.
3. Implement real adapter shells for:
   - Provable Explorer metadata checks;
   - RecordScanner registration/query flow;
   - RecordCiphertext decryption;
   - record-specific disclosure artifact generation;
   - Dynamic wallet shape.
4. Keep private payment submission and scanner/decryption runnable only when configured with real test accounts, scanner credentials, fee records/funds, and stablecoin records.
5. Provide isolated mock adapters for local demo and tests.
6. Include a Leo wrapper blueprint for deterministic order-reference receipts, but document it as not deployed.

## Fallback Path

If live USDCx transfer execution cannot be completed during the spike:

1. Use the mock adapter to demonstrate UI and domain behavior.
2. Use verified program interfaces and adapter contracts to show what the real calls require.
3. Mark the real private-payment walkthrough as blocked by missing funded test records, scanner/DPS credentials, or wallet setup.
4. Do not claim deterministic on-chain order linking until the Leo wrapper is deployed and executed.
