@echo off
echo ==================================================
echo LEVEL UP SYSTEM // CLOUDFLARE PAGES DEPLOYMENT
echo ==================================================
echo.
echo Deploying Level Up System to apex-system-os.pages.dev...
echo.
npx -y wrangler pages deploy . --project-name=apex-system-os
echo.
echo ==================================================
echo Deployment complete!
echo Live URL: https://apex-system-os.pages.dev
echo ==================================================
pause
