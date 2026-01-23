"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
type NavItem = {
  label: string;
  href: string;
};

const roleLabels: Record<string, string> = {
  OPERADOR: "Operador",
  ANALISTA: "Analista",
  GESTAO: "Gestão",
};

const navByRole: Record<string, NavItem[]> = {
  OPERADOR: [
    { label: "Propostas", href: "/app/propostas" },
    { label: "DUT", href: "/app/dut" },
    { label: "Notificações", href: "/app/notificacoes" },
  ],
  ANALISTA: [
    { label: "Fila", href: "/app/fila" },
    { label: "Propostas", href: "/app/propostas" },
    { label: "Integração", href: "/app/integracao" },
    { label: "Relatórios", href: "/app/relatorios" },
    { label: "Notificações", href: "/app/notificacoes" },
  ],
  GESTAO: [
    { label: "Fila", href: "/app/fila" },
    { label: "Propostas", href: "/app/propostas" },
    { label: "Integração", href: "/app/integracao" },
    { label: "Billing", href: "/app/billing" },
    { label: "Relatórios", href: "/app/relatorios" },
    { label: "Config", href: "/app/config" },
    { label: "Notificações", href: "/app/notificacoes" },
  ],
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUserState] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const navItems = useMemo(() => {
    if (user?.role && navByRole[user.role]) {
      return navByRole[user.role];
    }
    return navByRole.OPERADOR;
  }, [user]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const storedUser = getUser();
    if (storedUser) {
      setUserState(storedUser);
      setLoading(false);
      return;
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
          {banner.message}
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        {loading ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : (
          children
        )}
      </main>
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST" });
    } catch {
      // best-effort logout
    } finally {
      clearSession();
      router.replace("/login");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">SOF</p>
            <p className="text-xs text-slate-500">Portal Operacional</p>
          </div>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
            {user ? (
              <div className="text-right text-xs text-slate-600">
                <p className="font-medium text-slate-800">{user.name}</p>
                <p>{roleLabels[user.role ?? ""] ?? user.role}</p>
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Sair
            </button>
          </div>
          {user?.role !== "OPERADOR" ? (
            <nav className="flex w-full flex-wrap gap-2 text-xs font-semibold text-slate-600 md:hidden">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1.5 transition ${
                    pathname === item.href
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-6">
        {user?.role !== "OPERADOR" ? (
          <aside className="hidden w-56 flex-shrink-0 rounded-2xl border border-slate-200 bg-white p-4 md:block">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Navegação
            </p>
            <nav className="flex flex-col gap-2 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 transition ${
                    pathname === item.href
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        ) : null}

        <main className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {children}
        </main>
      </div>

      {user?.role === "OPERADOR" ? (
        <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-4 py-2 md:hidden">
          <div className="flex items-center justify-around text-xs font-semibold text-slate-600">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1 transition ${
                  pathname === item.href
                    ? "bg-slate-900 text-white"
                    : "text-slate-600"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
