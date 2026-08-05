# Production Deployment Guide

## 1. Deploying Backend to Railway / Render

1. Push the repository to GitHub.
2. Link the repository root to Railway.
3. Set the Dockerfile path to `docker/Dockerfile.backend`.
4. Configure Environment Variables in Railway Dashboard:
   - `PORT=5000`
   - `DATABASE_URL=postgresql://user:pass@ep-host.supabase.co:5432/vrdb`
   - `JWT_SECRET=production-secret-key-min-32-chars`
   - `FRONTEND_URL=https://app.yourapp.com`
   - `R2_ENDPOINT=https://your-id.r2.cloudflarestorage.com`
   - `R2_ACCESS_KEY_ID=xxx`
   - `R2_SECRET_ACCESS_KEY=yyy`
   - `R2_BUCKET=vr-platform-assets`
   - `CDN_URL=https://cdn.yourapp.com`

---

## 2. Deploying Frontend to Vercel

1. Import project into Vercel and select the `frontend` folder as Root Directory.
2. Set Environment Variables:
   - `NEXT_PUBLIC_API_URL=https://api.yourapp.com/api`
   - `NEXTAUTH_URL=https://app.yourapp.com`
   - `NEXTAUTH_SECRET=production-nextauth-secret`
3. Click **Deploy**.

---

## 3. Docker Compose Deployment (Self-Hosted VPS)

Run full production stack with single command:
```bash
docker-compose -f docker/docker-compose.yml up -d --build
```
