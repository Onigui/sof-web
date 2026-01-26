"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/session";
import { getUser } from "@/lib/session";

type AuditEntry = {
  id: string | number;
  created_at?: string;
  action?: string;
  metadata?: Record<string, unknown> | string | null;
};

type Proposal = {
  id: string | number;
  status?: string;
  operador_id?: string | number;
  operador?: {
    id?: string | number;
    nome?: string;
  };
};

type OperatorOption = {
  id: string | number;
  nome?: string;
  name?: string;
  email?: string;
};

type PrecheckDoc = {
  id?: string | number;
  nome?: string;
  name?: string;
  label?: string;
  descricao?: string;
};

type PrecheckPayload = {
  errors?: Array<string | { message?: string }>;
  warnings?: Array<string | { message?: string }>;
  missing_fields?: string[];
  missing_docs?: Array<string | PrecheckDoc>;
  erros?: Array<string | { message?: string }>;
  avisos?: Array<string | { message?: string }>;
  campos_faltantes?: string[];
  docs_faltantes?: Array<string | PrecheckDoc>;
};

const statusOptions = [
  "EM_ANALISE",
  "PENDENTE",
  "APROVADA",
  "REJEITADA",
  "CANCELADA",
];

const formatSummary = (metadata: AuditEntry["metadata"]) => {
  if (!metadata) return "-";
  if (typeof metadata === "string") return metadata.slice(0, 80);
  const raw = JSON.stringify(metadata);
  return raw.length > 80 ? `${raw.slice(0, 77)}...` : raw;
};

