# Publicar o SOF na internet (sem instalar no seu PC)

Você só precisa de conta no **GitHub**, **Vercel** (portal) e um host para a **API Laravel**.

## Visão geral

| Parte | Repositório | Onde hospedar | Custo típico |
|-------|-------------|---------------|--------------|
| Portal (Next.js) | `Onigui/sof-web` | [Vercel](https://vercel.com) | Hobby grátis para testes |
| API (Laravel) | `Onigui/sof-api` | **Render** (recomendado se Railway expirou) | Plano Free (com limites) |

O frontend usa `NEXT_PUBLIC_API_BASE_URL` = URL da API **sem** `/api` no final.

---

## Railway — trial expirou?

Se aparecer *"Your trial has expired. Please select a plan to continue using Railway"*:

| Opção | Quando faz sentido |
|--------|-------------------|
| **Assinar Railway** (Hobby ~US$ 5/mês) | Quer manter o que já configurou, sem mudar nada |
| **Migrar para Render** (abaixo) | Quer continuar **sem pagar** para testes |
| **Fly.io / VPS** | Mais controle; costuma exigir cartão ou configuração manual |

O restante deste guia usa **Render + Vercel**, sem Railway.

---

## Passo 1 — API no Render (grátis para testes)

### 1.1 Banco PostgreSQL

1. https://dashboard.render.com → login com **GitHub**
2. **New +** → **PostgreSQL**
3. Nome: `sof-db` → plano **Free**
4. Crie e copie a **Internal Database URL** (ou External, se pedir)

> Banco Free do Render expira após **90 dias** se não atualizar o plano — ok para homologação.

### 1.2 Web Service (API Laravel) — obrigatório **Docker**

Se o log mostrar `Using Node.js` e `composer: command not found`, o Render está no runtime errado.

1. **New +** → **Web Service** → `Onigui/sof-api`
2. **Environment: Docker** (não Node / Native)
3. **Dockerfile Path:** `Dockerfile`
4. **Remova** Build Command e Start Command manuais (vazios)
5. Plano **Free**

O repo precisa do `Dockerfile` na raiz (veja branch `cursor/fix-railway-composer-945d` ou adicione pelo GitHub).

Guia detalhado: `sof-api/docs/DEPLOY-RENDER.md`

### 1.3 Variáveis de ambiente (Render → Environment)

| Variável | Valor |
|----------|--------|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | gere no Codespace: `php artisan key:generate --show` |
| `APP_URL` | `https://SEU-SERVICO.onrender.com` |
| `FRONTEND_URL` | URL do Vercel (passo 2) |
| `DB_CONNECTION` | `pgsql` |
| `DATABASE_URL` | URL do Postgres Render |
| `SESSION_DRIVER` | `database` |
| `QUEUE_CONNECTION` | `sync` |
| `CACHE_STORE` | `database` |

### 1.4 Após o deploy

No **Shell** do serviço Render (ou one-off job):

```bash
php artisan db:seed --force
```

Teste: `https://SEU-SERVICO.onrender.com/up`

**Limites do Free:** o serviço **dorme** após ~15 min sem acesso; o primeiro acesso pode levar ~1 minuto (cold start).

---

## Passo 2 — Portal no Vercel

1. https://vercel.com → importe `Onigui/sof-web`
2. Variável:

| Nome | Valor |
|------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://SEU-SERVICO.onrender.com` |

3. Deploy → abra a URL → login: `operador@casa-senior.dev` / `password` (após seed)

---

## Passo 3 — CORS

Na API, `FRONTEND_URL` deve ser **exatamente** a URL do Vercel (`https://...`, sem barra no final).

Arquivo `config/cors.php` no `sof-api` usa essa variável.

---

## Corrigir composer.lock no GitHub (recomendado)

No `sof-api`, use **Codespaces** ou PC:

```bash
composer update mercadopago/dx-php maatwebsite/excel --no-interaction
git add composer.lock
git commit -m "fix: sincronizar composer.lock"
git push
```

Ou adicione `railpack.json` / variável de build com `composer update` (ver `docs/FIX-RAILWAY-COMPOSER.md` no repo da API).

---

## Checklist

- [ ] Postgres Render criado
- [ ] Web Service Render **Live**
- [ ] `GET .../up` OK
- [ ] `migrate` + `db:seed` executados
- [ ] Vercel com `NEXT_PUBLIC_API_BASE_URL`
- [ ] `FRONTEND_URL` = URL Vercel
- [ ] Login no portal funciona

---

## Comparativo rápido

| Plataforma | API Laravel | Grátis longo prazo | Observação |
|------------|-------------|--------------------|------------|
| **Render** | Sim | Sim (com limites) | Melhor substituto do Railway para testes |
| **Railway** | Sim | Trial acabou | Pago após trial |
| **Vercel** | Não (só front) | Sim | Use só para `sof-web` |
| **Fly.io** | Sim | Cartão / créditos | Alternativa técnica |

Para **produção** da financeira, planeje plano pago (Render Starter, Railway Hobby, ou VPS) com domínio próprio.
