'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollStory } from './useScrollStory';

export function WorldEnvironment() {
  const { progress } = useScrollStory();

  const stadiumGroup = useRef<THREE.Group>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const accentLightRef = useRef<THREE.DirectionalLight>(null);
  const floodlightGlowRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const beamConeMatRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const accentColorRef = useRef(new THREE.Color('#B7FF3C'));

  // 4 Corner floodlight mast coordinates
  const floodlightPositions: [number, number, number][] = useMemo(
    () => [
      [-10.5, 8.2, -10.5],
      [10.5, 8.2, -10.5],
      [-10.5, 8.2, 10.5],
      [10.5, 8.2, 10.5],
    ],
    []
  );

  // Reusable colors
  const limeColor = useMemo(() => new THREE.Color('#B7FF3C'), []);
  const cyanColor = useMemo(() => new THREE.Color('#38D8FF'), []);
  const goldColor = useMemo(() => new THREE.Color('#FFC857'), []);
  const blueColor = useMemo(() => new THREE.Color('#477BFF'), []);

  // Frame animation for lighting interpolation based on scroll progress
  useFrame((state, delta) => {
    // 1. Dynamic Lighting state calculation
    const currentAccentColor = accentColorRef.current;
    currentAccentColor.copy(limeColor);
    let keyIntensity = 1.0;
    let beamOpacity = 0.06;
    let floodlightIntensity = 1.0;

    if (progress < 0.18) {
      // Act I: Stadium Awakening (Tunnel darkness -> Floodlights ignite)
      const t = progress / 0.18;
      floodlightIntensity = THREE.MathUtils.lerp(0.1, 1.2, t);
      keyIntensity = THREE.MathUtils.lerp(0.2, 1.2, t);
      beamOpacity = THREE.MathUtils.lerp(0.01, 0.07, t);
      currentAccentColor.copy(limeColor);
    } else if (progress < 0.38) {
      // Act II: Tactical Universe (Tactical Lime / Cyan focus)
      keyIntensity = 1.35;
      beamOpacity = 0.08;
      floodlightIntensity = 1.2;
      currentAccentColor.copy(limeColor);
    } else if (progress < 0.58) {
      // Act III: Build Your Dynasty (Victory Gold warmth)
      const t = (progress - 0.38) / 0.2;
      currentAccentColor.lerp(goldColor, t);
      keyIntensity = 1.15;
      beamOpacity = 0.07;
      floodlightIntensity = 1.0;
    } else if (progress < 0.78) {
      // Act IV: Draft League (Electric Blue competitive arena)
      const t = (progress - 0.58) / 0.2;
      currentAccentColor.copy(goldColor).lerp(blueColor, t);
      keyIntensity = 1.2;
      beamOpacity = 0.09;
      floodlightIntensity = 1.3;
    } else {
      // Act V: Finale Master Composition
      currentAccentColor.copy(limeColor);
      keyIntensity = 1.4;
      beamOpacity = 0.08;
      floodlightIntensity = 1.4;
    }

    if (keyLightRef.current) {
      keyLightRef.current.intensity = keyIntensity;
    }

    if (accentLightRef.current) {
      accentLightRef.current.color.copy(currentAccentColor);
    }

    beamConeMatRefs.current.forEach((mat) => {
      if (mat) {
        mat.opacity = beamOpacity;
        mat.color.copy(currentAccentColor);
      }
    });

    floodlightGlowRefs.current.forEach((mat) => {
      if (mat) {
        mat.color.copy(currentAccentColor);
      }
    });
  });

  return (
    <group ref={stadiumGroup}>
      {/* Stadium Spatial Fog */}
      <fogExp2 attach="fog" args={['#05080D', 0.042]} />

      {/* Ambient Night Illumination */}
      <ambientLight ref={ambientLightRef} intensity={0.5} color="#08111D" />

      {/* Central Key Light illuminating the pitch */}
      <directionalLight
        ref={keyLightRef}
        position={[0, 16, 6]}
        intensity={1.2}
        color="#F2F6FA"
      />

      {/* Dynamic Accent Rim Light */}
      <directionalLight
        ref={accentLightRef}
        position={[-12, 10, -8]}
        intensity={0.8}
        color="#B7FF3C"
      />

      {/* 1. ARCHITECTURAL STADIUM TIERS & SEATING RINGS */}
      {/* Lower Grandstand Bowl */}
      <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[7.2, 13.0, 48]} />
        <meshStandardMaterial color="#08111D" roughness={0.85} metalness={0.25} />
      </mesh>

      {/* Mezzanine Grandstand Rim */}
      <mesh position={[0, 1.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[13.1, 15.8, 48]} />
        <meshStandardMaterial color="#0b1726" roughness={0.8} metalness={0.3} />
      </mesh>

      {/* Upper Structural Ring Silhouette */}
      <mesh position={[0, 5.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[15.9, 17.5, 48]} />
        <meshStandardMaterial color="#111B27" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Roof Gantry Truss Ring */}
      <mesh position={[0, 7.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[16.8, 0.14, 16, 64]} />
        <meshStandardMaterial
          color="#192535"
          emissive="#38D8FF"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* 2. FOUR CORNER FLOODLIGHT MASTS */}
      {floodlightPositions.map((pos, idx) => (
        <group key={idx} position={pos}>
          {/* Mast Steel Column */}
          <mesh position={[0, -4.0, 0]}>
            <cylinderGeometry args={[0.15, 0.24, 8.0, 12]} />
            <meshStandardMaterial color="#111B27" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Mast Head Gantry */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.2, 0.75, 0.45]} />
            <meshStandardMaterial color="#192535" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Luminous Lamp Array Bulb */}
          <mesh position={[0, 0, 0.24]}>
            <boxGeometry args={[1.0, 0.6, 0.05]} />
            <meshBasicMaterial
              ref={(el) => {
                floodlightGlowRefs.current[idx] = el;
              }}
              color="#B7FF3C"
            />
          </mesh>

          {/* Volumetric Directional Light Cone shining toward pitch */}
          <mesh
            position={[
              pos[0] > 0 ? -4.8 : 4.8,
              -4.0,
              pos[2] > 0 ? -4.8 : 4.8,
            ]}
            rotation={[
              pos[2] > 0 ? 0.6 : -0.6,
              0,
              pos[0] > 0 ? -0.6 : 0.6,
            ]}
          >
            <coneGeometry args={[3.4, 10.0, 24, 1, true]} />
            <meshBasicMaterial
              ref={(el) => {
                beamConeMatRefs.current[idx] = el;
              }}
              color="#B7FF3C"
              transparent
              opacity={0.065}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}

      {/* 3. Deep Stadium Ground Base Plane */}
      <mesh position={[0, -0.68, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshBasicMaterial color="#05080D" />
      </mesh>
    </group>
  );
}
