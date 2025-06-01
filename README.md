# PRESS

Ultra-lightweight, secure, single-user note-taking app with Markdown, Material UI, and Supabase cloud sync.

## Features
- 4-digit passcode login (auto-lock after 10 min inactivity)
- Full notes CRUD (cloud, real-time sync)
- Markdown editor (CommonMark, live preview)
- Responsive, mobile-first UI
- IBM Plex Mono font, black theme

## Security & Privacy
- Input validation and sanitization throughout
- Audit logging for sensitive actions
- Data integrity checks (HMAC)
- Secure memory handling (clears sensitive data)
- Device/session binding
- Security headers (CSP, X-Frame-Options)
- Linting/static analysis
- Guidance for secure key storage and Supabase config

## Setup
1. Install dependencies: `npm install`
2. Start app: `npm start`

## Configuration
- Supabase URL: https://gtmrpijcmiqsobgoaiua.supabase.co
- Supabase anon key: see `src/supabaseClient.js`

## SQL
- See your provided SQL for schema and RLS setup.

## Deployment
1. Push your code to a GitHub repository (public or private).
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, and import your repo.
3. In Vercel project settings, add these environment variables:
   - `REACT_APP_SUPABASE_URL` (your Supabase project URL)
   - `REACT_APP_SUPABASE_ANON_KEY` (your Supabase anon key)
4. Click 'Deploy'. Vercel will build and host your app with HTTPS automatically.
5. After deploy, access your app via the Vercel-provided URL.

---
MIT License
