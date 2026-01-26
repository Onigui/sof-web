"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getUser } from "@/lib/session";

export default function AppHomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (user?.role === "LOJA") {
      router.replace("/app/leads");
    }
  }, [router]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
      Selecione uma opção no menu para continuar.
    </div>
  );
}
