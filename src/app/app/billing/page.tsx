"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { getUser, setUser, type SessionUser } from "@/lib/session";

type SubscriptionInfo = {
  status?: string;
  trial_ends_at?: string;
  grace_days?: number;
};

type BillingSettings = {
  mensalidade: number;
  valor_integrada: number;
};

type Invoice = {
  id: string | number;
  status?: "OPEN" | "PAID" | "FAILED" | string;
  mensalidade?: number;
  variavel?: number;
  total?: number;
  paid_at?: string;
  checkout_url?: string;
  provider?: string;
};

const formatMonthValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return "-";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/session";

type BillingSummary = {
  total_mensalidade?: number;
  total_integradas?: number;
  total_valor_integradas?: number;
  total_geral?: number;
};

type BillingEvent = {
  id: string | number;
  tipo?: string;
  descricao?: string;
  valor?: number;
  criado_em?: string;
};

type BillingSettings = {
  mensalidade: number;
  valor_integrada: number;
};

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUserState] = useState<SessionUser | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [month, setMonth] = useState(() => formatMonthValue(new Date()));
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [mensalidade, setMensalidade] = useState(0);
  const [valorIntegrada, setValorIntegrada] = useState(0);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  const invoiceQuery = useMemo(() => `?month=${month}`, [month]);
  const paymentStatus = searchParams.get("payment");
  const paymentInvoiceId = searchParams.get("invoice");

  const invoiceQuery = useMemo(() => `?month=${month}`, [month]);

  useEffect(() => {
    const stored = getUser();
    if (stored) {
      setUserState(stored);
      setSubscription(stored.subscription ?? null);
      if (stored.role !== "GESTAO") {
        router.replace("/app");
      }
    }

    apiFetch<SessionUser>("/api/v1/me")
      .then((data) => {
        setUser(data);
        setUserState(data);
        setSubscription(data.subscription ?? null);
        if (data.role !== "GESTAO") {
          router.replace("/app");
        }
      })
      .catch(() => null);
  }, [router]);

  const loadInvoice = async () => {
    setLoadingInvoice(true);
    setError(null);

    try {
      const data = await apiFetch<Invoice[]>(
        `/api/v1/billing/invoices${invoiceQuery}`,
      );
      setInvoice(data?.[0] ?? null);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
const formatMonthValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return "-";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export default function BillingPage() {
  const router = useRouter();
  const [month, setMonth] = useState(() => formatMonthValue(new Date()));
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [events, setEvents] = useState<BillingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [mensalidade, setMensalidade] = useState(0);
  const [valorIntegrada, setValorIntegrada] = useState(0);

  const query = useMemo(() => `?month=${month}`, [month]);

  const loadBilling = async () => {
    setLoading(true);
    setError(null);

    try {
      const [summaryData, eventsData] = await Promise.all([
        apiFetch<BillingSummary>(`/api/v1/billing/summary${query}`),
        apiFetch<BillingEvent[]>(`/api/v1/billing/events${query}`),
      ]);
      setSummary(summaryData);
      setEvents(eventsData);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível carregar a fatura.");
      }
    } finally {
      setLoadingInvoice(false);
        setError("Não foi possível carregar o billing.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [invoiceQuery]);

  useEffect(() => {
    if (!paymentStatus) {
      setPaymentNotice(null);
      return;
    }

    if (paymentStatus === "success") {
      setPaymentNotice("Pagamento enviado. Aguardando confirmação.");
    } else if (paymentStatus === "failure") {
      setPaymentNotice("Pagamento não concluído.");
    } else if (paymentStatus === "pending") {
      setPaymentNotice("Pagamento pendente.");
    } else {
      setPaymentNotice(null);
    }
  }, [paymentStatus]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    const user = getUser();
    if (user?.role !== "GESTAO") {
      router.replace("/app");
    }
  }, [router]);

  useEffect(() => {
    loadBilling();
  }, [query]);

  const handleSaveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload: BillingSettings = {
      mensalidade,
      valor_integrada: valorIntegrada,
    };

    try {
      await apiFetch("/api/v1/billing/settings", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setSuccess("Configurações atualizadas.");
      await loadBilling();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível atualizar as configurações.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = async () => {
    if (!invoice) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await apiFetch<{ checkout_url?: string }>(
        `/api/v1/billing/invoices/${invoice.id}/checkout`,
        { method: "POST" },
      );
      setInvoice((prev) =>
        prev
          ? {
              ...prev,
              checkout_url: data.checkout_url,
              provider: "mercadopago",
            }
          : prev,
        prev ? { ...prev, checkout_url: data.checkout_url } : prev,
      );
      setSuccess("Link de pagamento gerado.");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível gerar o link de pagamento.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Billing</h1>
        <p className="text-sm text-slate-500">
          Status da assinatura e configurações do plano.
          Acompanhe o faturamento e ajuste os valores.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Assinatura</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs uppercase text-slate-400">Status</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {subscription?.status ?? "-"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs uppercase text-slate-400">Trial termina em</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {subscription?.trial_ends_at
                ? new Date(subscription.trial_ends_at).toLocaleDateString("pt-BR")
                : "-"}
            </p>
          </div>
        </div>
      </section>

      {paymentNotice ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {paymentNotice}
            </p>
            <button
              type="button"
              onClick={loadInvoice}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Atualizar
            </button>
          </div>
          {paymentInvoiceId ? (
            <p className="mt-2 text-xs text-slate-400">
              Invoice: {paymentInvoiceId}
            </p>
          ) : null}
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="month">
              Mês da fatura
            </label>
            <input
              id="month"
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={loadInvoice}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Buscar
          </button>
        </div>

        {loadingInvoice ? (
          <p className="mt-4 text-sm text-slate-500">Carregando fatura...</p>
        ) : invoice ? (
          <div className="mt-4 space-y-4 rounded-lg border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {invoice.status ?? "OPEN"}
              </span>
              {invoice.provider ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {invoice.provider}
                </span>
              ) : null}
              {invoice.paid_at ? (
                <span className="text-xs text-slate-500">
                  Pago em{" "}
                  {new Date(invoice.paid_at).toLocaleString("pt-BR")}
                </span>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-3 text-sm text-slate-600">
              <div>
                <p className="text-xs text-slate-400">Mensalidade</p>
                <p className="font-semibold text-slate-900">
                  {formatCurrency(invoice.mensalidade)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Variável</p>
                <p className="font-semibold text-slate-900">
                  {formatCurrency(invoice.variavel)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Total</p>
                <p className="font-semibold text-slate-900">
                  {formatCurrency(invoice.total)}
                </p>
              </div>
            </div>

            {invoice.status === "OPEN" ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={saving}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                >
                  Gerar link de pagamento
                </button>
                {invoice.checkout_url ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    <p className="break-all">{invoice.checkout_url}</p>
                    <a
                      href={invoice.checkout_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-xs font-semibold text-slate-700 underline"
                    >
                      Abrir pagamento
                    </a>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            Nenhuma fatura encontrada para o mês selecionado.
          </p>
        )}
      </section>

      {user?.role !== "GESTAO" ? (
        <p className="text-sm text-slate-500">
          Apenas a gestão pode editar valores de cobrança.
        </p>
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-700">Configurações</h2>
          {error ? (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  className="text-xs font-medium text-slate-500"
                  htmlFor="mensalidade"
                >
                  Mensalidade
                </label>
                <input
                  id="mensalidade"
                  type="number"
                  value={mensalidade}
                  onChange={(event) => setMensalidade(Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="space-y-1">
                <label
                  className="text-xs font-medium text-slate-500"
                  htmlFor="valor-integrada"
                >
                  Valor por integrada
                </label>
                <input
                  id="valor-integrada"
                  type="number"
                  value={valorIntegrada}
                  onChange={(event) =>
                    setValorIntegrada(Number(event.target.value))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
            >
              {saving ? "Salvando..." : "Salvar configurações"}
            </button>
          </form>
        </section>
      )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="month">
              Mês
            </label>
            <input
              id="month"
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={loadBilling}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Atualizar
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Carregando billing...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Mensalidade
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {formatCurrency(summary?.total_mensalidade)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Integradas
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {summary?.total_integradas ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Valor integradas
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {formatCurrency(summary?.total_valor_integradas)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Total geral
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {formatCurrency(summary?.total_geral)}
            </p>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Eventos</h2>
        {loading ? (
          <p className="mt-2 text-sm text-slate-500">Carregando eventos...</p>
        ) : events.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nenhum evento no período.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {event.tipo ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {event.descricao ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {formatCurrency(event.valor)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {event.criado_em
                        ? new Date(event.criado_em).toLocaleString("pt-BR")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Configurações</h2>
        <form className="mt-3 space-y-3" onSubmit={handleSaveSettings}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                className="text-xs font-medium text-slate-500"
                htmlFor="mensalidade"
              >
                Mensalidade
              </label>
              <input
                id="mensalidade"
                type="number"
                value={mensalidade}
                onChange={(event) => setMensalidade(Number(event.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div className="space-y-1">
              <label
                className="text-xs font-medium text-slate-500"
                htmlFor="valor-integrada"
              >
                Valor por integrada
              </label>
              <input
                id="valor-integrada"
                type="number"
                value={valorIntegrada}
                onChange={(event) => setValorIntegrada(Number(event.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </form>
      </section>
    </div>
  );
}
