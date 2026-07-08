# SOF Web — Portal Operacional

Frontend Next.js do SaaS SOF (financeira). Conecta-se à API Laravel em [sof-api](https://github.com/Onigui/sof-api).

## Só navegador (sem PC)

- **Estratégia:** [docs/ESTRATEGIA.md](docs/ESTRATEGIA.md) — por que manter como site e não extensão/plugin
- **Deploy:** [docs/DEPLOY-SO-BROWSER.md](docs/DEPLOY-SO-BROWSER.md) — Vercel + Render passo a passo
- **Arquivos da API para copiar no GitHub:** pasta [deploy/sof-api/](deploy/sof-api/)
- **Editar no navegador:** GitHub Codespaces (botão Code → Codespaces neste repo)

## Configuração local (opcional)

```bash
cp .env.example .env.local
npm install
```

Edite `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Usuários de desenvolvimento (após seed da API)

| E-mail | Papel | Senha |
|--------|-------|-------|
| operador@casa-senior.dev | Operador | password |
| analista@casa-senior.dev | Analista | password |
| gestao@casa-senior.dev | Gestão | password |
| loja@casa-senior.dev | Loja | password |

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run lint` — ESLint
