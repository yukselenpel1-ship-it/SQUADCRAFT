'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type FormationType = '4-3-3' | '4-2-3-1' | '3-4-3';

export interface TacticalPlayerNode {
  id: string;
  number: number;
  name: string;
  role: string;
  isKeyPlaymaker?: boolean;
  // Positions for each formation in pitch coordinate space [-3.0 to 3.0 X, -4.5 to 4.5 Z]
  pos433: [number, number, number];
  pos4231: [number, number, number];
  pos343: [number, number, number];
}

export const TACTICAL_NODES: TacticalPlayerNode[] = [
  { id: 'gk', number: 1, name: 'VASQUEZ', role: 'GK', pos433: [0, 0.1, 4.0], pos4231: [0, 0.1, 4.0], pos343: [0, 0.1, 4.0] },
  { id: 'lb', number: 3, name: 'MORENO', role: 'LB', pos433: [-2.2, 0.1, 2.4], pos4231: [-2.2, 0.1, 2.4], pos343: [-2.4, 0.1, 1.2] },
  { id: 'cb1', number: 4, name: 'LAURENT', role: 'LCB', pos433: [-0.9, 0.1, 2.7], pos4231: [-0.9, 0.1, 2.7], pos343: [-1.2, 0.1, 2.6] },
  { id: 'cb2', number: 5, name: 'VARGA', role: 'RCB', pos433: [0.9, 0.1, 2.7], pos4231: [0.9, 0.1, 2.7], pos343: [0, 0.1, 2.8] },
  { id: 'rb', number: 2, name: 'COSTA', role: 'RB', pos433: [2.2, 0.1, 2.4], pos4231: [2.2, 0.1, 2.4], pos343: [1.2, 0.1, 2.6] },
  { id: 'dm1', number: 6, name: 'NOVAK', role: 'DM', pos433: [0, 0.1, 1.2], pos4231: [-0.8, 0.1, 1.3], pos343: [2.4, 0.1, 1.2] },
  { id: 'cm2', number: 8, name: 'VELAS', role: 'CM', pos433: [-1.0, 0.1, -0.2], pos4231: [0.8, 0.1, 1.3], pos343: [-0.8, 0.1, 0.2] },
  { id: 'am', number: 10, name: 'KIMURA', role: 'AM', isKeyPlaymaker: true, pos433: [1.0, 0.1, -0.2], pos4231: [0, 0.1, -0.7], pos343: [0.8, 0.1, 0.2] },
  { id: 'lw', number: 11, name: 'SAAR', role: 'LW', pos433: [-2.2, 0.1, -2.2], pos4231: [-2.2, 0.1, -1.8], pos343: [-2.1, 0.1, -2.3] },
  { id: 'rw', number: 7, name: 'KOVA', role: 'RW', pos433: [2.2, 0.1, -2.2], pos4231: [2.2, 0.1, -1.8], pos343: [2.1, 0.1, -2.3] },
  { id: 'st', number: 9, name: 'POPOV', role: 'ST', pos433: [0, 0.1, -3.2], pos4231: [0, 0.1, -3.2], pos343: [0, 0.1, -3.3] },
];

// Passing connection pairs (indices into TACTICAL_NODES)
const PASSING_PAIRS: [number, number][] = [
  [0, 2], // GK -> LCB
  [0, 3], // GK -> RCB
  [2, 1], // LCB -> LB
  [3, 4], // RCB -> RB
  [2, 5], // LCB -> DM
  [3, 5], // RCB -> DM
  [5, 6], // DM -> CM
  [5, 7], // DM -> AM (Kimura)
  [1, 8], // LB -> LW
  [4, 9], // RB -> RW
  [7, 10], // AM -> ST (Popov)
  [6, 7], // CM -> AM
  [8, 10], // LW -> ST
  [9, 10], // RW -> ST
];

interface FormationVisualizationProps {
  formation: FormationType;
  selectedPlayerId?: string | null;
  onSelectPlayer?: (id: string) => void;
  accentColor?: string;
  cyanColor?: string;
}

