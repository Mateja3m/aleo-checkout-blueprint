# Owner Setup Guide

Last updated: 2026-06-09

This guide is for running one real Aleo testnet Credits private-payment checkout PoC. It is written for a developer who is unfamiliar with Aleo operational setup.

Do not use production funds. Do not use mainnet. Do not paste private keys, view keys, seeds, or raw records into chat.

## Section 1: Prepare Local Environment

1. Open a terminal.

2. Go to the repository:

```bash
cd /Users/milanmatejic/Desktop/personal/Projects/aleo-checkout-blueprint
```

3. Use Node.js 20 or newer. The installed project dependency path was verified with Node 20, and the Provable SDK requires Node 20+.

4. Install packages:

```bash
npm install
```

5. Create the local environment file:

```bash
cp .env.example .env.local
```

6. Validate the codebase:

```bash
npm test
npm run typecheck
npm --workspace @aleo-checkout/web run typecheck
npm run build
```

7. Validate testnet PoC configuration after filling `.env.local`:

```bash
npm run poc:validate-env
```

8. Run the local UI only when you intentionally want a browser demo server:

```bash
npm run dev
```

9. Run the real Credits PoC after account setup and faucet funding:

```bash
npm run poc:testnet-credits
```

## Environment Variables

Fill only `.env.local`. Do not paste these values into chat.

| Variable | Purpose | Where the owner obtains it | Required? | Safe in `.env.local`? | Must never appear in logs? | Can omit in minimal PoC? |
| --- | --- | --- | --- | --- | --- | --- |
| `ALEO_ADAPTER_MODE` | Selects mock or real Credits mode | `.env.example` | Yes | Yes | No | No |
| `ALEO_NETWORK` | Locks execution to `testnet` | `.env.example` | Yes | Yes | No | No |
| `ALEO_CUSTOMER_PRIVATE_KEY` | Signs customer testnet transactions | Local SDK account generation | Yes | Yes, local only | Yes | No |
| `ALEO_CUSTOMER_VIEW_KEY` | Customer account view key for owned-record lookup | Local SDK account generation | Yes | Yes, local only | Yes | No |
| `ALEO_CUSTOMER_ADDRESS` | Faucet destination and sender identity | Local SDK account generation | Yes | Yes | No, but redact in screenshots | No |
| `ALEO_MERCHANT_PRIVATE_KEY` | Merchant key path for ownership/decryption in local PoC | Local SDK account generation | Yes | Yes, local only | Yes | No |
| `ALEO_MERCHANT_VIEW_KEY` | Merchant account view key; retained for future scanner paths | Local SDK account generation | Yes | Yes, local only | Yes | No |
| `ALEO_MERCHANT_ADDRESS` | Private transfer recipient | Local SDK account generation | Yes | Yes | No, but redact in screenshots | No |
| `ALEO_SCAN_BLOCK_WINDOW` | Maximum recent block range to scan | `.env.example`, owner may tune | Optional | Yes | No | Yes, defaults to `30` |
| `ALEO_PAYMENT_AMOUNT_MICROCREDITS` | Test order amount | `.env.example`, owner may tune | Optional | Yes | No | Yes, defaults to `1000000` |

## Section 2: Create Customer Test Account

Warning:

```text
Never use a wallet that contains real funds.
Create a dedicated Aleo testnet-only account.
```

1. Use the installed official Provable SDK locally.

2. Run this command on your machine only:

```bash
node -e "import('@provablehq/sdk/testnet.js').then(({Account})=>{const a=new Account(); console.log('privateKey='+a.privateKey().toString()); console.log('viewKey='+a.viewKey().toString()); console.log('address='+a.address().toString()); a.destroy();})"
```

3. The command returns:

- `privateKey`
- `viewKey`
- `address`

4. Open `.env.local` locally.

5. Fill:

```bash
ALEO_CUSTOMER_PRIVATE_KEY=
ALEO_CUSTOMER_VIEW_KEY=
ALEO_CUSTOMER_ADDRESS=
```

6. Paste the generated customer values into those fields locally.

7. Never paste the private key or view key into chat, GitHub issues, screenshots, logs, or commits.

8. Verify the address after `.env.local` is populated:

```bash
npm run poc:validate-env
```

9. Expected safe output:

```json
{
  "status": "ok",
  "adapterMode": "testnet-credits-local",
  "network": "testnet"
}
```

