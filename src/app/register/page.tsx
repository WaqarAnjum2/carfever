"use client";

import { useSearchParams } from "next/navigation";
import { RegistrationForm } from "@/components/registration-form";
import { Suspense } from "react";

function RegisterContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const initialRole = roleParam === "seller" ? "seller" : "buyer";

  return <RegistrationForm initialRole={initialRole} />;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400">Loading Registration Desk…</div>}>
      <RegisterContent />
    </Suspense>
  );
}
