import React from 'react';
import { BadgeConfig } from '@/lib/draft/types';

interface BadgePreviewProps {
  badge?: BadgeConfig;
  clubCode?: string;
  size?: number;
  className?: string;
}

export const BadgePreview: React.FC<BadgePreviewProps> = ({
  badge,
  clubCode = 'SC',
  size = 48,
  className = '',
}) => {
  const shape = badge?.shape || 'shield';
  const pattern = badge?.pattern || 'solid';
  const emblem = badge?.emblem || 'star';
  const primary = badge?.primaryColor || '#1e3a8a';
  const secondary = badge?.secondaryColor || '#38bdf8';
  const accent = badge?.accentColor || '#ffffff';

  // Shapes paths in a 100x100 viewBox
  const renderClipShape = () => {
    switch (shape) {
      case 'circle':
        return <circle cx="50" cy="50" r="46" />;
      case 'diamond':
        return <polygon points="50,4 96,50 50,96 4,50" />;
      case 'hexagon':
        return <polygon points="50,4 92,26 92,74 50,96 8,74 8,26" />;
      case 'banner':
        return <polygon points="8,4 92,4 92,72 50,96 8,72" />;
      case 'shield':
      default:
        return <path d="M 50 4 C 75 4 94 12 94 36 C 94 68 50 96 50 96 C 50 96 6 68 6 36 C 6 12 25 4 50 4 Z" />;
    }
  };

  const renderPattern = () => {
    switch (pattern) {
      case 'stripes_vertical':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill={primary} />
            <rect x="25" y="0" width="25" height="100" fill={secondary} />
            <rect x="75" y="0" width="25" height="100" fill={secondary} />
          </>
        );
      case 'stripes_horizontal':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill={primary} />
            <rect x="0" y="25" width="100" height="25" fill={secondary} />
            <rect x="0" y="75" width="100" height="25" fill={secondary} />
          </>
        );
      case 'diagonal_half':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill={primary} />
            <polygon points="0,0 100,100 0,100" fill={secondary} />
          </>
        );
      case 'cross':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill={primary} />
            <rect x="40" y="0" width="20" height="100" fill={secondary} />
            <rect x="0" y="40" width="100" height="20" fill={secondary} />
          </>
        );
      case 'quartered':
        return (
          <>
            <rect x="0" y="0" width="50" height="50" fill={primary} />
            <rect x="50" y="0" width="50" height="50" fill={secondary} />
            <rect x="0" y="50" width="50" height="50" fill={secondary} />
            <rect x="50" y="50" width="50" height="50" fill={primary} />
          </>
        );
      case 'solid':
      default:
        return <rect x="0" y="0" width="100" height="100" fill={primary} />;
    }
  };

  const renderEmblem = () => {
    switch (emblem) {
      case 'crown':
        return (
          <path
            d="M 30 65 L 35 45 L 45 55 L 50 38 L 55 55 L 65 45 L 70 65 Z"
            fill={accent}
            stroke="#000"
            strokeWidth="2"
          />
        );
      case 'eagle_crest':
        return (
          <path
            d="M 50 35 Q 60 40 68 35 Q 65 52 50 68 Q 35 52 32 35 Q 40 40 50 35 Z"
            fill={accent}
            stroke="#000"
            strokeWidth="2"
          />
        );
      case 'lion_crest':
        return (
          <path
            d="M 50 32 C 60 32 66 40 64 52 C 62 60 56 68 50 70 C 44 68 38 60 36 52 C 34 40 40 32 50 32 Z"
            fill={accent}
            stroke="#000"
            strokeWidth="2"
          />
        );
      case 'anchor':
        return (
          <path
            d="M 50 35 L 50 68 M 42 45 L 58 45 M 34 58 C 34 72 66 72 66 58"
            fill="none"
            stroke={accent}
            strokeWidth="5"
            strokeLinecap="round"
          />
        );
      case 'torch':
        return (
          <path
            d="M 46 48 L 54 48 L 51 68 L 49 68 Z M 50 34 Q 56 40 50 46 Q 44 40 50 34 Z"
            fill={accent}
            stroke="#000"
            strokeWidth="1.5"
          />
        );
      case 'lightning':
        return (
          <polygon
            points="54,32 40,52 48,52 44,70 60,48 52,48"
            fill={accent}
            stroke="#000"
            strokeWidth="1.5"
          />
        );
      case 'initials':
        return (
          <text
            x="50"
            y="58"
            textAnchor="middle"
            fill={accent}
            fontSize="26"
            fontWeight="bold"
            fontFamily="sans-serif"
            stroke="#000"
            strokeWidth="1"
          >
            {clubCode.slice(0, 3)}
          </text>
        );
      case 'star':
      default:
        return (
          <polygon
            points="50,32 54,44 67,44 56,53 60,66 50,57 40,66 44,53 33,44 46,44"
            fill={accent}
            stroke="#000"
            strokeWidth="1.5"
          />
        );
    }
  };

  const clipId = `badge-clip-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`inline-block drop-shadow-md select-none ${className}`}
    >
      <defs>
        <clipPath id={clipId}>{renderClipShape()}</clipPath>
      </defs>

      {/* Main Clipped Badge Content */}
      <g clipPath={`url(#${clipId})`}>
        {renderPattern()}
        {/* Subtle shading */}
        <path d="M 0 0 L 100 0 L 100 100 Z" fill="rgba(255,255,255,0.08)" />
        {renderEmblem()}
      </g>

      {/* Border Outline */}
      <g fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="3">
        {renderClipShape()}
      </g>
    </svg>
  );
};
