"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";

type AuditEntry = {
  id: string | number;
  created_at?: string;
  action?: string;
  metadata?: Record<string, unknown> | string | null;
};

const formatSummary = (metadata: AuditEntry["metadata"]) => {
  if (!metadata) return "-";
  if (typeof metadata === "string") return metadata.slice(0, 80);
  const raw = JSON.stringify(metadata);
  return raw.length > 80 ? `${raw.slice(0, 77)}...` : raw;
};

export default function PropostaDetalhePage() {
  const params = useParams();
  const propostaId = params?.id as string;
  const [auditItems, setAuditItems] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderedItems = useMemo(() => {
    return [...auditItems].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [auditItems]);

  useEffect(() => {
    if (!propostaId) return;
    setLoading(true);
    setError(null);

    apiFetch<AuditEntry[]>(`/api/v1/propostas/${propostaId}/audit`)
      .then((data) => setAuditItems(data))
      .catch((err) => {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Não foi possível carregar auditoria.");
        }
      })
      .finally(() => setLoading(false));
  }, [propostaId]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">
          Proposta #{propostaId}
        </h1>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Auditoria</h2>
        {error ? (
          <p className="mt-2 text-sm text-rose-600">{error}</p>
        ) : loading ? (
          <p className="mt-2 text-sm text-slate-500">Carregando auditoria...</p>
        ) : orderedItems.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Nenhum registro de auditoria encontrado.
          </p>
        ) : (
          <ol className="mt-3 space-y-3 text-sm text-slate-600">
            {orderedItems.map((item) => (
              <li key={item.id} className="rounded-lg bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">
                  {item.action ?? "Ação"}
                </p>
                <p className="text-xs text-slate-400">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString("pt-BR")
                    : "-"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {formatSummary(item.metadata)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
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

type Pendencia = {
  categoria?: string;
  itens?: { doc_tipo?: string }[];
};

type Documento = {
  id: string | number;
  tipo?: string;
  status?: string;
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

export default function PropostaDetalhePage() {
  const params = useParams();
  const propostaId = params?.id as string;
  const [proposta, setProposta] = useState<Proposta | null>(null);
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadTipo, setUploadTipo] = useState<DocumentoTipo>("CNH");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const canSend = useMemo(() => proposta?.status === "RASCUNHO", [proposta]);

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
        setError("Não foi possível carregar a proposta.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propostaId) {
      loadAll();
    }
  }, [propostaId]);

  const handleEnviar = async () => {
    setSending(true);
    setError(null);

    try {
      await apiFetch(`/api/v1/propostas/${propostaId}/enviar`, {
        method: "POST",
      });
      await loadAll();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível enviar a proposta.");
      }
    } finally {
      setSending(false);
    }
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!uploadFile) {
      setError("Selecione um arquivo para enviar.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("tipo", uploadTipo);
      formData.append("arquivo", uploadFile);

      await apiFetch(`/api/v1/propostas/${propostaId}/documentos`, {
        method: "POST",
        body: formData,
      });

      setUploadFile(null);
      await loadAll();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível enviar o documento.");
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-slate-500">Carregando proposta...</p>
    );
  }

  if (!proposta) {
    return (
      <p className="text-sm text-slate-500">Proposta não encontrada.</p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">
          Proposta #{proposta.id}
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

      {canSend ? (
        <button
          type="button"
          onClick={handleEnviar}
          disabled={sending}
          className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {sending ? "Enviando..." : "Enviar para análise"}
        </button>
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
            {pendencias.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Nenhuma pendência encontrada.
              </p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm text-slate-600">
                {pendencias.map((pendencia, index) => (
                  <li key={`${pendencia.categoria ?? "pendencia"}-${index}`}>
                    <p className="font-semibold text-slate-700">
                      {pendencia.categoria ?? "Pendência"}
                    </p>
                    <ul className="ml-4 list-disc">
                      {pendencia.itens?.map((item, itemIndex) => (
                        <li key={`${item.doc_tipo ?? "item"}-${itemIndex}`}>
                          {item.doc_tipo ?? "Documento"}
                        </li>
                      )) ?? <li>Sem itens</li>}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
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
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {documentos.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <span>{doc.tipo ?? "Documento"}</span>
                    <span className="text-xs font-semibold text-slate-500">
                      {doc.status ?? "-"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-700">Enviar documento</h2>
            <form className="mt-3 space-y-3" onSubmit={handleUpload}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="tipo">
                  Tipo
                </label>
                <select
                  id="tipo"
                  value={uploadTipo}
                  onChange={(event) =>
                    setUploadTipo(event.target.value as DocumentoTipo)
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {documentoTipos.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="arquivo">
                  Arquivo
                </label>
                <input
                  id="arquivo"
                  type="file"
                  onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {sending ? "Enviando..." : "Enviar documento"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
