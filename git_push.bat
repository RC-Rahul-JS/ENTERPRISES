@echo off
cd /d "c:\Users\pc\Desktop\badari\ENTERPRISES"

echo ============================================
echo  Checking for any remaining changed files...
echo ============================================
echo.

git status --short

echo.
echo ─────────────────────────────────────────────
echo  The files listed above are NOT yet committed.
echo  Adding all remaining changes and committing...
echo ─────────────────────────────────────────────
echo.

:: Add everything that's modified or untracked
git add -A

:: Check if there's anything to commit
git diff --cached --quiet
if %ERRORLEVEL% == 0 (
    echo  Nothing new to commit. Everything is already up to date!
) else (
    git commit -m "chore: commit remaining modified files"
    echo  Committed remaining files!
    echo.
    echo  Pushing to main...
    git push origin main
    echo  Pushed to main!
)

echo.
echo ============================================
echo  Done! Showing final git log (last 8 commits):
echo ============================================
git log --oneline -8
echo.
pause
