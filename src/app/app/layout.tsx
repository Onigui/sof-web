"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import {
  clearSession,
  getToken,
  getUser,
  setUser,
  type SessionUser,
} from "@/lib/session";

type InvoiceSummary = {
  id: string | number;
  status?: string;
  due_date?: string;
};

const getTrialDaysLeft = (trialEndsAt?: string) => {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const diffMs = end.getTime() - todayStart.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceBanner, setInvoiceBanner] = useState<InvoiceSummary | null>(null);
  const navItems = useMemo(() => {
    if (!user?.role) return [];
    if (user.role === "GESTAO") {
      return [
        { href: "/app/billing", label: "Billing" },
        { href: "/app/auditoria", label: "Auditoria" },
        { href: "/app/admin", label: "Admin" },
        { href: "/app/backoffice/leads", label: "Backoffice" },
      ];
    }
    if (user.role === "ANALISTA") {
      return [
        { href: "/app/auditoria", label: "Auditoria" },
        { href: "/app/backoffice/leads", label: "Backoffice" },
      ];
    }
    if (user.role === "LOJA") {
      return [{ href: "/app/leads", label: "Leads" }];
    }
    return [];
  }, [user]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const storedUser = getUser();
    if (storedUser) {
      setUserState(storedUser);
    }

    apiFetch<SessionUser>("/api/v1/me")
      .then((data) => {
        setUser(data);
        setUserState(data);
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user || user.role !== "GESTAO") {
      setInvoiceBanner(null);
      return;
    }

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const storageKey = `sof.billing.invoice.${monthKey}`;

    if (typeof window !== "undefined") {
      const cached = window.sessionStorage.getItem(storageKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as InvoiceSummary;
          setInvoiceBanner(parsed);
          return;
        } catch {
          window.sessionStorage.removeItem(storageKey);
        }
      }
    }

    apiFetch<InvoiceSummary[]>(`/api/v1/billing/invoices?month=${monthKey}`)
      .then((data) => {
        const invoice = data?.[0] ?? null;
        if (invoice) {
          setInvoiceBanner(invoice);
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(storageKey, JSON.stringify(invoice));
          }
        }
      })
      .catch(() => null);
  }, [user]);

  const banner = useMemo(() => {
    const subscription = user?.subscription;
    if (!subscription) return null;
    const allowedRoles = ["ANALISTA", "GESTAO", "OPERADOR"];
    if (user?.role && !allowedRoles.includes(user.role)) {
      return null;
    }

    const daysLeft = getTrialDaysLeft(subscription.trial_ends_at);
    const isTrial = subscription.status === "TRIAL";
    const isSuspended = subscription.status === "SUSPENSA";
    const isTrialExpired = isTrial && daysLeft !== null && daysLeft < 0;

    if (isSuspended || isTrialExpired) {
      return {
        tone: "danger",
        message:
          "Sua assinatura está suspensa ou o trial expirou. Procure a gestão para ativar o plano.",
        cta: "/app/billing",
        ctaLabel: "Ver faturamento",
      };
    }

    if (isTrial && daysLeft !== null && daysLeft <= 3) {
      return {
        tone: "warning",
        message: `Seu trial termina em ${daysLeft} dia(s).`,
      };
    }

    return null;
  }, [user]);

  const billingBanner = useMemo(() => {
    if (!invoiceBanner || user?.role !== "GESTAO") return null;
    if (invoiceBanner.status !== "OPEN") return null;
    if (!invoiceBanner.due_date) return null;

    const due = new Date(invoiceBanner.due_date);
    if (Number.isNaN(due.getTime())) return null;

    return {
      message: `Fatura do mês aberta - vence em ${due.toLocaleDateString("pt-BR")}`,
      cta: "/app/billing",
    };
  }, [invoiceBanner, user]);

  return (
    <div className="min-h-screen bg-slate-50">
      {banner ? (
        <div
          className={`px-4 py-3 text-sm font-semibold ${
            banner.tone === "danger"
              ? "bg-rose-100 text-rose-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>{banner.message}</span>
            {banner.cta ? (
              <Link
                href={banner.cta}
                className="rounded-lg border border-current px-3 py-1 text-xs font-semibold"
              >
                {banner.ctaLabel ?? "Ir para faturamento"}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {billingBanner ? (
        <div className="bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>{billingBanner.message}</span>
            <Link
              href={billingBanner.cta}
              className="rounded-lg border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700"
            >
              Pagar agora
            </Link>
          </div>
        </div>
      ) : null}

      {navItems.length > 0 ? (
        <nav className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap gap-2 px-4 py-3 text-sm font-semibold text-slate-600">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full bg-slate-100 px-3 py-1 hover:bg-slate-200"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}

      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        {loading ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
