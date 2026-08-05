import express from 'express';
import path from 'path';
import morgan from 'morgan';
import { helmetMiddleware } from './middleware/helmet';
import { corsMiddleware } from './middleware/cors';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/error';

import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import uploadRoutes from './routes/upload';
import commentRoutes from './routes/comments';
import analyticsRoutes from './routes/analytics';
import adminRoutes from './routes/admin';
import creatorRoutes from './routes/creator';

const app = express();

// Security & Logging Middlewares
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve local uploads statically with correct MIME types & Brotli/Gzip Compression Headers
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    const lower = filePath.toLowerCase();

    // Compression Encodings
    if (lower.endsWith('.br')) {
      res.setHeader('Content-Encoding', 'br');
    } else if (lower.endsWith('.gz')) {
      res.setHeader('Content-Encoding', 'gzip');
    }

    // MIME Types
    if (lower.includes('.wasm')) res.setHeader('Content-Type', 'application/wasm');
    else if (lower.includes('.data')) res.setHeader('Content-Type', 'application/octet-stream');
    else if (lower.includes('.framework.js') || lower.includes('.loader.js')) res.setHeader('Content-Type', 'application/javascript');
    else if (lower.endsWith('.glb')) res.setHeader('Content-Type', 'model/gltf-binary');
    else if (lower.endsWith('.usdz')) res.setHeader('Content-Type', 'model/vnd.usdz+zip');
    else if (lower.endsWith('.hdr') || lower.endsWith('.hdri')) res.setHeader('Content-Type', 'image/vnd.radiance');
    else if (lower.endsWith('.fbx') || lower.endsWith('.obj')) res.setHeader('Content-Type', 'application/octet-stream');

    res.removeHeader('X-Frame-Options');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

// API Rate Limiting
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/creator', creatorRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'VR Platform Backend API (WebXR)',
  });
});

// Error Handling Middleware
app.use(errorHandler);

export default app;
