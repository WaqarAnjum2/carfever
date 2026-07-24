"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegistrationsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/users?tab=requests");
  }, [router]);

  return (
    <div className="py-16 text-center text-slate-400">
      <p className="text-xs font-semibold">Redirecting to User & Dealer Hub...</p>
    </div>
  );
}
