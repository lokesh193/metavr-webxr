# VR Platform — Sketchfab + Meta Horizon + Unity Cloud Build Hybrid Platform

A production-ready, enterprise-grade WebXR hybrid platform that allows users to upload, process, manage, and experience 3D models (`.glb`, `.gltf`) and Unity WebGL builds directly in VR/AR headsets (Meta Quest 2/3/Pro, Apple Vision Pro, HTC Vive, Pico) or fallback desktop/mobile web browsers.

![WebXR Platform](https://img.shields.io/badge/WebXR-3D_6DOF-purple?style=for-the-badge&logo=webxr)
![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-black?style=for-the-badge&logo=next.js)
![Three.js](https://img.shields.io/badge/3D_Engine-Three.js_/_R3F-black?style=for-the-badge&logo=three.js)
![Node.js](https://img.shields.io/badge/Backend-Express_/_Prisma-green?style=for-the-badge&logo=node.js)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## 🌟 Key Features

- 🥽 **Instant WebXR Launch**: Prominent "Enter VR" button on every project page supporting `immersive-vr`, `local-floor`, hand-tracking, and controller raycasting.
- 📦 **Unity WebGL Integration**: Native dynamic loader validating `.loader.js`, `.framework.js`, `.data`, and `.wasm` with MIME type enforcement and streaming progress.
- 🎨 **Sketchfab-Style 3D Viewer**: Interactive fallback WebGL orbit controls with lighting toggles, shadow plane, bounding box auto-centering, wireframe, and background color controls.
- 🚀 **Automated Upload Pipeline**: Multi-file dropzone handling GLB/Unity ZIP uploads with automated virus scanning, thumbnail generation, Draco model compression, and CDN storage.
- 🛡️ **Enterprise Security**: Helmet CSP configured specifically for WebXR WSS/Workers, CORS validation, JWT authentication, bcrypt password hashing, and express-rate-limiters.
- ⚡ **90 FPS VR Optimizations**: Frustum culling, geometry instancing, Level of Detail (LOD), texture compression (KTX2/Basis), and low draw-call shading pipeline.
- 🐳 **Full DevOps & CI/CD**: Ready-to-use Docker Compose environment and GitHub Actions pipelines for automated linting, testing, and deployment.

---

## 🏗️ Monorepo Structure

```text
vr-platform/
├── frontend/             # Next.js 14 App Router, R3F, WebXR, Tailwind CSS
├── backend/              # Express API, Prisma ORM, Storage, Security & Automated Services
├── docker/               # Dockerfiles and docker-compose.yml
├── docs/                 # Complete Documentation Suite (API, Architecture, Deployment, etc.)
├── tests/                # Integration and E2E Test suites
├── .github/workflows/    # CI/CD Workflows
├── .env.example          # Environment setup template
└── package.json          # Workspace scripts
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**
- **Git**

### Installation

1. **Clone repository**:
   ```bash
   git clone https://github.com/your-org/vr-platform.git
   cd vr-platform
   ```

2. **Set up Environment Variables**:
   Copy `.env.example` to `.env` in both `frontend/` and `backend/`.

3. **Install Dependencies & Seed Database**:
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   npx prisma db push
   npx prisma db seed

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

4. **Start Development Servers**:
   ```bash
   # Terminal 1: Start Backend API (Port 5000)
   cd backend
   npm run dev

   # Terminal 2: Start Frontend Web App (Port 3000)
   cd frontend
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🥽 Testing WebXR Mode

1. Open a WebXR-compatible browser (e.g., Meta Quest Browser, Wolvic, Chrome with WebXR API Emulator).
2. Navigate to any project detail page (e.g., `/project/clp1234567890`).
3. Click the **"Enter VR"** button.
4. Put on your headset to experience the 3D model or Unity experience in 6DOF immersive VR!

---

## 📑 Documentation

Explore our comprehensive documentation suite in the `docs/` folder:
- 📖 [API Specification](docs/API.md)
- 🏗️ [Architecture & WebXR Pipeline](docs/Architecture.md)
- 🚢 [Production Deployment Guide](docs/Deployment.md)
- 💻 [Developer Guide](docs/Developer.md)
- 🛡️ [Admin Guide](docs/Admin.md)
- 👤 [User & VR Setup Guide](docs/User.md)

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
