"use client";

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

export default function BillingPage() {
  const router = useRouter();
  const [user, setUserState] = useState<SessionUser | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [mensalidade, setMensalidade] = useState(0);
  const [valorIntegrada, setValorIntegrada] = useState(0);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Billing</h1>
        <p className="text-sm text-slate-500">
          Status da assinatura e configurações do plano.
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
    </div>
  );
}
