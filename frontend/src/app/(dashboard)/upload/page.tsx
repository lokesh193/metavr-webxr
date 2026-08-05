'use client';

import { Dropzone } from '@/components/upload/Dropzone';
import { UploadCloud, Sparkles } from 'lucide-react';

export default function UploadPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border-primary/40 text-xs font-bold text-primary">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Automated 3D Processing Pipeline</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white">Upload Your WebXR Build</h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Drag & drop your GLB models or exported Unity WebGL builds. Assets are automatically scanned, Draco compressed, and indexed for 90 FPS WebXR playback.
        </p>
      </div>

      <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-vr">
        <Dropzone />
      </div>
    </div>
  );
}
