/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@aleo-checkout/aleo-client",
    "@aleo-checkout/checkout-core",
    "@aleo-checkout/shared-types"
  ]
};

export default nextConfig;
