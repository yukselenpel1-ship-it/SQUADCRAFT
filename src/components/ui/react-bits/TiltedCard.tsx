'use client';

import React, { useRef, useState } from 'react';

interface TiltedCardProps {
  children: React.ReactNode;
  maxAngle?: number;
  scale?: number;
  glareOpacity?: number;
  className?: string;
}

export function TiltedCard({
  children,
  maxAngle = 12,
  scale = 1.02,
  glareOpacity = 0.2,
  className = '',
}: TiltedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxAngle;
    const rotateY = ((x - centerX) / centerX) * maxAngle;

    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`);
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative will-change-transform transition-transform duration-200 ease-out ${className}`}
      style={{
        transform,
        transformStyle: 'preserve-3d',
      }}
    >
      {children}

      {/* Holographic Specular Glare */}
      <div
        className="pointer-events-none absolute inset-0 rounded-inherit transition-opacity duration-300"
        style={{
          opacity: isHovered ? glareOpacity : 0,
          background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, 0.4), transparent 60%)`,
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  );
}
