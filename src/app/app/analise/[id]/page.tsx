"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
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

type Pendencia = {
  id: string | number;
  status?: string;
  resolved?: boolean;
  resolvida_em?: string;
  descricao?: string;
  motivo?: string;
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

const isPendenciaResolvida = (pendencia: Pendencia) => {
  if (pendencia.resolved) return true;
  const status = pendencia.status?.toLowerCase();
  return status === "resolvida" || status === "resolvido" || status === "closed";
};

export default function AnaliseDetalhePage() {
  const params = useParams();
  const propostaId = params?.id as string;
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [auditItems, setAuditItems] = useState<AuditEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [loadingProposal, setLoadingProposal] = useState(true);
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [loadingPendencias, setLoadingPendencias] = useState(true);
  const [pendenciasError, setPendenciasError] = useState<string | null>(null);
  const [isGestao, setIsGestao] = useState(false);
  const [operators, setOperators] = useState<OperatorOption[]>([]);
  const [loadingOperators, setLoadingOperators] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [transferOperatorId, setTransferOperatorId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [statusValue, setStatusValue] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [selectedPendencia, setSelectedPendencia] = useState<Pendencia | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
export default function AnaliseDetalhePage() {
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
    const user = getUser();
    setIsGestao(user?.role === "GESTAO");
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

  const loadPendencias = async () => {
    if (!propostaId) return;
    setLoadingPendencias(true);
    setPendenciasError(null);

    try {
      const data = await apiFetch<Pendencia[]>(
        `/api/v1/propostas/${propostaId}/pendencias`,
      );
      setPendencias(data ?? []);
    } catch (err) {
      if (err instanceof Error) {
        setPendenciasError(err.message);
      } else {
        setPendenciasError("Não foi possível carregar pendências.");
      }
    } finally {
      setLoadingPendencias(false);
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
          Análise #{propostaId}
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
    loadProposal();
    loadAudit();
    loadPendencias();
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

  const handleReopen = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!selectedPendencia || !reopenReason.trim()) {
      setActionError("Informe o motivo para reabrir.");
      return;
    }

    setActionLoading(true);
    try {
      await apiFetch(`/api/v1/pendencias/${selectedPendencia.id}/reabrir`, {
        method: "POST",
        body: JSON.stringify({ motivo: reopenReason }),
      });
      setActionSuccess("Pendência reaberta.");
      setShowReopenModal(false);
      setReopenReason("");
      setSelectedPendencia(null);
      await loadPendencias();
    } catch (err) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError("Não foi possível reabrir a pendência.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">
          Análise #{propostaId}
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
        <h2 className="text-sm font-semibold text-slate-700">Pendências</h2>
        {pendenciasError ? (
          <p className="mt-2 text-sm text-rose-600">{pendenciasError}</p>
        ) : loadingPendencias ? (
          <p className="mt-2 text-sm text-slate-500">
            Carregando pendências...
          </p>
        ) : pendencias.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Nenhuma pendência encontrada.
          </p>
        ) : (
          <ul className="mt-3 space-y-3 text-sm text-slate-600">
            {pendencias.map((pendencia) => (
              <li
                key={pendencia.id}
                className="rounded-lg border border-slate-100 bg-slate-50 p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {pendencia.descricao ?? `Pendência #${pendencia.id}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      Status: {pendencia.status ?? "—"}
                    </p>
                    {pendencia.motivo ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Motivo: {pendencia.motivo}
                      </p>
                    ) : null}
                  </div>
                  {isGestao && isPendenciaResolvida(pendencia) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPendencia(pendencia);
                        setShowReopenModal(true);
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      Reabrir
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

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

      {showReopenModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">
              Reabrir pendência
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Pendência #{selectedPendencia?.id}
            </p>
            <form className="mt-4 space-y-3" onSubmit={handleReopen}>
              <div className="space-y-1">
                <label
                  htmlFor="reopen-reason"
                  className="text-xs font-medium text-slate-500"
                >
                  Motivo
                </label>
                <textarea
                  id="reopen-reason"
                  value={reopenReason}
                  onChange={(event) => setReopenReason(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  rows={3}
                  required
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {actionLoading ? "Salvando..." : "Reabrir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
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