export function FormationVisualization({
  formation,
  selectedPlayerId,
  onSelectPlayer,
  accentColor = '#B7FF3C',
  cyanColor = '#38D8FF',
}: FormationVisualizationProps) {
  const currentPositions = useRef<{ [id: string]: THREE.Vector3 }>({});
  const nodeMeshes = useRef<{ [id: string]: THREE.Group }>({});
  const passingEnergyMesh = useRef<THREE.InstancedMesh>(null);

  // Initialize target vectors
  useMemo(() => {
    TACTICAL_NODES.forEach((node) => {
      if (!currentPositions.current[node.id]) {
        const p = formation === '4-3-3' ? node.pos433 : formation === '4-2-3-1' ? node.pos4231 : node.pos343;
        currentPositions.current[node.id] = new THREE.Vector3(...p);
      }
    });
  }, [formation]);

  // Curve paths for passing channels
  const passingCurves = useMemo(() => {
    return PASSING_PAIRS.map(([fromIdx, toIdx]) => {
      const fromNode = TACTICAL_NODES[fromIdx];
      const toNode = TACTICAL_NODES[toIdx];
      const fromPos = formation === '4-3-3' ? fromNode.pos433 : formation === '4-2-3-1' ? fromNode.pos4231 : fromNode.pos343;
      const toPos = formation === '4-3-3' ? toNode.pos433 : formation === '4-2-3-1' ? toNode.pos4231 : toNode.pos343;

      const p1 = new THREE.Vector3(...fromPos);
      const p2 = new THREE.Vector3(...toPos);
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      mid.y = 0.22; // Elevate slightly above pitch

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(24);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      return { curve, geometry };
    });
  }, [formation]);

  // Animate node lerping & moving passing energy pulses
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pulseTimes = useRef(PASSING_PAIRS.map((_, i) => i * 0.12));

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    // Smooth node interpolation to formation positions
    TACTICAL_NODES.forEach((node) => {
      const targetPos = formation === '4-3-3' ? node.pos433 : formation === '4-2-3-1' ? node.pos4231 : node.pos343;
      const cur = currentPositions.current[node.id];
      if (cur) {
        cur.x = THREE.MathUtils.lerp(cur.x, targetPos[0], 0.08);
        cur.y = THREE.MathUtils.lerp(cur.y, targetPos[1], 0.08);
        cur.z = THREE.MathUtils.lerp(cur.z, targetPos[2], 0.08);

        const group = nodeMeshes.current[node.id];
        if (group) {
          group.position.copy(cur);
        }
      }
    });

    // Update passing energy packet positions along curves
    if (passingEnergyMesh.current) {
      PASSING_PAIRS.forEach((_, idx) => {
        pulseTimes.current[idx] = (pulseTimes.current[idx] + dt * 0.45) % 1.0;
        const t = pulseTimes.current[idx];
        const curveData = passingCurves[idx];
        if (curveData) {
          const pt = curveData.curve.getPoint(t);
          dummy.position.copy(pt);
          const scale = 0.05 + Math.sin(t * Math.PI) * 0.035;
          dummy.scale.set(scale, scale, scale);
          dummy.updateMatrix();
          passingEnergyMesh.current?.setMatrixAt(idx, dummy.matrix);
        }
      });
      passingEnergyMesh.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 1. Tactical Passing Lines */}
      {passingCurves.map((pc, idx) => (
        <primitive key={idx} object={new THREE.Line(pc.geometry, new THREE.LineBasicMaterial({
          color: idx % 2 === 0 ? accentColor : cyanColor,
          transparent: true,
          opacity: 0.28,
          linewidth: 1,
        }))} />
      ))}

      {/* 2. Instanced Moving Energy Packets (Passing pulses) */}
      <instancedMesh
        ref={passingEnergyMesh}
        args={[undefined, undefined, PASSING_PAIRS.length]}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={cyanColor} />
      </instancedMesh>

      {/* 3. Tactical Formation Player Nodes (11 Players) */}
      {TACTICAL_NODES.map((node) => {
        const isSelected = selectedPlayerId === node.id;
        const isPlaymaker = node.isKeyPlaymaker;
        const color = isPlaymaker ? cyanColor : accentColor;

        return (
          <group
            key={node.id}
            ref={(el) => {
              if (el) nodeMeshes.current[node.id] = el;
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectPlayer?.(node.id);
            }}
          >
            {/* Base pitch ring marker */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
              <ringGeometry args={[0.22, 0.28, 32]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={isSelected ? 0.95 : 0.6}
              />
            </mesh>

            {/* Inner disc */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
              <circleGeometry args={[0.21, 32]} />
              <meshBasicMaterial
                color="#05080D"
                transparent
                opacity={0.88}
              />
            </mesh>

            {/* Tactical Elevated Beacon Pin */}
            <mesh position={[0, 0.18, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.28, 16]} />
              <meshStandardMaterial
                color={color}
                metalness={0.8}
                roughness={0.25}
                emissive={color}
                emissiveIntensity={isSelected ? 0.9 : 0.35}
              />
            </mesh>

            {/* Glowing Cap */}
            <mesh position={[0, 0.34, 0]}>
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshBasicMaterial color={isSelected ? '#FFFFFF' : color} />
            </mesh>

            {/* Node Pulse Light */}
            <pointLight
              color={color}
              intensity={isSelected ? 1.8 : 0.45}
              distance={1.2}
              position={[0, 0.3, 0]}
            />
          </group>
        );
      })}
    </group>
  );
}
