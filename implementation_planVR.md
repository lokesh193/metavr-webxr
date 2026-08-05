# Implementation Plan: WebXR Sketchfab + Meta Horizon + Unity Cloud Build Hybrid Platform

Build a production-ready, high-performance WebXR platform (`vr-platform`) enabling users to upload, view, manage, and experience 3D assets (GLB models) and Unity WebGL builds directly in VR/AR browsers or fallback desktop/mobile modes.

## User Review Required

> [!IMPORTANT]
> - The application will be organized in a monorepo structure with `frontend/` (Next.js 14 App Router, R3F, `@react-three/xr`, Tailwind CSS), `backend/` (Node.js, Express, Prisma ORM, Multer, AWS S3/R2 storage, Security & Automated Services), `docker/`, `docs/`, and `.github/workflows/`.
> - SQLite / PostgreSQL setup will be configured via Prisma with database seeding included so that the app can run out-of-the-box locally without needing an external cloud DB immediately.
> - WebXR features (`immersive-vr`, `local-floor`, `hand-tracking`, `hit-test`) are fully supported with desktop orbit controls & mobile touch fallbacks.

## Proposed Components & Architecture

### 1. Root & Configuration Files
- **[NEW] [package.json](file:///d:/VRwebsite/package.json)**: Workspace scripts for running frontend, backend, docker, and tests.
- **[NEW] [.env.example](file:///d:/VRwebsite/.env.example)**: Environment variables template for local and production deployment.
- **[NEW] [README.md](file:///d:/VRwebsite/README.md)**: Main project documentation, features list, quickstart guide, and verification steps.

### 2. Backend Services (`backend/`)
- **[NEW] [backend/package.json](file:///d:/VRwebsite/backend/package.json)** & **[backend/tsconfig.json](file:///d:/VRwebsite/backend/tsconfig.json)**
- **[NEW] [backend/prisma/schema.prisma](file:///d:/VRwebsite/backend/prisma/schema.prisma)**: Database schema defining `User`, `Account`, `Session`, `Project`, `File`, `Comment`, `Like`, `Favorite`, `Role`, `ProjectType`, `Status`.
- **[NEW] [backend/prisma/seed.ts](file:///d:/VRwebsite/backend/prisma/seed.ts)**: Seed script populating demo users, sample GLB projects, and sample Unity WebGL metadata.
- **[NEW] [backend/src/app.ts](file:///d:/VRwebsite/backend/src/app.ts)**: Express application setup with Helmet, CORS, Rate Limiting, JSON parsers, routes, health check, and error handlers.
- **[NEW] [backend/src/server.ts](file:///d:/VRwebsite/backend/src/server.ts)**: Server entry point listening on port 5000.
- **[NEW] [backend/src/middleware/](file:///d:/VRwebsite/backend/src/middleware/)**:
  - `auth.ts`: JWT authentication & role-based authorization (`requireAdmin`).
  - `helmet.ts`: Comprehensive security headers & WebXR/Unity friendly Content Security Policy.
  - `cors.ts`: Origin validation & credentials support.
  - `rateLimit.ts`: API & upload rate limiters.
  - `error.ts`: Error handler & logging integration.
- **[NEW] [backend/src/services/](file:///d:/VRwebsite/backend/src/services/)**:
  - `storageService.ts`: R2/S3 file upload & local storage fallback.
  - `compressionService.ts`: Automated 3D mesh optimization pipeline.
  - `virusScanService.ts`: File safety scan & validation.
  - `thumbnailService.ts`: Thumbnail generation pipeline.
  - `webxrService.ts`: Asset optimization metadata generator for WebXR.
- **[NEW] [backend/src/controllers/](file:///d:/VRwebsite/backend/src/controllers/)**:
  - `authController.ts`: Signup, login, JWT token issue, user state.
  - `projectController.ts`: CRUD, filtering, searching, like, view count increment.
  - `uploadController.ts`: Multi-file upload, Unity WebGL parser, GLB handler.
  - `commentController.ts`: Comments management per project.
  - `analyticsController.ts`: Plausible/Custom VR interaction metrics.
- **[NEW] [backend/src/routes/](file:///d:/VRwebsite/backend/src/routes/)**: API route handlers for auth, projects, upload, comments, analytics, admin.

### 3. Frontend WebXR Web App (`frontend/`)
- **[NEW] [frontend/package.json](file:///d:/VRwebsite/frontend/package.json)** & **[frontend/tsconfig.json](file:///d:/VRwebsite/frontend/tsconfig.json)**
- **[NEW] [frontend/tailwind.config.js](file:///d:/VRwebsite/frontend/tailwind.config.js)** & **[frontend/src/styles/globals.css](file:///d:/VRwebsite/frontend/src/styles/globals.css)**: Modern futuristic dark theme, glassmorphic UI, glowing purple/cyan accents.
- **[NEW] [frontend/src/app/layout.tsx](file:///d:/VRwebsite/frontend/src/app/layout.tsx)** & **[frontend/src/app/page.tsx](file:///d:/VRwebsite/frontend/src/app/page.tsx)**: Root layout, Hero section with WebXR showcase and features.
- **[NEW] [frontend/src/app/(auth)/login/page.tsx](file:///d:/VRwebsite/frontend/src/app/\(auth\)/login/page.tsx)** & **register/page.tsx**: Modern auth forms.
- **[NEW] [frontend/src/app/(dashboard)/dashboard/page.tsx](file:///d:/VRwebsite/frontend/src/app/\(dashboard\)/dashboard/page.tsx)**: User control panel.
- **[NEW] [frontend/src/app/(dashboard)/projects/page.tsx](file:///d:/VRwebsite/frontend/src/app/\(dashboard\)/projects/page.tsx)**: WebXR project catalog (GLB models & Unity WebGL showcase).
- **[NEW] [frontend/src/app/(dashboard)/project/[id]/page.tsx](file:///d:/VRwebsite/frontend/src/app/\(dashboard\)/project/\[id\]/page.tsx)**: Detailed project viewer page with prominent VR Launch button, full metadata, comments, likes, and responsive fallback viewers.
- **[NEW] [frontend/src/app/(dashboard)/upload/page.tsx](file:///d:/VRwebsite/frontend/src/app/\(dashboard\)/upload/page.tsx)**: Asset upload dashboard for GLB files and Unity WebGL builds.
- **[NEW] [frontend/src/app/(dashboard)/admin/page.tsx](file:///d:/VRwebsite/frontend/src/app/\(dashboard\)/admin/page.tsx)**: Admin management dashboard.
- **[NEW] [frontend/src/app/(dashboard)/profile/page.tsx](file:///d:/VRwebsite/frontend/src/app/\(dashboard\)/profile/page.tsx)**: User profile & saved projects.
- **[NEW] WebXR Components (`frontend/src/components/webxr/`)**:
  - `VRButton.tsx`: VR hardware capability check (`navigator.xr`), session request (`immersive-vr`), loading indicator, VR/Desktop toggle.
  - `VRScene.tsx`: Three.js Canvas with R3F / WebXR context, lighting, ambient environment, teleportation plane, hand tracking, motion controller support.
  - `XRController.tsx`, `TeleportSystem.tsx`, `HandTracking.tsx`: VR controller raycasting, locomotion, hand gesture interactions.
- **[NEW] Viewer Components (`frontend/src/components/viewer/`)**:
  - `ModelViewer.tsx`: Interactive Three.js/Fiber viewer for GLB models with fallback orbit controls, loading state, shadow plane, lighting controls.
  - `UnityViewer.tsx`: Dynamic Unity WebGL canvas loader supporting `.loader.js`, `.framework.js`, `.data`, `.wasm` with MIME validation and progress feedback.
- **[NEW] UI & Upload Components**: Dropzone upload with multi-file support, progress bar, notification toasts.

### 4. DevOps, Infrastructure & Documentation
- **[NEW] [docker/Dockerfile.frontend](file:///d:/VRwebsite/docker/Dockerfile.frontend)**
- **[NEW] [docker/Dockerfile.backend](file:///d:/VRwebsite/docker/Dockerfile.backend)**
- **[NEW] [docker/docker-compose.yml](file:///d:/VRwebsite/docker/docker-compose.yml)**
- **[NEW] [.github/workflows/ci.yml](file:///d:/VRwebsite/.github/workflows/ci.yml)** & **cd.yml**
- **[NEW] Documentation (`docs/`)**:
  - `API.md`: Detailed REST API endpoints and schemas.
  - `Architecture.md`: System design, data flow, WebXR rendering pipeline, Mermaid diagrams.
  - `Deployment.md`: Production deployment guide for Vercel, Railway, Supabase, Cloudflare R2.
  - `Developer.md`: Local setup guide, code conventions, testing instructions.
  - `Admin.md`: User management, moderation, server health monitoring.
  - `User.md`: Platform user guide, VR device setup guide (Meta Quest 2/3, HTC Vive, Apple Vision Pro WebXR, Desktop/Mobile).
- **[NEW] Testing (`tests/`)**: Unit tests, integration tests for API endpoints, Playwright E2E test configuration.

---

## Verification Plan

### Automated Verification
1. **TypeScript Verification**:
   - `cd backend && npm run build` (or `npx tsc --noEmit`)
   - `cd frontend && npm run build` (or `npx tsc --noEmit`)
2. **Backend Automated API Tests**:
   - Execute Jest / Vitest unit and API route tests (`npm test` in `backend/`).
3. **Frontend Production Build**:
   - Build Next.js application (`npm run build` in `frontend/`) to confirm 0 build or compilation errors.

### Manual Verification
1. Verify express backend starts cleanly on port 5000 and serves `/health` endpoint returning `200 OK`.
2. Verify Next.js frontend renders landing page, auth screens, projects gallery, and project details page.
3. Test project page "Enter VR" button: inspect device detection, session handling logic, and canvas render.
4. Test Unity WebGL loader component and GLB viewer in fallback orbit controls mode.
5. Verify upload dropzone accepts multi-file uploads and sends request to backend `/api/upload`.
