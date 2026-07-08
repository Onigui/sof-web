"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/session";

type LeadPayload = {
  nome?: string;
  telefone?: string;
  email?: string;
  cpf?: string;
  observacao?: string;
};

export default function NovoLeadPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [observacao, setObservacao] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const user = getUser();
    if (user?.role !== "LOJA") {
      router.replace("/app");
    }
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload: LeadPayload = {
      nome: nome || undefined,
      telefone: telefone || undefined,
      email: email || undefined,
      cpf: cpf || undefined,
      observacao: observacao || undefined,
    };

    try {
      const data = await apiFetch<{ id?: string | number }>(
        "/api/v1/loja/leads",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
      setSuccess("Lead criado com sucesso.");
      if (data?.id) {
        router.replace(`/app/leads/${data.id}`);
      } else {
        router.replace("/app/leads");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível criar o lead.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Novo lead</h1>
        <p className="text-sm text-slate-500">
          Registre um novo atendimento da loja.
        </p>
      </header>

      <form className="space-y-4" onSubmit={handleSubmit}>
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
            htmlFor="telefone"
          >
            Telefone
          </label>
          <input
            id="telefone"
            value={telefone}
            onChange={(event) => setTelefone(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500" htmlFor="cpf">
            CPF
          </label>
          <input
            id="cpf"
            value={cpf}
            onChange={(event) => setCpf(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label
            className="text-xs font-medium text-slate-500"
            htmlFor="observacao"
          >
            Observações
          </label>
          <textarea
            id="observacao"
            value={observacao}
            onChange={(event) => setObservacao(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            rows={4}
          />
        </div>
        {error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : null}
        {success ? (
          <p className="text-sm text-emerald-600">{success}</p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Link
            href="/app/leads"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Voltar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
