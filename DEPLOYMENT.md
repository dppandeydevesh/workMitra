# Deployment (Render)

workMitra runs as a **single Render Web Service**: the Vite frontend is built to
`dist/` and served by the Express backend (`backend/server.js`) on the same origin.

## Stack
- **Host:** Render (Web Service)
- **Database:** MongoDB Atlas
- **Redis / queues + rate limiting:** Upstash
- **Payments:** Razorpay
- **Bot rendering / SEO:** Prerender.io
- **Search:** Google Search Console
- **AI:** Google Gemini
- **File storage:** Supabase
- **Vector search:** Pinecone
- **Email:** Resend
- **Error monitoring:** Sentry

---

## Render service settings

Configure these in the Render dashboard (or via `render.yaml` if you adopt Blueprints):

| Setting | Value |
|---|---|
| **Build Command** | `npm install && npm run render-build` |
| **Start Command** | `npm start` (runs `node backend/server.js`) |
| **Health Check Path** | `/api/health` |
| **Node version** | 18+ (set `NODE_VERSION=20`) — required for global `fetch()` |

> ⚠️ **Important:** the Build Command **must** install backend dependencies.
> `npm run render-build` does `npm install --prefix backend && npm run build`.
> A build command of just `npm install && npm run build` will **not** install
> `backend/`'s dependencies and the server will crash on boot
> (`Cannot find module 'bullmq'`, etc.).

---

## Environment variables

Set all of these in **Render → Environment**. Values are never committed.

### Runtime
- `NODE_ENV=production`  ← without this the backend won't serve `dist/` and cookies lose `secure`
- `NODE_VERSION=20`

### Auth / JWT
- `ACCESS_TOKEN_SECRET` — long random string (128 hex recommended)
- `REFRESH_TOKEN_SECRET` — different long random string
- `ACCESS_TOKEN_EXPIRY=15m`
- `REFRESH_TOKEN_EXPIRY=7d`

### Admin seed (created on first boot)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### Database (MongoDB Atlas)
- `MONGO_URI` — Atlas SRV connection string
- In Atlas → **Network Access**, allow Render's outbound IPs (or `0.0.0.0/0` if you
  can't get static egress IPs on your plan; prefer restricting).

### URLs / CORS (same-origin deploy)
- `FRONTEND_URL` — e.g. `https://workmitra.me` (used in password-reset emails)
- `CORS_ORIGINS` — comma-separated allowed origins, e.g. `https://workmitra.me,https://www.workmitra.me`

### AI (Gemini)
- `GEMINI_API_KEY`
- `GEMINI_API_URL` *(optional; defaults to gemini-2.5-flash)*

### Redis (Upstash)
- `UPSTASH_REDIS_REST_URL` — REST endpoint (rate-limiter store; limiter fails open if Redis is unreachable or over quota)
- `UPSTASH_REDIS_REST_TOKEN`
- `REDIS_URL` is no longer needed — the BullMQ queue was replaced by an in-process AI job runner (Upstash free-tier command quota was being exhausted by idle BullMQ polling)

### Payments (Razorpay)
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `PRICE_PASS=99`
- In the Razorpay dashboard, set the **Webhook URL** to
  `https://<your-domain>/api/payments/webhook` and subscribe to
  `payment.captured` / `payment.failed`. The secret there must equal
  `RAZORPAY_WEBHOOK_SECRET`.

### Email (Resend)
- `RESEND_API_KEY`
- `EMAIL_FROM` — e.g. `workMitra <noreply@workmitra.me>` (verify the domain in Resend)

### File storage (Supabase)
- `SUPABASE_URL`
- `SUPABASE_KEY`
- Create a **`resumes`** storage bucket. (Without Supabase configured, production
  uploads fail rather than silently writing to ephemeral disk.)

### Semantic search (Pinecone)
- `PINECONE_API_KEY`
- `PINECONE_INDEX`

### Bot rendering (Prerender)
- `PRERENDER_TOKEN`

### Anti-abuse (Cloudflare Turnstile)
- `CF_TURNSTILE_SECRET_KEY` — **must** be set in production or all logins/registers fail closed

### Error monitoring (Sentry)
- `SENTRY_DSN`

### Notifications
- `WEBHOOK_URL` *(optional Discord/Slack webhook for new-user pings)*

### Frontend build-time vars (Vite inlines these **at build time**)
These must exist when the build runs, not just at runtime:
- `VITE_API_BASE_URL=` *(empty = same-origin)*
- `VITE_RAZORPAY_KEY_ID`
- `VITE_CF_TURNSTILE_SITE_KEY`
- `VITE_POSTHOG_KEY`
- `VITE_POSTHOG_HOST`

---

## Post-deploy checklist

1. **Health check** — visit `https://<domain>/api/health` → should return `{"status":"ok","db":"connected"}`.
2. **Razorpay webhook** — send a test event from the Razorpay dashboard; confirm a
   `payment.captured` flips `hasPaidPass` and check Render logs for the confirmation line.
3. **Google Search Console** — verify domain ownership (DNS TXT record is cleanest for
   an apex domain like `workmitra.me`). `public/robots.txt` and `public/sitemap.xml`
   already point at `https://workmitra.me/sitemap.xml` — submit the sitemap.
4. **Prerender** — test a crawlable URL with
   `curl -A "Googlebot" https://<domain>/` and confirm you get server-rendered HTML,
   not the empty JS shell.
5. **CORS** — confirm the frontend can call the API (same-origin means this "just works",
   but double-check if you add a separate marketing domain).
6. **Turnstile** — confirm login/registration succeed (they fail closed if the secret is wrong).
