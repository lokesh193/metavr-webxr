'use client';

import { useEffect, useRef, useState } from 'react';
import { loadUnityInstance } from '@/lib/unity-loader';
import { UnityUrls } from '@/types';
import { Progress } from '../ui/progress';
import { Play, Glasses, Maximize2, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { useVRStore } from '@/hooks/useVR';
import { checkWebXRSupport, DeviceXRMatrix } from '@/lib/webxr-utils';

interface UnityViewerProps {
  urls: UnityUrls;
  projectTitle?: string;
}

export function UnityViewer({ urls, projectTitle }: UnityViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [xrStatus, setXrStatus] = useState<DeviceXRMatrix | null>(null);
  const [unityInstance, setUnityInstance] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { setIsPresenting } = useVRStore();

  useEffect(() => {
    checkWebXRSupport().then((res) => setXrStatus(res));
  }, []);

  useEffect(() => {
    // If indexUrl is available, serve creator's native index.html via iframe engine
    if (urls?.indexUrl) return;

    if (!canvasRef.current) return;
    
    // Resolve loader, framework, data, and wasm URLs
    const loaderUrl = urls?.loader;
    if (!loaderUrl) {
      setLoadError('Unity loader.js script URL is missing from project metadata.');
      setLoading(false);
      return;
    }

    console.log('[UnityViewer] Initializing Unity WebGL runtime with URLs:', {
      loaderUrl,
      frameworkUrl: urls.framework,
      dataUrl: urls.data,
      wasmUrl: urls.wasm,
    });

    loadUnityInstance(canvasRef.current, {
      loaderUrl: loaderUrl,
      frameworkUrl: urls.framework || '',
      dataUrl: urls.data || '',
      wasmUrl: urls.wasm || '',
      onProgress: (p) => {
        const pct = Math.round(p * 100);
        setProgress(pct);
      },
    })
      .then((instance) => {
        console.log('[UnityViewer] Unity Instance successfully initialized! (100% Loaded)');
        setUnityInstance(instance);
        setProgress(100);
        setLoading(false);
      })
      .catch((err) => {
        const errorMsg = typeof err === 'string' ? err : err?.message || JSON.stringify(err) || 'Failed to stream Unity WebGL build files.';
        console.error('[UnityViewer DEBUG ERROR]:', err);
        setLoadError(errorMsg);
        setLoading(false);
      });
  }, [urls]);

  const handleStartPlay = () => {
    setIsPlaying(true);
    if (canvasRef.current) {
      canvasRef.current.focus();
    }
  };

  const handleEnterVR = async () => {
    if (xrStatus?.supported) {
      try {
        if (unityInstance?.Module?.WebXR || (window as any).webxr) {
          if (unityInstance?.Module?.WebXR?.toggleVR) {
            unityInstance.Module.WebXR.toggleVR();
          } else {
            await (navigator as any).xr.requestSession('immersive-vr', {
              requiredFeatures: ['local-floor'],
              optionalFeatures: ['hand-tracking'],
            });
            setIsPresenting(true);
          }
        } else {
          setIsPresenting(true);
        }
      } catch (err) {
        console.error('WebXR session request:', err);
        setIsPresenting(true);
      }
    } else {
      alert(`VR Hardware Notice: No 6DOF VR Headset API detected on your current browser (${xrStatus?.hardwareName || 'Desktop'}). Launching live Unity project in GPU WebGL Desktop mode.`);
      setIsPlaying(true);
      if (canvasRef.current) canvasRef.current.focus();
    }
  };

  const handleToggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  // Option 1: Serve Creator's exact index.html template if indexUrl is available
  if (urls?.indexUrl) {
    return (
      <div ref={containerRef} className="relative w-full h-full min-h-[580px] bg-slate-950 rounded-2xl overflow-hidden border border-border/60 shadow-vr">
        <iframe
          src={urls.indexUrl}
          className="w-full h-full min-h-[580px] border-0"
          allow="autoplay; fullscreen; vr; xr-spatial-tracking"
          title={projectTitle || 'Unity WebGL Build'}
        />
      </div>
    );
  }

  // Option 2: Execute createUnityInstance directly on canvas
  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[540px] bg-slate-950 rounded-2xl overflow-hidden border border-border/60 flex items-center justify-center group shadow-vr"
    >
      <canvas ref={canvasRef} className="w-full h-full object-cover" tabIndex={0} />

      {/* GPU WASM Streaming Loading Screen */}
      {loading && !loadError && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-8 z-30 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center animate-bounce text-primary">
            <Zap className="w-8 h-8 fill-primary" />
          </div>
          <h3 className="text-2xl font-extrabold text-white">Streaming High-Performance Unity WebGL Build</h3>
          <p className="text-xs text-slate-400 text-center max-w-md leading-relaxed">
            Executing creator's original C# scripts, physics, particle effects, UI canvases, and XR Interaction Toolkit logic...
          </p>
          <div className="w-full max-w-sm">
            <Progress value={progress} />
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2 font-mono">
              <span>WASM GPU Acceleration Stream:</span>
              <span className="text-cyan-400 font-bold">{progress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Load Error Report */}
      {loadError && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-8 text-center z-30 space-y-3">
          <AlertCircle className="w-12 h-12 text-red-400 animate-pulse mx-auto" />
          <h4 className="text-lg font-bold text-white">Unity Build Runtime Error</h4>
          <p className="text-xs text-red-300 max-w-md font-mono bg-red-950/60 p-4 rounded-xl border border-red-800/40">
            {loadError}
          </p>
        </div>
      )}

      {/* Action Overlay Panel: ▶ Play & 🥽 Enter VR Mode */}
      {!loading && !isPlaying && !loadError && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center gap-5 z-20 p-6">
          <div className="text-center space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold uppercase tracking-wider">
              Native Unity WebGL & WebXR Execution Engine
            </span>
            <h3 className="text-3xl font-extrabold text-white">{projectTitle || 'Unity VR Application'}</h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              Preserves 100% of original C# scripts, XR interactions, UI canvases, audio, animations, and game logic.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleStartPlay}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary text-white font-extrabold text-base rounded-2xl shadow-vr hover:scale-105 transition flex items-center justify-center gap-3"
            >
              <Play className="w-5 h-5 fill-white" /> ▶ Play Game
            </button>
            <button
              onClick={handleEnterVR}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-secondary to-cyan-500 hover:from-cyan-500 hover:to-secondary text-white font-extrabold text-base rounded-2xl shadow-cyan hover:scale-105 transition flex items-center justify-center gap-3"
            >
              <Glasses className="w-6 h-6 text-cyan-200 animate-pulse" /> 🥽 Enter VR Mode
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2 pt-2">
            {xrStatus?.supported ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {xrStatus.hardwareName} Detected (6DOF WebXR VR Session Ready)
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                {xrStatus?.hardwareName || 'Desktop Device'} — High-Performance GPU WebGL Mode
              </span>
            )}
          </div>
        </div>
      )}

      {/* Control Bar in Play Mode */}
      {isPlaying && (
        <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2">
          <button
            onClick={handleToggleFullscreen}
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md text-white rounded-xl border border-white/10 shadow-lg"
            title="Fullscreen Mode"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
