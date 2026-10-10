'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FormationVisualization, FormationType } from './FormationVisualization';
import { StadiumEnvironment } from './StadiumEnvironment';

interface TacticalSceneProps {
  formation?: FormationType;
  selectedPlayerId?: string | null;
  onSelectPlayer?: (id: string) => void;
  accentColor?: string;
  cyanColor?: string;
  className?: string;
}

/**
 * 1. PROCEDURAL 3D TACTICAL PITCH SLAB & GEOMETRIC FIELD MARKINGS
 */
function TacticalPitchField({
  accentColor = '#B7FF3C',
  cyanColor = '#38D8FF',
}: {
  accentColor?: string;
  cyanColor?: string;
}) {
  const pitchWidth = 6.4;
  const pitchLength = 9.4;
  const halfW = pitchWidth / 2;
  const halfL = pitchLength / 2;

  // Outer touchlines line geometry
  const touchlinesGeo = React.useMemo(() => {
    const pts = [
      new THREE.Vector3(-halfW, 0.02, -halfL),
      new THREE.Vector3(halfW, 0.02, -halfL),
      new THREE.Vector3(halfW, 0.02, halfL),
      new THREE.Vector3(-halfW, 0.02, halfL),
      new THREE.Vector3(-halfW, 0.02, -halfL),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [halfW, halfL]);

  // Halfway line geometry
  const halfwayLineGeo = React.useMemo(() => {
    const pts = [
      new THREE.Vector3(-halfW, 0.02, 0),
      new THREE.Vector3(halfW, 0.02, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [halfW]);

  // Penalty box North geometry
  const penaltyBoxNorthGeo = React.useMemo(() => {
    const bw = 3.2 / 2;
    const bd = 1.6;
    const pts = [
      new THREE.Vector3(-bw, 0.02, -halfL),
      new THREE.Vector3(-bw, 0.02, -halfL + bd),
      new THREE.Vector3(bw, 0.02, -halfL + bd),
      new THREE.Vector3(bw, 0.02, -halfL),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [halfL]);

  // Penalty box South geometry
  const penaltyBoxSouthGeo = React.useMemo(() => {
    const bw = 3.2 / 2;
    const bd = 1.6;
    const pts = [
      new THREE.Vector3(-bw, 0.02, halfL),
      new THREE.Vector3(-bw, 0.02, halfL - bd),
      new THREE.Vector3(bw, 0.02, halfL - bd),
      new THREE.Vector3(bw, 0.02, halfL),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [halfL]);

  // Goal box North geometry (6-yard box)
  const goalBoxNorthGeo = React.useMemo(() => {
    const bw = 1.8 / 2;
    const bd = 0.65;
    const pts = [
      new THREE.Vector3(-bw, 0.02, -halfL),
      new THREE.Vector3(-bw, 0.02, -halfL + bd),
      new THREE.Vector3(bw, 0.02, -halfL + bd),
      new THREE.Vector3(bw, 0.02, -halfL),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [halfL]);

  // Goal box South geometry (6-yard box)
  const goalBoxSouthGeo = React.useMemo(() => {
    const bw = 1.8 / 2;
    const bd = 0.65;
    const pts = [
      new THREE.Vector3(-bw, 0.02, halfL),
      new THREE.Vector3(-bw, 0.02, halfL - bd),
      new THREE.Vector3(bw, 0.02, halfL - bd),
      new THREE.Vector3(bw, 0.02, halfL),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [halfL]);

  const lineMat = React.useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#E0E8F0',
        transparent: true,
        opacity: 0.55,
      }),
    []
  );

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Main Floating Pitch Slab */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[pitchWidth + 0.6, 0.2, pitchLength + 0.6]} />
        <meshStandardMaterial
          color="#0B131E"
          metalness={0.4}
          roughness={0.7}
        />
      </mesh>

      {/* 2. Tactical Grass Turf Surface (Subtle striped field segments) */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[pitchWidth, pitchLength]} />
        <meshStandardMaterial
          color="#09101A"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* 3. Perimeter Glowing LED Ribbon around the pitch edge */}
      {/* Top and Bottom LED border */}
      <mesh position={[0, 0.015, -halfL - 0.12]}>
        <boxGeometry args={[pitchWidth + 0.3, 0.03, 0.04]} />
        <meshBasicMaterial color={accentColor} />
      </mesh>
      <mesh position={[0, 0.015, halfL + 0.12]}>
        <boxGeometry args={[pitchWidth + 0.3, 0.03, 0.04]} />
        <meshBasicMaterial color={accentColor} />
      </mesh>
      {/* Left and Right LED border */}
      <mesh position={[-halfW - 0.12, 0.015, 0]}>
        <boxGeometry args={[0.04, 0.03, pitchLength + 0.3]} />
        <meshBasicMaterial color={cyanColor} />
      </mesh>
      <mesh position={[halfW + 0.12, 0.015, 0]}>
        <boxGeometry args={[0.04, 0.03, pitchLength + 0.3]} />
        <meshBasicMaterial color={cyanColor} />
      </mesh>

      {/* 4. Tactical Pitch Lines */}
      <primitive object={new THREE.Line(touchlinesGeo, lineMat)} />
      <primitive object={new THREE.Line(halfwayLineGeo, lineMat)} />
      <primitive object={new THREE.Line(penaltyBoxNorthGeo, lineMat)} />
      <primitive object={new THREE.Line(penaltyBoxSouthGeo, lineMat)} />
      <primitive object={new THREE.Line(goalBoxNorthGeo, lineMat)} />
      <primitive object={new THREE.Line(goalBoxSouthGeo, lineMat)} />

      {/* Center Circle */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 0.96, 48]} />
        <meshBasicMaterial color="#E0E8F0" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>

      {/* Center Spot */}
      <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.08, 24]} />
        <meshBasicMaterial color={cyanColor} />
      </mesh>

      {/* North & South Penalty Spots */}
      <mesh position={[0, 0.021, -halfL + 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.065, 24]} />
        <meshBasicMaterial color="#E0E8F0" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.021, halfL - 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.065, 24]} />
        <meshBasicMaterial color="#E0E8F0" transparent opacity={0.7} />
      </mesh>

      {/* North & South Penalty D-Arcs */}
      <mesh position={[0, 0.02, -halfL + 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.78, 0.82, 32, 1, Math.PI * 0.22, Math.PI * 0.56]} />
        <meshBasicMaterial color="#E0E8F0" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.02, halfL - 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.78, 0.82, 32, 1, -Math.PI * 0.78, Math.PI * 0.56]} />
        <meshBasicMaterial color="#E0E8F0" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/**
 * 2. POINTER-REACTIVE CINEMATIC CAMERA RIG
 * Subtly tilts and shifts camera with mouse movement for AAA tactical command feel
 */
function CinematicCameraRig() {
  const { camera, pointer } = useThree();
  const initialCamPos = useRef(new THREE.Vector3(0, 8.4, 9.2));
  const targetCamPos = useRef(new THREE.Vector3(0, 8.4, 9.2));
  const lookTarget = useRef(new THREE.Vector3(0, 0.1, 0));

  useFrame((_, delta) => {
    // Restrain delta to prevent wild jumps on frame drop
    const dt = Math.min(delta, 0.05);

    // Compute subtle parallax based on pointer (-1 to 1)
    // Max horizontal tilt: 1.2 units, max vertical tilt: 0.8 units
    targetCamPos.current.x = pointer.x * 1.35;
    targetCamPos.current.y = 8.4 - pointer.y * 0.75;
    targetCamPos.current.z = 9.2 + Math.abs(pointer.x) * 0.4;

    // Smooth damping lerp
    camera.position.lerp(targetCamPos.current, 0.045);
    camera.lookAt(lookTarget.current);
  });

  return null;
}

/**
 * 3. MASTER TACTICAL SCENE WRAPPER
 */
export function TacticalScene({
  formation = '4-3-3',
  selectedPlayerId = null,
  onSelectPlayer,
  accentColor = '#B7FF3C',
  cyanColor = '#38D8FF',
  className = '',
}: TacticalSceneProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // High-performance placeholder while mounting
    return (
      <div className={`w-full h-full bg-[#05080D] flex items-center justify-center ${className}`}>
        <div className="w-8 h-8 rounded-full border-2 border-[#B7FF3C] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      <Canvas
        camera={{
          fov: 42,
          position: [0, 8.4, 9.2],
          near: 0.1,
          far: 80,
        }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        dpr={[1, 1.5]}
        style={{ background: '#05080D' }}
      >
        {/* Pointer-Reactive Parallax Camera Controller */}
        <CinematicCameraRig />

        {/* Stadium Architecture, Floodlights & Atmospheric Fog */}
        <StadiumEnvironment
          accentColor={accentColor}
          cyanColor={cyanColor}
        />

        {/* Tactical Pitch Slab & Geometric Line Markings */}
        <TacticalPitchField
          accentColor={accentColor}
          cyanColor={cyanColor}
        />

        {/* 11 Dynamic Formation Nodes & Passing Beams */}
        <FormationVisualization
          formation={formation}
          selectedPlayerId={selectedPlayerId}
          onSelectPlayer={onSelectPlayer}
          accentColor={accentColor}
          cyanColor={cyanColor}
        />
      </Canvas>
    </div>
  );
}
