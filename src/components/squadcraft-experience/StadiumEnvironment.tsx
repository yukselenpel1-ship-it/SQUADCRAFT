'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StadiumEnvironmentProps {
  accentColor?: string; // Tactical Lime #B7FF3C
  cyanColor?: string;   // Electric Cyan #38D8FF
}

export function StadiumEnvironment({
  accentColor = '#B7FF3C',
  cyanColor = '#38D8FF',
}: StadiumEnvironmentProps) {
  const stadiumGroup = useRef<THREE.Group>(null);
  const floatingBallRef = useRef<THREE.Group>(null);
  const dustParticlesRef = useRef<THREE.Points>(null);

  // 1. Stadium Floodlight Mast Coordinates
  const floodlightPositions: [number, number, number][] = useMemo(
    () => [
      [-9.5, 7.8, -9.5],
      [9.5, 7.8, -9.5],
      [-9.5, 7.8, 9.5],
      [9.5, 7.8, 9.5],
    ],
    []
  );

  // 2. Atmospheric Floating Dust Motes (120 particles)
  const [particleGeo, particlePositions] = useMemo(() => {
    const count = 120;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = Math.random() * 9 + 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 24;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return [geo, pos];
  }, []);

  // Frame animation for atmospheric float & ball rotation
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Floating tactical ball gentle levitation & spin
    if (floatingBallRef.current) {
      floatingBallRef.current.position.y = 3.6 + Math.sin(t * 1.1) * 0.25;
      floatingBallRef.current.rotation.y += delta * 0.4;
      floatingBallRef.current.rotation.x = Math.sin(t * 0.6) * 0.15;
    }

    // Floating stadium dust particles gentle drift
    if (dustParticlesRef.current) {
      const positions = dustParticlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] -= delta * 0.12;
        if (positions[i * 3 + 1] < 0.2) {
          positions[i * 3 + 1] = 9.0;
        }
      }
      dustParticlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group ref={stadiumGroup}>
      {/* Exponential Spatial Stadium Fog */}
      <fogExp2 attach="fog" args={['#05080D', 0.045]} />

      {/* Ambient Stadium Lighting */}
      <ambientLight intensity={0.45} color="#0d1824" />

      {/* Central Key Light illuminating the Pitch */}
      <directionalLight
        position={[0, 14, 5]}
        intensity={1.2}
        color="#F2F6FA"
        castShadow={false}
      />

      {/* Tactical Lime Rim Light */}
      <directionalLight
        position={[-12, 8, -10]}
        intensity={0.65}
        color={accentColor}
      />

      {/* Electric Cyan Fill Light */}
      <directionalLight
        position={[12, 6, 10]}
        intensity={0.5}
        color={cyanColor}
      />

      {/* 1. Grandstand Architectural Structure (Tiers & Outer Shell) */}
      {/* Lower Tier Bowl */}
      <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.8, 12.5, 48]} />
        <meshStandardMaterial
          color="#080F18"
          roughness={0.88}
          metalness={0.25}
        />
      </mesh>

      {/* Mezzanine Tier Rim */}
      <mesh position={[0, 1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[12.6, 15.2, 48]} />
        <meshStandardMaterial
          color="#0c1724"
          roughness={0.85}
          metalness={0.3}
        />
      </mesh>

      {/* Upper Structural Ring Silhouette */}
      <mesh position={[0, 5.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[15.3, 16.8, 48]} />
        <meshStandardMaterial
          color="#111B27"
          roughness={0.7}
          metalness={0.5}
          wireframe={false}
        />
      </mesh>

      {/* Roof Gantry Truss Ring (Luminous Structural Beam) */}
      <mesh position={[0, 6.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[16.2, 0.12, 16, 64]} />
        <meshStandardMaterial
          color="#192535"
          emissive={cyanColor}
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* 2. Four Corner Floodlight Towers with Volumetric Cones */}
      {floodlightPositions.map((pos, idx) => {
        const isAccent = idx % 2 === 0;
        const towerColor = isAccent ? accentColor : cyanColor;

        return (
          <group key={idx} position={pos}>
            {/* Mast Column */}
            <mesh position={[0, -3.8, 0]}>
              <cylinderGeometry args={[0.14, 0.22, 7.6, 12]} />
              <meshStandardMaterial color="#111B27" metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Floodlight Head Gantry */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.1, 0.7, 0.4]} />
              <meshStandardMaterial color="#192535" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Glowing Lamp Bulbs */}
            <mesh position={[0, 0, 0.22]}>
              <boxGeometry args={[0.95, 0.55, 0.05]} />
              <meshBasicMaterial color={towerColor} />
            </mesh>

            {/* Point Light Casting Atmosphere */}
            <pointLight
              color={towerColor}
              intensity={2.8}
              distance={18}
              decay={2}
            />

            {/* Volumetric Light Beam Cone towards Pitch */}
            <mesh
              position={[
                pos[0] > 0 ? -4.5 : 4.5,
                -3.8,
                pos[2] > 0 ? -4.5 : 4.5,
              ]}
              rotation={[
                pos[2] > 0 ? 0.6 : -0.6,
                0,
                pos[0] > 0 ? -0.6 : 0.6,
              ]}
            >
              <coneGeometry args={[3.2, 9.5, 24, 1, true]} />
              <meshBasicMaterial
                color={towerColor}
                transparent
                opacity={0.065}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}

      {/* 3. Floating Tactical Polyhedron (Futuristic Football Core) */}
      <group ref={floatingBallRef} position={[4.6, 3.6, -3.2]}>
        {/* Outer Wireframe Cage */}
        <mesh>
          <icosahedronGeometry args={[0.62, 1]} />
          <meshStandardMaterial
            color="#192535"
            metalness={0.9}
            roughness={0.15}
            wireframe
            emissive={accentColor}
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* Inner Solid Core with Hexagonal Dark Facets */}
        <mesh>
          <icosahedronGeometry args={[0.54, 0]} />
          <meshStandardMaterial
            color="#080F18"
            metalness={0.95}
            roughness={0.2}
          />
        </mesh>

        {/* Tactical Energy Halo Ring */}
        <mesh rotation={[-Math.PI / 4, 0, 0]}>
          <ringGeometry args={[0.75, 0.82, 32]} />
          <meshBasicMaterial
            color={cyanColor}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>

        <pointLight color={cyanColor} intensity={0.9} distance={3.5} />
      </group>

      {/* 4. Atmospheric Floating Stadium Dust Motes */}
      <points ref={dustParticlesRef} geometry={particleGeo}>
        <pointsMaterial
          size={0.05}
          color="#38D8FF"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* 5. Deep Ground Base Plane */}
      <mesh position={[0, -0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[70, 70]} />
        <meshBasicMaterial color="#05080D" />
      </mesh>
    </group>
  );
}
