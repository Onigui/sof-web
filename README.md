# SOF — SaaS Operacional Financeira (Monorepo)

Portal operacional + API em um único repositório.

| Pasta | Stack | Deploy |
|-------|-------|--------|
| `apps/web` | Next.js 16 | Vercel (root directory: `apps/web`) |
| `apps/api` | Laravel 11 | Render (Docker, root directory: `apps/api`) |

## Só navegador (sem PC)

- **Estratégia:** [docs/ESTRATEGIA.md](docs/ESTRATEGIA.md)
- **Deploy:** [docs/DEPLOY-SO-BROWSER.md](docs/DEPLOY-SO-BROWSER.md)
- **Editar código:** GitHub → **Code** → **Codespaces** neste repositório

## Configuração rápida

### Portal (apps/web)

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

`.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### API (apps/api)

```bash
cd apps/api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

## Usuários de teste (após seed)

| E-mail | Papel | Senha |
|--------|-------|-------|
| operador@casa-senior.dev | Operador | password |
| analista@casa-senior.dev | Analista | password |
| gestao@casa-senior.dev | Gestão | password |
| loja@casa-senior.dev | Loja | password |

## Repositório legado

O repositório `Onigui/sof-api` foi absorvido neste monorepo. Use apenas **`Onigui/sof-web`** (este repo) daqui em diante.
