'use client';

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { CinematicCameraRig } from './CinematicCameraRig';
import { WorldEnvironment } from './WorldEnvironment';
import { WorldTacticalPitch } from './WorldTacticalPitch';
import { SpatialPlayerCards } from './SpatialPlayerCards';
import { useScrollStory } from './useScrollStory';

export function WorldCanvas() {
  const { isMobile, isReducedMotion } = useScrollStory();
  const [mounted, setMounted] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGLSupported(false);
      }
    } catch {
      setWebGLSupported(false);
    }
    setMounted(true);
  }, []);

  if (!mounted || !webGLSupported) {
    // High-performance static cinematic fallback
    return (
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-[#05080D]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 30%, rgba(183, 255, 60, 0.08), transparent 60%), radial-gradient(circle at 50% 80%, rgba(56, 216, 255, 0.05), transparent 50%)',
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
      <Canvas
        camera={{
          fov: isMobile ? 55 : 42,
          position: [0, 2.2, 16.5],
          near: 0.1,
          far: 90,
        }}
        gl={{
          antialias: !isMobile,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        dpr={[1, isMobile ? 1.25 : 1.75]}
        style={{ background: '#05080D' }}
      >
        {/* Scroll-Driven Dynamic Camera Rig */}
        <CinematicCameraRig />

        {/* Continuous Stadium Architecture & Dynamic Lighting */}
        <WorldEnvironment />

        {/* Floating Holographic Pitch Slab & 11 Formation Nodes */}
        <WorldTacticalPitch />

        {/* 3D Spatial Player Cards for Career & Draft Acts */}
        <SpatialPlayerCards />
      </Canvas>

      {/* Atmospheric Vignette Overlay ensuring text contrast */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(5,8,13,0.3) 0%, rgba(5,8,13,0.85) 100%)',
        }}
      />
    </div>
  );
}
