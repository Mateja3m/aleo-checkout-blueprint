# Private Checkout Leo Blueprint

This directory contains a wrapper blueprint, not a deployed production program.

The purpose is to show the intended deterministic order-correlation path:

1. Accept a private `test_usdcx_stablecoin.aleo/Token.record`.
2. Call the verified USDCx-compatible private transfer transition.
3. Emit a merchant-owned private checkout receipt record that carries `order_reference_hash`.

The current PoC does not claim this wrapper is deployed or executed. It should be compiled, audited, deployed to testnet, and exercised with real test records before proposal claims are expanded.
