"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getUser } from "@/lib/session";

const defaultTemplates = {
  dut: "Olá, tudo bem? Precisamos do comprovante da transferência (DUT) referente ao financiamento. Por favor, envie o comprovante por aqui. Obrigado.",
  pendencia:
    "Olá! Identificamos uma pendência na proposta. Por favor, revise os documentos e retorne quando possível.",
};

type TemplatesState = {
  dut: string;
  pendencia: string;
};

export default function TemplatesPage() {
  const router = useRouter();
  const user = getUser();
  const storageKey = useMemo(() => {
    const empresaId = (user as { empresa_id?: string | number })?.empresa_id;
    return `sof.templates.${empresaId ?? "default"}`;
  }, [user]);

  const [templates, setTemplates] = useState<TemplatesState>(defaultTemplates);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "GESTAO") {
      router.replace("/app");
    }
  }, [router, user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as TemplatesState;
        setTemplates({
          dut: parsed.dut ?? defaultTemplates.dut,
          pendencia: parsed.pendencia ?? defaultTemplates.pendencia,
        });
      } catch {
        setTemplates(defaultTemplates);
      }
    }
  }, [storageKey]);

  const handleSave = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(templates));
    setSuccess("Templates salvos com sucesso.");
  };

  const handleReset = () => {
    setTemplates(defaultTemplates);
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(defaultTemplates));
    setSuccess("Templates restaurados para o padrão.");
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Templates</h1>
        <p className="text-sm text-slate-500">
          Ajuste mensagens padrão usadas nas cobranças.
        </p>
      </header>

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="dut">
            DUT cobrança
          </label>
          <textarea
            id="dut"
            value={templates.dut}
            onChange={(event) =>
              setTemplates((prev) => ({ ...prev, dut: event.target.value }))
            }
            className="min-h-[120px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="pendencia"
          >
            Pendência criada
          </label>
          <textarea
            id="pendencia"
            value={templates.pendencia}
            onChange={(event) =>
              setTemplates((prev) => ({ ...prev, pendencia: event.target.value }))
            }
            className="min-h-[120px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Restaurar padrão
          </button>
        </div>
      </section>
    </div>
  );
}
