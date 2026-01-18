"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/session";

type Proposta = {
  id: string | number;
  status?: string;
  cliente_nome?: string;
  cliente_cpf?: string;
  cliente_celular?: string;
  cliente_email?: string;
  veiculo_placa?: string;
  veiculo_renavam?: string;
  veiculo_descricao?: string;
  valor_veiculo?: string;
  valor_financiado?: string;
  banco_nome?: string;
  produto_nome?: string;
  loja_nome?: string;
  regiao_raw?: string;
};

type PendenciaItem = {
  doc_tipo?: string;
};

type Pendencia = {
  id: string | number;
  categoria?: string;
  comentario?: string;
  itens?: PendenciaItem[];
  created_at?: string;
  updated_at?: string;
  resolved_at?: string | null;
};

type Documento = {
  id: string | number;
  tipo?: string;
  status?: string;
  enviado_em?: string;
  motivo_invalidez?: string;
  url?: string;
};

type DocumentoTipo =
  | "CNH"
  | "COMP_END"
  | "COMP_RENDA"
  | "SELFIE_ASSIN"
  | "FOTO_VEICULO"
  | "DOC_CARRO"
  | "PEDIDO_PAG"
  | "EVICCAO"
  | "VALIDACAO_DOC"
  | "CONSULTA_DETRAN"
  | "OUTRO";

type PendenciaCategoria =
  | "DOC_FALTANDO"
  | "DADO_INCONSISTENTE"
  | "FOTO_ILEGIVEL"
  | "OUTRO";

const documentoTipos: DocumentoTipo[] = [
  "CNH",
  "COMP_END",
  "COMP_RENDA",
  "SELFIE_ASSIN",
  "FOTO_VEICULO",
  "DOC_CARRO",
  "PEDIDO_PAG",
  "EVICCAO",
  "VALIDACAO_DOC",
  "CONSULTA_DETRAN",
  "OUTRO",
];

const pendenciaCategorias: PendenciaCategoria[] = [
  "DOC_FALTANDO",
  "DADO_INCONSISTENTE",
  "FOTO_ILEGIVEL",
  "OUTRO",
];

