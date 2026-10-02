import React, { useId } from 'react';

export type ClubEmblemType =
  | 'anchor'
  | 'lion_crest'
  | 'eagle_crest'
  | 'lightning'
  | 'crown'
  | 'star'
  | 'torch'
  | 'waves'
  | 'tower'
  | 'diamond';

export interface ClubBadgeProps {
  code: string;
  name?: string;
  clubId?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  emblem?: ClubEmblemType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showCode?: boolean;
}

// Known club emblem mappings
const CLUB_PRESETS: Record<
  string,
  {
    shape: 'shield' | 'circle' | 'diamond' | 'hexagon' | 'banner';
    pattern: 'solid' | 'stripes_vertical' | 'stripes_horizontal' | 'diagonal_half' | 'cross' | 'quartered';
    emblem: ClubEmblemType;
    accent: string;
  }
> = {
  KDO: { shape: 'shield', pattern: 'stripes_vertical', emblem: 'anchor', accent: '#FFFFFF' },
  'kalyon-doruk': { shape: 'shield', pattern: 'stripes_vertical', emblem: 'anchor', accent: '#FFFFFF' },

  VAD: { shape: 'hexagon', pattern: 'diagonal_half', emblem: 'lightning', accent: '#93C5FD' },
  vadisehir: { shape: 'hexagon', pattern: 'diagonal_half', emblem: 'lightning', accent: '#93C5FD' },

  SLV: { shape: 'shield', pattern: 'quartered', emblem: 'lion_crest', accent: '#FDE047' },
  'solvanya-gucu': { shape: 'shield', pattern: 'quartered', emblem: 'lion_crest', accent: '#FDE047' },

  KUZ: { shape: 'diamond', pattern: 'cross', emblem: 'eagle_crest', accent: '#E0E7FF' },
  'kuzey-firtinasi': { shape: 'diamond', pattern: 'cross', emblem: 'eagle_crest', accent: '#E0E7FF' },

  LMN: { shape: 'banner', pattern: 'stripes_horizontal', emblem: 'waves', accent: '#FDE047' },
  'liman-birlik': { shape: 'banner', pattern: 'stripes_horizontal', emblem: 'waves', accent: '#FDE047' },

  AYZ: { shape: 'circle', pattern: 'solid', emblem: 'crown', accent: '#FFFFFF' },
  ayazkent: { shape: 'circle', pattern: 'solid', emblem: 'crown', accent: '#FFFFFF' },

  KNY: { shape: 'shield', pattern: 'diagonal_half', emblem: 'torch', accent: '#FED7AA' },
  'kanyon-atlas': { shape: 'shield', pattern: 'diagonal_half', emblem: 'torch', accent: '#FED7AA' },

  GOK: { shape: 'circle', pattern: 'quartered', emblem: 'star', accent: '#A7F3D0' },
  'gokova-genclik': { shape: 'circle', pattern: 'quartered', emblem: 'star', accent: '#A7F3D0' },

  KZL: { shape: 'diamond', pattern: 'stripes_vertical', emblem: 'diamond', accent: '#FDE047' },
  'kizilkaya-spor': { shape: 'diamond', pattern: 'stripes_vertical', emblem: 'diamond', accent: '#FDE047' },

  YLK: { shape: 'banner', pattern: 'solid', emblem: 'star', accent: '#C7D2FE' },
  'yelkenkoy-akademi': { shape: 'banner', pattern: 'solid', emblem: 'star', accent: '#C7D2FE' },

  BGH: { shape: 'shield', pattern: 'stripes_vertical', emblem: 'anchor', accent: '#BAE6FD' },
  'bogazici-hisari': { shape: 'shield', pattern: 'stripes_vertical', emblem: 'anchor', accent: '#BAE6FD' },

  TRK: { shape: 'shield', pattern: 'quartered', emblem: 'eagle_crest', accent: '#86EFAC' },
  'toros-kartallari': { shape: 'shield', pattern: 'quartered', emblem: 'eagle_crest', accent: '#86EFAC' },

  AND: { shape: 'hexagon', pattern: 'diagonal_half', emblem: 'torch', accent: '#FDE68A' },
  'anadolu-atletik': { shape: 'hexagon', pattern: 'diagonal_half', emblem: 'torch', accent: '#FDE68A' },

  EGE: { shape: 'banner', pattern: 'stripes_horizontal', emblem: 'waves', accent: '#99F6E4' },
  'ege-dalga': { shape: 'banner', pattern: 'stripes_horizontal', emblem: 'waves', accent: '#99F6E4' },

  PMR: { shape: 'diamond', pattern: 'cross', emblem: 'star', accent: '#C7D2FE' },
  'pamir-yildizi': { shape: 'diamond', pattern: 'cross', emblem: 'star', accent: '#C7D2FE' },

  MRT: { shape: 'circle', pattern: 'solid', emblem: 'diamond', accent: '#E0F2FE' },
  'sahil-marti': { shape: 'circle', pattern: 'solid', emblem: 'diamond', accent: '#E0F2FE' },

  VLK: { shape: 'shield', pattern: 'diagonal_half', emblem: 'torch', accent: '#FECACA' },
  'volkan-atletik': { shape: 'shield', pattern: 'diagonal_half', emblem: 'torch', accent: '#FECACA' },

  ZRV: { shape: 'diamond', pattern: 'solid', emblem: 'crown', accent: '#F1F5F9' },
  'zirve-spor': { shape: 'diamond', pattern: 'solid', emblem: 'crown', accent: '#F1F5F9' },
};

