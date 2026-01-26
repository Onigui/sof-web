"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/session";

type Lead = {
  id: string | number;
  nome?: string;
  status?: string;
  loja?: string;
  loja_id?: string | number;
  created_at?: string;
  proposta_id?: string | number;
};

type ConverterResponse = {
  proposta_id?: string | number;
  message?: string;
};

const statusOptions = ["", "NOVO", "EM_ANALISE", "CONVERTIDO", "INATIVO"];

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("pt-BR");
};

export default function BackofficeLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [lojaFilter, setLojaFilter] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<
    Record<string | number, boolean>
  >({});

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (lojaFilter) params.set("loja", lojaFilter);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [statusFilter, lojaFilter]);

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Lead[]>(`/api/v1/leads${queryString}`);
      setLeads(data ?? []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível carregar leads.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getUser();
    if (user?.role !== "GESTAO" && user?.role !== "ANALISTA") {
      router.replace("/app");
      return;
    }
    loadLeads();
  }, [router, queryString]);

  const handleConvert = async (lead: Lead) => {
    setActionError(null);
    setActionMessage(null);
    setActionLoading((prev) => ({ ...prev, [lead.id]: true }));
    try {
      const data = await apiFetch<ConverterResponse>(
        `/api/v1/leads/${lead.id}/converter`,
        { method: "POST" },
      );
      if (data?.proposta_id) {
        setActionMessage(
          `Lead convertido. Proposta #${data.proposta_id} criada.`,
        );
      } else {
        setActionMessage(data?.message ?? "Lead convertido.");
      }
      await loadLeads();
    } catch (err) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError("Não foi possível converter o lead.");
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [lead.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">
          Backoffice de leads
        </h1>
        <p className="text-sm text-slate-500">
          Acompanhe leads da loja e converta quando necessário.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              className="text-xs font-medium text-slate-500"
              htmlFor="status"
            >
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option || "Todos"}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label
              className="text-xs font-medium text-slate-500"
              htmlFor="loja"
            >
              Loja
            </label>
            <input
              id="loja"
              value={lojaFilter}
              onChange={(event) => setLojaFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Nome ou ID da loja"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={loadLeads}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Aplicar filtros
          </button>
        </div>
        {actionError ? (
          <p className="mt-3 text-sm text-rose-600">{actionError}</p>
        ) : null}
        {actionMessage ? (
          <p className="mt-3 text-sm text-emerald-600">{actionMessage}</p>
        ) : null}
      </section>

      {loading ? (
        <p className="text-sm text-slate-500">Carregando leads...</p>
      ) : error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : leads.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum lead encontrado.</p>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const canConvert =
              lead.status === "NOVO" || lead.status === "EM_ANALISE";
            const isLoading = actionLoading[lead.id] ?? false;
            return (
              <div
                key={lead.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1 text-sm text-slate-600">
                    <p className="text-sm font-semibold text-slate-900">
                      {lead.nome ?? "Lead"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Status: {lead.status ?? "—"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Loja: {lead.loja ?? lead.loja_id ?? "—"}
                    </p>
                    <p className="text-xs text-slate-400">
                      Criado em {formatDateTime(lead.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    {lead.proposta_id ? (
                      <Link
                        href={`/app/propostas/${lead.proposta_id}`}
                        className="text-xs font-semibold text-slate-700 underline"
                      >
                        Proposta #{lead.proposta_id}
                      </Link>
                    ) : null}
                    {canConvert ? (
                      <button
                        type="button"
                        onClick={() => handleConvert(lead)}
                        disabled={isLoading}
                        className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-70"
                      >
                        {isLoading ? "Convertendo..." : "Converter"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
