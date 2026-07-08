"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/session";

type DetranQuery = {
  id: string | number;
  placa?: string;
  renavam?: string;
  proposta_id?: string | number;
  requested_at?: string;
  status?: string;
};

const statusTabs = ["PENDENTE", "MANUAL", "CONCLUIDA", "FALHOU"] as const;

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("pt-BR");
};

export default function DetranPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [queries, setQueries] = useState<DetranQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<(typeof statusTabs)[number]>(
    "PENDENTE",
  );
  const [showNewModal, setShowNewModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualResult, setManualResult] = useState("");
  const [manualJson, setManualJson] = useState("");
  const [selectedQuery, setSelectedQuery] = useState<DetranQuery | null>(null);
  const [creating, setCreating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [newPropostaId, setNewPropostaId] = useState("");
  const [newPlaca, setNewPlaca] = useState("");
  const [newRenavam, setNewRenavam] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const propostaFilter = searchParams.get("proposta_id") ?? "";

  const filteredQueries = useMemo(() => {
    return queries.filter((query) => {
      if (statusFilter && query.status !== statusFilter) return false;
      if (propostaFilter && String(query.proposta_id ?? "") !== propostaFilter) {
        return false;
      }
      return true;
    });
  }, [queries, statusFilter, propostaFilter]);

  const loadQueries = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<DetranQuery[]>("/api/v1/detran/queries");
      setQueries(data ?? []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível carregar consultas.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getUser();
    if (user?.role !== "ANALISTA" && user?.role !== "GESTAO") {
      router.replace("/app");
      return;
    }
    loadQueries();
  }, [router]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const token = getToken();
      const payload = {
        proposta_id: newPropostaId || undefined,
        placa: newPlaca || undefined,
        renavam: newRenavam || undefined,
      };

      const response = await fetch(`${baseUrl}/api/v1/detran/queries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 429) {
        setActionError("Limite diário atingido.");
        return;
      }

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Não foi possível criar a consulta.");
      }

      setActionMessage("Consulta criada.");
      setShowNewModal(false);
      setNewPropostaId("");
      setNewPlaca("");
      setNewRenavam("");
      await loadQueries();
    } catch (err) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError("Não foi possível criar a consulta.");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCompleteManual = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!selectedQuery) return;
    if (!manualResult.trim()) {
      setActionError("Informe o resultado manual.");
      return;
    }

    setCompleting(true);
    setActionError(null);
    setActionMessage(null);
    try {
      let parsedJson: unknown = undefined;
      if (manualJson.trim()) {
        try {
          parsedJson = JSON.parse(manualJson);
        } catch {
          setActionError("JSON inválido.");
          return;
        }
      }
      await apiFetch(`/api/v1/detran/queries/${selectedQuery.id}/complete-manual`, {
        method: "POST",
        body: JSON.stringify({
          result_text: manualResult,
          result_json: parsedJson,
        }),
      });
      setActionMessage("Consulta atualizada.");
      setShowManualModal(false);
      setManualResult("");
      setManualJson("");
      setSelectedQuery(null);
      await loadQueries();
    } catch (err) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError("Não foi possível completar manualmente.");
      }
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Detran</h1>
        <p className="text-sm text-slate-500">
          Consultas pendentes e históricas do Detran.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
            {statusTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`rounded-full border px-3 py-1 ${
                  statusFilter === tab
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Nova consulta
          </button>
        </div>
        {propostaFilter ? (
          <p className="mt-3 text-xs text-slate-500">
            Filtrando por proposta #{propostaFilter}
            <Link
              href="/app/detran"
              className="ml-2 text-xs font-semibold text-slate-700 underline"
            >
              Limpar filtro
            </Link>
          </p>
        ) : null}
        {actionError ? (
          <p className="mt-3 text-sm text-rose-600">{actionError}</p>
        ) : null}
        {actionMessage ? (
          <p className="mt-3 text-sm text-emerald-600">{actionMessage}</p>
        ) : null}
      </section>

      {loading ? (
        <p className="text-sm text-slate-500">Carregando consultas...</p>
      ) : error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : filteredQueries.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma consulta encontrada.</p>
      ) : (
        <div className="space-y-3">
          {filteredQueries.map((query) => (
            <div
              key={query.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1 text-sm text-slate-600">
                  <p className="text-xs uppercase text-slate-400">Placa</p>
                  <p className="font-semibold text-slate-900">
                    {query.placa ?? "-"}
                  </p>
                  <p className="text-xs uppercase text-slate-400">Renavam</p>
                  <p>{query.renavam ?? "-"}</p>
                  <p className="text-xs uppercase text-slate-400">Proposta</p>
                  <p>{query.proposta_id ?? "-"}</p>
                </div>
                <div className="space-y-2 text-xs text-slate-500 sm:text-right">
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {query.status ?? "-"}
                  </span>
                  <p>Solicitada em {formatDateTime(query.requested_at)}</p>
                  {query.status === "PENDENTE" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedQuery(query);
                        setShowManualModal(true);
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      Completar manualmente
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">
              Nova consulta Detran
            </h2>
            <form className="mt-4 space-y-3" onSubmit={handleCreate}>
              <div className="space-y-1">
                <label
                  htmlFor="proposta"
                  className="text-xs font-medium text-slate-500"
                >
                  Proposta (opcional)
                </label>
                <input
                  id="proposta"
                  value={newPropostaId}
                  onChange={(event) => setNewPropostaId(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="placa"
                  className="text-xs font-medium text-slate-500"
                >
                  Placa (opcional)
                </label>
                <input
                  id="placa"
                  value={newPlaca}
                  onChange={(event) => setNewPlaca(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="renavam"
                  className="text-xs font-medium text-slate-500"
                >
                  Renavam (opcional)
                </label>
                <input
                  id="renavam"
                  value={newRenavam}
                  onChange={(event) => setNewRenavam(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {creating ? "Salvando..." : "Criar consulta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showManualModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">
              Completar manualmente
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Consulta #{selectedQuery?.id}
            </p>
            <form className="mt-4 space-y-3" onSubmit={handleCompleteManual}>
              <div className="space-y-1">
                <label
                  htmlFor="result"
                  className="text-xs font-medium text-slate-500"
                >
                  Resultado (obrigatório)
                </label>
                <textarea
                  id="result"
                  value={manualResult}
                  onChange={(event) => setManualResult(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="json"
                  className="text-xs font-medium text-slate-500"
                >
                  JSON (opcional)
                </label>
                <textarea
                  id="json"
                  value={manualJson}
                  onChange={(event) => setManualJson(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  rows={4}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowManualModal(false);
                    setManualResult("");
                    setManualJson("");
                    setSelectedQuery(null);
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={completing}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {completing ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
