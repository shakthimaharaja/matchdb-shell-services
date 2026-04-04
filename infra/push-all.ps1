<# ──────────────────────────────────────────────────────────────────────────────
   push-all.ps1  —  git add, commit & push across all MatchDB repos
   Rule: always push directly to main — never use feature branches.
   ────────────────────────────────────────────────────────────────────────────── #>

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$repos = @(
    "matchdb-shell-services",
    "matchdb-jobs-services",
    "matchdb-shell-ui",
    "matchdb-jobs-ui",
    "matchingdb-component-library"
)

# ─── Prompt for a shared commit message ──────────────────────────────────────
$msg = Read-Host "`nEnter commit message (applies to all repos)"
if ([string]::IsNullOrWhiteSpace($msg)) {
    Write-Host "Commit message cannot be empty. Aborting." -ForegroundColor Red
    exit 1
}

# ─── Iterate repos ──────────────────────────────────────────────────────────
foreach ($repo in $repos) {
    $repoPath = Join-Path $root $repo
    if (-not (Test-Path (Join-Path $repoPath ".git"))) {
        Write-Host "`n[$repo] Skipped — not a git repo" -ForegroundColor Yellow
        continue
    }

    Push-Location $repoPath
    Write-Host "`n=== $repo ===" -ForegroundColor Cyan

    # Enforce main branch
    $branch = git branch --show-current
    if ($branch -ne "main") {
        Write-Host "  Switching from '$branch' to 'main' ..." -ForegroundColor Yellow
        git checkout main
    }

    # Show status
    $status = git status --short
    if ([string]::IsNullOrWhiteSpace($status)) {
        Write-Host "  Nothing to commit — clean." -ForegroundColor DarkGray
        Pop-Location
        continue
    }
    Write-Host $status

    # Stage, commit, push to main
    git add .
    git commit -m $msg
    Write-Host "  Pushing to origin/main ..." -ForegroundColor Green
    git push origin main

    Pop-Location
}

Write-Host "`n=== All repos processed ===" -ForegroundColor Green
