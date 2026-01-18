"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

type Notificacao = {
  id: string | number;
  titulo?: string;
  mensagem?: string;
  lida?: boolean;
  created_at?: string;
};

export default function NotificacoesPage() {
  const [items, setItems] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotificacoes = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<Notificacao[]>("/api/v1/notificacoes");
      setItems(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível carregar notificações.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotificacoes();
  }, []);

  const markAsRead = async (id: string | number) => {
    try {
      await apiFetch(`/api/v1/notificacoes/${id}/ler`, { method: "POST" });
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, lida: true } : item,
        ),
      );
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível atualizar notificação.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">Notificações</h1>
        <p className="text-sm text-slate-500">
          Acompanhe as últimas mensagens e alertas.
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Carregando notificações...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nenhuma notificação disponível.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border px-4 py-3 ${
                item.lida
                  ? "border-slate-200 bg-slate-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {item.titulo ?? "Sem título"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.mensagem ?? "Sem descrição disponível."}
                  </p>
                  {item.created_at ? (
                    <p className="mt-2 text-xs text-slate-400">
                      {new Date(item.created_at).toLocaleString("pt-BR")}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      item.lida
                        ? "bg-slate-200 text-slate-600"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.lida ? "Lida" : "Não lida"}
                  </span>
                  {!item.lida ? (
                    <button
                      type="button"
                      onClick={() => markAsRead(item.id)}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Marcar como lida
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