The output also shows redacted account/address status. It must not print the private key or view key.

## Section 3: Create Merchant Test Account

Warning:

```text
Customer and merchant must use separate dedicated testnet-only accounts.
```

1. Generate a second account. Do not reuse the customer account:

```bash
node -e "import('@provablehq/sdk/testnet.js').then(({Account})=>{const a=new Account(); console.log('privateKey='+a.privateKey().toString()); console.log('viewKey='+a.viewKey().toString()); console.log('address='+a.address().toString()); a.destroy();})"
```

2. Open `.env.local`.

3. Fill:

```bash
ALEO_MERCHANT_PRIVATE_KEY=
ALEO_MERCHANT_VIEW_KEY=
ALEO_MERCHANT_ADDRESS=
```

4. Paste the generated merchant values into those fields locally.

5. Keep merchant and customer accounts separate.

6. Never paste either private key or view key into chat, screenshots, logs, issues, or commits.

7. Verify configuration:

```bash
npm run poc:validate-env
```

8. Expected safe output:

```text
status: ok
```

If validation fails, check that all account fields exist in `.env.local` and that `ALEO_ADAPTER_MODE=testnet-credits-local`.

## Section 4: Obtain Testnet Credits For Fees

1. Credits are required. The PoC pays public fees from the customer public Credits balance.

2. Official faucet:

```text
https://faucet.aleo.org/
```

Official Aleo Quick Start path:

```text
https://developer.aleo.org/guides/introduction/quick_start/
```

3. Browser steps:

- Open `https://faucet.aleo.org/`.
- If prompted, connect or complete the browser verification required by the faucet.
- Enter the customer address from `ALEO_CUSTOMER_ADDRESS`.
- Request testnet Credits.

4. The faucet funds public Credits. Official Aleo docs state faucet Credits are public.

5. The customer account needs public Credits for:

- creating the private `credits.record`;
- paying the public fee for `transfer_public_to_private`;
- paying the public fee for `transfer_private`.

6. The merchant account does not need Credits for the minimal receive-and-decrypt PoC.

7. Official docs say Credits may take a few minutes to arrive.

8. Verify locally:

```bash
npm run poc:check-credits
```

9. Expected safe output:

```text
status: ok
customerPublicBalanceMicrocredits: greater than ALEO_PAYMENT_AMOUNT_MICROCREDITS
```

10. If faucet funding fails, retry once from the faucet page. If it still fails, ask Aleo support:

```text
Subject: Request for Aleo testnet Credits faucet assistance

Hello,

I am building an open-source Aleo Private Payments Checkout Blueprint PoC that demonstrates one private Aleo testnet Credits checkout flow.

I am currently blocked because the official faucet did not fund my dedicated testnet customer account.

I need public testnet Credits for one dedicated customer testnet address so I can create a private credits.aleo record and submit one credits.aleo/transfer_private transaction.

The request is only for a testnet-only technical PoC. No production funds will be used.

Repository:
[ADD PUBLIC GITHUB URL]

Could you please confirm the official self-service path or help with the required testnet Credits?

Thank you.
```

## Section 5: Create Or Identify A Private Credits Record

1. The critical path uses:

```text
credits.aleo
```

2. Faucet Credits are public, so a private payment needs a private `credits.record`.

3. The PoC can create the private record:

```bash
npm run poc:create-private-credits-record
```

4. Verified transition:

```text
credits.aleo/transfer_public_to_private
```

5. Verified inputs:

```text
address.private
u64.public
```

6. Expected safe output:

```text
status: submitted
transition: credits.aleo/transfer_public_to_private
transactionId: at1...
```

7. List customer private Credits records:

```bash
npm run poc:list-customer-credit-records
```

8. Expected safe output:

```text
programId: credits.aleo
recordName: credits
amountMicrocredits: at least ALEO_PAYMENT_AMOUNT_MICROCREDITS
```

9. The command output must not show private keys, view keys, or raw record plaintext.

10. Save redacted output and the creation transaction ID as proposal evidence.

## Section 6: Provable RSS

Provable RSS is not required for the minimal real-testnet Credits PoC.

The PoC uses a direct local scanner over a narrow recent block range. RSS remains a future production-oriented indexing extension.

No RSS `.env.local` fields are needed for the minimal PoC.

## Section 7: DPS Or Feemaster

