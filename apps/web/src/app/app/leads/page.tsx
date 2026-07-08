"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/session";

type Lead = {
  id: string | number;
  nome?: string;
  status?: string;
  created_at?: string;
  telefone?: string;
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("pt-BR");
};

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Lead[]>("/api/v1/loja/leads");
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
    if (user?.role !== "LOJA") {
      router.replace("/app");
      return;
    }
    loadLeads();
  }, [router]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Leads</h1>
        <p className="text-sm text-slate-500">
          Acompanhe seus atendimentos em andamento.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/app/leads/novo"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Novo lead
        </Link>
        <button
          type="button"
          onClick={loadLeads}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Atualizar
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Carregando leads...</p>
      ) : error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : leads.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum lead encontrado.</p>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/app/leads/${lead.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-col gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {lead.nome ?? "Lead"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Status: {lead.status ?? "—"}
                  </p>
                </div>
                <div className="text-xs text-slate-400">
                  {lead.telefone ? <p>Telefone: {lead.telefone}</p> : null}
                  <p>Criado em {formatDateTime(lead.created_at)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
