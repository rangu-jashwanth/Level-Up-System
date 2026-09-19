# SYSTEM // SELF-MASTERY OS

An elite personal command interface engineered for mission execution, awareness, physical pacing, and technical performance.

Designed with a celestial visual identity, dark frosted luminous glass panels, 12 single-accent color themes, local-first offline storage, PWA installability, and cross-device sync powered by Supabase.

---

## 🚀 Quick Deployment Guide: Cloudflare Pages (Cellular Mobile Data Access)

You can host **SYSTEM** permanently on Cloudflare Pages for free so it opens from any phone browser on cellular/mobile data and can be installed to your phone home screen.

### 1. Push Your Repository to GitHub
```bash
git init
git add .
git commit -m "Deploy SYSTEM OS to Cloudflare Pages"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/SYSTEM-OS.git
git push -u origin main
```

### 2. Connect to Cloudflare Pages
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages**.
2. Click **Create Application** > Select **Pages** > **Connect to Git**.
3. Choose your `SYSTEM-OS` repository and click **Begin setup**.
4. Configure Build Settings:
   - **Framework preset**: `None` (Static HTML/CSS/JS)
   - **Build command**: Leave EMPTY (No build step required)
   - **Build output directory**: `./` (Root directory)
5. Click **Save and Deploy**.

Cloudflare will build your project in seconds and provide a public URL: `https://system-os.pages.dev`.

### 3. Open & Install on Mobile Data
1. Open `https://system-os.pages.dev` on your mobile phone over 4G/5G mobile data.
2. Tap browser options (**Share** on iOS Safari or **⋮** on Android Chrome).
3. Select **Add to Home Screen** / **Install App**.

---

## ⚡ Cross-Device Sync Setup: Supabase Backend

To securely sync your missions, achievements, XP, physical pacing, and preferences between desktop and mobile over cellular networks:

### 1. Create a Supabase Project
1. Log in to [Supabase](https://supabase.com/) and create a new project.
2. In your Supabase Dashboard, open **SQL Editor**.
3. Copy the entire contents of [`supabase_schema.sql`](./supabase_schema.sql) into the SQL Editor and click **Run**.
   *(This creates all database tables and applies Row Level Security policies).*

### 2. Connect Supabase to SYSTEM
1. Go to Supabase **Project Settings** > **API**.
2. Copy your **Project URL** (`https://xyz.supabase.co`) and **anon / public key**.
3. Open **SYSTEM** on desktop or phone, navigate to **Preferences** (`[ PREFERENCES ]` button), and expand **Cloud Sync & Supabase Setup**.
4. Paste your **Supabase URL** and **Anon Public Key**, then click **Save & Connect**.
5. Sign in or sign up using your email and password.
6. Upon your first sign-in, SYSTEM will ask: *"Import this device's APEX data into your account?"* Click **[IMPORT DATA]** to sync existing local data into your account.

> [!SECURITY_NOTE]
> Never expose your Supabase `service_role` key in frontend code or git history. SYSTEM uses ONLY the safe `anon` public key in browser memory.

---

## 💻 Local Development Server

To run locally on your computer and test Wi-Fi network connection:

```bash
# Start server (listens on 0.0.0.0:3000)
node server.js
```

Console output will display your computer's local network address for phone testing:
```
SYSTEM // SELF-MASTERY OS SERVER ONLINE
Local Access:   http://localhost:3000
Mobile/Wi-Fi:   http://192.168.1.4:3000
```

---

## ✦ Key Features
- **Celestial Visual Identity**: Frosted luminous glass panels, 12 single-accent themes, holographic progress rails.
- **100% User Sovereignty**: Zero seeded tasks or auto-created routines. You command all content.
- **PWA & Offline Capability**: Service Worker (`sw.js`) caches app shell for instant offline loading.
- **Cross-Device Sync**: Local-first storage merged with Supabase database RLS isolation.
- **Respectful System Analysis**: Urgency recommendations phrased with complete respect for user autonomy.
