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
   | `NEXT_PUBLIC_API_BASE_URL` | `https://sof-web.onrender.com` (sem barra no final) |

6. **Deploy**. Anote a URL: `https://xxxx.vercel.app`.

---

## Parte 2 — API no Render

### 2.1 Postgres

1. https://dashboard.render.com → **New +** → **PostgreSQL** → Free.
2. Copie a **Internal Database URL**.

### 2.2 Web Service (Docker)

**Importante:** depois de criar o Web Service, volte em **Environment** e use **Link Database** para vincular o Postgres criado em 2.1. Isso preenche `DATABASE_URL` automaticamente. Sem isso, a API tenta `127.0.0.1:5432` e o deploy falha.

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
   | `FRONTEND_URL` | URL do Vercel, ex: `https://sof-web1.vercel.app` (sem barra no final) |
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

7. **Usuários de teste (plano Free — sem Shell no Render)**

O plano gratuito do Render **não inclui Shell**. Duas opções:

**Opção A — automático (recomendado):** após merge do PR com seed no deploy, cada redeploy da API roda `db:seed` sozinho (variável `SEED_ON_DEPLOY=true` por padrão).

**Opção B — GitHub Actions (alternativa):**

1. Render → Postgres → copie a **External Database URL**
2. GitHub → repo → **Settings → Secrets → Actions** → crie `RENDER_DATABASE_URL`
3. **Actions** → **Seed banco (produção)** → **Run workflow**

Usuários criados:

| E-mail | Senha |
|--------|-------|
| operador@casa-senior.dev | password |
| analista@casa-senior.dev | password |
| gestao@casa-senior.dev | password |
| loja@casa-senior.dev | password |

Para desativar seed automático depois: Render → `SEED_ON_DEPLOY=false`

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
| CORS / login falha | `FRONTEND_URL` = URL exata do Vercel; `NEXT_PUBLIC_API_BASE_URL` sem `/` no final; redeploy Render após mudar env |
| `127.0.0.1:5432 connection refused` | Web Service → **Environment** → **Link Database** (Postgres) ou cole `DATABASE_URL` (Internal URL) manualmente |
| API cai no deploy / `regiaos` | `DATABASE_URL` + `DB_CONNECTION=pgsql`; merge PR com fix Regiao |
| API lenta no 1º acesso | Plano Free do Render “dorme” ~1 min |
| Vercel não acha Next.js | Root Directory = `apps/web` |
