'use client';

export function HandTracking() {
  return (
    <group position={[0, 1.2, -0.4]}>
      {/* Hand joints visualization mesh */}
      <mesh position={[-0.2, 0, 0]}>
        <sphereGeometry args={[0.015, 16, 16]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>
      <mesh position={[0.2, 0, 0]}>
        <sphereGeometry args={[0.015, 16, 16]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>
    </group>
  );
}
