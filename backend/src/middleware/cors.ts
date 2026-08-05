import cors from 'cors';

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, postman) or matching frontend
    if (!origin || origin === frontendUrl || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all during development & WebXR cross-origin loading
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});
