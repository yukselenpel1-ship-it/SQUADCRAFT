'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 1. Interactive Tactical Football (Responsive to pointer coordinates and scroll, no endless spin AF-G02)
function FloatingFootball({ mousePos }: { mousePos: { x: number; y: number } }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const accumulatedTime = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    accumulatedTime.current += Math.min(delta, 0.05);
    const t = accumulatedTime.current;

    // Organic athletic breathing elevation (subtle, 1.18 to 1.22)
    groupRef.current.position.y = 1.2 + Math.sin(t * 1.2) * 0.035;

    // Camera/Pointer driven rotation (AF-G02 compliance: angles respond to pointer and settle, not an infinite automatic spin)
    const targetRotY = mousePos.x * 0.55;
    const targetTiltX = -mousePos.y * 0.12;
    const targetTiltZ = mousePos.x * 0.12;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.06);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetTiltX, 0.06);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetTiltZ, 0.06);
  });

  return (
    <group ref={groupRef} position={[0, 1.2, 0]}>
      {/* Outer Football Body: Matte Carbon Composite */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[0.55, 36, 36]} />
        <meshStandardMaterial
          color="#121814"
          roughness={0.48}
          metalness={0.72}
        />
      </mesh>

      {/* Luminous Lime Pentagonal Seam Cage */}
      <mesh scale={[1.002, 1.002, 1.002]}>
        <icosahedronGeometry args={[0.552, 1]} />
        <meshBasicMaterial
          color="#b7ff35"
          wireframe={true}
          transparent={true}
          opacity={0.4}
        />
      </mesh>

      {/* Tactical Specular Core Light */}
      <pointLight color="#b7ff35" intensity={1.6} distance={2.4} />
    </group>
  );
}

// 2. Stadium Floodlights (Fixed Architectural Lighting, not disco lights)
function StadiumSpotlights() {
  const light1 = useRef<THREE.SpotLight>(null);
  const light2 = useRef<THREE.SpotLight>(null);

  return (
    <>
      {/* Light 1: Primary Pitch Floodlight Left */}
      <spotLight
        ref={light1}
        position={[-7.5, 9, 3.5]}
        color="#b7ff35"
        intensity={2.8}
        angle={0.48}
        penumbra={0.85}
        castShadow
      />
      {/* Light 2: Secondary Rim Light Right */}
      <spotLight
        ref={light2}
        position={[7.5, 9, 3.5]}
        color="#17e5c2"
        intensity={2.4}
        angle={0.48}
        penumbra={0.85}
      />
      {/* Key Architectural Flood */}
      <spotLight
        position={[0, 9.5, -2.5]}
        color="#f2f5f2"
        intensity={1.8}
        angle={0.58}
        penumbra={0.9}
      />
    </>
  );
}

// 3. Stadium Atmosphere Mist (Focused floodlight mist, compliant with AF-G04)
function AtmosphericMist({ count = 110 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = Math.random() * 6 + 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return pos;
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const step = delta * 0.12;

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += Math.sin(i + step) * 0.003;
      if (pos[i * 3 + 1] > 7.5) pos[i * 3 + 1] = 0.5;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#b7ff35"
        transparent={true}
        opacity={0.18}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// 4. Stadium Pitch & Architecture
function StadiumPitch() {
  return (
    <group position={[0, 0, 0]}>
      {/* Dark Pitch Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[45, 45]} />
        <meshStandardMaterial
          color="#060c08"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Luminous Tactical Center Circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[2.8, 2.83, 64]} />
        <meshBasicMaterial color="#b7ff35" transparent opacity={0.18} />
      </mesh>

      {/* Halfway Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[18, 0.03]} />
        <meshBasicMaterial color="#b7ff35" transparent opacity={0.16} />
      </mesh>

      {/* Distant Architectural Tunnel & LED Strip */}
      <mesh position={[0, 1.8, -12]}>
        <boxGeometry args={[24, 0.2, 0.1]} />
        <meshBasicMaterial color="#b7ff35" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, 1.2, -12]}>
        <boxGeometry args={[4.5, 2.4, 0.2]} />
        <meshBasicMaterial color="#050806" />
      </mesh>

      {/* Distant Stadium Stands Silhouette */}
      <mesh position={[0, 5, -16]} rotation={[0.2, 0, 0]}>
        <planeGeometry args={[36, 12]} />
        <meshBasicMaterial color="#030504" transparent opacity={0.94} />
      </mesh>
    </group>
  );
}

// 5. Cinematic Camera Controller (Camera Director v6)
function CameraRig({ mousePos }: { mousePos: { x: number; y: number } }) {
  useFrame(() => {
    // Subtle physical tracking: horizontal ±0.14, vertical ±0.06
    const targetX = mousePos.x * 0.14;
    const targetY = 1.2 + mousePos.y * 0.06;

    // Smooth lerp damping
    THREE.MathUtils.lerp(0, targetX, 0.05);
  });
  return null;
}

export function SquadCraftEnvironment({
  showFootball = true,
  particleCount = 110,
}: {
  showFootball?: boolean;
  particleCount?: number;
}) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [canRenderWebGL, setCanRenderWebGL] = useState(false);

  useEffect(() => {
    // Performance Downgrade Guard (CWI v6 Mobile & Reduced Motion Strategy):
    // Disable WebGL on mobile devices (<768px) and when user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    if (prefersReducedMotion || isMobile) {
      setCanRenderWebGL(false);
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) setCanRenderWebGL(true);
    } catch {
      setCanRenderWebGL(false);
    }

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Mobile / Reduced Motion / Low GPU Fallback (CWI v6 Clean Downgrade Chain)
  if (!canRenderWebGL) {
    return (
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 10%, rgba(183, 255, 53, 0.07), transparent 45%), radial-gradient(circle at 80% 80%, rgba(23, 229, 194, 0.04), transparent 50%), #050806',
        }}
      />
    );
  }

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <Canvas
        camera={{ position: [0, 1.2, 5.8], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.4} />
        <CameraRig mousePos={mousePos} />
        <StadiumSpotlights />
        <AtmosphericMist count={particleCount} />
        <StadiumPitch />
        {showFootball && <FloatingFootball mousePos={mousePos} />}
      </Canvas>
    </div>
  );
}

export default SquadCraftEnvironment;
