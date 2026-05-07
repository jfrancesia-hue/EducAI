#!/usr/bin/env bash
# db-setup.sh — Setup completo de la base de datos contra el proyecto Supabase elegido.
#
# Pasos:
#   1. Verifica DATABASE_URL.
#   2. Corre `pnpm db:deploy` (migraciones Prisma).
#   3. Aplica supabase/migrations/*.sql via psql (RLS + storage policies).
#   4. Corre `pnpm db:seed`.
#   5. Corre el smoke test RLS.
#
# Uso:
#   DATABASE_URL='postgresql://...' ./scripts/db-setup.sh
#
# o desde Windows (Git Bash):
#   $env:DATABASE_URL='postgresql://...'; bash ./scripts/db-setup.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "ERROR: variable de entorno '$name' no esta seteada." >&2
    echo "Pegala desde Supabase Dashboard > Project Settings > Database (connection string para Node/Prisma)." >&2
    exit 1
  fi
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: '$1' no esta instalado o no esta en PATH." >&2
    return 1
  fi
}

require_var DATABASE_URL

echo "==> [1/5] Verificando dependencias..."
require_cmd pnpm

if ! command -v psql >/dev/null 2>&1; then
  echo "WARN: 'psql' no esta instalado. Las migraciones de supabase/migrations/*.sql"
  echo "      no se aplicaran automaticamente. Instalalo (https://www.postgresql.org/download/)"
  echo "      o pega manualmente el contenido en Supabase SQL Editor."
  USE_PSQL=0
else
  USE_PSQL=1
fi

echo "==> [2/5] Aplicando migraciones Prisma (db:deploy)..."
pnpm db:deploy

if [[ "$USE_PSQL" == "1" ]]; then
  echo "==> [3/5] Aplicando supabase/migrations/*.sql con psql..."
  for sql_file in "$ROOT"/supabase/migrations/*.sql; do
    [[ -e "$sql_file" ]] || continue
    echo "    -> $(basename "$sql_file")"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$sql_file"
  done
else
  echo "==> [3/5] SKIPPED: aplica manualmente desde Supabase SQL Editor:"
  ls -1 "$ROOT"/supabase/migrations/*.sql | sed 's|^|    - |'
fi

echo "==> [4/5] Sembrando datos (db:seed)..."
pnpm db:seed

echo "==> [5/5] Corriendo smoke test RLS..."
SKIP_RLS_SMOKE=0 pnpm --filter @educai/database test:rls

echo ""
echo "OK: base de datos lista."
echo "    - Migraciones Prisma aplicadas."
echo "    - RLS y storage policies activas (si psql se ejecuto)."
echo "    - Seed cargado: 3 familias + 1 colegio."
echo "    - Smoke test RLS paso."
