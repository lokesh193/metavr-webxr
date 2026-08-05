# System Architecture & WebXR Pipeline

## 🏗️ High-Level Platform Architecture

```mermaid
graph TD
    User[WebXR Headset / Browser] -->|HTTPS / WSS| Frontend[Next.js 14 WebXR Frontend]
    Frontend -->|React Three Fiber| ThreeEngine[Three.js / WebXR Engine]
    Frontend -->|Unity Loader| UnityEngine[Unity WebGL WASM Engine]
    Frontend -->|REST API| Backend[Node.js / Express API]
    
    Backend -->|Helmet Security| Middleware[CSP / Rate Limiter / JWT Auth]
    Backend -->|Multer Pipeline| Services[Automated Pipeline Services]
    
    Services -->|Virus Check| ScanService[Virus Scan Service]
    Services -->|Draco / KTX2| CompressService[Mesh Compression Service]
    Services -->|Thumbnail Gen| ThumbService[Thumbnail Service]
    Services -->|Storage Layer| S3Service[AWS S3 / Cloudflare R2 / Local Storage]
    
    Backend -->|Prisma ORM| DB[(PostgreSQL / SQLite Database)]
```

---

## 🥽 WebXR 90 FPS Rendering Pipeline

1. **Hardware Detection**: `navigator.xr.isSessionSupported('immersive-vr')` verifies 6DOF headset capabilities (Meta Quest 2/3, Vision Pro, HTC Vive).
2. **Session Initialization**: WebXR session requested with required features (`local-floor`, `hand-tracking`, `hit-test`).
3. **Asset Streaming**: High-poly GLB models optimized via Draco geometry decoders. Unity builds loaded via dynamic WebAssembly (.wasm) streaming.
4. **Rendering Loop**: Three.js WebXR render loop executing frustum culling, occlusion culling, low draw-call shading, and controller raycasting at 90 FPS.
