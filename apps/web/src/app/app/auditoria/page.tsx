"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/session";

type Actor = {
  nome?: string;
  role?: string;
};

type AuditEntry = {
  id: string | number;
  created_at?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string | number;
  actor?: Actor;
  metadata?: Record<string, unknown> | string | null;
};

const entityOptions = ["proposta", "documento", "usuario", "fatura", "outro"];

const formatSummary = (metadata: AuditEntry["metadata"]) => {
  if (!metadata) return "-";
  if (typeof metadata === "string") return metadata.slice(0, 80);
  const candidate =
    (metadata["message"] as string | undefined) ??
    (metadata["descricao"] as string | undefined) ??
    (metadata["status"] as string | undefined) ??
    JSON.stringify(metadata);
  return candidate.length > 80 ? `${candidate.slice(0, 77)}...` : candidate;
};

export default function AuditoriaPage() {
  const router = useRouter();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [actorId, setActorId] = useState("");
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (action) params.set("action", action);
    if (entityType) params.set("entity_type", entityType);
    if (actorId) params.set("actor_id", actorId);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [dateFrom, dateTo, action, entityType, actorId]);

  const loadAudit = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<AuditEntry[]>(`/api/v1/audit${query}`);
      setItems(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível carregar auditoria.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getUser();
    if (user?.role !== "GESTAO" && user?.role !== "ANALISTA") {
      router.replace("/app");
    }
  }, [router]);

  useEffect(() => {
    loadAudit();
  }, [query]);

  const handleExport = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    const url = `${baseUrl}/api/v1/audit/export?format=csv${query ? `&${query.slice(1)}` : ""}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Auditoria</h1>
        <p className="text-sm text-slate-500">
          Acompanhe ações e alterações registradas no sistema.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="from">
              De
            </label>
            <input
              id="from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="to">
              Até
            </label>
            <input
              id="to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="action">
              Ação
            </label>
            <input
              id="action"
              value={action}
              onChange={(event) => setAction(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label
              className="text-xs font-medium text-slate-500"
              htmlFor="entity"
            >
              Entidade
            </label>
            <select
              id="entity"
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {entityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label
              className="text-xs font-medium text-slate-500"
              htmlFor="actor"
            >
              Ator ID
            </label>
            <input
              id="actor"
              value={actorId}
              onChange={(event) => setActorId(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={loadAudit}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Exportar CSV
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Carregando auditoria...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum registro encontrado.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Data/Hora</th>
                <th className="px-4 py-3">Ação</th>
                <th className="px-4 py-3">Entidade</th>
                <th className="px-4 py-3">Ator</th>
                <th className="px-4 py-3">Resumo</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString("pt-BR")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {item.action ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {item.entity_type ?? "-"} #{item.entity_id ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {item.actor?.nome ?? "-"}
                    {item.actor?.role ? ` (${item.actor.role})` : ""}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {formatSummary(item.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