export default function AnalisePage() {
  const params = useParams();
  const router = useRouter();
  const propostaId = params?.id as string;

  const [proposta, setProposta] = useState<Proposta | null>(null);
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [categoria, setCategoria] = useState<PendenciaCategoria>("DOC_FALTANDO");
  const [comentario, setComentario] = useState("");
  const [itensSelecionados, setItensSelecionados] = useState<DocumentoTipo[]>(
    [],
  );

  const pendenciasAbertas = useMemo(
    () => pendencias.filter((item) => !item.resolved_at),
    [pendencias],
  );
  const pendenciasResolvidas = useMemo(
    () => pendencias.filter((item) => item.resolved_at),
    [pendencias],
  );

  const loadAll = async () => {
    setLoading(true);
    setError(null);

    try {
      const [propostaData, pendenciasData, documentosData] = await Promise.all([
        apiFetch<Proposta>(`/api/v1/propostas/${propostaId}`),
        apiFetch<Pendencia[]>(`/api/v1/propostas/${propostaId}/pendencias`),
        apiFetch<Documento[]>(`/api/v1/propostas/${propostaId}/documentos`),
      ]);
      setProposta(propostaData);
      setPendencias(pendenciasData);
      setDocumentos(documentosData);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível carregar a análise.");
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
    if (propostaId) {
      loadAll();
    }
  }, [propostaId]);

  const handleResolvePendencia = async (pendenciaId: string | number) => {
    setSaving(true);
    setError(null);

    try {
      await apiFetch(`/api/v1/pendencias/${pendenciaId}/resolver`, {
        method: "PATCH",
      });
      await loadAll();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível resolver a pendência.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleItem = (tipo: DocumentoTipo) => {
    setItensSelecionados((prev) =>
      prev.includes(tipo) ? prev.filter((item) => item !== tipo) : [...prev, tipo],
    );
  };

  const handleCreatePendencia = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await apiFetch(`/api/v1/propostas/${propostaId}/pendencias`, {
        method: "POST",
        body: JSON.stringify({
          categoria,
          comentario: comentario || undefined,
          itens: itensSelecionados.map((doc_tipo) => ({ doc_tipo })),
        }),
      });
      setComentario("");
      setItensSelecionados([]);
      await loadAll();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível criar pendência.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Carregando análise...</p>;
  }

  if (!proposta) {
    return <p className="text-sm text-slate-500">Proposta não encontrada.</p>;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">
          Análise da proposta #{proposta.id}
        </h1>
        <p className="text-sm text-slate-500">
          Status atual: <span className="font-semibold">{proposta.status}</span>
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-700">Resumo</h2>
            <dl className="mt-3 space-y-2 text-sm text-slate-600">
              <div>
                <dt className="font-medium text-slate-500">Cliente</dt>
                <dd>{proposta.cliente_nome ?? "-"}</dd>
                <dd>{proposta.cliente_cpf ?? ""}</dd>
                <dd>{proposta.cliente_celular ?? ""}</dd>
                <dd>{proposta.cliente_email ?? ""}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Veículo</dt>
                <dd>{proposta.veiculo_descricao ?? "-"}</dd>
                <dd>{proposta.veiculo_placa ?? ""}</dd>
                <dd>{proposta.veiculo_renavam ?? ""}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Financeiro</dt>
                <dd>Banco: {proposta.banco_nome ?? "-"}</dd>
                <dd>Produto: {proposta.produto_nome ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Origem</dt>
                <dd>Loja: {proposta.loja_nome ?? "-"}</dd>
                <dd>Região: {proposta.regiao_raw ?? "-"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-700">Pendências</h2>
            {pendenciasAbertas.length === 0 && pendenciasResolvidas.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Nenhuma pendência registrada.
              </p>
            ) : (
              <div className="mt-3 space-y-4">
                {pendenciasAbertas.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Abertas
                    </p>
                    <ul className="mt-2 space-y-3">
                      {pendenciasAbertas.map((pendencia) => (
                        <li
                          key={pendencia.id}
                          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-slate-700"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">
                                {pendencia.categoria ?? "Pendência"}
                              </p>
                              {pendencia.comentario ? (
                                <p className="mt-1 text-slate-600">
                                  {pendencia.comentario}
                                </p>
                              ) : null}
                              <p className="mt-2 text-xs text-slate-400">
                                Aberta em{" "}
                                {pendencia.created_at
                                  ? new Date(pendencia.created_at).toLocaleString(
                                      "pt-BR",
                                    )
                                  : "-"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleResolvePendencia(pendencia.id)}
                              disabled={saving}
                              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              Resolver
                            </button>
                          </div>
                          <ul className="mt-2 list-disc pl-5 text-xs text-slate-600">
                            {pendencia.itens?.map((item, index) => (
                              <li key={`${item.doc_tipo ?? "item"}-${index}`}>
                                {item.doc_tipo ?? "Documento"}
                              </li>
                            )) ?? <li>Sem itens</li>}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {pendenciasResolvidas.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Resolvidas
                    </p>
                    <ul className="mt-2 space-y-3">
                      {pendenciasResolvidas.map((pendencia) => (
                        <li
                          key={pendencia.id}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600"
                        >
                          <p className="font-semibold text-slate-700">
                            {pendencia.categoria ?? "Pendência"}
                          </p>
                          {pendencia.comentario ? (
                            <p className="mt-1 text-slate-600">
                              {pendencia.comentario}
                            </p>
                          ) : null}
                          <p className="mt-2 text-xs text-slate-400">
                            Resolvida em{" "}
                            {pendencia.resolved_at
                              ? new Date(pendencia.resolved_at).toLocaleString(
                                  "pt-BR",
                                )
                              : "-"}
                          </p>
                          <ul className="mt-2 list-disc pl-5 text-xs text-slate-500">
                            {pendencia.itens?.map((item, index) => (
                              <li key={`${item.doc_tipo ?? "item"}-${index}`}>
                                {item.doc_tipo ?? "Documento"}
                              </li>
                            )) ?? <li>Sem itens</li>}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-700">
              Criar pendência
            </h2>
            <form className="mt-3 space-y-3" onSubmit={handleCreatePendencia}>
              <div className="space-y-1">
                <label
                  className="text-xs font-medium text-slate-500"
                  htmlFor="categoria"
                >
                  Categoria
                </label>
                <select
                  id="categoria"
                  value={categoria}
                  onChange={(event) =>
                    setCategoria(event.target.value as PendenciaCategoria)
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {pendenciaCategorias.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label
                  className="text-xs font-medium text-slate-500"
                  htmlFor="comentario"
                >
                  Comentário (opcional)
                </label>
                <textarea
                  id="comentario"
                  value={comentario}
                  onChange={(event) => setComentario(event.target.value)}
                  className="min-h-[96px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">Itens</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {documentoTipos.map((tipo) => (
                    <label
                      key={tipo}
                      className="flex items-center gap-2 text-sm text-slate-600"
                    >
                      <input
                        type="checkbox"
                        checked={itensSelecionados.includes(tipo)}
                        onChange={() => handleToggleItem(tipo)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      {tipo}
                    </label>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Salvando..." : "Criar pendência"}
              </button>
            </form>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-700">Documentos</h2>
            {documentos.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Nenhum documento enviado ainda.
              </p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm text-slate-600">
                {documentos.map((doc) => (
                  <li
                    key={doc.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-slate-700">
                        {doc.tipo ?? "Documento"}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {doc.status ?? "-"}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-slate-500">
                      <p>
                        Enviado em: {doc.enviado_em
                          ? new Date(doc.enviado_em).toLocaleString("pt-BR")
                          : "-"}
                      </p>
                      {doc.motivo_invalidez ? (
                        <p>Motivo: {doc.motivo_invalidez}</p>
                      ) : null}
                    </div>
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex text-xs font-semibold text-slate-700 underline"
                      >
                        Abrir
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
