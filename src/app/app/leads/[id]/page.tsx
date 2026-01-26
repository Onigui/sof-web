"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/session";

type LeadDetail = {
  id: string | number;
  nome?: string;
  status?: string;
  created_at?: string;
  telefone?: string;
  email?: string;
  cpf?: string;
  observacao?: string;
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("pt-BR");
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params?.id as string;
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLead = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<LeadDetail>(
        `/api/v1/loja/leads/${leadId}`,
      );
      setLead(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível carregar o lead.");
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
    if (leadId) {
      loadLead();
    }
  }, [router, leadId]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Detalhe do lead</h1>
        <p className="text-sm text-slate-500">
          Acompanhe as informações do atendimento.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-500">Carregando lead...</p>
      ) : error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : lead ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 text-sm text-slate-600">
          <div>
            <p className="text-xs uppercase text-slate-400">Nome</p>
            <p className="font-semibold text-slate-900">{lead.nome ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400">Status</p>
            <p>{lead.status ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400">Criado em</p>
            <p>{formatDateTime(lead.created_at)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400">Telefone</p>
            <p>{lead.telefone ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400">Email</p>
            <p>{lead.email ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400">CPF</p>
            <p>{lead.cpf ?? "-"}</p>
          </div>
          {lead.observacao ? (
            <div>
              <p className="text-xs uppercase text-slate-400">Observações</p>
              <p>{lead.observacao}</p>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-slate-500">Lead não encontrado.</p>
      )}

      <div className="flex justify-start">
        <Link
          href="/app/leads"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Voltar
        </Link>
      </div>
    </div>
  );
}
