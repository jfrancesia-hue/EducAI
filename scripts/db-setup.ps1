# db-setup.ps1 — Setup completo de la base de datos contra el proyecto Supabase elegido.
#
# Uso:
#   $env:DATABASE_URL = 'postgresql://...'
#   .\scripts\db-setup.ps1
#
# Pasos:
#   1. Verifica DATABASE_URL.
#   2. Corre `pnpm db:deploy` (migraciones Prisma).
#   3. Aplica supabase/migrations/*.sql via psql (RLS + storage policies).
#   4. Corre `pnpm db:seed`.
#   5. Corre el smoke test RLS.

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Require-EnvVar {
    param([string]$Name)
    if (-not (Get-Item -Path "Env:$Name" -ErrorAction SilentlyContinue) -or
        [string]::IsNullOrWhiteSpace((Get-Item -Path "Env:$Name").Value)) {
        Write-Error "ERROR: variable de entorno '$Name' no esta seteada. Pegala desde Supabase Dashboard > Project Settings > Database."
        exit 1
    }
}

function Require-Cmd {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Write-Error "ERROR: '$Name' no esta instalado o no esta en PATH."
        return $false
    }
    return $true
}

Require-EnvVar -Name 'DATABASE_URL'

Write-Host "==> [1/5] Verificando dependencias..."
[void](Require-Cmd -Name 'pnpm')

$UsePsql = $true
if (-not (Get-Command 'psql' -ErrorAction SilentlyContinue)) {
    Write-Warning "'psql' no esta instalado. Las migraciones de supabase/migrations/*.sql"
    Write-Warning "se omitiran. Instalalo (https://www.postgresql.org/download/) o pegalas"
    Write-Warning "manualmente en Supabase SQL Editor."
    $UsePsql = $false
}

Write-Host "==> [2/5] Aplicando migraciones Prisma (db:deploy)..."
pnpm db:deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($UsePsql) {
    Write-Host "==> [3/5] Aplicando supabase/migrations/*.sql con psql..."
    Get-ChildItem -Path (Join-Path $Root 'supabase/migrations') -Filter '*.sql' | Sort-Object Name | ForEach-Object {
        Write-Host "    -> $($_.Name)"
        & psql $env:DATABASE_URL -v 'ON_ERROR_STOP=1' -f $_.FullName
        if ($LASTEXITCODE -ne 0) {
            Write-Error "psql fallo aplicando $($_.Name)"
            exit $LASTEXITCODE
        }
    }
} else {
    Write-Host "==> [3/5] SKIPPED: aplica manualmente desde Supabase SQL Editor:"
    Get-ChildItem -Path (Join-Path $Root 'supabase/migrations') -Filter '*.sql' | ForEach-Object {
        Write-Host "    - $($_.FullName)"
    }
}

Write-Host "==> [4/5] Sembrando datos (db:seed)..."
pnpm db:seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> [5/5] Corriendo smoke test RLS..."
$env:SKIP_RLS_SMOKE = '0'
pnpm --filter '@educai/database' test:rls
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "OK: base de datos lista."
Write-Host "    - Migraciones Prisma aplicadas."
Write-Host "    - RLS y storage policies activas (si psql se ejecuto)."
Write-Host "    - Seed cargado: 3 familias + 1 colegio."
Write-Host "    - Smoke test RLS paso."
