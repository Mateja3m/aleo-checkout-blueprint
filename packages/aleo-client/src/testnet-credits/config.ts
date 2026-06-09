export type AleoAdapterMode = "mock" | "testnet-credits-local";

export interface CreditsTestnetConfig {
  adapterMode: AleoAdapterMode;
  network: "testnet";
  customerPrivateKey: string;
  customerViewKey: string;
  customerAddress: string;
  merchantPrivateKey: string;
  merchantViewKey: string;
  merchantAddress: string;
  scanBlockWindow: number;
  paymentAmountMicrocredits: number;
}

export const TESTNET_API_HOST = "https://api.provable.com/v2";
export const CREDITS_PROGRAM_ID = "credits.aleo";
export const CREDITS_RECORD_NAME = "credits";
export const CREDITS_DECIMALS = 1_000_000;

const SECRET_KEYS = new Set([
  "ALEO_CUSTOMER_PRIVATE_KEY",
  "ALEO_CUSTOMER_VIEW_KEY",
  "ALEO_MERCHANT_PRIVATE_KEY",
  "ALEO_MERCHANT_VIEW_KEY"
]);

export function loadCreditsTestnetConfig(env: NodeJS.ProcessEnv = process.env): CreditsTestnetConfig {
  const adapterMode = readMode(env.ALEO_ADAPTER_MODE);
  const network = readNetwork(env.ALEO_NETWORK);
  const scanBlockWindow = readPositiveInteger(env.ALEO_SCAN_BLOCK_WINDOW ?? "30", "ALEO_SCAN_BLOCK_WINDOW");
  const paymentAmountMicrocredits = readPositiveInteger(
    env.ALEO_PAYMENT_AMOUNT_MICROCREDITS ?? "1000000",
    "ALEO_PAYMENT_AMOUNT_MICROCREDITS"
  );

  if (adapterMode !== "testnet-credits-local") {
    throw new Error("This command requires ALEO_ADAPTER_MODE=testnet-credits-local.");
  }

  return {
    adapterMode,
    network,
    customerPrivateKey: readRequired(env, "ALEO_CUSTOMER_PRIVATE_KEY"),
    customerViewKey: readRequired(env, "ALEO_CUSTOMER_VIEW_KEY"),
    customerAddress: readRequired(env, "ALEO_CUSTOMER_ADDRESS"),
    merchantPrivateKey: readRequired(env, "ALEO_MERCHANT_PRIVATE_KEY"),
    merchantViewKey: readRequired(env, "ALEO_MERCHANT_VIEW_KEY"),
    merchantAddress: readRequired(env, "ALEO_MERCHANT_ADDRESS"),
    scanBlockWindow,
    paymentAmountMicrocredits
  };
}

export function validateMockMode(env: NodeJS.ProcessEnv = process.env): AleoAdapterMode {
  const mode = readMode(env.ALEO_ADAPTER_MODE ?? "mock");
  if (mode !== "mock") {
    throw new Error("Mock adapters may only be used with ALEO_ADAPTER_MODE=mock.");
  }
  return mode;
}

export function redactEnvPresence(config: CreditsTestnetConfig): Record<string, string | number> {
  return {
    ALEO_ADAPTER_MODE: config.adapterMode,
    ALEO_NETWORK: config.network,
    ALEO_CUSTOMER_PRIVATE_KEY: "present",
    ALEO_CUSTOMER_VIEW_KEY: "present",
    ALEO_CUSTOMER_ADDRESS: redactAddress(config.customerAddress),
    ALEO_MERCHANT_PRIVATE_KEY: "present",
    ALEO_MERCHANT_VIEW_KEY: "present",
    ALEO_MERCHANT_ADDRESS: redactAddress(config.merchantAddress),
    ALEO_SCAN_BLOCK_WINDOW: config.scanBlockWindow,
    ALEO_PAYMENT_AMOUNT_MICROCREDITS: config.paymentAmountMicrocredits
  };
}

export function redactAddress(address: string): string {
  if (address.length <= 16) return "redacted";
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

export function redactTransactionId(transactionId: string): string {
  if (transactionId.length <= 18) return "redacted";
  return `${transactionId.slice(0, 10)}...${transactionId.slice(-8)}`;
}

export function isSecretEnvKey(key: string): boolean {
  return SECRET_KEYS.has(key);
}

function readRequired(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable ${key}. Add it locally to .env.local.`);
  }
  return value;
}

function readMode(value: string | undefined): AleoAdapterMode {
  if (value === "mock" || value === "testnet-credits-local") return value;
  throw new Error("ALEO_ADAPTER_MODE must be either mock or testnet-credits-local.");
}

function readNetwork(value: string | undefined): "testnet" {
  if (value === "testnet") return "testnet";
  throw new Error("ALEO_NETWORK must be testnet.");
}

function readPositiveInteger(value: string, key: string): number {
  if (!/^[1-9][0-9]*$/u.test(value)) {
    throw new Error(`${key} must be a positive integer.`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`${key} must be a safe integer.`);
  }
  return parsed;
}
