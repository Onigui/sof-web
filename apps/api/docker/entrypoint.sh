#!/bin/sh
set -e

if [ -z "$APP_KEY" ]; then
  echo "ERRO: defina APP_KEY nas variáveis do Render."
  exit 1
fi

db_connection="${DB_CONNECTION:-sqlite}"

if [ "$db_connection" = "pgsql" ] || [ "$db_connection" = "mysql" ] || [ "$db_connection" = "mariadb" ]; then
  if [ -z "$DATABASE_URL" ] && [ -z "$DB_HOST" ]; then
    echo "ERRO: banco não configurado para DB_CONNECTION=$db_connection."
    echo "No Render: Web Service → Environment → Link Database (Postgres)"
    echo "ou defina DATABASE_URL com a Internal Database URL do Postgres."
    exit 1
  fi
fi

php artisan config:clear 2>/dev/null || true
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force

if [ "${SEED_ON_DEPLOY:-true}" = "true" ]; then
  php artisan db:seed --force
fi

php artisan storage:link 2>/dev/null || true

exec php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"
