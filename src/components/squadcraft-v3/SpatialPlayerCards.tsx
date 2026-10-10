'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollStory } from './useScrollStory';

interface FictionalCardData {
  id: string;
  name: string;
  role: string;
  rating: number;
  number: number;
  theme: 'gold' | 'cyan' | 'lime';
  basePos: [number, number, number];
  baseRotY: number;
}

const CAREER_CARDS: FictionalCardData[] = [
  {
    id: 'laurent',
    name: 'LAURENT',
    role: 'CB',
    rating: 84,
    number: 4,
    theme: 'gold',
    basePos: [-2.1, 2.2, 1.8],
    baseRotY: 0.25,
  },
  {
    id: 'kimura',
    name: 'KIMURA',
    role: 'AM',
    rating: 88,
    number: 10,
    theme: 'gold',
    basePos: [0, 2.5, 2.8],
    baseRotY: -0.05,
  },
  {
    id: 'popov',
    name: 'POPOV',
    role: 'ST',
    rating: 86,
    number: 9,
    theme: 'gold',
    basePos: [2.1, 2.2, 1.8],
    baseRotY: -0.25,
  },
];

export function SpatialPlayerCards() {
  const { progress } = useScrollStory();
  const groupRef = useRef<THREE.Group>(null);
  const cardRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Check if within Act III (0.38 - 0.58) or Act IV (0.58 - 0.78)
    const inAct3 = progress >= 0.35 && progress <= 0.60;
    const inAct4 = progress > 0.60 && progress <= 0.80;

    let targetGroupY = -10; // Hidden below stage
    let targetGroupScale = 0.01;

    if (inAct3) {
      // Act III: Career Cards prominent
      const t = Math.sin(((progress - 0.35) / 0.25) * Math.PI);
      targetGroupY = THREE.MathUtils.lerp(-4, 0.5, t);
      targetGroupScale = THREE.MathUtils.lerp(0.5, 1.0, t);
    } else if (inAct4) {
      // Act IV: Draft Selection stage
      const t = Math.sin(((progress - 0.60) / 0.20) * Math.PI);
      targetGroupY = THREE.MathUtils.lerp(-4, 0.4, t);
      targetGroupScale = THREE.MathUtils.lerp(0.5, 0.95, t);
    }

    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetGroupY,
      0.08
    );
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, targetGroupScale, 0.08)
    );

    // Subtle gentle floating hover on individual cards
    const time = state.clock.getElapsedTime();
    cardRefs.current.forEach((card, idx) => {
      if (card) {
        card.position.y = Math.sin(time * 1.5 + idx * 0.8) * 0.08;
        if (idx === 1) {
          // Center playmaker card rotates slightly
          card.rotation.y = CAREER_CARDS[idx].baseRotY + Math.sin(time * 1.2) * 0.12;
        }
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, -10, 0]}>
      {CAREER_CARDS.map((card, idx) => {
        const isCenter = idx === 1;
        const color = isCenter ? '#B7FF3C' : '#FFC857';

        return (
          <group
            key={card.id}
            position={card.basePos}
            rotation={[0, card.baseRotY, 0]}
            ref={(el) => {
              cardRefs.current[idx] = el;
            }}
          >
            {/* Card Slab Mesh */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.5, 2.3, 0.05]} />
              <meshStandardMaterial
                color="#0c1726"
                metalness={0.75}
                roughness={0.25}
              />
            </mesh>

            {/* Glowing Perimeter Rim */}
            <mesh position={[0, 0, 0.03]}>
              <ringGeometry args={[0.74, 0.77, 4]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={isCenter ? 0.9 : 0.6}
              />
            </mesh>

            {/* Fictional Rating Badge Plate */}
            <mesh position={[-0.45, 0.8, 0.035]}>
              <boxGeometry args={[0.38, 0.38, 0.02]} />
              <meshBasicMaterial color={color} />
            </mesh>

            {/* Player Crest Silhouette Plate */}
            <mesh position={[0, 0.15, 0.035]}>
              <planeGeometry args={[1.0, 0.9]} />
              <meshStandardMaterial
                color="#111B27"
                metalness={0.9}
                roughness={0.2}
              />
            </mesh>

            {/* Lower Identity Bar */}
            <mesh position={[0, -0.75, 0.035]}>
              <boxGeometry args={[1.25, 0.35, 0.02]} />
              <meshStandardMaterial
                color="#08111D"
                emissive={color}
                emissiveIntensity={0.25}
              />
            </mesh>

            {/* Spotlight on Card */}
            <pointLight
              color={color}
              intensity={isCenter ? 1.5 : 0.8}
              distance={2.5}
              position={[0, 0, 0.8]}
            />
          </group>
        );
      })}
    </group>
  );
}
