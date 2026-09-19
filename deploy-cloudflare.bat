@echo off
echo ==================================================
echo SYSTEM // CLOUDFLARE PAGES 1-CLICK DEPLOYMENT
echo ==================================================
echo.
echo Deploying APEX OS static assets to Cloudflare Pages...
echo (If prompted, log in to your Cloudflare account in the browser window)
echo.
npx -y wrangler pages deploy . --project-name=apex-system-os
echo.
echo ==================================================
echo Deployment process complete!
echo Open your *.pages.dev URL on your phone to install PWA.
echo ==================================================
pause
