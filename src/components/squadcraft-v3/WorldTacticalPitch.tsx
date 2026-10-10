'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollStory } from './useScrollStory';
import { FormationVisualization, FormationType } from '../squadcraft-experience/FormationVisualization';

export function WorldTacticalPitch() {
  const { progress, formation } = useScrollStory();
  const pitchGroup = useRef<THREE.Group>(null);

  const pitchWidth = 6.4;
  const pitchLength = 9.4;
  const halfW = pitchWidth / 2;
  const halfL = pitchLength / 2;

  // Touchlines
  const touchlinesGeo = useMemo(() => {
    const pts = [
      new THREE.Vector3(-halfW, 0.02, -halfL),
      new THREE.Vector3(halfW, 0.02, -halfL),
      new THREE.Vector3(halfW, 0.02, halfL),
      new THREE.Vector3(-halfW, 0.02, halfL),
      new THREE.Vector3(-halfW, 0.02, -halfL),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [halfW, halfL]);

  // Halfway line
  const halfwayLineGeo = useMemo(() => {
    const pts = [
      new THREE.Vector3(-halfW, 0.02, 0),
      new THREE.Vector3(halfW, 0.02, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [halfW]);

  // Penalty box North
  const penaltyBoxNorthGeo = useMemo(() => {
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

  // Penalty box South
  const penaltyBoxSouthGeo = useMemo(() => {
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

  const lineMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#E0E8F0',
        transparent: true,
        opacity: 0.6,
      }),
    []
  );

  // Animate pitch elevation & tilt across scroll progress
  useFrame(() => {
    if (!pitchGroup.current) return;

    let targetY = 0;
    let targetRotX = 0;
    let targetScale = 1.0;

    if (progress < 0.18) {
      // Act I: rises into position
      const t = progress / 0.18;
      targetY = THREE.MathUtils.lerp(-1.2, 0, t);
      targetRotX = THREE.MathUtils.lerp(0.05, 0.12, t);
      targetScale = THREE.MathUtils.lerp(0.85, 1.0, t);
    } else if (progress < 0.38) {
      // Act II: Tactical prominent angle
      targetY = 0;
      targetRotX = 0.14;
      targetScale = 1.0;
    } else if (progress < 0.58) {
      // Act III: Sits slightly back to give stage to Career 3D cards
      targetY = -0.3;
      targetRotX = 0.08;
      targetScale = 0.92;
    } else if (progress < 0.78) {
      // Act IV: Sits as floor for Draft arena
      targetY = -0.4;
      targetRotX = 0.06;
      targetScale = 0.9;
    } else {
      // Act V: Settles in grand master composition
      targetY = 0;
      targetRotX = 0.1;
      targetScale = 1.0;
    }

    pitchGroup.current.position.y = THREE.MathUtils.lerp(
      pitchGroup.current.position.y,
      targetY,
      0.08
    );
    pitchGroup.current.rotation.x = THREE.MathUtils.lerp(
      pitchGroup.current.rotation.x,
      targetRotX,
      0.08
    );
    pitchGroup.current.scale.setScalar(
      THREE.MathUtils.lerp(pitchGroup.current.scale.x, targetScale, 0.08)
    );
  });

  return (
    <group ref={pitchGroup} position={[0, -0.6, 0]}>
      {/* 1. Main Pitch Slab */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[pitchWidth + 0.6, 0.2, pitchLength + 0.6]} />
        <meshStandardMaterial color="#0B131E" metalness={0.4} roughness={0.7} />
      </mesh>

      {/* 2. Tactical Grass Turf */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[pitchWidth, pitchLength]} />
        <meshStandardMaterial color="#09101A" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* 3. Perimeter Glowing LED Strips */}
      <mesh position={[0, 0.015, -halfL - 0.12]}>
        <boxGeometry args={[pitchWidth + 0.3, 0.03, 0.04]} />
        <meshBasicMaterial color="#B7FF3C" />
      </mesh>
      <mesh position={[0, 0.015, halfL + 0.12]}>
        <boxGeometry args={[pitchWidth + 0.3, 0.03, 0.04]} />
        <meshBasicMaterial color="#B7FF3C" />
      </mesh>
      <mesh position={[-halfW - 0.12, 0.015, 0]}>
        <boxGeometry args={[0.04, 0.03, pitchLength + 0.3]} />
        <meshBasicMaterial color="#38D8FF" />
      </mesh>
      <mesh position={[halfW + 0.12, 0.015, 0]}>
        <boxGeometry args={[0.04, 0.03, pitchLength + 0.3]} />
        <meshBasicMaterial color="#38D8FF" />
      </mesh>

      {/* 4. Pitch Lines */}
      <primitive object={new THREE.Line(touchlinesGeo, lineMat)} />
      <primitive object={new THREE.Line(halfwayLineGeo, lineMat)} />
      <primitive object={new THREE.Line(penaltyBoxNorthGeo, lineMat)} />
      <primitive object={new THREE.Line(penaltyBoxSouthGeo, lineMat)} />

      {/* Center Circle & Spot */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 0.96, 48]} />
        <meshBasicMaterial color="#E0E8F0" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.08, 24]} />
        <meshBasicMaterial color="#38D8FF" />
      </mesh>

      {/* Dynamic 11 Formation Nodes & Animated Passing Channels */}
      <FormationVisualization
        formation={formation}
        accentColor="#B7FF3C"
        cyanColor="#38D8FF"
      />
    </group>
  );
}
