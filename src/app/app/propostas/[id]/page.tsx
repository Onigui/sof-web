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
    </div>
  );
}
