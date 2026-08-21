# Script de auditoría programada de seguridad de base de datos (db-security-auditor)
# Ejecuta el comando `db-security-audit` de opencode de forma no interactiva y
# guarda el informe con marca de tiempo en reports/db-security-audit/.
# Pensado para lanzarse desde el Programador de tareas de Windows (cron local).

[CmdletBinding()]
param(
    [string]$ProjectDir = "C:\Users\Olivier\OneDrive\Documentos\React\CursoOPENCODE\06-open-daycare",
    [string]$ReportsDir = ""
)

$ErrorActionPreference = "Stop"

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
if (-not $ReportsDir) { $ReportsDir = Join-Path $ProjectDir "reports\db-security-audit" }

$reportFile = Join-Path $ReportsDir "audit-$stamp.md"
$logFile    = Join-Path $ReportsDir "audit-$stamp.log"

# Directorio de trabajo: el proyecto (para que opencode lea AGENTS.md, opencode.json y los comandos)
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

function Write-Log {
    param([string]$Message)
    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
    Write-Host $line
    Add-Content -Path $logFile -Value $line
}

# Resolver opencode (npm global shim o el binario en PATH)
$opencode = (Get-Command opencode -ErrorAction SilentlyContinue)
if (-not $opencode) {
    $candidate = "C:\Users\Olivier\AppData\Roaming\npm\opencode.cmd"
    if (Test-Path $candidate) { $opencodePath = $candidate } else {
        Write-Log "ERROR: no se encontró el binario opencode en PATH"
        exit 1
    }
} else {
    $opencodePath = $opencode.Source
}

Write-Log "Inicio de auditoría de seguridad de BD"
Write-Log "  opencode: $opencodePath"
Write-Log "  proyecto: $ProjectDir"

try {
    Push-Location $ProjectDir
    # --command ejecuta el comando .opencode/command/db-security-audit.md (agente db-security-auditor)
    & $opencodePath run --command db-security-audit *> $reportFile
    $exit = $LASTEXITCODE
    Pop-Location
} catch {
    Pop-Location
    Write-Log "ERROR al ejecutar opencode: $($_.Exception.Message)"
    exit 1
}

if ($exit -ne 0) {
    Write-Log "ERROR: opencode terminó con código $exit. Ver $reportFile"
    exit $exit
}

# Extraer solo el informe final (texto en markdown) del output capturado
$raw = Get-Content -Raw -Path $reportFile
if ($raw -match "```") {
    # Conservar todo el output; el informe del agente queda al final
    Write-Log "Auditoría completada. Informe guardado en: $reportFile"
} else {
    Write-Log "Auditoría completada. Informe guardado en: $reportFile"
}

# Limpiar archivos de informe/log más antiguos (retener los 30 últimos)
Get-ChildItem -Path $ReportsDir -Filter "audit-*" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 30 | Remove-Item -Force

Write-Log "Fin de auditoría de seguridad de BD"
exit 0
