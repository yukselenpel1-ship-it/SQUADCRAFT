'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollStory } from './useScrollStory';
import { CAMERA_KEYFRAMES, STORY_CONFIG, StoryAct } from './storyConfig';

export function CinematicCameraRig() {
  const { camera, pointer } = useThree();
  const { progress, isMobile, isReducedMotion } = useScrollStory();

  const currentPos = useRef(new THREE.Vector3(0, 2.2, 16.5));
  const currentLookAt = useRef(new THREE.Vector3(0, 1.4, 0));
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const targetLookAt = useMemo(() => new THREE.Vector3(), []);

  // Compute interpolated camera transform for a given progress [0 to 1]
  const computeKeyframe = (p: number) => {
    const { acts } = STORY_CONFIG;
    let act: StoryAct = 'intro';
    let localT = 0;

    if (p <= acts.intro[1]) {
      act = 'intro';
      localT = p / acts.intro[1];
    } else if (p <= acts.tactics[1]) {
      act = 'tactics';
      localT = (p - acts.tactics[0]) / (acts.tactics[1] - acts.tactics[0]);
    } else if (p <= acts.career[1]) {
      act = 'career';
      localT = (p - acts.career[0]) / (acts.career[1] - acts.career[0]);
    } else if (p <= acts.draft[1]) {
      act = 'draft';
      localT = (p - acts.draft[0]) / (acts.draft[1] - acts.draft[0]);
    } else {
      act = 'finale';
      localT = Math.min(1, (p - acts.finale[0]) / (acts.finale[1] - acts.finale[0]));
    }

    // Clamp localT
    localT = Math.max(0, Math.min(1, localT));
    // Smooth ease in-out curve
    const smoothT = THREE.MathUtils.smoothstep(localT, 0, 1);

    const kf = CAMERA_KEYFRAMES[act];
    const sPos = kf.start.position;
    const ePos = kf.end.position;
    const sTarget = kf.start.target;
    const eTarget = kf.end.target;

    targetPos.set(
      THREE.MathUtils.lerp(sPos[0], ePos[0], smoothT),
      THREE.MathUtils.lerp(sPos[1], ePos[1], smoothT),
      THREE.MathUtils.lerp(sPos[2], ePos[2], smoothT)
    );

    targetLookAt.set(
      THREE.MathUtils.lerp(sTarget[0], eTarget[0], smoothT),
      THREE.MathUtils.lerp(sTarget[1], eTarget[1], smoothT),
      THREE.MathUtils.lerp(sTarget[2], eTarget[2], smoothT)
    );

    // If mobile, pull back slightly on Z axis for comfortable portrait FOV
    if (isMobile) {
      targetPos.z += 1.8;
      targetPos.y += 0.4;
    }

    // Add subtle pointer parallax on desktop (disabled if reduced motion)
    if (!isMobile && !isReducedMotion) {
      targetPos.x += pointer.x * 0.45;
      targetPos.y += -pointer.y * 0.35;
    }
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    computeKeyframe(progress);

    // Smooth camera damping
    currentPos.current.lerp(targetPos, STORY_CONFIG.cameraSmoothing);
    currentLookAt.current.lerp(targetLookAt, STORY_CONFIG.cameraSmoothing);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}
