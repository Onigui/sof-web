"use client";

import { useEffect, useState } from "react";

import { apiFetch, SubscriptionRequiredError } from "@/lib/api";
import { getUser, type SessionUser } from "@/lib/session";

type IntegracaoPayload = {
  proposta_id: string;
  data_averbacao: string;
  contrato: string;
  repasse?: string;
  tabela?: string;
  veiculo?: string;
  alienado?: boolean;
  regiao_override?: string;
};

export default function IntegracaoPage() {
  const [propostaId, setPropostaId] = useState("");
  const [dataAverbacao, setDataAverbacao] = useState("");
  const [contrato, setContrato] = useState("");
  const [repasse, setRepasse] = useState("");
  const [tabela, setTabela] = useState("");
  const [veiculo, setVeiculo] = useState("");
  const [alienado, setAlienado] = useState(false);
  const [regiaoOverride, setRegiaoOverride] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    const user = getUser() as SessionUser | null;
    if (user?.role === "OPERADOR") {
      setError("Acesso restrito para integração.");
    }
    if (user?.subscription?.status === "SUSPENSA") {
      setIsSuspended(true);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: IntegracaoPayload = {
      proposta_id: propostaId,
      data_averbacao: dataAverbacao,
      contrato,
      repasse: repasse || undefined,
      tabela: tabela || undefined,
      veiculo: veiculo || undefined,
      alienado: alienado || undefined,
      regiao_override: regiaoOverride || undefined,
    };

    try {
      await apiFetch(`/api/v1/propostas/${propostaId}/integrar`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      if (err instanceof SubscriptionRequiredError) {
        setShowModal(true);
        return;
      }
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível integrar a proposta.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Integração</h1>
        <p className="text-sm text-slate-500">
          Envie propostas para integração.
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      {isSuspended ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Sua assinatura está suspensa. Procure a gestão para regularizar o
          pagamento.
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500" htmlFor="id">
            ID da proposta
          </label>
          <input
            id="id"
            value={propostaId}
            onChange={(event) => setPropostaId(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              className="text-xs font-medium text-slate-500"
              htmlFor="data"
            >
              Data de averbação
            </label>
            <input
              id="data"
              type="date"
              value={dataAverbacao}
              onChange={(event) => setDataAverbacao(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-1">
            <label
              className="text-xs font-medium text-slate-500"
              htmlFor="contrato"
            >
              Contrato
            </label>
            <input
              id="contrato"
              value={contrato}
              onChange={(event) => setContrato(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="repasse">
              Repasse
            </label>
            <input
              id="repasse"
              value={repasse}
              onChange={(event) => setRepasse(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="tabela">
              Tabela
            </label>
            <input
              id="tabela"
              value={tabela}
              onChange={(event) => setTabela(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="veiculo">
              Veículo
            </label>
            <input
              id="veiculo"
              value={veiculo}
              onChange={(event) => setVeiculo(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label
              className="text-xs font-medium text-slate-500"
              htmlFor="regiao-override"
            >
              Região override
            </label>
            <input
              id="regiao-override"
              value={regiaoOverride}
              onChange={(event) => setRegiaoOverride(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={alienado}
            onChange={(event) => setAlienado(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Veículo alienado
        </label>
        {isSuspended ? null : (
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {saving ? "Integrando..." : "Integrar proposta"}
          </button>
        )}
      </form>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">
              Assinatura necessária para integrar propostas
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Procure a gestão para ativar o plano.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <a
                href="/app/billing"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Ir para Faturamento
              </a>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