export const ClubBadge: React.FC<ClubBadgeProps> = ({
  code = 'SC',
  name,
  clubId,
  primaryColor = '#C7FF38',
  secondaryColor = '#0F172A',
  accentColor,
  emblem: manualEmblem,
  size = 'md',
  className = '',
  showCode = true,
}) => {
  const reactId = useId().replace(/:/g, '');

  const sizePixels = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
    '2xl': 108,
  };

  const px = sizePixels[size] || 40;

  // Find preset or fallback
  const lookupKey = (clubId || code || '').toLowerCase();
  const upperCode = (code || 'SC').toUpperCase();
  const preset =
    CLUB_PRESETS[code] ||
    CLUB_PRESETS[upperCode] ||
    CLUB_PRESETS[lookupKey] ||
    CLUB_PRESETS[clubId || ''];

  // Hash fallback for custom/new clubs
  const str = `${code}_${clubId || ''}_${name || ''}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const shapes: ('shield' | 'circle' | 'diamond' | 'hexagon' | 'banner')[] = [
    'shield',
    'circle',
    'diamond',
    'hexagon',
    'banner',
  ];
  const patterns: ('solid' | 'stripes_vertical' | 'stripes_horizontal' | 'diagonal_half' | 'cross' | 'quartered')[] = [
    'solid',
    'stripes_vertical',
    'stripes_horizontal',
    'diagonal_half',
    'cross',
    'quartered',
  ];
  const emblems: ClubEmblemType[] = [
    'anchor',
    'lion_crest',
    'eagle_crest',
    'lightning',
    'crown',
    'star',
    'torch',
    'waves',
    'diamond',
  ];

  const shape = preset?.shape || shapes[Math.abs(hash) % shapes.length];
  const pattern = preset?.pattern || patterns[Math.abs(hash >> 2) % patterns.length];
  const emblem = manualEmblem || preset?.emblem || emblems[Math.abs(hash >> 4) % emblems.length];
  const accent = accentColor || preset?.accent || '#FFFFFF';

  // 1. Shapes Path in 100x100 SVG coordinate space
  const renderShapePath = () => {
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
        return (
          <path d="M 50 4 C 75 4 94 12 94 36 C 94 68 50 96 50 96 C 50 96 6 68 6 36 C 6 12 25 4 50 4 Z" />
        );
    }
  };

  // 2. Pattern Layer inside the shape
  const renderPattern = () => {
    switch (pattern) {
      case 'stripes_vertical':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill={primaryColor} />
            <rect x="22" y="0" width="18" height="100" fill={secondaryColor} />
            <rect x="60" y="0" width="18" height="100" fill={secondaryColor} />
          </>
        );
      case 'stripes_horizontal':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill={primaryColor} />
            <rect x="0" y="24" width="100" height="22" fill={secondaryColor} />
            <rect x="0" y="68" width="100" height="22" fill={secondaryColor} />
          </>
        );
      case 'diagonal_half':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill={primaryColor} />
            <polygon points="0,0 100,100 0,100" fill={secondaryColor} />
          </>
        );
      case 'cross':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill={primaryColor} />
            <rect x="38" y="0" width="24" height="100" fill={secondaryColor} />
            <rect x="0" y="38" width="100" height="24" fill={secondaryColor} />
          </>
        );
      case 'quartered':
        return (
          <>
            <rect x="0" y="0" width="50" height="50" fill={primaryColor} />
            <rect x="50" y="0" width="50" height="50" fill={secondaryColor} />
            <rect x="0" y="50" width="50" height="50" fill={secondaryColor} />
            <rect x="50" y="50" width="50" height="50" fill={primaryColor} />
          </>
        );
      case 'solid':
      default:
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill={primaryColor} />
            <rect x="0" y="50" width="100" height="50" fill={secondaryColor} opacity="0.45" />
          </>
        );
    }
  };

  // 3. Emblems in 100x100 space
  const renderEmblem = () => {
    switch (emblem) {
      case 'anchor':
        return (
          <g>
            <circle cx="50" cy="30" r="6" fill="none" stroke={accent} strokeWidth="3" />
            <line x1="50" y1="36" x2="50" y2="66" stroke={accent} strokeWidth="4" strokeLinecap="round" />
            <line x1="40" y1="44" x2="60" y2="44" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
            <path
              d="M 32 54 C 32 72 68 72 68 54"
              fill="none"
              stroke={accent}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <polygon points="30,52 34,56 30,60" fill={accent} />
            <polygon points="70,52 66,56 70,60" fill={accent} />
          </g>
        );

      case 'lion_crest':
        return (
          <g>
            <path
              d="M 50 24 C 57 24 64 30 63 42 C 61 52 56 62 50 68 C 44 62 39 52 37 42 C 36 30 43 24 50 24 Z"
              fill={accent}
              stroke="#000"
              strokeWidth="1.5"
            />
            {/* Crown above lion */}
            <path
              d="M 42 22 L 44 14 L 48 18 L 50 12 L 52 18 L 56 14 L 58 22 Z"
              fill={accent}
              stroke="#000"
              strokeWidth="1"
            />
          </g>
        );

      case 'eagle_crest':
        return (
          <g>
            <path
              d="M 50 26 Q 64 32 74 24 Q 68 46 50 66 Q 32 46 26 24 Q 36 32 50 26 Z"
              fill={accent}
              stroke="#000"
              strokeWidth="1.5"
            />
            <polygon points="50,28 47,40 53,40" fill="#000" />
          </g>
        );

      case 'lightning':
        return (
          <polygon
            points="55,20 38,44 48,44 43,68 62,40 52,40"
            fill={accent}
            stroke="#000"
            strokeWidth="1.5"
          />
        );

      case 'crown':
        return (
          <g>
            <path
              d="M 28 58 L 33 34 L 43 46 L 50 28 L 57 46 L 67 34 L 72 58 Z"
              fill={accent}
              stroke="#000"
              strokeWidth="1.5"
            />
            <circle cx="33" cy="31" r="2.5" fill={accent} />
            <circle cx="50" cy="25" r="3" fill={accent} />
            <circle cx="67" cy="31" r="2.5" fill={accent} />
          </g>
        );

      case 'torch':
        return (
          <g>
            {/* Flame */}
            <path
              d="M 50 20 C 58 28 58 36 50 42 C 42 36 42 28 50 20 Z"
              fill="#FFD700"
              stroke="#EA580C"
              strokeWidth="1.5"
            />
            {/* Torch Handle */}
            <polygon points="44,42 56,42 52,66 48,66" fill={accent} stroke="#000" strokeWidth="1" />
          </g>
        );

      case 'waves':
        return (
          <g>
            <path
              d="M 28 40 Q 38 32 48 40 T 68 40"
              fill="none"
              stroke={accent}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 28 50 Q 38 42 48 50 T 68 50"
              fill="none"
              stroke={accent}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 28 60 Q 38 52 48 60 T 68 60"
              fill="none"
              stroke={accent}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </g>
        );

      case 'diamond':
        return (
          <polygon
            points="50,22 72,44 50,66 28,44"
            fill={accent}
            stroke="#000"
            strokeWidth="1.5"
          />
        );

      case 'star':
      default:
        return (
          <polygon
            points="50,20 55,34 70,34 58,44 62,59 50,49 38,59 42,44 30,34 45,34"
            fill={accent}
            stroke="#000"
            strokeWidth="1.5"
          />
        );
    }
  };

  const clipId = `club-badge-clip-${reactId}`;
  const gradId = `club-badge-grad-${reactId}`;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}
      style={{ width: px, height: px }}
      title={name || code}
    >
      <svg
        viewBox="0 0 100 100"
        width={px}
        height={px}
        className="overflow-visible drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
      >
        <defs>
          <clipPath id={clipId}>{renderShapePath()}</clipPath>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* 1. Base Drop Glow */}
        <g opacity="0.35">
          <filter id={`glow-${reactId}`}>
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <g filter={`url(#glow-${reactId})`} fill={primaryColor}>
            {renderShapePath()}
          </g>
        </g>

        {/* 2. Clipped Body: Patterns + Shading + Emblem */}
        <g clipPath={`url(#${clipId})`}>
          {renderPattern()}

          {/* Gloss & depth diagonal overlay */}
          <rect x="0" y="0" width="100" height="100" fill={`url(#${gradId})`} />

          {/* Central Emblem Icon */}
          {renderEmblem()}

          {/* Club Code Ribbon (if large enough) */}
          {showCode && px >= 28 && (
            <g transform="translate(0, 56)">
              <rect
                x="20"
                y="14"
                width="60"
                height="18"
                rx="3"
                fill="rgba(0,0,0,0.85)"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
              />
              <text
                x="50"
                y="27"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="11"
                fontWeight="900"
                fontFamily="monospace"
                letterSpacing="1"
              >
                {code.slice(0, 3)}
              </text>
            </g>
          )}
        </g>

        {/* 3. Outer Crest Border with High Contrast */}
        <g fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5">
          {renderShapePath()}
        </g>
        <g fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="1">
          {renderShapePath()}
        </g>
      </svg>
    </div>
  );
};
