"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PayButton({ orderId, disabled }: { orderId: string; disabled: boolean }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitPayment() {
    setIsSubmitting(true);
    await fetch(`/api/orders/${orderId}/submit`, { method: "POST" });
    router.push(`/progress/${orderId}`);
    router.refresh();
  }

  return (
    <button className="primary" type="button" onClick={submitPayment} disabled={disabled || isSubmitting}>
      {isSubmitting ? <Loader2 size={17} aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
      {isSubmitting ? "Submitting" : "Initiate payment"}
    </button>
  );
}
