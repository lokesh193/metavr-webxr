'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function XRController({ isLeft = false }: { isLeft?: boolean }) {
  const pointerRef = useRef<THREE.Mesh>(null);
  const controllerGroup = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (pointerRef.current) {
      pointerRef.current.rotation.x += delta * 0.5;
    }
  });

  return (
    <group ref={controllerGroup} position={[isLeft ? -0.4 : 0.4, 1.2, -0.5]}>
      {/* VR Controller Handle */}
      <mesh castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.16, 16]} />
        <meshStandardMaterial color="#8b5cf6" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Controller Thumbstick */}
      <mesh position={[0, 0.08, -0.02]}>
        <cylinderGeometry args={[0.015, 0.015, 0.02, 16]} />
        <meshStandardMaterial color="#06b6d4" metalness={0.9} />
      </mesh>

      {/* Controller Trigger Button */}
      <mesh position={[0, -0.02, -0.04]}>
        <boxGeometry args={[0.015, 0.04, 0.03]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* 6DOF Raycast Pointer Beam */}
      <mesh ref={pointerRef} position={[0, 0, -1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.002, 0.002, 2, 8]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}
