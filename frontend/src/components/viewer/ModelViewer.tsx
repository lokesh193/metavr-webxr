'use client';

import { useRef, useEffect, Suspense, useMemo } from 'react';
import { OrbitControls, useGLTF, useFBX, Float } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useVRStore } from '@/hooks/useVR';

interface ModelViewerProps {
  glbUrl: string;
  projectTitle?: string;
  isVRMode?: boolean;
  wireframe?: boolean;
  autoRotate?: boolean;
}

function WebXRManager() {
  const { gl } = useThree();
  const { isPresenting, setIsPresenting } = useVRStore();

  useEffect(() => {
    if (!gl) return;
    gl.xr.enabled = true;

    if (isPresenting) {
      if ((window as any).__XR_SESSION__) {
        const session = (window as any).__XR_SESSION__;
        gl.xr.setSession(session);
        session.addEventListener('end', () => {
          setIsPresenting(false);
          (window as any).__XR_SESSION__ = null;
        });
      } else if (navigator.xr) {
        (navigator as any).xr
          .requestSession('immersive-vr', {
            requiredFeatures: ['local-floor'],
            optionalFeatures: ['hand-tracking'],
          })
          .then((session: any) => {
            (window as any).__XR_SESSION__ = session;
            gl.xr.setSession(session);
            session.addEventListener('end', () => {
              setIsPresenting(false);
              (window as any).__XR_SESSION__ = null;
            });
          })
          .catch((err: any) => console.warn('WebXR requestSession:', err));
      }
    }
  }, [gl, isPresenting]);

  return null;
}

// Auto-Fit & Ground-Snap Bounding Box Normalizer for FBX & GLTF Models
function AutoFitModel({ object, wireframe }: { object: THREE.Object3D; wireframe?: boolean }) {
  const clone = useMemo(() => object.clone(), [object]);

  useEffect(() => {
    if (!clone) return;

    // Reset transform
    clone.position.set(0, 0, 0);
    clone.rotation.set(0, 0, 0);

    // Compute bounding box
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    if (maxDim > 0 && isFinite(maxDim)) {
      // Normalize model size to a 2.0m bounding height/width
      const desiredScale = 2.0 / maxDim;
      clone.scale.setScalar(desiredScale);

      // Re-center X and Z to origin (0, 0), and snap bottom (Y min) to ground plane (y = 0)
      const center = box.getCenter(new THREE.Vector3());
      clone.position.x = -center.x * desiredScale;
      clone.position.z = -center.z * desiredScale;
      clone.position.y = -box.min.y * desiredScale; // Snap base to y=0 ground level!
    }

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          const mat = mesh.material as any;
          mat.wireframe = !!wireframe;

          if (mat.map) {
            mat.map.colorSpace = THREE.SRGBColorSpace;
            mat.map.needsUpdate = true;
          }
          mat.needsUpdate = true;
        }
      }
    });
  }, [clone, wireframe]);

  return <primitive object={clone} />;
}

function FBXModelAsset({ url, wireframe }: { url: string; wireframe?: boolean }) {
  const fbx = useFBX(url);
  return <AutoFitModel object={fbx} wireframe={wireframe} />;
}

function GLBModelAsset({ url, wireframe }: { url: string; wireframe?: boolean }) {
  const { scene } = useGLTF(url);
  return <AutoFitModel object={scene} wireframe={wireframe} />;
}

export function ModelViewer({
  glbUrl,
  isVRMode = false,
  wireframe = false,
  autoRotate = false,
}: ModelViewerProps) {
  const isFbx = glbUrl.toLowerCase().includes('.fbx');

  return (
    <>
      <WebXRManager />

      {/* Studio Lighting Setup */}
      <ambientLight intensity={1.2} />
      <hemisphereLight args={['#ffffff', '#1e293b', 1.0]} />
      <directionalLight position={[10, 18, 12]} intensity={2.5} castShadow />
      <directionalLight position={[-10, 10, -12]} intensity={1.2} color="#38bdf8" />
      <pointLight position={[0, -5, 0]} intensity={0.8} color="#8b5cf6" />
      <spotLight position={[0, 14, 0]} intensity={1.8} angle={0.6} penumbra={1} castShadow />

      <Float speed={autoRotate ? 1.5 : 0} rotationIntensity={autoRotate ? 0.4 : 0} floatIntensity={0.1}>
        <Suspense fallback={null}>
          {isFbx ? (
            <FBXModelAsset url={glbUrl} wireframe={wireframe} />
          ) : (
            <GLBModelAsset url={glbUrl} wireframe={wireframe} />
          )}
        </Suspense>
      </Float>

      {!isVRMode && (
        <OrbitControls
          makeDefault
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
      )}
    </>
  );
}
