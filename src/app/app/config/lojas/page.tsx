"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/session";

type Loja = {
  id: string | number;
  nome: string;
  cidade?: string;
  uf?: string;
  ativo?: boolean;
};

type LojaPayload = {
  nome: string;
  cidade?: string;
  uf?: string;
  ativo: boolean;
};

export default function LojasPage() {
  const router = useRouter();
  const [items, setItems] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Loja | null>(null);
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadLojas = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<Loja[]>("/api/v1/lojas");
      setItems(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível carregar lojas.");
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
    loadLojas();
  }, []);

  const openModal = (loja?: Loja) => {
    if (loja) {
      setEditing(loja);
      setNome(loja.nome);
      setCidade(loja.cidade ?? "");
      setUf(loja.uf ?? "");
      setAtivo(loja.ativo ?? true);
    } else {
      setEditing(null);
      setNome("");
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

    const payload: LojaPayload = {
      nome,
      cidade: cidade || undefined,
      uf: uf || undefined,
      ativo,
    };

    try {
      if (editing) {
        await apiFetch(`/api/v1/lojas`, {
          method: "PATCH",
          body: JSON.stringify({ ...payload, id: editing.id }),
        });
      } else {
        await apiFetch(`/api/v1/lojas`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      await loadLojas();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível salvar loja.");
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleAtivo = async (loja: Loja) => {
    setSaving(true);
    setError(null);

    try {
      await apiFetch(`/api/v1/lojas`, {
        method: "PATCH",
        body: JSON.stringify({ id: loja.id, ativo: !loja.ativo }),
      });
      await loadLojas();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível atualizar loja.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Lojas</h1>
          <p className="text-sm text-slate-500">Cadastre lojas.</p>
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
        <p className="text-sm text-slate-500">Carregando lojas...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma loja cadastrada.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Cidade/UF</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((loja) => (
                <tr key={loja.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {loja.nome}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {loja.cidade ?? "-"}
                    {loja.uf ? `/${loja.uf}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {loja.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openModal(loja)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleAtivo(loja)}
                        disabled={saving}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-70"
                      >
                        {loja.ativo ? "Desativar" : "Ativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">
              {editing ? "Editar loja" : "Nova loja"}
            </h2>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500" htmlFor="nome">
                  Nome
                </label>
                <input
                  id="nome"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <label
                  className="text-xs font-medium text-slate-500"
                  htmlFor="cidade"
                >
                  Cidade (opcional)
                </label>
                <input
                  id="cidade"
                  value={cidade}
                  onChange={(event) => setCidade(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500" htmlFor="uf">
                  UF (opcional)
                </label>
                <input
                  id="uf"
                  value={uf}
                  onChange={(event) => setUf(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
