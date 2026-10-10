/**
 * SQUADCRAFT V3 — IMMERSIVE 3D SCROLL CINEMATIC EXPERIENCE
 * Story & Timeline Configuration
 */

export type StoryAct = 'intro' | 'tactics' | 'career' | 'draft' | 'finale';

export interface CameraKeyframe {
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
}

export const STORY_CONFIG = {
  acts: {
    intro: [0.0, 0.18] as [number, number],
    tactics: [0.18, 0.38] as [number, number],
    career: [0.38, 0.58] as [number, number],
    draft: [0.58, 0.78] as [number, number],
    finale: [0.78, 1.0] as [number, number],
  },
  cameraSmoothing: 0.08,
  pointerParallax: 0.035,
  defaultCameraFov: 42,
  mobileCameraFov: 55,
  desktopDprCap: 1.75,
  mobileDprCap: 1.25,
};

// 5 Act Camera Keyframes for smooth interpolation
export const CAMERA_KEYFRAMES: Record<StoryAct, { start: CameraKeyframe; end: CameraKeyframe }> = {
  intro: {
    start: {
      position: [0, 2.2, 16.5],
      target: [0, 1.4, 0],
    },
    end: {
      position: [0, 5.2, 12.0],
      target: [0, 0.8, 0],
    },
  },
  tactics: {
    start: {
      position: [0, 5.2, 12.0],
      target: [0, 0.8, 0],
    },
    end: {
      position: [0, 8.0, 8.4],
      target: [0, 0.1, 0],
    },
  },
  career: {
    start: {
      position: [0, 8.0, 8.4],
      target: [0, 0.1, 0],
    },
    end: {
      position: [-3.4, 4.4, 6.2],
      target: [-0.6, 0.9, -0.5],
    },
  },
  draft: {
    start: {
      position: [-3.4, 4.4, 6.2],
      target: [-0.6, 0.9, -0.5],
    },
    end: {
      position: [3.4, 3.8, 5.8],
      target: [0.6, 1.0, -1.0],
    },
  },
  finale: {
    start: {
      position: [3.4, 3.8, 5.8],
      target: [0.6, 1.0, -1.0],
    },
    end: {
      position: [0, 10.8, 13.5],
      target: [0, 0.2, -1.0],
    },
  },
};
