"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";

type AuditEntry = {
  id: string | number;
  created_at?: string;
  action?: string;
  metadata?: Record<string, unknown> | string | null;
};

const formatSummary = (metadata: AuditEntry["metadata"]) => {
  if (!metadata) return "-";
  if (typeof metadata === "string") return metadata.slice(0, 80);
  const raw = JSON.stringify(metadata);
  return raw.length > 80 ? `${raw.slice(0, 77)}...` : raw;
};

export default function AnaliseDetalhePage() {
  const params = useParams();
  const propostaId = params?.id as string;
  const [auditItems, setAuditItems] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderedItems = useMemo(() => {
    return [...auditItems].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [auditItems]);

  useEffect(() => {
    if (!propostaId) return;
    setLoading(true);
    setError(null);

    apiFetch<AuditEntry[]>(`/api/v1/propostas/${propostaId}/audit`)
      .then((data) => setAuditItems(data))
      .catch((err) => {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Não foi possível carregar auditoria.");
        }
      })
      .finally(() => setLoading(false));
  }, [propostaId]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">
          Análise #{propostaId}
        </h1>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Auditoria</h2>
        {error ? (
          <p className="mt-2 text-sm text-rose-600">{error}</p>
        ) : loading ? (
          <p className="mt-2 text-sm text-slate-500">Carregando auditoria...</p>
        ) : orderedItems.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Nenhum registro de auditoria encontrado.
          </p>
        ) : (
          <ol className="mt-3 space-y-3 text-sm text-slate-600">
            {orderedItems.map((item) => (
              <li key={item.id} className="rounded-lg bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">
                  {item.action ?? "Ação"}
                </p>
                <p className="text-xs text-slate-400">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString("pt-BR")
                    : "-"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {formatSummary(item.metadata)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
