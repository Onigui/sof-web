# SOF — Estratégia para desenvolver só pelo navegador

## Resposta direta: qual formato escolher?

| Formato | Recomendado? | Por quê |
|---------|--------------|---------|
| **Site / SaaS web** | **Sim** | Operadores, analistas e gestão acessam de qualquer lugar, sem instalar nada. Já é o que o SOF faz. |
| **Extensão de navegador** | Não | Ainda precisa de API e banco; cada usuário instala algo; difícil para TI da financeira; não resolve deploy. |
| **Plugin (Excel, etc.)** | Não | Só faria sentido para um recorte (ex.: exportar planilha), não para o fluxo inteiro de propostas. |
| **App desktop externo** | Não | Você não tem PC; distribuição e atualização são piores que web. |

**Conclusão:** mantenha o SOF como **portal web (SaaS)**. O que muda é **como publicamos e editamos** — tudo via GitHub + Vercel + Render, sem máquina local.

---

## Melhor cenário técnico (3 opções)

### Cenário A — Recomendado agora (2 repositórios, 2 hosts)

```
GitHub (editar no navegador)
    ├── sof-web  ──push──►  Vercel   (portal Next.js)
    └── sof-api  ──push──►  Render   (API Laravel em Docker)
              └── Postgres no Render
```

- **Vantagem:** quase nada de reescrita; usa o Laravel que já existe.
- **Desenvolvimento no navegador:** GitHub.com (editar arquivos) ou **GitHub Codespaces** (VS Code na nuvem).
- **Deploy:** conectar os dois repos nos painéis; cada `git push` na `main` publica.

### Cenário B — Futuro (1 repositório, 1 host) — se quiser simplificar depois

```
GitHub ──push──► Vercel (Next.js + API em Route Handlers + Supabase)
```

- **Vantagem:** um único `git push`, tudo na Vercel; ótimo para “só navegador”.
- **Custo:** migrar a lógica do Laravel (meses de trabalho ou fazer por partes).

### Cenário C — Não recomendado

Extensão/plugin que fala com API — mais complexo para adotar, mesmo backend, zero ganho para seu caso.

---

## Fluxo de trabalho 100% navegador

1. **Editar código:** GitHub → repositório → arquivo → lápis (Edit) **ou** Codespaces (`.devcontainer` neste repo).
2. **Publicar front:** merge na `main` do `sof-web` → Vercel faz deploy sozinho.
3. **Publicar API:** merge na `main` do `sof-api` (com `Dockerfile`) → Render faz deploy em Docker.
4. **Testar:** abrir URL do Vercel; login com usuários do seed da API.

Nenhum passo exige instalar Node ou PHP no seu computador.

---

## O que fazer agora (ordem)

1. Seguir **[DEPLOY-SO-BROWSER.md](./DEPLOY-SO-BROWSER.md)** — passo a passo só com navegador.
2. Copiar arquivos de **`deploy/sof-api/`** para o repo `Onigui/sof-api` pelo GitHub (Add file).
3. Conectar Vercel ao `sof-web` e Render ao `sof-api` (Docker).
4. Quando estiver estável, avaliar Cenário B só se quiser um único host.

---

## Vercel não foi “ignorado”

- **Vercel** = portal (`sof-web`) — é onde vocês já trabalham em outros projetos.
- **Render** (ou similar) = API Laravel — Vercel não roda PHP/Laravel completo de forma confiável.
- Do ponto de vista do usuário final: **um único site** (URL do Vercel); a API fica invisível atrás de `NEXT_PUBLIC_API_BASE_URL`.
