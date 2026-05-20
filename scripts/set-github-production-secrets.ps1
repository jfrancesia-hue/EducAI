param(
  [string]$Repo = "jfrancesia-hue/EducAI",
  [string]$Environment = "production",
  [string]$SecretsFile = "ops/production/github.production.secrets.env"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI no esta instalado."
}

if (-not (Test-Path $SecretsFile)) {
  throw "No existe el archivo de secrets: $SecretsFile"
}

$authStatus = & gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
  throw "gh auth no esta listo. Ejecuta 'gh auth login -h github.com' y vuelve a correr este script."
}

$pairs = @{}
Get-Content $SecretsFile | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) {
    return
  }

  $separator = $line.IndexOf("=")
  if ($separator -lt 1) {
    throw "Linea invalida en $SecretsFile: $line"
  }

  $key = $line.Substring(0, $separator).Trim()
  $value = $line.Substring($separator + 1).Trim()
  if (-not $value) {
    throw "Falta valor para secret '$key' en $SecretsFile"
  }

  $pairs[$key] = $value
}

foreach ($entry in $pairs.GetEnumerator()) {
  $entry.Value | & gh secret set $entry.Key --repo $Repo --env $Environment --body-file -
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo cargar el secret $($entry.Key)"
  }
}

Write-Host "Secrets cargados en GitHub environment '$Environment' para $Repo"
