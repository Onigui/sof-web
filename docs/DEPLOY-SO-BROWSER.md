# Deploy só pelo navegador (sem PC)

Tempo estimado: ~30–45 min na primeira vez.

## Parte 1 — Portal no Vercel (sof-web)

1. Acesse https://vercel.com → login com GitHub.
2. **Add New → Project** → importe `Onigui/sof-web`.
3. Branch: `main` (ou `cursor/saas-ready-945d` se ainda não mergeou).
4. **Environment Variables:**

   | Nome | Valor (preencha depois da API) |
   |------|--------------------------------|
   | `NEXT_PUBLIC_API_BASE_URL` | `https://SEU-API.onrender.com` |

5. **Deploy**. Anote a URL: `https://xxxx.vercel.app`.

---

## Parte 2 — API no Render (sof-api)

### 2.1 Arquivos no GitHub (obrigatório)

O Render em modo **Node** não tem Composer. É preciso o **Dockerfile** na `main` do `sof-api`.

**Pelo navegador:**

1. Abra https://github.com/Onigui/sof-api
2. Para cada arquivo abaixo, **Add file** → cole o conteúdo de `deploy/sof-api/` **neste repositório sof-web** (mesmos nomes de pasta):

   | Criar no sof-api | Copiar de |
   |------------------|-----------|
   | `Dockerfile` | `deploy/sof-api/Dockerfile` |
   | `docker/entrypoint.sh` | `deploy/sof-api/docker/entrypoint.sh` |
   | `render.yaml` | `deploy/sof-api/render.yaml` (opcional) |

3. **Commit** na branch `main`.

### 2.2 Postgres no Render

1. https://dashboard.render.com → **New +** → **PostgreSQL** → Free.
2. Copie a **Internal Database URL**.

### 2.3 Web Service (Docker)

1. **New +** → **Web Service** → repo `Onigui/sof-api`.
2. **Environment: Docker** (não Node).
3. **Dockerfile Path:** `Dockerfile`.
4. **Build Command** e **Start Command:** vazios.
5. Variáveis:

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

**Gerar `APP_KEY` sem PC:** GitHub → `sof-api` → **Code** → **Codespaces** → **Create codespace** → no terminal:

```bash
php artisan key:generate --show
```

Copie o valor para `APP_KEY` no Render.

6. **Deploy**. Teste: `https://SEU-SERVICO.onrender.com/up`

7. Shell do Render:

```bash
php artisan db:seed --force
```

### 2.4 Ligar Vercel à API

Vercel → Project → **Settings → Environment Variables** → atualize:

`NEXT_PUBLIC_API_BASE_URL` = URL do Render (sem `/api`).

**Redeploy** o projeto Vercel.

---

## Parte 3 — Editar código no futuro

| Tarefa | Onde |
|--------|------|
| Mudar tela do portal | GitHub `sof-web` → Edit ou Codespaces |
| Mudar API | GitHub `sof-api` → Edit ou Codespaces |
| Ver se build passou | Vercel / Render dashboards |
| Login de teste | `operador@casa-senior.dev` / `password` |

---

## Problemas comuns

| Erro | Solução |
|------|---------|
| `composer: command not found` | Runtime = **Docker**, não Node |
| `composer.lock` desatualizado | Dockerfile já roda `composer update` |
| CORS / login falha | `FRONTEND_URL` = URL exata do Vercel |
| API lenta no 1º acesso | Plano Free do Render “dorme” ~1 min |
