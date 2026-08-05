'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function TeleportSystem() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.5;
    }
  });

  return (
    <group position={[0, -0.01, 0]}>
      {/* Teleport Grid Floor */}
      <gridHelper args={[30, 30, '#8b5cf6', '#1e2235']} />

      {/* Target Teleport Locomotion Ring */}
      <mesh ref={ringRef} position={[0, 0.02, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.48, 32]} />
        <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#0b0d19" roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
  );
}
