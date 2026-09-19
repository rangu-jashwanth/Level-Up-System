@echo off
echo ==================================================
echo AETHER // CLOUDFLARE PAGES DEPLOYMENT
echo ==================================================
echo.
echo Deploying AETHER OS static assets to Cloudflare Pages...
echo.
npx -y wrangler pages deploy . --project-name=aether-execution-os
echo.
echo ==================================================
echo Deployment complete!
echo Open your *.pages.dev URL to use AETHER OS.
echo ==================================================
pause

