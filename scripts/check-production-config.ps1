param(
  [string]$GithubSecretsFile = "ops/production/github.production.secrets.env",
  [string]$RenderApiEnvFile = "ops/production/render.api.production.env",
  [string]$VercelWebEnvFile = "ops/production/vercel.web.production.env",
  [string]$VercelGovEnvFile = "ops/production/vercel.gov-dashboard.production.env"
)

$ErrorActionPreference = "Stop"

function Read-KeyValueFile {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    throw "No existe el archivo: $Path"
  }

  $result = @{}
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) {
      return
    }

    $separator = $line.IndexOf("=")
    if ($separator -lt 1) {
      return
    }

    $key = $line.Substring(0, $separator).Trim()
    $value = $line.Substring($separator + 1).Trim()
    $result[$key] = $value
  }

  return $result
}

function Report-MissingKeys {
  param(
    [string]$Label,
    [hashtable]$Values,
    [string[]]$RequiredKeys
  )

  $missing = @()
  foreach ($key in $RequiredKeys) {
    if (-not $Values.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($Values[$key])) {
      $missing += $key
    }
  }

  if ($missing.Count -eq 0) {
    Write-Host "[OK] $Label"
    return $true
  }

  Write-Host "[FALTA] $Label -> $($missing -join ', ')"
  return $false
}

$github = Read-KeyValueFile -Path $GithubSecretsFile
$renderApi = Read-KeyValueFile -Path $RenderApiEnvFile
$vercelWeb = Read-KeyValueFile -Path $VercelWebEnvFile
$vercelGov = Read-KeyValueFile -Path $VercelGovEnvFile

$allOk = $true
$allOk = (Report-MissingKeys -Label "GitHub production secrets" -Values $github -RequiredKeys @(
  "VERCEL_WEB_DEPLOY_HOOK_URL",
  "VERCEL_GOV_DASHBOARD_DEPLOY_HOOK_URL",
  "RENDER_API_DEPLOY_HOOK_URL"
)) -and $allOk

$allOk = (Report-MissingKeys -Label "Render API" -Values $renderApi -RequiredKeys @(
  "NODE_ENV",
  "PUBLIC_APP_URL",
  "ALLOWED_ORIGINS",
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_ANON_KEY",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_API_KEY_SID",
  "TWILIO_API_KEY_SECRET",
  "TWILIO_WHATSAPP_FROM",
  "TWILIO_PUBLIC_WEBHOOK_URL",
  "TWILIO_FORCE_PROTOCOL",
  "TWILIO_SKIP_SIGNATURE_VALIDATION",
  "TWILIO_DRY_RUN",
  "EDUCAI_AGENT_PROVIDER",
  "MERCADOPAGO_ACCESS_TOKEN",
  "MERCADOPAGO_WEBHOOK_SECRET"
)) -and $allOk

$allOk = (Report-MissingKeys -Label "Vercel web" -Values $vercelWeb -RequiredKeys @(
  "NEXT_PUBLIC_APP_NAME",
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)) -and $allOk

$allOk = (Report-MissingKeys -Label "Vercel gov-dashboard" -Values $vercelGov -RequiredKeys @(
  "NEXT_PUBLIC_APP_NAME",
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)) -and $allOk

if (-not $renderApi["DATABASE_URL"].Contains("schema=educai")) {
  Write-Host "[FALTA] Render API -> DATABASE_URL debe incluir schema=educai"
  $allOk = $false
}

if ($renderApi["TWILIO_PUBLIC_WEBHOOK_URL"] -and -not $renderApi["TWILIO_PUBLIC_WEBHOOK_URL"].StartsWith("https://")) {
  Write-Host "[FALTA] Render API -> TWILIO_PUBLIC_WEBHOOK_URL debe usar https"
  $allOk = $false
}

if ($vercelWeb["NEXT_PUBLIC_API_URL"] -and $vercelWeb["NEXT_PUBLIC_API_URL"] -ne "https://educai-api-t4gf.onrender.com") {
  Write-Host "[AVISO] Vercel web -> NEXT_PUBLIC_API_URL no coincide con https://educai-api-t4gf.onrender.com"
}

if ($vercelGov["NEXT_PUBLIC_API_URL"] -and $vercelGov["NEXT_PUBLIC_API_URL"] -ne "https://educai-api-t4gf.onrender.com") {
  Write-Host "[AVISO] Vercel gov-dashboard -> NEXT_PUBLIC_API_URL no coincide con https://educai-api-t4gf.onrender.com"
}

if ($allOk) {
  Write-Host "Checklist de configuracion productiva completo."
} else {
  exit 1
}
