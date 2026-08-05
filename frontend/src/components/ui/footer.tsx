import Link from 'next/link';
import { Box, Github, Twitter, Layers } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/80 mt-20 py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">METAVR Platform</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Sketchfab + Meta Horizon + Unity Cloud Build hybrid WebXR platform. Upload, stream, and experience immersive 3D/VR content directly in the browser.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Features</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/projects" className="hover:text-primary transition">WebXR 6DOF Immersive Mode</Link></li>
            <li><Link href="/upload" className="hover:text-primary transition">Unity WebGL Streaming</Link></li>
            <li><Link href="/projects" className="hover:text-primary transition">Draco Mesh Compression</Link></li>
            <li><Link href="/projects" className="hover:text-primary transition">Sketchfab 3D Model Viewer</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Documentation</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-primary transition">REST API Docs</a></li>
            <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-primary transition">Architecture & Pipelines</a></li>
            <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-primary transition">Deployment Guide</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Community</h4>
          <div className="flex items-center gap-4 text-slate-400">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition">
              <Github className="w-5 h-5" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-white transition">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://webxr.io" target="_blank" rel="noreferrer" className="hover:text-white transition">
              <Layers className="w-5 h-5" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()} METAVR Inc. All rights reserved. 90 FPS WebXR Optimized.
          </p>
        </div>
      </div>
    </footer>
  );
}
