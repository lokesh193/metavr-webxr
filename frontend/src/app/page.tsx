'use client';

import Link from 'next/link';
import { Glasses, Upload, Compass, Zap, ShieldCheck, Box, Play, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-6 max-w-7xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-primary/40 text-xs font-bold text-primary mb-8 animate-float">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Sketchfab + Meta Horizon + Unity Cloud Build Hybrid Platform</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-5xl leading-tight">
          Upload, Stream & Experience <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-purple-400">
            3D Assets & Unity Builds in WebXR
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-3xl leading-relaxed">
          The ultimate 6DOF WebXR platform. Stream high-poly GLB models and Unity WebGL builds at 90 FPS directly in Meta Quest 2/3, Vision Pro, or any web browser.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/projects"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-cyan-500 text-white font-extrabold text-lg rounded-2xl shadow-vr hover:scale-105 transition flex items-center justify-center gap-3"
          >
            <Glasses className="w-6 h-6 text-cyan-300" />
            Explore 3D/VR Catalog
          </Link>
          <Link
            href="/upload"
            className="w-full sm:w-auto px-8 py-4 glass-card hover:bg-slate-800 text-white font-bold text-lg rounded-2xl border border-white/10 hover:border-primary transition flex items-center justify-center gap-3"
          >
            <Upload className="w-5 h-5 text-primary" />
            Upload Your Build
          </Link>
        </div>

        {/* Feature Pill Matrix */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl">
          <div className="glass-card p-5 rounded-2xl text-center border-white/5">
            <h3 className="text-3xl font-extrabold text-cyan-400">90 FPS</h3>
            <p className="text-xs text-slate-400 mt-1">WebXR Target Refresh</p>
          </div>
          <div className="glass-card p-5 rounded-2xl text-center border-white/5">
            <h3 className="text-3xl font-extrabold text-primary">6DOF</h3>
            <p className="text-xs text-slate-400 mt-1">Head & Controller Tracking</p>
          </div>
          <div className="glass-card p-5 rounded-2xl text-center border-white/5">
            <h3 className="text-3xl font-extrabold text-emerald-400">Draco</h3>
            <p className="text-xs text-slate-400 mt-1">3D Mesh Compression</p>
          </div>
          <div className="glass-card p-5 rounded-2xl text-center border-white/5">
            <h3 className="text-3xl font-extrabold text-rose-400">Unity</h3>
            <p className="text-xs text-slate-400 mt-1">WebGL WASM Streaming</p>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">Engineered for WebXR Creators</h2>
          <p className="text-slate-400 mt-2">Zero hardcoded data. Built on PostgreSQL, Express, Next.js, and Three.js.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-3xl border border-white/10 hover:border-primary/50 transition">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary mb-6">
              <Glasses className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Instant WebXR Launch</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every project includes a dedicated "Enter VR" launcher. Auto-detects headsets (Quest 2/3, Vision Pro, HTC Vive) or falls back to responsive orbit controls.
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl border border-white/10 hover:border-cyan-500/50 transition">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-6">
              <Play className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Unity WebGL Pipeline</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Upload exported Unity Cloud builds (.loader.js, .framework.js, .data, .wasm). Served with verified MIME types and streaming progress.
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl border border-white/10 hover:border-emerald-500/50 transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Automated Pipeline</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automated virus scanning, thumbnail generation, Draco mesh optimization, security headers, and Cloudflare R2 / AWS S3 distribution.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="glass-card p-12 rounded-3xl border border-primary/40 text-center relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/30 rounded-full blur-3xl"></div>
          <h2 className="text-3xl font-extrabold text-white mb-4">Ready to Experience Your 3D Models in VR?</h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-8 text-sm">
            Drag & drop your GLB files or Unity WebGL packages right now. No setup required.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary-glow text-white font-extrabold rounded-2xl shadow-vr hover:scale-105 transition"
          >
            <Upload className="w-5 h-5" /> Launch Upload Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
