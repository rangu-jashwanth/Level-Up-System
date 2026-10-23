@echo off
echo ==================================================
echo LEVEL UP SYSTEM // CLOUDFLARE PAGES DEPLOYMENT
echo ==================================================
echo.
echo Deploying Level Up System static assets to Cloudflare Pages...
echo.
npx -y wrangler pages deploy . --project-name=level-up-system
echo.
echo ==================================================
echo Deployment complete!
echo Open your *.pages.dev URL to use Level Up System.
echo ==================================================
pause

