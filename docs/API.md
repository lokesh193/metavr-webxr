# METAVR Platform API Specification

Base API Endpoint: `http://localhost:5000/api`

## Authentication

All write/upload endpoints require a Bearer Token in request headers:
`Authorization: Bearer <JWT_TOKEN>`

---

## 1. Authentication Endpoints

### `POST /auth/register`
Create a new user account.
- **Request Body**:
  ```json
  {
    "name": "Metaverse Creator",
    "email": "user@vrplatform.dev",
    "password": "password123"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": { "id": "clp...", "email": "user@vrplatform.dev", "name": "Metaverse Creator", "role": "USER" }
  }
  ```

### `POST /auth/login`
Authenticate user and receive JWT session token.
- **Request Body**:
  ```json
  {
    "email": "user@vrplatform.dev",
    "password": "password123"
  }
  ```

### `GET /auth/me`
Fetch current user profile. (Requires Auth Token)

---

## 2. Projects & WebXR Endpoints

### `GET /projects`
Query catalog of 3D assets & Unity builds.
- **Query Params**:
  - `type`: `MODEL` or `UNITY` (optional)
  - `search`: Keyword string (optional)
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 12)

### `GET /projects/:id`
Fetch full detail for single project. Automatically increments view count telemetry.
- **Response**:
  ```json
  {
    "id": "clp123456",
    "title": "Cyberpunk VR City Platform",
    "type": "MODEL",
    "glbUrl": "http://localhost:5000/uploads/projects/clp123456/model.glb",
    "unityUrls": null,
    "views": 1421,
    "likesCount": 189
  }
  ```

### `POST /projects/:id/like`
Toggle like on a project. (Requires Auth Token)

### `DELETE /projects/:id`
Delete project asset. (Requires Admin or Owner Auth)

---

## 3. Automated Upload Pipeline

### `POST /upload`
Multi-part upload endpoint accepting GLB models or Unity WebGL files.
- **Headers**: `Content-Type: multipart/form-data`
- **Form Data**:
  - `files`: File array (max 20 files, up to 1GB per file)
  - `title`: String
  - `description`: String
- **Automated Operations Executed**:
  1. Virus & Malware scan validation.
  2. Draco mesh geometry compression.
  3. Automated 3D preview thumbnail generation.
  4. WebXR 90 FPS optimization profile calculation.
  5. Cloudflare R2 / AWS S3 storage distribution.

---

## 4. Admin & Telemetry Endpoints

### `GET /admin/stats`
Retrieve server uptime, active users, project count, and memory telemetry. (Requires Admin Auth)

### `POST /analytics/event`
Record WebXR session telemetry, FPS refresh metrics, and device hardware telemetry.
