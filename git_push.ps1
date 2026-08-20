# git_push.ps1
# Run this in PowerShell from the project root:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\git_push.ps1

Set-Location "c:\Users\pc\Desktop\badari\ENTERPRISES"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Git Status - Remaining Changes" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$status = git status --short
if ($status) {
    Write-Host $status -ForegroundColor Yellow
} else {
    Write-Host "  Nothing to commit. Working tree is clean." -ForegroundColor Green
}

Write-Host ""

if ($status) {
    Write-Host "Staging all changes..." -ForegroundColor White
    git add -A

    Write-Host "Committing..." -ForegroundColor White
    git commit -m "chore: commit remaining modified files"

    Write-Host ""
    Write-Host "Pushing to main..." -ForegroundColor White
    git push origin main

    Write-Host ""
    Write-Host "  Push complete!" -ForegroundColor Green
} else {
    Write-Host "  Nothing to push." -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Last 8 commits:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
git log --oneline -8
Write-Host ""
