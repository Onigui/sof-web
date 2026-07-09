#!/bin/sh
set -e

if [ -z "$APP_KEY" ]; then
  echo "ERRO: defina APP_KEY nas variáveis do Render."
  exit 1
fi

if [ -z "$DATABASE_URL" ] && [ "${DB_CONNECTION:-sqlite}" = "sqlite" ]; then
  echo "ERRO: defina DATABASE_URL (Postgres do Render) e DB_CONNECTION=pgsql."
  exit 1
fi

php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force

if [ "${SEED_ON_DEPLOY:-true}" = "true" ]; then
  php artisan db:seed --force
fi

php artisan storage:link 2>/dev/null || true

exec php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"
