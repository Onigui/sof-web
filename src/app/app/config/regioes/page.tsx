"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/session";

type Regiao = {
  id: string | number;
  cidade: string;
  uf: string;
  ativo?: boolean;
};

type RegiaoPayload = {
  cidade: string;
  uf: string;
  ativo: boolean;
};

type RawRegiao = {
  id: string | number;
  raw_text: string;
};

export default function RegioesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Regiao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Regiao | null>(null);
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [saving, setSaving] = useState(false);

  const [rawRegionText, setRawRegionText] = useState("");
  const [selectedRegiaoId, setSelectedRegiaoId] = useState("");
  const [rawList, setRawList] = useState<RawRegiao[]>([]);

  const regiaoOptions = useMemo(
    () =>
      items.map((item) => ({
        value: String(item.id),
        label: `${item.cidade}/${item.uf}`,
      })),
    [items],
  );

  const loadRegioes = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<Regiao[]>("/api/v1/regioes");
      setItems(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível carregar regiões.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getUser();
    if (user?.role !== "GESTAO") {
      router.replace("/app");
    }
  }, [router]);

  useEffect(() => {
    loadRegioes();
  }, []);

  const openModal = (regiao?: Regiao) => {
    if (regiao) {
      setEditing(regiao);
      setCidade(regiao.cidade);
      setUf(regiao.uf);
      setAtivo(regiao.ativo ?? true);
    } else {
      setEditing(null);
      setCidade("");
      setUf("");
      setAtivo(true);
    }
    setShowModal(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: RegiaoPayload = { cidade, uf, ativo };

    try {
      if (editing) {
        await apiFetch(`/api/v1/regioes`, {
          method: "PATCH",
          body: JSON.stringify({ ...payload, id: editing.id }),
        });
      } else {
        await apiFetch(`/api/v1/regioes`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      await loadRegioes();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível salvar região.");
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleAtivo = async (regiao: Regiao) => {
    setSaving(true);
    setError(null);

    try {
      await apiFetch(`/api/v1/regioes`, {
        method: "PATCH",
        body: JSON.stringify({ id: regiao.id, ativo: !regiao.ativo }),
      });
      await loadRegioes();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível atualizar região.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleNormalize = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    if (!rawRegionText || !selectedRegiaoId) {
      setError("Selecione a região e informe o texto bruto.");
      setSaving(false);
      return;
    }

    try {
      await apiFetch("/api/v1/regioes/normalize", {
        method: "POST",
        body: JSON.stringify({
          raw_text: rawRegionText,
          regiao_id: selectedRegiaoId,
        }),
      });
      setRawRegionText("");
      setSelectedRegiaoId("");
      // TODO: integrar endpoint de regiões pendentes e remover item da lista após normalizar.
      setRawList((prev) => prev.filter((item) => item.raw_text !== rawRegionText));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível normalizar região.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Regiões</h1>
          <p className="text-sm text-slate-500">Cadastre regiões oficiais.</p>
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Novo
        </button>
      </header>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Carregando regiões...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma região cadastrada.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Região</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((regiao) => (
                <tr key={regiao.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {regiao.cidade}/{regiao.uf}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {regiao.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openModal(regiao)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleAtivo(regiao)}
                        disabled={saving}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-70"
                      >
                        {regiao.ativo ? "Desativar" : "Ativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Normalização</h2>
        <p className="mt-1 text-sm text-slate-500">
          Associe textos brutos às regiões oficiais.
        </p>
        <form className="mt-4 space-y-3" onSubmit={handleNormalize}>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="raw">
              Texto bruto
            </label>
            <input
              id="raw"
              value={rawRegionText}
              onChange={(event) => setRawRegionText(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Ex: Região Sul"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="regiao">
              Região oficial
            </label>
            <select
              id="regiao"
              value={selectedRegiaoId}
              onChange={(event) => setSelectedRegiaoId(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              {regiaoOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            Normalizar
          </button>
        </form>

        {rawList.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Nenhuma região pendente encontrada.
          </p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {rawList.map((item) => (
              <li key={item.id} className="rounded-lg bg-slate-50 px-3 py-2">
                {item.raw_text}
              </li>
            ))}
          </ul>
        )}
      </section>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">
              {editing ? "Editar região" : "Nova região"}
            </h2>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500" htmlFor="cidade">
                  Cidade
                </label>
                <input
                  id="cidade"
                  value={cidade}
                  onChange={(event) => setCidade(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500" htmlFor="uf">
                  UF
                </label>
                <input
                  id="uf"
                  value={uf}
                  onChange={(event) => setUf(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(event) => setAtivo(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Ativo
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