1. DPS is not required for the minimal Credits PoC unless local proving fails during owner execution.

2. Feemaster sponsorship is not required. The PoC uses customer-paid public testnet Credits fees.

3. No DPS or Feemaster environment variables are needed.

4. Validate that the customer has public Credits:

```bash
npm run poc:check-credits
```

5. If local proving fails, save the redacted error and open a follow-up issue. Do not paste private keys or view keys.

## Section 8: Dynamic

Dynamic is not required for the minimal real-testnet PoC.
It remains an optional funded-scope integration.

No Dynamic `.env.local` fields are needed.

Do not add Dynamic until the Credits PoC receipt is verified.

## Section 9: Run One Real Testnet Checkout

Run commands in this order.

1. Validate configuration:

```bash
npm run poc:validate-env
```

Expected safe output:

```text
status: ok
adapterMode: testnet-credits-local
network: testnet
```

Failure means `.env.local` is missing or invalid.

2. Validate customer public Credits:

```bash
npm run poc:check-credits
```

Expected safe output:

```text
status: ok
customerPublicBalanceMicrocredits: greater than ALEO_PAYMENT_AMOUNT_MICROCREDITS
```

Failure means the customer address needs faucet Credits.

3. Create a private Credits record if needed:

```bash
npm run poc:create-private-credits-record
```

Expected safe output:

```text
transition: credits.aleo/transfer_public_to_private
transactionId: at1...
```

4. Validate customer private records:

```bash
npm run poc:list-customer-credit-records
```

Expected safe output:

```text
count: at least 1
programId: credits.aleo
recordName: credits
```

5. Submit the real private payment:

```bash
npm run poc:transfer-private-credits
```

Expected safe output:

```text
transition: credits.aleo/transfer_private
transactionId: at1...
```

6. Check transaction status:

```bash
npm run poc:transaction-status
```

Expected safe output:

```text
status: accepted
```

7. Scan for the merchant-owned record:

```bash
npm run poc:scan-merchant-local
```

Expected safe output:

```text
status: found
recordId: credits-record-...
```

Failure means the transaction was not accepted yet, the block window is too small, or no merchant-owned record was discovered.

8. Decrypt the merchant record:

```bash
npm run poc:decrypt-merchant-record
```

Expected safe output:

```text
status: decrypted
programId: credits.aleo
ownerMatchesMerchant: true
amountMinor: matches ALEO_PAYMENT_AMOUNT_MICROCREDITS
```

9. Confirm the order:

```bash
npm run poc:confirm-order
```

Expected safe output:

```text
status: verified
recordDiscovered: true
recordDecrypted: true
amountValidated: true
duplicateConfirmationRejected: true
```

10. Preferred one-command run:

```bash
npm run poc:testnet-credits
```

Expected artifact:

```text
artifacts/testnet-credits-poc-result.json
```

## Section 10: Capture Proposal Evidence

Save only redacted evidence:

1. Screenshot of `ALEO TESTNET - VERIFIED CREDITS MODE` badge.
2. Screenshot or redacted CLI output showing submitted transaction ID.
3. Screenshot or redacted CLI output showing scanned block range.
4. Screenshot of successful merchant record discovery.
5. Screenshot of successful decryption status.
6. Screenshot of `paid` order status or confirmation output.
7. Screenshot of generated receipt artifact.
8. Redacted CLI output from `npm run poc:testnet-credits`.
9. Redacted JSON artifact at `artifacts/testnet-credits-poc-result.json`.
10. Short demo video showing validate, credits check, real payment, scan, decrypt, confirm, and artifact.
11. README evidence section after the real run.

Never capture or expose `.env.local`, private keys, view keys, seeds, raw record plaintext, or ignored private artifacts.

## Manual Owner Checklist

```text
[ ] Create dedicated customer testnet account
[ ] Add customer account values to .env.local
[ ] Create dedicated merchant testnet account
[ ] Add merchant account values to .env.local
[ ] Obtain customer testnet credits
[ ] Create or identify private Credits record
[ ] Validate local environment
[ ] Run real testnet payment
[ ] Confirm actual transaction ID
[ ] Run merchant scan
[ ] Confirm encrypted record discovery
[ ] Run merchant decryption
[ ] Confirm order status changed to paid
[ ] Generate receipt
[ ] Save redacted evidence
[ ] Record short demo video
```
