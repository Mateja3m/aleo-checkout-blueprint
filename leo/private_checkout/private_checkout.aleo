import test_usdcx_stablecoin.aleo;

program private_checkout.aleo;

record CheckoutReceipt:
    owner as address.private;
    order_reference_hash as field.private;
    amount as u128.private;
    merchant as address.private;

function pay_order_usdcx:
    input r0 as test_usdcx_stablecoin.aleo/Token.record;
    input r1 as address.private;
    input r2 as u128.private;
    input r3 as field.private;
    input r4 as [test_usdcx_stablecoin.aleo/MerkleProof; 2u32].private;
    call test_usdcx_stablecoin.aleo/transfer_private r1 r2 r0 r4 into r5 r6 r7 r8;
    cast r1 r3 r2 r1 into r9 as CheckoutReceipt.record;
    async pay_order_usdcx r8 r3 into r10;
    output r5 as test_usdcx_stablecoin.aleo/ComplianceRecord.record;
    output r6 as test_usdcx_stablecoin.aleo/Token.record;
    output r7 as test_usdcx_stablecoin.aleo/Token.record;
    output r9 as CheckoutReceipt.record;
    output r10 as private_checkout.aleo/pay_order_usdcx.future;

finalize pay_order_usdcx:
    input r0 as test_usdcx_stablecoin.aleo/transfer_private.future;
    input r1 as field.public;
    await r0;
