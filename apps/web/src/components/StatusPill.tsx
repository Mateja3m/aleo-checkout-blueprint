import { CheckCircle2, Clock3, XCircle } from "lucide-react";

export function StatusPill({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const Icon = normalized.includes("paid") || normalized.includes("confirmed") || normalized.includes("found")
    ? CheckCircle2
    : normalized.includes("failed") || normalized.includes("unavailable")
      ? XCircle
      : Clock3;

  return (
    <span className={`status ${normalized.replaceAll("_", "-")}`}>
      <Icon size={14} aria-hidden="true" />
      {value.replaceAll("_", " ")}
    </span>
  );
}
