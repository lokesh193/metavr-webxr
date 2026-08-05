import helmet from 'helmet';

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
        "blob:",
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      mediaSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: [
        "'self'",
        "https:",
        "http:",
        "wss:",
        "ws:",
        "blob:",
      ],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"],
      frameSrc: ["'self'", "http://localhost:5000", "http://localhost:3000", "blob:"],
      frameAncestors: ["'self'", "http://localhost:3000", "http://localhost:5000", "*"],
      objectSrc: ["'none'"],
    },
  },
  xFrameOptions: false, // Allow cross-origin iframe embedding for WebXR & Unity WebGL viewports
  crossOriginEmbedderPolicy: false, // Required for WebXR & WebGL WASM shared array buffers
  crossOriginResourcePolicy: { policy: "cross-origin" },
});
