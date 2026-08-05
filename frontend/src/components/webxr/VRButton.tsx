'use client';

import { useEffect, useState } from 'react';
import { Glasses, Loader2, Monitor, AlertCircle } from 'lucide-react';
import { useVRStore } from '@/hooks/useVR';
import { checkWebXRSupport } from '@/lib/webxr-utils';
import { Project } from '@/types';

interface VRButtonProps {
  project: Project;
  onLaunchVR?: () => void;
}

export function VRButton({ project, onLaunchVR }: VRButtonProps) {
  const { isPresenting, setIsPresenting, isLoadingVR, setIsLoadingVR, setProject } = useVRStore();
  const [xrStatus, setXrStatus] = useState<{ supported: boolean; handTrackingSupported: boolean } | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    checkWebXRSupport().then((res) => setXrStatus(res));
  }, []);

  const handleEnterVR = async () => {
    setIsLoadingVR(true);
    setProgress(20);

    try {
      // Set active VR project in store
      setProject(project);

      // Simulate asset preloading progress for smooth WebXR transition
      await new Promise((r) => setTimeout(r, 400));
      setProgress(60);

      await new Promise((r) => setTimeout(r, 400));
      setProgress(100);

      setIsPresenting(true);
      if (onLaunchVR) onLaunchVR();
    } catch (error) {
      console.error('Failed to launch WebXR Session:', error);
    } finally {
      setIsLoadingVR(false);
    }
  };

  const handleExitVR = () => {
    setIsPresenting(false);
  };

  if (isPresenting) {
    return (
      <button
        onClick={handleExitVR}
        className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl shadow-lg flex items-center gap-3 transition transform hover:scale-105"
      >
        <Monitor className="w-6 h-6" /> Exit VR Mode
      </button>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <button
        onClick={handleEnterVR}
        disabled={isLoadingVR}
        className="w-full py-4 px-8 bg-gradient-to-r from-primary via-purple-600 to-secondary hover:from-purple-600 hover:to-cyan-500 text-white font-extrabold text-lg rounded-2xl shadow-vr hover:shadow-cyan flex items-center justify-center gap-3 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
      >
        {isLoadingVR ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin text-white" />
            <span>Preloading VR Assets ({progress}%)...</span>
          </>
        ) : (
          <>
            <Glasses className="w-7 h-7 text-cyan-300 animate-pulse-slow" />
            <span>ENTER VR MODE</span>
          </>
        )}
      </button>

      {/* Hardware Status Indicator */}
      <div className="text-xs text-slate-400 flex items-center gap-2">
        {xrStatus?.supported ? (
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
            WebXR Hardware Detected (Quest / Vive / Index / Vision Pro)
          </span>
        ) : (
          <span className="text-amber-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            No VR Headset detected — Click to preview in 3D Browser Fallback
          </span>
        )}
      </div>
    </div>
  );
}
