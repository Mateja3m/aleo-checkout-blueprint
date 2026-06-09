# External Access Requests

Last updated: 2026-06-09

Historical note: these requests apply to the optional USDCx/RSS/DPS extension path. They are not required for the minimal Credits-based testnet PoC.

Use these only if the official public path is unavailable or incomplete. Do not include private keys, view keys, wallet seeds, API keys, JWTs, or `.env.local` contents in any request.

## Aleo Support

Subject: Request for testnet USDCx access for Aleo Private Checkout Blueprint PoC

```text
Hello,

I am building an open-source Aleo Private Checkout Blueprint PoC that demonstrates one private testnet stablecoin checkout flow.

I am currently blocked at:
No verified public self-service path was found for obtaining a testnet `test_usdcx_stablecoin.aleo/Token` private record, or a public test USDCx balance that can be shielded into a private record.

I need:
Official instructions or access for obtaining testnet-only USDCx suitable for one private transfer using `test_usdcx_stablecoin.aleo` edition `2`, transition `transfer_private`, on Aleo testnet. If the correct path is public balance first, I need the official mint/faucet/on-ramp path and the supported `transfer_public_to_private` setup. If private records are issued directly, I need the official process for a dedicated test account.

The request is only for a testnet-only technical PoC. No production funds will be used.

Repository:
[ADD PUBLIC GITHUB URL]

Could you please confirm the official self-service path or provide the required testnet access?

Thank you.
```

## Provable Support

Subject: Request for Provable RSS/DPS testnet access for Aleo Private Checkout Blueprint PoC

```text
Hello,

I am building an open-source Aleo Private Checkout Blueprint PoC that demonstrates one private testnet stablecoin checkout flow.

I am currently blocked at:
The official Record Scanning Service and Delegated Proving Service docs require a Provable API key and consumer ID, but I could not verify a complete public self-service signup flow, dashboard path, or consumer-registration request schema for obtaining those credentials.

I need:
Testnet-only Provable access for:
1. Record Scanning Service registration and owned-record queries against `https://api.provable.com/scanner/testnet`.
2. A Provable API key and consumer ID for JWT refresh.
3. Delegated Proving Service access against `https://api.provable.com/prove/testnet`, if local proving is not the recommended path.
4. Official setup instructions for encrypted `registerEncrypted` RSS registration and encrypted DPS submission.

The request is only for a testnet-only technical PoC. No production funds will be used.

Repository:
[ADD PUBLIC GITHUB URL]

Could you please confirm the official self-service path or provide the required testnet access?

Thank you.
```
