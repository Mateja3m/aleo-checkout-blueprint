# Blockers

Last updated: 2026-06-09

Current Credits PoC verdict: `READY`

The minimal Credits-based testnet PoC has been live-executed by the repository owner with local-only secrets. Codex did not request or receive private keys, view keys, seeds, or `.env.local` values in chat.

## B1. Owner Testnet Account Setup

The owner must create dedicated testnet-only customer and merchant accounts and store the values locally in `.env.local`.

Status: completed by the owner for the verified run. Dedicated testnet-only accounts remain required for repeat runs.

## B2. Faucet-Funded Public Credits

The official Aleo Quick Start points to `https://faucet.aleo.org/` and states faucet Credits are public Credits. The customer account must have enough public Credits to create a private record, pay the public fee, and run the private transfer.

Status: completed for the verified run. Repeat runs require enough customer public Credits for conversion, transfer, and fees.

## B3. Live Local Proving

The installed SDK exposes `ProgramManager.transfer(...)` and `buildTransferTransaction(...)` for Credits transfer types. The implementation uses `buildTransferTransaction(...)` and `submitTransaction(...)` so the CLI can show proof/submission progress.

Status: completed for `credits.aleo/transfer_public_to_private` and `credits.aleo/transfer_private` in the owner testnet run.

## B4. Direct Local Scanner Runtime

The implementation uses SDK transaction and record APIs to locate the accepted transaction block, scan nearby records, and decrypt merchant-owned records locally.

Status: completed. The accepted private payment transaction was located at block `17092360`, and merchant-owned record `credits_record_4a17d1800531a35ba0710434` was discovered.

## B5. Order Correlation Is PoC-Only

Raw `credits.aleo/transfer_private` records contain owner and amount. They do not contain a deterministic checkout order reference.

Status: not a blocker for one verified receipt. It still blocks production checkout claims and deterministic on-chain order-reference claims.

## B6. USDCx Remains Outside The Critical Path

The earlier USDCx spike remains blocked by unavailable self-service test USDCx records and freeze-list proof handling. This no longer blocks the Credits PoC.

Status: optional extension only.

## B7. RSS, Dynamic, DPS, And Feemaster Are Not Required

The Credits PoC does not require Provable RSS credentials, Dynamic setup, DPS access, or Feemaster sponsorship.

Status: not blockers for the minimal Credits receipt.
