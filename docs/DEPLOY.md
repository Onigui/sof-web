# Publicar o SOF na internet (sem instalar no seu PC)

Você só precisa de conta no **GitHub** (onde já estão os repositórios), **Vercel** (frontend) e **Railway** (API). Cada `git push` pode publicar automaticamente.

## Visão geral

| Parte | Repositório | Onde hospedar | URL exemplo |
|-------|-------------|---------------|-------------|
| Portal (Next.js) | `Onigui/sof-web` | [Vercel](https://vercel.com) | `https://sof-web.vercel.app` |
| API (Laravel) | `Onigui/sof-api` | [Railway](https://railway.app) | `https://sof-api.up.railway.app` |

O frontend chama a API pela variável `NEXT_PUBLIC_API_BASE_URL` (sem `/api` no final).

---

## Passo 1 — API no Railway (recomendado)

1. Acesse https://railway.app e entre com **GitHub**.
2. **New Project** → **Deploy from GitHub repo** → escolha `Onigui/sof-api`.
3. No mesmo projeto, **Add service** → **Database** → **PostgreSQL** (grátis no trial).
4. No serviço da API, aba **Variables**, configure:

| Variável | Valor |
|----------|--------|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | gere com `php artisan key:generate --show` (uma vez, no Actions ou local) |
| `APP_URL` | URL pública da API (Railway gera em **Settings → Networking → Generate Domain**) |
| `FRONTEND_URL` | URL do Vercel (passo 2) — ex.: `https://seu-app.vercel.app` |
| `DB_CONNECTION` | `pgsql` |
| `DATABASE_URL` | copie da aba **Connect** do PostgreSQL (URL interna) |
| `SESSION_DRIVER` | `database` |
| `QUEUE_CONNECTION` | `database` |
| `CACHE_STORE` | `database` |

5. **Settings → Deploy** → confira o comando de start (o arquivo `railway.toml` do repo já sugere migrate + servidor).
6. **Generate Domain** e anote a URL — será a base da API.

**Seed (usuários de teste):** no Railway, abra o serviço → **Settings** → rode um deploy one-off ou use o terminal:

```bash
php artisan migrate --force
php artisan db:seed --force
```

Usuários após o seed: `operador@casa-senior.dev` / `password` (e analista, gestão, loja).

> Use a branch `cursor/saas-ready-945d` na API se `main` ainda estiver com merge quebrado — ou mescle essa PR antes do deploy.

---

## Passo 2 — Frontend no Vercel (mais simples que Actions)

1. https://vercel.com → **Add New** → **Project** → importe `Onigui/sof-web`.
2. Framework: **Next.js** (detectado automaticamente).
3. **Environment Variables**:

| Nome | Valor |
|------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | URL da API no Railway, ex.: `https://sof-api-production.up.railway.app` |

4. **Deploy**. A cada push em `main`, o Vercel publica de novo.

Abra a URL do Vercel e faça login com um usuário do seed.

---

## Passo 3 (opcional) — Deploy do front via GitHub Actions

Se preferir publicar pelo Actions em vez do painel da Vercel:

1. No Vercel: **Project Settings** → copie **Org ID** e **Project ID**.
2. Crie um token: https://vercel.com/account/tokens
3. No GitHub `sof-web` → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Conteúdo |
|--------|----------|
| `VERCEL_TOKEN` | token da Vercel |
| `VERCEL_ORG_ID` | org id |
| `VERCEL_PROJECT_ID` | project id |

4. Em **Variables** (repositório):

| Variable | Conteúdo |
|----------|----------|
| `NEXT_PUBLIC_API_BASE_URL` | URL da API Railway |

5. Push em `main` ou rode manualmente: **Actions** → **Deploy — Vercel (SOF Web)** → **Run workflow**.

---

## Passo 4 (opcional) — API via GitHub Actions no Railway

1. Railway → **Account Settings** → **Tokens** → crie um token.
2. No serviço da API, **Settings** → copie o **Service ID** e **Environment ID** (ou use deploy só pelo GitHub connect — mais fácil).
3. GitHub `sof-api` → secrets:

| Secret | Uso |
|--------|-----|
| `RAILWAY_TOKEN` | token Railway |

O workflow `deploy-railway.yml` dispara deploy após push em `main` (se o secret existir).

**Alternativa mais fácil:** só conectar o repo no Railway (passo 1) — não precisa de Actions na API.

---

## CORS

A API usa `FRONTEND_URL` no `.env` (veja `config/cors.php`). Deve ser **exatamente** a URL do Vercel, com `https://`, sem barra no final.

---

## Checklist rápido

- [ ] API no ar (`GET https://sua-api.up.railway.app/up` retorna OK)
- [ ] PostgreSQL ligado e migrations rodadas
- [ ] Seed executado
- [ ] Vercel com `NEXT_PUBLIC_API_BASE_URL` apontando para a API
- [ ] `FRONTEND_URL` na API = URL do Vercel
- [ ] Login no portal com `operador@casa-senior.dev` / `password`

---

## Custos

- **Vercel:** plano hobby costuma bastar para testes.
- **Railway:** trial/créditos; PostgreSQL + web service consomem crédito mensal.

Para produção da financeira, depois vale domínio próprio (`app.suaempresa.com.br`) nas duas plataformas.
