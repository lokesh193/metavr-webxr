'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { OrbitControls } from '@react-three/drei';
import { XRController } from './XRController';
import { TeleportSystem } from './TeleportSystem';
import { HandTracking } from './HandTracking';
import { ModelViewer } from '../viewer/ModelViewer';
import { UnityViewer } from '../viewer/UnityViewer';
import { useVRStore } from '@/hooks/useVR';
import { X, Glasses, Compass } from 'lucide-react';

export function VRScene() {
  const { isPresenting, project, setIsPresenting } = useVRStore();

  if (!isPresenting || !project) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#07080f] flex flex-col">
      {/* VR HUD Header Banner */}
      <div className="absolute top-6 left-6 right-6 z-50 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-primary/40 pointer-events-auto shadow-vr">
          <Glasses className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span className="text-sm font-bold text-white tracking-wide">
            WebXR Mode Active — {project.title}
          </span>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <span className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-slate-900/80 backdrop-blur-md text-xs font-semibold text-slate-300 rounded-full border border-white/10">
            <Compass className="w-3.5 h-3.5 text-cyan-400" /> Right-Click / Shift+Drag to Pan Up/Down | Drag to Orbit 360°
          </span>

          <button
            onClick={() => setIsPresenting(false)}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-full backdrop-blur-md flex items-center gap-2 transition shadow-lg"
          >
            <X className="w-4 h-4" /> Exit VR Mode
          </button>
        </div>
      </div>

      {/* Render 3D Model WebGL Canvas OR Native Unity WebGL Container */}
      {project.type === 'MODEL' && project.glbUrl ? (
        <Canvas
          camera={{ position: [0, 1.4, 3.8], fov: 50 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            <color attach="background" args={['#07080f']} />
            <ambientLight intensity={1.2} />
            <directionalLight position={[10, 18, 12]} intensity={2.2} castShadow />
            <hemisphereLight args={['#ffffff', '#1e293b', 1.0]} />

            <XRController isLeft={true} />
            <XRController isLeft={false} />
            <TeleportSystem />
            <HandTracking />

            <ModelViewer glbUrl={project.glbUrl} projectTitle={project.title} isVRMode={true} />

            <OrbitControls
              makeDefault
              target={[0, 0.8, 0]}
              enableDamping
              dampingFactor={0.05}
              enablePan={true}
              panSpeed={1.5}
              screenSpacePanning={true}
              minDistance={0.05}
              maxDistance={300}
              minPolarAngle={0}
              maxPolarAngle={Math.PI}
            />
          </Suspense>
        </Canvas>
      ) : project.type === 'UNITY' && project.unityUrls ? (
        <div className="w-full h-full pt-16">
          <UnityViewer urls={project.unityUrls} projectTitle={project.title} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-slate-400">
          No playable media stream found for this project.
        </div>
      )}
    </div>
  );
}
