# Estratégia SOF — site SaaS (monorepo)

## Decisão

Manter **um site SaaS** (portal web + API), **não** extensão de navegador nem plugin.

| Opção | Usar? | Motivo |
|-------|-------|--------|
| **Site SaaS (monorepo)** | Sim | Um clone, um fluxo de deploy, edição no Codespaces |
| Dois repositórios separados | Não | Duplica esforço; API quebrada sem push fácil |
| Extensão de navegador | Não | Instalação por usuário; não resolve backend |

## Arquitetura

```
Onigui/sof-web (monorepo)
├── apps/web   ──Vercel──►  Portal Next.js
└── apps/api   ──Render──►  API Laravel + PostgreSQL
         ▲
         └── NEXT_PUBLIC_API_BASE_URL
```

## Fluxo de trabalho (só navegador)

1. **Código:** GitHub `Onigui/sof-web` → branch → PR → merge na `main`.
2. **Portal:** Vercel detecta mudanças em `apps/web` e faz deploy.
3. **API:** Render detecta mudanças em `apps/api` (Docker) e faz deploy.
4. **Banco:** Postgres no Render; `migrate` + `db:seed` no shell.

## Próximos passos após merge

1. Conectar Vercel com root `apps/web`.
2. Conectar Render com root `apps/api` (Docker).
3. Configurar variáveis (`NEXT_PUBLIC_API_BASE_URL`, `FRONTEND_URL`, `APP_KEY`, `DATABASE_URL`).
4. Rodar seed e testar login.

O repositório `Onigui/sof-api` pode ser arquivado após validar o monorepo.
