# Registra la tarea programada "OpenDaycare DB Security Audit" en el Programador de tareas de Windows.
# Ejecuta scripts/db-security-audit-cron.ps1 cada lunes a las 08:00 con el usuario actual (solo cuando inicia sesión).

$taskName = "OpenDaycare DB Security Audit"
$projectDir = "C:\Users\Olivier\OneDrive\Documentos\React\CursoOPENCODE\06-open-daycare"
$scriptPath = Join-Path $projectDir "scripts\db-security-audit-cron.ps1"
$pwsh = "C:\Program Files\PowerShell\7\pwsh.exe"

if (-not (Test-Path $scriptPath)) {
    Write-Error "No se encontró el script: $scriptPath"
    exit 1
}

$action = New-ScheduledTaskAction -Execute $pwsh -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 08:00
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd -ExecutionTimeLimit (New-TimeSpan -Hours 2)

# Registrar (o actualizar) la tarea con el usuario actual, solo si tiene la sesión iniciada
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Auditoría de seguridad de BD Supabase (db-security-auditor) — semanal, lunes 08:00" -Force | Out-Null

Get-ScheduledTask -TaskName $taskName | Select-Object TaskName, State, @{N='NextRun';E={($_ | Get-ScheduledTaskInfo).NextRunTime}}
