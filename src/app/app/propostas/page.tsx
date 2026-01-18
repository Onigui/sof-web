"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";

type Proposta = {
  id: string | number;
  status?: string;
  cliente_nome?: string;
  loja_nome?: string;
  regiao_raw?: string;
  banco_nome?: string;
  produto_nome?: string;
  updated_at?: string;
  pendencia?: boolean;
  pendencias?: unknown[] | boolean;
};

const statusOptions = [
  "RASCUNHO",
  "ANALISE_PROMOTORA",
  "ANALISE_BANCO",
  "APROVADA",
  "RECUSADA",
  "FORMALIZACAO",
  "ANALISE_PAGAMENTO",
  "INTEGRADA",
] as const;

export default function PropostasPage() {
  const searchParams = useSearchParams();
  const selectedStatus = searchParams.get("status");
  const [items, setItems] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (!selectedStatus) {
      return items;
    }
    return items.filter((item) => item.status === selectedStatus);
  }, [items, selectedStatus]);

  useEffect(() => {
    const loadPropostas = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await apiFetch<Proposta[]>("/api/v1/propostas");
        setItems(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Não foi possível carregar propostas.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadPropostas();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Propostas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe suas propostas em andamento.
          </p>
        </div>
        <Link
          href="/app/propostas/nova"
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Nova Proposta
        </Link>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/app/propostas"
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            !selectedStatus
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          Todas
        </Link>
        {statusOptions.map((status) => (
          <Link
            key={status}
            href={`/app/propostas?status=${status}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              selectedStatus === status
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {status}
          </Link>
        ))}
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Carregando propostas...</p>
      ) : filteredItems.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma proposta encontrada.</p>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => {
            const pendencias =
              typeof item.pendencia === "boolean"
                ? item.pendencia
                : Array.isArray(item.pendencias)
                  ? item.pendencias.length > 0
                  : Boolean(item.pendencias);

            return (
              <Link
                key={item.id}
                href={`/app/propostas/${item.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {item.status ?? "--"}
                  </span>
                  {pendencias ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Pendência
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-3 text-base font-semibold text-slate-900">
                  {item.cliente_nome ?? "Cliente não informado"}
                </h2>
                <div className="mt-2 space-y-1 text-sm text-slate-500">
                  {item.loja_nome || item.regiao_raw ? (
                    <p>
                      {item.loja_nome ?? ""}
                      {item.loja_nome && item.regiao_raw ? " · " : ""}
                      {item.regiao_raw ?? ""}
                    </p>
                  ) : null}
                  {item.banco_nome || item.produto_nome ? (
                    <p>
                      {item.banco_nome ?? ""}
                      {item.banco_nome && item.produto_nome ? " · " : ""}
                      {item.produto_nome ?? ""}
                    </p>
                  ) : null}
                  {item.updated_at ? (
                    <p>
                      Atualizado em {new Date(item.updated_at).toLocaleString("pt-BR")}
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
