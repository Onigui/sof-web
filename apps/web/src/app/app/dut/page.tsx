"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/session";

type DutItem = {
  id: string | number;
  cliente_nome?: string;
  celular?: string;
  loja_nome?: string;
  regiao_nome?: string;
  prazo_data?: string;
  status?: string;
  proposta?: {
    cliente_nome?: string;
    celular?: string;
    loja_nome?: string;
    regiao_nome?: string;
  };
};

const cobrancaMensagem =
  "Olá, tudo bem? Precisamos do comprovante da transferência (DUT) referente ao financiamento. Por favor, envie o comprovante por aqui. Obrigado.";

const normalizePhone = (value?: string | null) => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.startsWith("55")) return digits;
  if (digits.length >= 10 && digits.length <= 11) return `55${digits}`;
  return digits;
};

const formatCountdown = (prazo?: string) => {
  if (!prazo) return "-";
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const [year, month, day] = prazo.split("-").map(Number);
  if (!year || !month || !day) return "-";
  const deadline = new Date(year, month - 1, day);
  const diffMs = deadline.getTime() - todayStart.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 0) {
    return `D-${diffDays}`;
  }
  if (diffDays === 0) {
    return "Vence hoje";
  }
  return `Vencido há ${Math.abs(diffDays)}d`;
};

export default function DutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<DutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const statusParam = searchParams.get("status") ?? "";
  const vencendoParam = searchParams.get("vencendo");
  const vencidosParam = searchParams.get("vencidos");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (statusParam) params.set("status", statusParam);
    if (vencendoParam) params.set("vencendo", vencendoParam);
    if (vencidosParam) params.set("vencidos", vencidosParam);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [statusParam, vencendoParam, vencidosParam]);

  const loadDut = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await apiFetch<DutItem[]>(`/api/v1/dut${queryString}`);
      setItems(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível carregar a lista de DUT.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getUser();
    if (user?.role !== "OPERADOR" && user?.role !== "GESTAO") {
      router.replace("/app/propostas");
    }
  }, [router]);

  useEffect(() => {
    loadDut();
  }, [queryString]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cobrancaMensagem);
      setSuccess("Mensagem copiada com sucesso.");
    } catch {
      setError("Não foi possível copiar a mensagem.");
    }
  };

  const handleWhatsapp = (celular?: string | null) => {
    const normalized = normalizePhone(celular ?? "");
    if (!normalized) {
      setError("Telefone inválido para WhatsApp.");
      return;
    }
    const url = `https://wa.me/${normalized}?text=${encodeURIComponent(
      cobrancaMensagem,
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleUpload = async (
    id: string | number,
    file: File | null,
  ) => {
    if (!file) {
      setError("Selecione um arquivo para enviar.");
      return;
    }

    setSavingId(id);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("arquivo", file);
      await apiFetch(`/api/v1/dut/${id}/comprovante`, {
        method: "POST",
        body: formData,
      });
      setSuccess("Comprovante enviado com sucesso.");
      await loadDut();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível enviar o comprovante.");
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleOk = async (id: string | number) => {
    setSavingId(id);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch(`/api/v1/dut/${id}/ok`, { method: "POST" });
      setSuccess("DUT marcado como OK.");
      await loadDut();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível marcar como OK.");
      }
    } finally {
      setSavingId(null);
    }
  };

  const resolveValue = (item: DutItem) => ({
    clienteNome: item.cliente_nome ?? item.proposta?.cliente_nome ?? "-",
    celular: item.celular ?? item.proposta?.celular ?? "-",
    loja: item.loja_nome ?? item.proposta?.loja_nome ?? "-",
    regiao: item.regiao_nome ?? item.proposta?.regiao_nome ?? "-",
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">DUT</h1>
        <p className="text-sm text-slate-500">
          Acompanhe cobranças e comprovantes de transferência.
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

      {loading ? (
        <p className="text-sm text-slate-500">Carregando DUT...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum registro encontrado.</p>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Contato</th>
                  <th className="px-4 py-3">Loja/Região</th>
                  <th className="px-4 py-3">Prazo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const resolved = resolveValue(item);
                  return (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {resolved.clienteNome}
                        </div>
                        <div className="text-xs text-slate-400">#{item.id}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {resolved.celular}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {resolved.loja} · {resolved.regiao}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        <div>{item.prazo_data ?? "-"}</div>
                        <div className="text-xs text-slate-400">
                          {formatCountdown(item.prazo_data)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {item.status ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handleCopy}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Copiar mensagem
                          </button>
                          <button
                            type="button"
                            onClick={() => handleWhatsapp(resolved.celular)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Abrir WhatsApp
                          </button>
                          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                            <span>Enviar comprovante</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(event) =>
                                handleUpload(
                                  item.id,
                                  event.target.files?.[0] ?? null,
                                )
                              }
                              disabled={savingId === item.id}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleOk(item.id)}
                            disabled={savingId === item.id}
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            Marcar OK
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 lg:hidden">
            {items.map((item) => {
              const resolved = resolveValue(item);
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>#{item.id}</span>
                    <span>{item.status ?? "-"}</span>
                  </div>
                  <h2 className="mt-2 text-base font-semibold text-slate-900">
                    {resolved.clienteNome}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {resolved.celular}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {resolved.loja} · {resolved.regiao}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Prazo: {item.prazo_data ?? "-"} ({" "}
                    {formatCountdown(item.prazo_data)})
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Copiar mensagem
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWhatsapp(resolved.celular)}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Abrir WhatsApp
                    </button>
                    <label className="flex w-full items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                      <span>Enviar comprovante</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(event) =>
                          handleUpload(
                            item.id,
                            event.target.files?.[0] ?? null,
                          )
                        }
                        disabled={savingId === item.id}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOk(item.id)}
                      disabled={savingId === item.id}
                      className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Marcar OK
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
