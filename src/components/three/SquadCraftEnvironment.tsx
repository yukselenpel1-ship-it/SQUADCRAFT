'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 1. Floating Metallic Football with luminous lime seams
function FloatingFootball({ mousePos }: { mousePos: { x: number; y: number } }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // Subtle floating and rotation animation
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();

    // Floating vertical oscillation: 1.15 -> 1.25 -> 1.15 over ~4s
    groupRef.current.position.y = 1.2 + Math.sin(time * 1.57) * 0.06;

    // Continuous rotateY: 18s full rotation
    groupRef.current.rotation.y += delta * (Math.PI * 2 / 18);

    // Mouse tilt: max ~5 degrees (0.087 rad) with smooth damping
    const targetTiltX = -mousePos.y * 0.08;
    const targetTiltZ = mousePos.x * 0.08;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetTiltX, 0.06);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetTiltZ, 0.06);
  });

  return (
    <group ref={groupRef} position={[0, 1.2, 0]}>
      {/* Outer Football Body: Matte Graphite with subtle carbon specular */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[0.55, 36, 36]} />
        <meshStandardMaterial
          color="#161b17"
          roughness={0.42}
          metalness={0.78}
          wireframe={false}
        />
      </mesh>

      {/* Luminous Lime Pentagonal Seam Rings / Wire cage */}
      <mesh scale={[1.002, 1.002, 1.002]}>
        <icosahedronGeometry args={[0.552, 1]} />
        <meshBasicMaterial
          color="#b7ff35"
          wireframe={true}
          transparent={true}
          opacity={0.45}
        />
      </mesh>

      {/* Subtle Inner Glow */}
      <pointLight color="#b7ff35" intensity={1.8} distance={2.5} />
    </group>
  );
}

// 2. Sweeping Stadium Spotlights (4 lights from upper structure)
function StadiumSpotlights() {
  const light1 = useRef<THREE.SpotLight>(null);
  const light2 = useRef<THREE.SpotLight>(null);
  const light3 = useRef<THREE.SpotLight>(null);
  const light4 = useRef<THREE.SpotLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (light1.current) {
      light1.current.position.x = -6 + Math.sin(t * 0.6) * 1.5;
      light1.current.target.position.x = Math.sin(t * 0.5) * 3;
      light1.current.target.updateMatrixWorld();
    }
    if (light2.current) {
      light2.current.position.x = 6 + Math.cos(t * 0.45) * 1.5;
      light2.current.target.position.x = -Math.cos(t * 0.55) * 3;
      light2.current.target.updateMatrixWorld();
    }
    if (light3.current) {
      light3.current.position.z = -5 + Math.sin(t * 0.35) * 2;
      light3.current.target.position.z = Math.cos(t * 0.4) * 2;
      light3.current.target.updateMatrixWorld();
    }
    if (light4.current) {
      light4.current.position.y = 8 + Math.cos(t * 0.5) * 0.8;
    }
  });

  return (
    <>
      {/* Light 1: Lime Accent left */}
      <spotLight
        ref={light1}
        position={[-7, 8, 4]}
        color="#b7ff35"
        intensity={3.2}
        angle={0.42}
        penumbra={0.8}
        castShadow
      />
      {/* Light 2: Teal Secondary right */}
      <spotLight
        ref={light2}
        position={[7, 8, 4]}
        color="#17e5c2"
        intensity={2.8}
        angle={0.44}
        penumbra={0.8}
      />
      {/* Light 3: Soft White Key */}
      <spotLight
        ref={light3}
        position={[0, 9, -2]}
        color="#f2f5f2"
        intensity={2.0}
        angle={0.55}
        penumbra={0.9}
      />
      {/* Light 4: High Pitch Wash */}
      <spotLight
        ref={light4}
        position={[0, 8.5, 6]}
        color="#b7ff35"
        intensity={1.2}
        angle={0.65}
        penumbra={0.85}
      />
    </>
  );
}

// 3. Floating Atmospheric Particles (moisture / stadium dust)
function AtmosphericParticles({ count = 380 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, opacities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const op = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = Math.random() * 8 - 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16;
      op[i] = 0.08 + Math.random() * 0.18;
    }
    return [pos, op];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      // Extremely slow vertical drift
      pos[i * 3 + 1] += Math.sin(time * 0.3 + i) * 0.002;
      if (pos[i * 3 + 1] > 8) pos[i * 3 + 1] = 0;
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
        size={0.035}
        color="#b7ff35"
        transparent={true}
        opacity={0.22}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// 4. Stadium Pitch & Architecture
function StadiumPitch() {
  return (
    <group position={[0, 0, 0]}>
      {/* Dark Pitch Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[45, 45]} />
        <meshStandardMaterial
          color="#07120b"
          roughness={0.88}
          metalness={0.12}
        />
      </mesh>

      {/* Luminous Tactical Pitch Markings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[2.8, 2.84, 64]} />
        <meshBasicMaterial color="#b7ff35" transparent opacity={0.2} />
      </mesh>

      {/* Halfway line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[18, 0.04]} />
        <meshBasicMaterial color="#b7ff35" transparent opacity={0.18} />
      </mesh>

      {/* Distant Stadium LED Strips & Tunnel Opening */}
      <mesh position={[0, 1.8, -12]}>
        <boxGeometry args={[24, 0.25, 0.1]} />
        <meshBasicMaterial color="#b7ff35" transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, 1.2, -12]}>
        <boxGeometry args={[4.5, 2.4, 0.2]} />
        <meshBasicMaterial color="#050806" />
      </mesh>

      {/* Distant Stadium Stands silhouette */}
      <mesh position={[0, 5, -16]} rotation={[0.2, 0, 0]}>
        <planeGeometry args={[36, 12]} />
        <meshBasicMaterial color="#040605" transparent opacity={0.92} />
      </mesh>
    </group>
  );
}

// 5. Camera Controller with smooth damping
function CameraRig({ mousePos }: { mousePos: { x: number; y: number } }) {
  useFrame((state) => {
    // Offset camera slightly with cursor damping: horizontal ±0.12, vertical ±0.06
    const targetX = mousePos.x * 0.12;
    const targetY = 1.2 + mousePos.y * 0.06;

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.06);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.06);
    state.camera.lookAt(0, 1.2, 0);
  });
  return null;
}

export function SquadCraftEnvironment({
  showFootball = true,
  particleCount = 420,
}: {
  showFootball?: boolean;
  particleCount?: number;
}) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebGLSupported(false);
    } catch {
      setWebGLSupported(false);
    }

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!webGLSupported) {
    return (
      <div className="absolute inset-0 z-0 bg-radial from-[#b7ff35]/8 via-[#07120b]/80 to-[#050806]" />
    );
  }

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <Canvas
        camera={{ position: [0, 1.2, 6], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.45} />
        <CameraRig mousePos={mousePos} />
        <StadiumSpotlights />
        <AtmosphericParticles count={particleCount} />
        <StadiumPitch />
        {showFootball && <FloatingFootball mousePos={mousePos} />}
      </Canvas>
    </div>
  );
}
export default SquadCraftEnvironment;
