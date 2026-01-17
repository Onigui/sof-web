"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";

type SelectOption = {
  id: string | number;
  nome?: string;
  descricao?: string;
};

type DraftPayload = {
  loja_id?: string | number | null;
  regiao_raw: string;
  produto_id: string | number;
  banco_id?: string | number | null;
  cliente_nome: string;
  cliente_cpf: string;
  cliente_celular: string;
  cliente_email?: string;
  veiculo_placa?: string;
  veiculo_renavam?: string;
  veiculo_descricao?: string;
  valor_veiculo?: string;
  valor_financiado?: string;
  status: string;
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

const steps = [
  "Origem",
  "Cliente",
  "Veículo",
  "Documentos",
  "Revisão",
];

export default function NovaPropostaPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bancos, setBancos] = useState<SelectOption[]>([]);
  const [produtos, setProdutos] = useState<SelectOption[]>([]);
  const [lojas, setLojas] = useState<SelectOption[]>([]);

  const [lojaId, setLojaId] = useState("");
  const [regiao, setRegiao] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [bancoId, setBancoId] = useState("");

  const [clienteNome, setClienteNome] = useState("");
  const [clienteCpf, setClienteCpf] = useState("");
  const [clienteCelular, setClienteCelular] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");

  const [veiculoPlaca, setVeiculoPlaca] = useState("");
  const [veiculoRenavam, setVeiculoRenavam] = useState("");
  const [veiculoDescricao, setVeiculoDescricao] = useState("");
  const [valorVeiculo, setValorVeiculo] = useState("");
  const [valorFinanciado, setValorFinanciado] = useState("");

  const [docTipo, setDocTipo] = useState<DocumentoTipo>("CNH");
  const [docFile, setDocFile] = useState<File | null>(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [bancosData, produtosData, lojasData] = await Promise.all([
          apiFetch<SelectOption[]>("/api/v1/bancos"),
          apiFetch<SelectOption[]>("/api/v1/produtos"),
          apiFetch<SelectOption[]>("/api/v1/lojas"),
        ]);
        setBancos(bancosData);
        setProdutos(produtosData);
        setLojas(lojasData);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Não foi possível carregar listas auxiliares.");
        }
      }
    };

    loadOptions();
  }, []);

  const canProceed = useMemo(() => {
    if (step === 0) {
      return regiao.trim().length > 0 && produtoId.trim().length > 0;
    }
    if (step === 1) {
      return (
        clienteNome.trim().length > 0 &&
        clienteCpf.trim().length > 0 &&
        clienteCelular.trim().length > 0
      );
    }
    return true;
  }, [step, regiao, produtoId, clienteNome, clienteCpf, clienteCelular]);

  const goNext = () => {
    if (!canProceed) {
      setError("Preencha os campos obrigatórios para continuar.");
      return;
    }
    setError(null);
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    const payload: DraftPayload = {
      loja_id: lojaId ? lojaId : null,
      regiao_raw: regiao,
      produto_id: produtoId,
      banco_id: bancoId ? bancoId : null,
      cliente_nome: clienteNome,
      cliente_cpf: clienteCpf,
      cliente_celular: clienteCelular,
      cliente_email: clienteEmail || undefined,
      veiculo_placa: veiculoPlaca || undefined,
      veiculo_renavam: veiculoRenavam || undefined,
      veiculo_descricao: veiculoDescricao || undefined,
      valor_veiculo: valorVeiculo || undefined,
      valor_financiado: valorFinanciado || undefined,
      status: "RASCUNHO",
    };

    try {
      const proposta = await apiFetch<{ id: string | number }>(
        "/api/v1/propostas",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      if (docFile) {
        const formData = new FormData();
        formData.append("tipo", docTipo);
        formData.append("arquivo", docFile);

        await apiFetch(`/api/v1/propostas/${proposta.id}/documentos`, {
          method: "POST",
          body: formData,
        });
      }

      router.push(`/app/propostas/${proposta.id}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível criar proposta.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Nova proposta</h1>
        <p className="text-sm text-slate-500">
          Complete os passos para criar um rascunho.
        </p>
        <div className="flex flex-wrap gap-2">
          {steps.map((label, index) => (
            <span
              key={label}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                index === step
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {index + 1}. {label}
            </span>
          ))}
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      {step === 0 ? (
        <section className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="loja">
              Loja (opcional)
            </label>
            <select
              id="loja"
              value={lojaId}
              onChange={(event) => setLojaId(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              {lojas.map((loja) => (
                <option key={loja.id} value={String(loja.id)}>
                  {loja.nome ?? loja.descricao ?? `Loja ${loja.id}`}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="regiao">
              Região
            </label>
            <input
              id="regiao"
              value={regiao}
              onChange={(event) => setRegiao(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Informe a região"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="produto">
              Produto
            </label>
            <select
              id="produto"
              value={produtoId}
              onChange={(event) => setProdutoId(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            >
              <option value="">Selecione</option>
              {produtos.map((produto) => (
                <option key={produto.id} value={String(produto.id)}>
                  {produto.nome ?? produto.descricao ?? `Produto ${produto.id}`}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="banco">
              Banco (opcional)
            </label>
            <select
              id="banco"
              value={bancoId}
              onChange={(event) => setBancoId(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              {bancos.map((banco) => (
                <option key={banco.id} value={String(banco.id)}>
                  {banco.nome ?? banco.descricao ?? `Banco ${banco.id}`}
                </option>
              ))}
            </select>
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="cliente-nome">
              Nome do cliente
            </label>
            <input
              id="cliente-nome"
              value={clienteNome}
              onChange={(event) => setClienteNome(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="cliente-cpf">
              CPF
            </label>
            <input
              id="cliente-cpf"
              value={clienteCpf}
              onChange={(event) => setClienteCpf(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="cliente-celular">
              Celular
            </label>
            <input
              id="cliente-celular"
              value={clienteCelular}
              onChange={(event) => setClienteCelular(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="cliente-email">
              E-mail (opcional)
            </label>
            <input
              id="cliente-email"
              type="email"
              value={clienteEmail}
              onChange={(event) => setClienteEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="veiculo-placa">
              Placa (opcional)
            </label>
            <input
              id="veiculo-placa"
              value={veiculoPlaca}
              onChange={(event) => setVeiculoPlaca(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="veiculo-renavam">
              Renavam (opcional)
            </label>
            <input
              id="veiculo-renavam"
              value={veiculoRenavam}
              onChange={(event) => setVeiculoRenavam(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="veiculo-descricao"
            >
              Descrição (opcional)
            </label>
            <input
              id="veiculo-descricao"
              value={veiculoDescricao}
              onChange={(event) => setVeiculoDescricao(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="valor-veiculo">
              Valor do veículo (opcional)
            </label>
            <input
              id="valor-veiculo"
              value={valorVeiculo}
              onChange={(event) => setValorVeiculo(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="valor-financiado"
            >
              Valor financiado (opcional)
            </label>
            <input
              id="valor-financiado"
              value={valorFinanciado}
              onChange={(event) => setValorFinanciado(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4">
          <p className="text-sm text-slate-500">
            Você pode anexar documentos agora ou pular esta etapa e enviar mais
            tarde.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="doc-tipo">
              Tipo de documento
            </label>
            <select
              id="doc-tipo"
              value={docTipo}
              onChange={(event) => setDocTipo(event.target.value as DocumentoTipo)}
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
            <label className="text-sm font-medium text-slate-700" htmlFor="doc-file">
              Arquivo
            </label>
            <input
              id="doc-file"
              type="file"
              onChange={(event) => setDocFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-4 text-sm text-slate-600">
          <p>
            Revise os dados antes de criar a proposta. Ela será salva como
            rascunho.
          </p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-700">Origem</p>
            <ul className="mt-2 space-y-1">
              <li>Loja: {lojaId || "-"}</li>
              <li>Região: {regiao || "-"}</li>
              <li>Produto: {produtoId || "-"}</li>
              <li>Banco: {bancoId || "-"}</li>
            </ul>
            <p className="mt-3 font-semibold text-slate-700">Cliente</p>
            <ul className="mt-2 space-y-1">
              <li>Nome: {clienteNome || "-"}</li>
              <li>CPF: {clienteCpf || "-"}</li>
              <li>Celular: {clienteCelular || "-"}</li>
              <li>E-mail: {clienteEmail || "-"}</li>
            </ul>
            <p className="mt-3 font-semibold text-slate-700">Veículo</p>
            <ul className="mt-2 space-y-1">
              <li>Placa: {veiculoPlaca || "-"}</li>
              <li>Renavam: {veiculoRenavam || "-"}</li>
              <li>Descrição: {veiculoDescricao || "-"}</li>
              <li>Valor do veículo: {valorVeiculo || "-"}</li>
              <li>Valor financiado: {valorFinanciado || "-"}</li>
            </ul>
            <p className="mt-3 font-semibold text-slate-700">Documento</p>
            <ul className="mt-2 space-y-1">
              <li>Tipo: {docFile ? docTipo : "Sem anexo"}</li>
              <li>Arquivo: {docFile?.name ?? "-"}</li>
            </ul>
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Voltar
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Continuar
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Salvando..." : "Criar proposta"}
          </button>
        )}
      </div>
    </div>
  );
}
