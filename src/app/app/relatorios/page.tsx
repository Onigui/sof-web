"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiDownload, apiFetch } from "@/lib/api";
import { getUser } from "@/lib/session";

type RelatorioItem = {
  id: string | number;
  tipo?: string;
  status?: string;
  gerado_em?: string;
  erro?: string;
};

const formatDateInput = (date: Date) =>
  date.toISOString().slice(0, 10);

export default function RelatoriosPage() {
  const router = useRouter();
  const [dataRef, setDataRef] = useState(() => formatDateInput(new Date()));
  const [items, setItems] = useState<RelatorioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRelatorios = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<RelatorioItem[]>(
        `/api/v1/relatorios/fechamento?data=${dataRef}`,
      );
      setItems(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível carregar relatórios.");
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
    loadRelatorios();
  }, []);

  const handleDownload = async (item: RelatorioItem) => {
    setError(null);

    try {
      const { blob, filename } = await apiDownload(
        `/api/v1/relatorios/fechamento/${item.id}/download`,
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        filename ?? `relatorio-${item.tipo ?? "fechamento"}-${dataRef}.dat`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível baixar o relatório.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Relatórios</h1>
        <p className="text-sm text-slate-500">
          Baixe os fechamentos diários.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="data">
              Data referência
            </label>
            <input
              id="data"
              type="date"
              value={dataRef}
              onChange={(event) => setDataRef(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={loadRelatorios}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Buscar
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Carregando relatórios...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum relatório encontrado.</p>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Gerado em</th>
                  <th className="px-4 py-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {item.tipo ?? "Fechamento"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "FALHOU"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.status ?? "-"}
                      </span>
                      {item.status === "FALHOU" && item.erro ? (
                        <p className="mt-1 text-xs text-rose-600">
                          {item.erro}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {item.gerado_em
                        ? new Date(item.gerado_em).toLocaleString("pt-BR")
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDownload(item)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{item.tipo ?? "Fechamento"}</span>
                  <span>#{item.id}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === "FALHOU"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.status ?? "-"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {item.gerado_em
                      ? new Date(item.gerado_em).toLocaleString("pt-BR")
                      : "-"}
                  </span>
                </div>
                {item.status === "FALHOU" && item.erro ? (
                  <p className="mt-2 text-xs text-rose-600">{item.erro}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleDownload(item)}
                  className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
