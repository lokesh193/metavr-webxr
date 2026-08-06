'use client';

import { useEffect, useState } from 'react';
import { Glasses, Loader2, Monitor, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useVRStore } from '@/hooks/useVR';
import { checkWebXRSupport } from '@/lib/webxr-utils';
import { Project } from '@/types';

interface VRButtonProps {
  project: Project;
  onLaunchVR?: () => void;
}

export function VRButton({ project, onLaunchVR }: VRButtonProps) {
  const { isPresenting, setIsPresenting, isLoadingVR, setIsLoadingVR, setProject } = useVRStore();
  const [xrStatus, setXrStatus] = useState<{ supported: boolean; handTrackingSupported: boolean; hardwareName: string } | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    checkWebXRSupport().then((res) => setXrStatus(res));
  }, []);

  const handleEnterVR = async () => {
    setIsLoadingVR(true);
    setProgress(30);

    try {
      setProject(project);

      await new Promise((r) => setTimeout(r, 200));
      setProgress(70);

      await new Promise((r) => setTimeout(r, 200));
      setProgress(100);

      // Trigger WebXR Immersive Session
      if (navigator.xr && xrStatus?.supported) {
        try {
          const session = await (navigator as any).xr.requestSession('immersive-vr', {
            requiredFeatures: ['local-floor'],
            optionalFeatures: ['hand-tracking'],
          });
          (window as any).__XR_SESSION__ = session;
        } catch (err) {
          console.warn('Direct requestSession note:', err);
        }
      }

      setIsPresenting(true);
      if (onLaunchVR) onLaunchVR();
    } catch (error) {
      console.error('Failed to launch WebXR Session:', error);
    } finally {
      setIsLoadingVR(false);
    }
  };

  const handleExitVR = () => {
    if ((window as any).__XR_SESSION__) {
      try {
        (window as any).__XR_SESSION__.end();
      } catch (e) {}
    }
    setIsPresenting(false);
  };

  if (isPresenting) {
    return (
      <button
        onClick={handleExitVR}
        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
      >
        <Monitor className="w-4 h-4" /> Exit VR Mode
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5 w-full">
      <button
        onClick={handleEnterVR}
        disabled={isLoadingVR}
        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-cyan hover:scale-[1.02] flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-50"
      >
        {isLoadingVR ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Launching 6DOF WebXR ({progress}%)...</span>
          </>
        ) : (
          <>
            <Glasses className="w-4 h-4 text-cyan-200 animate-pulse" />
            <span>ENTER IMMERSIVE VR MODE</span>
          </>
        )}
      </button>

      {/* Clean Status Subtext */}
      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
        {xrStatus?.supported ? (
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {xrStatus.hardwareName} VR Headset Detected (6DOF Stereo Ready)
          </span>
        ) : (
          <span className="text-amber-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Desktop / Mobile Device — Full 3D Interactive GPU Canvas Mode
          </span>
        )}
      </div>
    </div>
  );
}
