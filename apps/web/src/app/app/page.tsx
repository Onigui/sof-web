"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getUser } from "@/lib/session";

type QuickLink = {
  title: string;
  description: string;
  href: string;
};

const quickLinksByRole: Record<string, QuickLink[]> = {
  OPERADOR: [
    {
      title: "Nova proposta",
      description: "Inicie um atendimento com checklist e documentos.",
      href: "/app/propostas/nova",
    },
    {
      title: "Minhas propostas",
      description: "Veja rascunhos e propostas em andamento.",
      href: "/app/propostas",
    },
    {
      title: "DUT",
      description: "Consulte pendências de transferência de veículo.",
      href: "/app/dut",
    },
  ],
  ANALISTA: [
    {
      title: "Fila de análise",
      description: "Propostas aguardando triagem e decisão.",
      href: "/app/fila",
    },
    {
      title: "Propostas",
      description: "Busque e acompanhe qualquer proposta da empresa.",
      href: "/app/propostas",
    },
    {
      title: "Relatórios",
      description: "Exporte fechamentos e indicadores operacionais.",
      href: "/app/relatorios",
    },
  ],
  GESTAO: [
    {
      title: "Fila",
      description: "Visão geral do volume em análise.",
      href: "/app/fila",
    },
    {
      title: "Configurações",
      description: "Bancos, produtos, lojas e regras da operação.",
      href: "/app/config",
    },
    {
      title: "Billing",
      description: "Assinatura, faturas e status do plano.",
      href: "/app/billing",
    },
  ],
  LOJA: [
    {
      title: "Novo lead",
      description: "Cadastre um cliente interessado em financiamento.",
      href: "/app/leads/novo",
    },
    {
      title: "Meus leads",
      description: "Acompanhe atendimentos enviados pela loja.",
      href: "/app/leads",
    },
  ],
};

export default function AppHomePage() {
  const router = useRouter();
  const user = getUser();
  const role = user?.role ?? "OPERADOR";
  const quickLinks = quickLinksByRole[role] ?? quickLinksByRole.OPERADOR;

  useEffect(() => {
    if (user?.role === "LOJA") {
      router.replace("/app/leads");
    }
  }, [router, user?.role]);

  if (user?.role === "LOJA") {
    return null;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">
          Olá{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Ambiente de demonstração pronto. Use os atalhos abaixo ou o menu à
          esquerda para começar.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
          >
            <h2 className="text-sm font-semibold text-slate-900">
              {item.title}
            </h2>
            <p className="mt-2 text-sm text-slate-500">{item.description}</p>
          </Link>
        ))}
      </div>

      {role === "OPERADOR" ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Dica: já existe uma proposta de exemplo. Abra{" "}
          <Link href="/app/propostas" className="font-semibold text-slate-900">
            Propostas
          </Link>{" "}
          para visualizar ou crie uma nova.
        </div>
      ) : null}
    </div>
  );
}
