"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/session";

type FilaItem = {
  id: string | number;
  status?: string;
  prioridade?: string;
  cliente_nome?: string;
  veiculo_placa?: string;
  operador_nome?: string;
  loja_nome?: string;
  regiao_nome?: string;
  updated_at?: string;
  has_pendencia_aberta?: boolean;
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

export default function FilaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<FilaItem[]>([]);

  const [status, setStatus] = useState("");
  const [operadorId, setOperadorId] = useState("");
  const [lojaId, setLojaId] = useState("");
  const [regiaoId, setRegiaoId] = useState("");
  const [bancoId, setBancoId] = useState("");
  const [produtoId, setProdutoId] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();

    if (status) params.set("status", status);
    if (operadorId) params.set("operador_id", operadorId);
    if (lojaId) params.set("loja_id", lojaId);
    if (regiaoId) params.set("regiao_id", regiaoId);
    if (bancoId) params.set("banco_id", bancoId);
    if (produtoId) params.set("produto_id", produtoId);

    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [status, operadorId, lojaId, regiaoId, bancoId, produtoId]);

  const loadFila = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<FilaItem[]>(`/api/v1/fila${query}`);
      setItems(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível carregar a fila.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getUser();
    if (user?.role === "OPERADOR") {
      router.replace("/app/propostas");
    }
  }, [router]);

  useEffect(() => {
    loadFila();
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Fila</h1>
        <p className="text-sm text-slate-500">
          Acompanhe propostas aguardando análise.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Filtros</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="operador">
              Operador ID
            </label>
            <input
              id="operador"
              value={operadorId}
              onChange={(event) => setOperadorId(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Ex: 123"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="loja">
              Loja ID
            </label>
            <input
              id="loja"
              value={lojaId}
              onChange={(event) => setLojaId(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Ex: 45"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="regiao">
              Região ID
            </label>
            <input
              id="regiao"
              value={regiaoId}
              onChange={(event) => setRegiaoId(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Ex: 7"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="banco">
              Banco ID
            </label>
            <input
              id="banco"
              value={bancoId}
              onChange={(event) => setBancoId(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Ex: 8"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="produto">
              Produto ID
            </label>
            <input
              id="produto"
              value={produtoId}
              onChange={(event) => setProdutoId(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Ex: 9"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={loadFila}
          className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
        >
          Aplicar
        </button>
      </section>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Carregando fila...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum item encontrado.</p>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/app/analise/${item.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                    {item.status ?? "--"}
                  </span>
                  {item.prioridade ? (
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                      Prioridade {item.prioridade}
                    </span>
                  ) : null}
                  {item.has_pendencia_aberta ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                      Pendência
                    </span>
                  ) : null}
                </div>
                {item.updated_at ? (
                  <span className="text-xs text-slate-400">
                    {new Date(item.updated_at).toLocaleString("pt-BR")}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-3 text-base font-semibold text-slate-900">
                {item.cliente_nome ?? "Cliente não informado"}
              </h2>
              <div className="mt-2 space-y-1 text-sm text-slate-500">
                <p>Placa: {item.veiculo_placa ?? "-"}</p>
                <p>Operador: {item.operador_nome ?? "-"}</p>
                <p>
                  {item.loja_nome ?? ""}
                  {item.loja_nome && item.regiao_nome ? " · " : ""}
                  {item.regiao_nome ?? ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
