# Deploy só pelo navegador (sem PC)

Um único repositório GitHub (`Onigui/sof-web`) com front e API.

## Parte 1 — Portal no Vercel

1. Acesse https://vercel.com → login com GitHub.
2. **Add New → Project** → importe `Onigui/sof-web`.
3. Branch: `main`.
4. **Root Directory:** `apps/web` (obrigatório — configure em **Settings → Build and Deployment → Root Directory**, não no `vercel.json`).
5. **Environment Variables:**

   | Nome | Valor |
   |------|-------|
   | `NEXT_PUBLIC_API_BASE_URL` | URL do Render (sem `/api`) |

6. **Deploy**. Anote a URL: `https://xxxx.vercel.app` — **este é o link do sistema** (login, propostas, etc.).

> A URL do Render é só a **API**. Abrir no navegador mostra JSON de status, não o portal.

---

## Parte 2 — API no Render

### 2.1 Postgres

1. https://dashboard.render.com → **New +** → **PostgreSQL** → Free.
2. Copie a **Internal Database URL**.

### 2.2 Web Service (Docker)

1. **New +** → **Web Service** → repo `Onigui/sof-web`.
2. **Root Directory:** deixe **vazio** (usa `Dockerfile` na raiz) **ou** defina `apps/api` (usa `apps/api/Dockerfile`).
3. **Environment: Docker**
4. **Dockerfile Path:**
   - Root vazio → `./Dockerfile`
   - Root `apps/api` → `Dockerfile`
5. **Build Command** e **Start Command:** vazios.
6. Variáveis:

   | Variável | Valor |
   |----------|--------|
   | `APP_ENV` | `production` |
   | `APP_DEBUG` | `false` |
   | `APP_KEY` | ver abaixo |
   | `APP_URL` | `https://SEU-SERVICO.onrender.com` |
   | `FRONTEND_URL` | URL do Vercel (sem barra no final) |
   | `DB_CONNECTION` | `pgsql` |
   | `DATABASE_URL` | Internal URL do Postgres |
   | `SESSION_DRIVER` | `database` |
   | `QUEUE_CONNECTION` | `sync` |
   | `CACHE_STORE` | `database` |

**Gerar `APP_KEY` (escolha uma opção):**

**Opção A — GitHub Actions (recomendado se Codespaces não abrir):**

1. GitHub → **Actions** → workflow **Gerar APP_KEY** → **Run workflow**
2. Abra o job concluído → expanda o step **Exibir APP_KEY para o Render**
3. Copie o valor `base64:...` e cole em `APP_KEY` no Render

**Opção B — Codespaces:**

GitHub → **Code** → **Codespaces** → terminal:

```bash
cd apps/api && php artisan key:generate --show
```

7. **Deploy**. Teste: `https://SEU-SERVICO.onrender.com/up`

7. Shell do Render:

```bash
php artisan db:seed --force
```

### 2.3 Ligar Vercel à API

Vercel → Project → **Settings → Environment Variables** → atualize `NEXT_PUBLIC_API_BASE_URL` e **Redeploy**.

---

## Parte 3 — Editar código no futuro

| Tarefa | Onde |
|--------|------|
| Tela do portal | `apps/web` → Edit ou Codespaces |
| API / regras de negócio | `apps/api` → Edit ou Codespaces |
| Build | Vercel + Render dashboards |
| Login de teste | `operador@casa-senior.dev` / `password` |

---

## Problemas comuns

| Erro | Solução |
|------|---------|
| `composer: command not found` | Runtime = **Docker**, não Node |
| `Dockerfile: no such file` | Root Directory vazio + `Dockerfile` na raiz **ou** Root = `apps/api` |
| CORS / login falha | `FRONTEND_URL` = URL exata do Vercel |
| API lenta no 1º acesso | Plano Free do Render “dorme” ~1 min |
| Vercel não acha Next.js | Root Directory = `apps/web` |
