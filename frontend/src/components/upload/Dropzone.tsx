'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUpload } from '@/hooks/useUpload';
import { Progress } from '../ui/progress';
import { UploadCloud, File, CheckCircle2, ShieldCheck, Box, Glasses, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Dropzone() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { upload, progress, isUploading } = useUpload();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'model/gltf-binary': ['.glb'],
      'model/gltf+json': ['.gltf'],
      'model/vnd.usdz+zip': ['.usdz'],
      'image/vnd.radiance': ['.hdr', '.hdri'],
      'application/octet-stream': ['.fbx', '.obj', '.data', '.unitypackage', '.usdz', '.hdr', '.hdri'],
      'application/x-unity-package': ['.unitypackage'],
      'application/zip': ['.zip'],
      'application/wasm': ['.wasm'],
      'text/javascript': ['.js', '.loader.js', '.framework.js'],
    },
    maxSize: 1024 * 1024 * 1024, // 1GB limit
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;
    try {
      const res = await upload(files, title, description);
      if (res?.projectId) {
        router.push(`/project/${res.projectId}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Project Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Unity VR Space Station / Sports Car"
            className="w-full bg-slate-900 border border-border/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary transition"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Project Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Interactive 6DOF Unity VR build exported for WebXR..."
            className="w-full bg-slate-900 border border-border/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary transition"
          />
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-primary bg-primary/10 scale-[1.01]'
            : 'border-border/80 hover:border-primary/60 bg-slate-900/60'
        }`}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-4 text-primary">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h4 className="text-lg font-bold text-white mb-2">
          {isDragActive ? 'Drop your Unity build or 3D files here...' : 'Upload Unity WebGL Builds, ZIPs, Packages or 3D Assets'}
        </h4>
        <p className="text-xs text-slate-400 max-w-xl mx-auto mb-4 leading-relaxed">
          Auto-detects <span className="text-purple-400 font-mono">Unity WebGL Builds</span>, <span className="text-cyan-400 font-mono">.ZIP</span>, <span className="text-purple-400 font-mono">.unitypackage</span>, <span className="text-cyan-400 font-mono">GLB / GLTF</span>, <span className="text-cyan-400 font-mono">FBX / OBJ</span>, <span className="text-cyan-400 font-mono">USDZ</span>, and <span className="text-cyan-400 font-mono">HDR / HDRI</span> up to 1GB.
        </p>

        {/* Feature Badges */}
        <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-2 border-t border-border/40 max-w-md mx-auto">
          <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Virus Validated</span>
          <span className="flex items-center gap-1"><Glasses className="w-4 h-4 text-cyan-400" /> WebXR Ready</span>
          <span className="flex items-center gap-1"><Play className="w-4 h-4 text-primary" /> Auto-Extract</span>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-slate-900/80 border border-border/60 rounded-xl p-4 space-y-2">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Selected Files ({files.length})
          </h5>
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between bg-slate-800/60 px-4 py-2.5 rounded-lg text-sm">
              <div className="flex items-center gap-3">
                <File className="w-4 h-4 text-primary" />
                <span className="text-slate-200 font-medium">{file.name}</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Automated Processing & WASM Extraction Pipeline Running...</span>
            <span className="font-mono text-primary">{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={files.length === 0 || isUploading}
        className="w-full py-4 bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-cyan-500 text-white font-extrabold rounded-xl shadow-vr transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="w-5 h-5" />
        {isUploading ? 'Extracting & Launching WebXR Asset...' : 'Upload & Launch in WebXR'}
      </button>
    </form>
  );
}