export default function PropostaDetalhePage() {
  const params = useParams();
  const propostaId = params?.id as string;
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [auditItems, setAuditItems] = useState<AuditEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [loadingProposal, setLoadingProposal] = useState(true);
  const [isGestao, setIsGestao] = useState(false);
  const [isOperador, setIsOperador] = useState(false);
  const [operators, setOperators] = useState<OperatorOption[]>([]);
  const [loadingOperators, setLoadingOperators] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [transferOperatorId, setTransferOperatorId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [statusValue, setStatusValue] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [precheck, setPrecheck] = useState<PrecheckPayload | null>(null);
  const [precheckError, setPrecheckError] = useState<string | null>(null);
  const [precheckLoading, setPrecheckLoading] = useState(false);
  const [showPrecheckModal, setShowPrecheckModal] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendLoading, setSendLoading] = useState(false);

  const normalizedPrecheck = useMemo(() => {
    if (!precheck) {
      return {
        errors: [] as string[],
        warnings: [] as string[],
        missingFields: [] as string[],
        missingDocs: [] as PrecheckDoc[],
      };
    }

    const errorItems = precheck.errors ?? precheck.erros ?? [];
    const warningItems = precheck.warnings ?? precheck.avisos ?? [];
    const missingFields =
      precheck.missing_fields ?? precheck.campos_faltantes ?? [];
    const rawDocs = precheck.missing_docs ?? precheck.docs_faltantes ?? [];

    const toMessages = (items: Array<string | { message?: string }>) =>
      items
        .map((item) => (typeof item === "string" ? item : item.message ?? ""))
        .filter(Boolean);

    const missingDocs = rawDocs
      .map((doc, index) => {
        if (typeof doc === "string") {
          return { id: index, label: doc };
        }
        return doc;
      })
      .filter(Boolean) as PrecheckDoc[];

    return {
      errors: toMessages(errorItems),
      warnings: toMessages(warningItems),
      missingFields,
      missingDocs,
    };
  }, [precheck]);
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
    const user = getUser();
    setIsGestao(user?.role === "GESTAO");
    setIsOperador(user?.role === "OPERADOR");
  }, [propostaId]);

  const loadProposal = async () => {
    if (!propostaId) return;
    setLoadingProposal(true);
    setProposalError(null);

    try {
      const data = await apiFetch<Proposal>(`/api/v1/propostas/${propostaId}`);
      setProposal(data);
    } catch (err) {
      if (err instanceof Error) {
        setProposalError(err.message);
      } else {
        setProposalError("Não foi possível carregar a proposta.");
      }
    } finally {
      setLoadingProposal(false);
    }
  };

  const loadAudit = async () => {
    if (!propostaId) return;
    setLoadingAudit(true);
    setAuditError(null);

    try {
      const data = await apiFetch<AuditEntry[]>(
        `/api/v1/propostas/${propostaId}/audit`,
      );
      setAuditItems(data);
    } catch (err) {
      if (err instanceof Error) {
        setAuditError(err.message);
      } else {
        setAuditError("Não foi possível carregar auditoria.");
      }
    } finally {
      setLoadingAudit(false);
    }
  };

  const loadOperators = async () => {
    if (loadingOperators || operators.length > 0) return;
    setLoadingOperators(true);
    try {
      const data = await apiFetch<OperatorOption[]>(
        "/api/v1/users?role=OPERADOR",
      );
      setOperators(data ?? []);
    } catch {
      setOperators([]);
    } finally {
      setLoadingOperators(false);
    }
  };

  const loadPrecheck = async (showModal = false) => {
    if (!propostaId) return;
    setPrecheckLoading(true);
    setPrecheckError(null);
    try {
      const data = await apiFetch<PrecheckPayload>(
        `/api/v1/propostas/${propostaId}/precheck`,
      );
      setPrecheck(data);
      if (showModal) {
        setShowPrecheckModal(true);
      }
    } catch (err) {
      if (err instanceof Error) {
        setPrecheckError(err.message);
      } else {
        setPrecheckError("Não foi possível carregar a pré-checagem.");
      }
    } finally {
      setPrecheckLoading(false);
    }
  };

  useEffect(() => {
    loadProposal();
    loadAudit();
  }, [propostaId]);

  useEffect(() => {
    if (showTransferModal) {
      loadOperators();
    }
  }, [showTransferModal]);

  const handleTransfer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!transferOperatorId || !transferReason.trim()) {
      setActionError("Selecione o operador e informe o motivo.");
      return;
    }

    setActionLoading(true);
    try {
      await apiFetch(`/api/v1/propostas/${propostaId}/transferir`, {
        method: "POST",
        body: JSON.stringify({
          operador_id: transferOperatorId,
          motivo: transferReason,
        }),
      });
      setActionSuccess("Transferência solicitada.");
      setShowTransferModal(false);
      setTransferOperatorId("");
      setTransferReason("");
      await Promise.all([loadProposal(), loadAudit()]);
    } catch (err) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError("Não foi possível transferir a proposta.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusAdjust = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!statusValue || !statusReason.trim()) {
      setActionError("Selecione o status e informe o motivo.");
      return;
    }

    setActionLoading(true);
    try {
      await apiFetch(`/api/v1/propostas/${propostaId}/ajustar-status`, {
        method: "POST",
        body: JSON.stringify({
          status: statusValue,
          motivo: statusReason,
        }),
      });
      setActionSuccess("Status ajustado.");
      setShowStatusModal(false);
      setStatusValue("");
      setStatusReason("");
      await Promise.all([loadProposal(), loadAudit()]);
    } catch (err) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError("Não foi possível ajustar o status.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSend = async () => {
    if (!propostaId) return;
    setSendLoading(true);
    setSendError(null);
    setSendSuccess(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const token = getToken();
      const response = await fetch(
        `${baseUrl}/api/v1/propostas/${propostaId}/enviar`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );

      if (response.status === 422) {
        const payload = (await response.json()) as PrecheckPayload;
        setPrecheck(payload);
        setShowPrecheckModal(true);
        return;
      }

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Não foi possível enviar a proposta.");
      }

      setSendSuccess("Proposta enviada para análise.");
      await Promise.all([loadProposal(), loadAudit()]);
    } catch (err) {
      if (err instanceof Error) {
        setSendError(err.message);
      } else {
        setSendError("Não foi possível enviar a proposta.");
      }
    } finally {
      setSendLoading(false);
    }
  };

  const renderPrecheckContent = (dense = false) => {
    if (precheckLoading) {
      return (
        <p className="text-sm text-slate-500">Carregando pré-checagem...</p>
      );
    }

    if (precheckError) {
      return <p className="text-sm text-rose-600">{precheckError}</p>;
    }

    if (
      normalizedPrecheck.errors.length === 0 &&
      normalizedPrecheck.warnings.length === 0 &&
      normalizedPrecheck.missingFields.length === 0 &&
      normalizedPrecheck.missingDocs.length === 0
    ) {
      return (
        <p className="text-sm text-slate-500">
          Nenhuma pendência encontrada na pré-checagem.
        </p>
      );
    }

    return (
      <div className={dense ? "space-y-3" : "space-y-4"}>
        {normalizedPrecheck.errors.length > 0 ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
            <p className="text-xs font-semibold uppercase text-rose-700">
              Erros
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-700">
              {normalizedPrecheck.errors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {normalizedPrecheck.warnings.length > 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold uppercase text-amber-700">
              Avisos
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-700">
              {normalizedPrecheck.warnings.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {normalizedPrecheck.missingFields.length > 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-600">
              Campos faltantes
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {normalizedPrecheck.missingFields.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {normalizedPrecheck.missingDocs.length > 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase text-slate-600">
              Documentos faltantes
            </p>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {normalizedPrecheck.missingDocs.map((doc, index) => (
                <li
                  key={`${doc.id ?? index}-${doc.label ?? doc.nome ?? doc.name}`}
                  className="flex flex-col gap-2 rounded-lg border border-slate-200 p-2"
                >
                  <span className="text-sm font-semibold text-slate-700">
                    {doc.label ?? doc.nome ?? doc.name ?? `Documento ${index + 1}`}
                  </span>
                  <label className="text-xs text-slate-500">
                    Upload rápido
                    <input
                      type="file"
                      className="mt-1 block w-full text-xs"
                    />
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">
          Proposta #{propostaId}
        </h1>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Resumo</h2>
        {proposalError ? (
          <p className="mt-2 text-sm text-rose-600">{proposalError}</p>
        ) : loadingProposal ? (
          <p className="mt-2 text-sm text-slate-500">Carregando proposta...</p>
        ) : proposal ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
            <div>
              <p className="text-xs uppercase text-slate-400">Status</p>
              <p className="font-semibold text-slate-900">
                {proposal.status ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Operador</p>
              <p className="font-semibold text-slate-900">
                {proposal.operador?.nome ??
                  proposal.operador_id ??
                  "Não definido"}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            Nenhuma informação disponível.
          </p>
        )}
      </section>

      {isOperador ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">
                Pré-checagem
              </h2>
              <p className="text-xs text-slate-500">
                Valide a proposta antes de enviar para análise.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => loadPrecheck(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Pré-checar
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sendLoading}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
              >
                {sendLoading ? "Enviando..." : "Enviar para análise"}
              </button>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {sendError ? (
              <p className="text-sm text-rose-600">{sendError}</p>
            ) : null}
            {sendSuccess ? (
              <p className="text-sm text-emerald-600">{sendSuccess}</p>
            ) : null}
            {precheck ? renderPrecheckContent() : null}
          </div>
        </section>
      ) : null}

      {isGestao ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">
                Ações (Gestão)
              </h2>
              <p className="text-xs text-slate-500">
                Use estas ações apenas com justificativa registrada.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowTransferModal(true)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Transferir operador
              </button>
              <button
                type="button"
                onClick={() => setShowStatusModal(true)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Ajustar status
              </button>
            </div>
          </div>
          {actionError ? (
            <p className="mt-3 text-sm text-rose-600">{actionError}</p>
          ) : null}
          {actionSuccess ? (
            <p className="mt-3 text-sm text-emerald-600">{actionSuccess}</p>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Auditoria</h2>
        {auditError ? (
          <p className="mt-2 text-sm text-rose-600">{auditError}</p>
        ) : loadingAudit ? (
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

      {showTransferModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">
              Transferir operador
            </h2>
            <form className="mt-4 space-y-3" onSubmit={handleTransfer}>
              <div className="space-y-1">
                <label
                  htmlFor="operator"
                  className="text-xs font-medium text-slate-500"
                >
                  Operador
                </label>
                <select
                  id="operator"
                  value={transferOperatorId}
                  onChange={(event) => setTransferOperatorId(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Selecione</option>
                  {loadingOperators ? (
                    <option disabled>Carregando...</option>
                  ) : null}
                  {operators.map((op) => (
                    <option key={op.id} value={String(op.id)}>
                      {op.nome ?? op.name ?? op.email ?? `Operador ${op.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="transfer-reason"
                  className="text-xs font-medium text-slate-500"
                >
                  Motivo
                </label>
                <textarea
                  id="transfer-reason"
                  value={transferReason}
                  onChange={(event) => setTransferReason(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  rows={3}
                  required
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {actionLoading ? "Salvando..." : "Transferir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showStatusModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">
              Ajustar status
            </h2>
            <form className="mt-4 space-y-3" onSubmit={handleStatusAdjust}>
              <div className="space-y-1">
                <label
                  htmlFor="status"
                  className="text-xs font-medium text-slate-500"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={statusValue}
                  onChange={(event) => setStatusValue(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Selecione</option>
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
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
              <div className="space-y-1">
                <label
                  htmlFor="status-reason"
                  className="text-xs font-medium text-slate-500"
                >
                  Motivo
                </label>
                <textarea
                  id="status-reason"
                  value={statusReason}
                  onChange={(event) => setStatusReason(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  rows={3}
                  required
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {actionLoading ? "Salvando..." : "Ajustar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showPrecheckModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                Pré-checagem bloqueou o envio
              </h2>
              <p className="text-sm text-slate-600">
                Ajuste os pontos abaixo antes de enviar para análise.
              </p>
            </div>
            <div className="mt-4">{renderPrecheckContent(true)}</div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPrecheckModal(false)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
