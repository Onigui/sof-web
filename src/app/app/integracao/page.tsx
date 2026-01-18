"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/session";

type IntegracaoItem = {
  id: string | number;
  cliente_nome?: string;
  cliente_cpf?: string;
  cliente_celular?: string;
  banco_nome?: string;
  produto_nome?: string;
  veiculo_placa?: string;
  veiculo_renavam?: string;
  loja_nome?: string;
  regiao_nome?: string;
  updated_at?: string;
};

type IntegracaoPayload = {
  data_averbacao: string;
  contrato: string;
  repasse?: string;
  tabela?: string;
  veiculo?: string;
  alienado?: boolean;
  regiao_override?: string;
};

export default function IntegracaoPage() {
  const router = useRouter();
  const [items, setItems] = useState<IntegracaoItem[]>([]);
  const [selected, setSelected] = useState<IntegracaoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [dataAverbacao, setDataAverbacao] = useState("");
  const [contrato, setContrato] = useState("");
  const [repasse, setRepasse] = useState("");
  const [tabela, setTabela] = useState("");
  const [veiculo, setVeiculo] = useState("");
  const [alienado, setAlienado] = useState(false);
  const [regiaoOverride, setRegiaoOverride] = useState("");

  const canSave = useMemo(
    () => Boolean(dataAverbacao && contrato && selected),
    [dataAverbacao, contrato, selected],
  );

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await apiFetch<IntegracaoItem[]>(
        "/api/v1/integracoes/pending",
      );
      setItems(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível carregar integrações.");
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
    loadItems();
  }, []);

  const resetForm = () => {
    setDataAverbacao("");
    setContrato("");
    setRepasse("");
    setTabela("");
    setVeiculo("");
    setAlienado(false);
    setRegiaoOverride("");
  };

  const handleSelect = (item: IntegracaoItem) => {
    setSelected(item);
    setSuccess(null);
    setError(null);
    resetForm();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selected) {
      setError("Selecione uma proposta para integrar.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload: IntegracaoPayload = {
      data_averbacao: dataAverbacao,
      contrato,
      repasse: repasse || undefined,
      tabela: tabela || undefined,
      veiculo: veiculo || undefined,
      alienado: alienado || undefined,
      regiao_override: regiaoOverride || undefined,
    };

    try {
      await apiFetch(`/api/v1/propostas/${selected.id}/integrar`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSuccess("Integração enviada com sucesso.");
      setItems((prev) => prev.filter((item) => item.id !== selected.id));
      setSelected(null);
      resetForm();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível integrar a proposta.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Integração</h1>
        <p className="text-sm text-slate-500">
          Propostas prontas para integração.
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4">
          {loading ? (
            <p className="text-sm text-slate-500">Carregando integrações...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma proposta pendente.</p>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Banco/Produto</th>
                      <th className="px-4 py-3">Veículo</th>
                      <th className="px-4 py-3">Loja/Região</th>
                      <th className="px-4 py-3">Atualizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                        onClick={() => handleSelect(item)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">
                            {item.cliente_nome ?? "-"}
                          </div>
                          <div className="text-xs text-slate-400">
                            {item.cliente_cpf ?? ""}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {item.banco_nome ?? "-"}
                          <div className="text-xs text-slate-400">
                            {item.produto_nome ?? ""}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {item.veiculo_placa ?? "-"}
                          <div className="text-xs text-slate-400">
                            {item.veiculo_renavam ?? ""}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {item.loja_nome ?? "-"}
                          <div className="text-xs text-slate-400">
                            {item.regiao_nome ?? ""}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {item.updated_at
                            ? new Date(item.updated_at).toLocaleString("pt-BR")
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 lg:hidden">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        {item.updated_at
                          ? new Date(item.updated_at).toLocaleString("pt-BR")
                          : "-"}
                      </span>
                      <span>#{item.id}</span>
                    </div>
                    <h2 className="mt-2 text-base font-semibold text-slate-900">
                      {item.cliente_nome ?? "-"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.banco_nome ?? "-"} · {item.produto_nome ?? ""}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Placa: {item.veiculo_placa ?? "-"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.loja_nome ?? "-"} · {item.regiao_nome ?? ""}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">
            Integrar proposta
          </h2>
          {selected ? (
            <div className="mt-3 space-y-1 text-xs text-slate-500">
              <p className="font-semibold text-slate-800">
                {selected.cliente_nome ?? "-"}
              </p>
              <p>
                {selected.banco_nome ?? "-"} · {selected.produto_nome ?? ""}
              </p>
              <p>
                Placa: {selected.veiculo_placa ?? "-"} · Renavam:{" "}
                {selected.veiculo_renavam ?? "-"}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Selecione uma proposta para preencher os dados de integração.
            </p>
          )}

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500" htmlFor="data">
                Data de averbação
              </label>
              <input
                id="data"
                type="date"
                value={dataAverbacao}
                onChange={(event) => setDataAverbacao(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <label
                className="text-xs font-medium text-slate-500"
                htmlFor="contrato"
              >
                Contrato
              </label>
              <input
                id="contrato"
                value={contrato}
                onChange={(event) => setContrato(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500" htmlFor="repasse">
                Repasse (opcional)
              </label>
              <input
                id="repasse"
                value={repasse}
                onChange={(event) => setRepasse(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500" htmlFor="tabela">
                Tabela (opcional)
              </label>
              <input
                id="tabela"
                value={tabela}
                onChange={(event) => setTabela(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500" htmlFor="veiculo">
                Veículo (opcional)
              </label>
              <input
                id="veiculo"
                value={veiculo}
                onChange={(event) => setVeiculo(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label
                className="text-xs font-medium text-slate-500"
                htmlFor="regiao-override"
              >
                Região override (opcional)
              </label>
              <input
                id="regiao-override"
                value={regiaoOverride}
                onChange={(event) => setRegiaoOverride(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={alienado}
                onChange={(event) => setAlienado(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Veículo alienado
            </label>
            <button
              type="submit"
              disabled={!canSave || saving}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Salvando..." : "Integrar proposta"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
