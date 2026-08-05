# Developer Guide

## Local Development Workflow

1. Install dependencies in backend and frontend:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. Initialize SQLite dev database:
   ```bash
   cd backend
   npx prisma db push
   npx prisma db seed
   ```

3. Start dev servers:
   ```bash
   # Terminal 1: Backend API
   cd backend && npm run dev

   # Terminal 2: Frontend Next.js
   cd frontend && npm run dev
   ```

## Code Conventions
- Frontend uses TypeScript, Next.js 14 App Router, React Three Fiber, Tailwind CSS.
- Backend uses TypeScript, Express, Prisma ORM, Multer, Helmet CSP.
- WebXR hardware testing supported via Meta Quest Browser, Wolvic, or WebXR API Emulator extension.
