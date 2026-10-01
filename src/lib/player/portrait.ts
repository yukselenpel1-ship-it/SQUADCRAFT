/**
 * SQUADCRAFT FICTIONAL PLAYER PORTRAIT ENGINE
 * 
 * 100% Procedural & Deterministic SVG Portrait Generation
 * - NO real footballers or copyrighted photos
 * - NO web scraping or celebrity likenesses
 * - Pure fictional, IP-safe, athletic studio photography style
 * - Deterministic hash from player.id guarantees identical portrait across all screens & refreshes
 * - Age-aware features: Youth (<=21), Prime (22-29), Veteran (30+)
 * - Ultra-lightweight, 0 network latency, resolution-independent SVG
 */

export interface PortraitConfig {
  seed: number;
  ageTier: 'youth' | 'prime' | 'veteran';
  skinTone: {
    base: string;
    shadow: string;
    highlight: string;
    lips: string;
  };
  hair: {
    styleId: number;
    name: string;
    color: string;
    highlightColor: string;
    shadowColor: string;
  };
  eyes: {
    color: string;
    iris: string;
    browShape: number;
  };
  facialHair: {
    type: 'none' | 'stubble' | 'beard' | 'goatee' | 'mustache_stubble';
    density: number;
  };
  jawWidth: number;
  chinShape: number;
  jerseyAccent: string;
  backgroundGlow: string;
}

// 32-bit Fowler-Noll-Vo (FNV-1a) deterministic hash
export function stableHash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < (str || '').length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Deterministic PRNG from 32-bit seed
export function createPRNG(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Athletic Skin Palettes (6 balanced diverse tiers)
const SKIN_TONES = [
  { base: '#F3D2B8', shadow: '#D9AB8D', highlight: '#FBE8D8', lips: '#CC937A' }, // Fair
  { base: '#E6BA95', shadow: '#C89772', highlight: '#F4D2B5', lips: '#BD7F61' }, // Warm Fair
  { base: '#D49B6F', shadow: '#B2764B', highlight: '#E5B78F', lips: '#A5653D' }, // Tanned Olive
  { base: '#B57448', shadow: '#8F5128', highlight: '#C98D63', lips: '#81411D' }, // Medium Brown
  { base: '#875133', shadow: '#61341B', highlight: '#A26746', lips: '#5A2E17' }, // Deep Warm Brown
  { base: '#553420', shadow: '#381F11', highlight: '#73472C', lips: '#3A1E11' }, // Rich Dark Bronze
];

// Athletic Hair Color Palettes
const HAIR_COLORS = [
  { color: '#101012', highlightColor: '#28282C', shadowColor: '#050506' }, // Jet Black
  { color: '#251A15', highlightColor: '#3D2D25', shadowColor: '#140C08' }, // Dark Espresso
  { color: '#3E2516', highlightColor: '#5C3822', shadowColor: '#24140B' }, // Chestnut Brown
  { color: '#5C3D23', highlightColor: '#7C5635', shadowColor: '#362111' }, // Medium Brown
  { color: '#886E45', highlightColor: '#AA8F60', shadowColor: '#584424' }, // Ash Blonde
  { color: '#BA9C63', highlightColor: '#D9BC82', shadowColor: '#7E663B' }, // Golden Blonde
  { color: '#C8C4B7', highlightColor: '#E2E0D8', shadowColor: '#969284' }, // Frosted Silver
];

// Eye Colors
const EYE_COLORS = [
  { color: '#3A2010', iris: '#5C3518' }, // Dark Brown
  { color: '#2E1908', iris: '#4A2A10' }, // Deep Espresso
  { color: '#4A5034', iris: '#6B734C' }, // Hazel / Olive
  { color: '#24453A', iris: '#3D6C5C' }, // Emerald / Dark Green
  { color: '#2B4254', iris: '#44647E' }, // Steel Blue
];

// Jersey Neon Accent Lines (SquadCraft Identity)
const ACCENT_COLORS = ['#00F5A0', '#00D4FF', '#FFB800', '#A855F7', '#F43F5E'];

// Background Atmosphere Tones
const BG_GLOWS = ['#0A2540', '#08281E', '#1F1735', '#241B08', '#0F1A2E'];

/**
 * Computes deterministic portrait parameters from player information
 */
export function getPortraitConfig(player: {
  id: string;
  age?: number;
  position?: string;
  nationality?: string;
  portraitSeed?: string;
}): PortraitConfig {
  const seedString = player.portraitSeed || player.id || 'sqc-player-0';
  const seed = stableHash(seedString);
  const rand = createPRNG(seed);

  const age = player.age ?? 24;
  const ageTier: 'youth' | 'prime' | 'veteran' =
    age <= 21 ? 'youth' : age >= 30 ? 'veteran' : 'prime';

  const skinTone = SKIN_TONES[Math.floor(rand() * SKIN_TONES.length)];

  // Hair color (veterans have higher chance of grey/frosted streaks)
  let hairColor = HAIR_COLORS[Math.floor(rand() * HAIR_COLORS.length)];
  if (ageTier === 'veteran' && rand() > 0.65) {
    hairColor = { color: '#4A4A52', highlightColor: '#6B6B75', shadowColor: '#2D2D33' }; // Salt & Pepper
  }

  // 12 Distinct Hair Styles
  const styleId = Math.floor(rand() * 12);
  const hairStyleNames = [
    'Taper Fade Crop',
    'Buzz Cut with Part',
    'Curly Top Fade',
    'Undercut Pompadour',
    'Braided Twists',
    'Classic Side Sweep',
    'Athletic Spiky Top',
    'Wavy Fringe',
    'Clean Shaved',
    'Mid-Length Headband',
    'High Fade Quiff',
    'Textured Crew Cut',
  ];

  // Facial Hair determination based on ageTier
  let facialHairType: 'none' | 'stubble' | 'beard' | 'goatee' | 'mustache_stubble' = 'none';
  if (ageTier === 'youth') {
    // Youths are mostly clean shaven or have faint stubble shadow
    facialHairType = rand() > 0.85 ? 'stubble' : 'none';
  } else if (ageTier === 'prime') {
    const r = rand();
    if (r > 0.65) facialHairType = 'stubble';
    else if (r > 0.45) facialHairType = 'beard';
    else if (r > 0.35) facialHairType = 'goatee';
    else facialHairType = 'none';
  } else {
    // Veterans commonly have mature facial hair
    const r = rand();
    if (r > 0.45) facialHairType = 'beard';
    else if (r > 0.25) facialHairType = 'stubble';
    else if (r > 0.15) facialHairType = 'mustache_stubble';
    else facialHairType = 'none';
  }

  const eyes = EYE_COLORS[Math.floor(rand() * EYE_COLORS.length)];
  const browShape = Math.floor(rand() * 3);
  const jawWidth = 72 + Math.floor(rand() * 8); // 72 to 80
  const chinShape = Math.floor(rand() * 3); // 0: rounded, 1: square, 2: athletic cleft
  const jerseyAccent = ACCENT_COLORS[Math.floor(rand() * ACCENT_COLORS.length)];
  const backgroundGlow = BG_GLOWS[Math.floor(rand() * BG_GLOWS.length)];

  return {
    seed,
    ageTier,
    skinTone,
    hair: {
      styleId,
      name: hairStyleNames[styleId],
      color: hairColor.color,
      highlightColor: hairColor.highlightColor,
      shadowColor: hairColor.shadowColor,
    },
    eyes: {
      color: eyes.color,
      iris: eyes.iris,
      browShape,
    },
    facialHair: {
      type: facialHairType,
      density: 0.4 + rand() * 0.5,
    },
    jawWidth,
    chinShape,
    jerseyAccent,
    backgroundGlow,
  };
}

/**
 * Generates an SVG string representation of the fictional player portrait
 */
export function generatePlayerPortraitSvg(config: PortraitConfig): string {
  const { skinTone, hair, eyes, facialHair, ageTier, jerseyAccent, backgroundGlow } = config;

  // Render Hair Elements based on styleId
  const renderHair = () => {
    switch (config.hair.styleId) {
      case 0: // Taper Fade Crop
        return `
          <!-- Hair Base: Taper Fade -->
          <path d="M 82 108 C 78 82, 88 56, 128 54 C 168 56, 178 82, 174 108 C 172 90, 164 68, 128 66 C 92 68, 84 90, 82 108 Z" fill="${hair.shadowColor}" />
          <path d="M 85 96 C 88 64, 102 54, 128 52 C 154 54, 168 64, 171 96 C 162 76, 148 64, 128 64 C 108 64, 94 76, 85 96 Z" fill="${hair.color}" />
          <!-- Textured top chunks -->
          <path d="M 96 66 Q 106 50 120 54 Q 132 48 144 54 Q 158 56 160 68 C 146 58, 110 58, 96 66 Z" fill="${hair.highlightColor}" />
        `;
      case 1: // Buzz Cut with razor edge
        return `
          <path d="M 82 105 C 80 72, 94 56, 128 56 C 162 56, 176 72, 174 105 C 170 85, 158 64, 128 64 C 98 64, 86 85, 82 105 Z" fill="${hair.color}" opacity="0.95" />
          <path d="M 88 92 C 96 70, 112 62, 128 62 C 144 62, 160 70, 168 92" stroke="${hair.shadowColor}" stroke-width="3" fill="none" opacity="0.4" />
          <!-- Razor Temple Part Line -->
          <line x1="90" y1="84" x2="102" y2="76" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" opacity="0.85" />
        `;
      case 2: // Curly Top Afro Fade
        return `
          <!-- Fade sides -->
          <path d="M 84 106 C 82 86, 88 72, 94 68 L 162 68 C 168 72, 174 86, 172 106 Z" fill="${hair.shadowColor}" />
          <!-- Curly Top Masses -->
          <circle cx="100" cy="58" r="14" fill="${hair.color}" />
          <circle cx="118" cy="50" r="15" fill="${hair.color}" />
          <circle cx="138" cy="50" r="15" fill="${hair.color}" />
          <circle cx="156" cy="58" r="14" fill="${hair.color}" />
          <circle cx="128" cy="46" r="15" fill="${hair.highlightColor}" />
          <circle cx="110" cy="52" r="10" fill="${hair.highlightColor}" opacity="0.8" />
          <circle cx="146" cy="52" r="10" fill="${hair.highlightColor}" opacity="0.8" />
        `;
      case 3: // Undercut Pompadour
        return `
          <!-- Tight sides -->
          <path d="M 82 108 C 80 84, 88 68, 96 66 L 160 66 C 168 68, 176 84, 174 108 Z" fill="${hair.shadowColor}" />
          <!-- Swept volume top -->
          <path d="M 88 68 C 88 42, 110 38, 134 40 C 162 42, 172 58, 168 76 C 158 56, 134 50, 112 54 C 98 56, 90 62, 88 68 Z" fill="${hair.color}" />
          <path d="M 98 54 C 110 44, 130 42, 146 44 C 158 46, 164 54, 164 62 C 150 50, 130 48, 110 52 Z" fill="${hair.highlightColor}" />
        `;
      case 4: // Braided Cornrows / Twists
        return `
          <path d="M 84 105 C 82 78, 92 60, 128 58 C 164 60, 174 78, 172 105 Z" fill="${hair.shadowColor}" />
          <!-- Neat row segments -->
          <path d="M 100 60 Q 112 70 114 88" stroke="${hair.color}" stroke-width="4.5" stroke-linecap="round" fill="none" />
          <path d="M 114 56 Q 120 70 122 88" stroke="${hair.color}" stroke-width="4.5" stroke-linecap="round" fill="none" />
          <path d="M 128 54 Q 128 70 128 88" stroke="${hair.color}" stroke-width="4.5" stroke-linecap="round" fill="none" />
          <path d="M 142 56 Q 136 70 134 88" stroke="${hair.color}" stroke-width="4.5" stroke-linecap="round" fill="none" />
          <path d="M 156 60 Q 144 70 142 88" stroke="${hair.color}" stroke-width="4.5" stroke-linecap="round" fill="none" />
          <!-- Bun knot behind head -->
          <circle cx="128" cy="48" r="10" fill="${hair.color}" stroke="${hair.shadowColor}" stroke-width="2" />
        `;
      case 5: // Classic Side Sweep
        return `
          <path d="M 80 108 C 78 80, 92 56, 130 52 C 168 54, 178 78, 174 108 Z" fill="${hair.shadowColor}" />
          <path d="M 84 94 C 84 64, 106 50, 140 48 C 166 50, 174 68, 172 90 C 158 64, 134 58, 108 62 C 94 66, 86 78, 84 94 Z" fill="${hair.color}" />
          <path d="M 102 58 C 120 52, 144 52, 160 62 C 146 54, 126 54, 108 58 Z" fill="${hair.highlightColor}" />
        `;
      case 6: // Athletic Spiky Top
        return `
          <path d="M 82 105 C 80 80, 90 66, 128 64 C 166 66, 176 80, 174 105 Z" fill="${hair.shadowColor}" />
          <!-- Spikes -->
          <polygon points="96,64 104,46 112,62" fill="${hair.color}" />
          <polygon points="110,60 122,42 130,58" fill="${hair.color}" />
          <polygon points="126,58 136,44 144,60" fill="${hair.color}" />
          <polygon points="140,62 152,48 158,64" fill="${hair.color}" />
          <polygon points="118,52 126,40 132,52" fill="${hair.highlightColor}" />
        `;
      case 7: // Wavy Fringe / Curtains
        return `
          <path d="M 80 110 C 78 80, 90 56, 128 54 C 166 56, 176 80, 174 110 Z" fill="${hair.shadowColor}" />
          <!-- Left curtain -->
          <path d="M 90 62 C 104 60, 118 72, 120 90 C 110 82, 98 76, 90 62 Z" fill="${hair.color}" />
          <!-- Right curtain -->
          <path d="M 166 62 C 152 60, 138 72, 136 90 C 146 82, 158 76, 166 62 Z" fill="${hair.color}" />
          <path d="M 100 58 C 118 52, 138 52, 156 58 C 142 54, 114 54, 100 58 Z" fill="${hair.highlightColor}" />
        `;
      case 8: // Clean Shaved / Bald Athletic
        return `
          <!-- Smooth scalp rim highlight -->
          <path d="M 84 98 C 82 66, 100 50, 128 50 C 156 50, 174 66, 172 98" stroke="#FFFFFF" stroke-width="2" fill="none" opacity="0.15" />
        `;
      case 9: // Mid-Length with Sports Headband
        return `
          <path d="M 78 120 C 76 80, 90 52, 128 50 C 166 52, 180 80, 178 120 C 172 88, 160 62, 128 62 C 96 62, 84 88, 78 120 Z" fill="${hair.shadowColor}" />
          <path d="M 82 86 C 88 60, 106 48, 128 48 C 150 48, 168 60, 174 86 C 164 66, 148 54, 128 54 C 108 54, 92 66, 82 86 Z" fill="${hair.color}" />
          <!-- Black Athletic Headband -->
          <path d="M 80 86 Q 128 92 176 86 L 174 94 Q 128 100 82 94 Z" fill="#18181B" stroke="#27272A" stroke-width="1.2" />
        `;
      case 10: // High Fade Quiff
        return `
          <path d="M 82 108 C 80 84, 88 70, 96 68 L 160 68 C 168 70, 176 84, 174 108 Z" fill="${hair.shadowColor}" />
          <path d="M 94 68 C 96 46, 118 40, 134 44 C 154 48, 164 62, 160 76 C 146 56, 126 50, 106 58 Z" fill="${hair.color}" />
          <path d="M 110 50 C 124 44, 140 46, 150 54 C 140 48, 122 48, 110 50 Z" fill="${hair.highlightColor}" />
        `;
      default: // Textured Crew Cut
        return `
          <path d="M 82 105 C 80 75, 94 58, 128 56 C 162 58, 176 75, 174 105 Z" fill="${hair.shadowColor}" />
          <path d="M 86 90 C 92 66, 108 58, 128 58 C 148 58, 164 66, 170 90 C 158 72, 144 64, 128 64 C 112 64, 98 72, 86 90 Z" fill="${hair.color}" />
          <path d="M 104 62 Q 128 56 152 62 C 140 58, 116 58, 104 62 Z" fill="${hair.highlightColor}" />
        `;
    }
  };

  // Render Facial Hair
  const renderFacialHair = () => {
    if (facialHair.type === 'none') return '';

    if (facialHair.type === 'stubble') {
      return `
        <!-- Athletic 5 O'clock Stubble -->
        <path d="M 98 142 C 104 164, 114 176, 128 178 C 142 176, 152 164, 158 142 C 154 156, 142 168, 128 168 C 114 168, 102 156, 98 142 Z" fill="${hair.shadowColor}" opacity="${facialHair.density * 0.45}" />
        <ellipse cx="128" cy="154" rx="14" ry="4" fill="${hair.shadowColor}" opacity="${facialHair.density * 0.35}" />
      `;
    }

    if (facialHair.type === 'beard') {
      return `
        <!-- Trimmed Athletic Beard -->
        <path d="M 94 136 C 96 166, 112 186, 128 188 C 144 186, 160 166, 162 136 C 156 158, 144 176, 128 178 C 112 176, 100 158, 94 136 Z" fill="${hair.color}" opacity="0.9" />
        <!-- Mustache Bar -->
        <path d="M 112 150 Q 128 148 144 150 Q 128 156 112 150 Z" fill="${hair.color}" opacity="0.95" />
      `;
    }

    if (facialHair.type === 'goatee') {
      return `
        <!-- Sculpted Goatee & Chin Strap -->
        <path d="M 112 148 Q 128 146 144 148 Q 128 154 112 148 Z" fill="${hair.color}" />
        <path d="M 118 162 C 120 176, 124 182, 128 184 C 132 182, 136 176, 138 162 C 134 170, 131 174, 128 174 C 125 174, 122 170, 118 162 Z" fill="${hair.color}" />
      `;
    }

    // mustache_stubble
    return `
      <path d="M 112 150 Q 128 148 144 150 Q 128 155 112 150 Z" fill="${hair.color}" opacity="0.85" />
      <path d="M 106 156 C 114 170, 122 176, 128 178 C 134 176, 142 170, 150 156 C 142 164, 134 168, 128 168 C 122 168, 114 164, 106 156 Z" fill="${hair.shadowColor}" opacity="0.4" />
    `;
  };

  // Render Eyebrows
  const renderEyebrows = () => {
    if (eyes.browShape === 0) {
      // Straight intense athletic
      return `
        <path d="M 98 108 Q 112 104 122 107" stroke="${hair.shadowColor}" stroke-width="3.2" stroke-linecap="round" fill="none" />
        <path d="M 134 107 Q 144 104 158 108" stroke="${hair.shadowColor}" stroke-width="3.2" stroke-linecap="round" fill="none" />
      `;
    }
    if (eyes.browShape === 1) {
      // Arched athletic with razor slit
      return `
        <path d="M 98 110 Q 110 103 122 108" stroke="${hair.shadowColor}" stroke-width="3.4" stroke-linecap="round" fill="none" />
        <path d="M 134 108 Q 146 103 158 110" stroke="${hair.shadowColor}" stroke-width="3.4" stroke-linecap="round" fill="none" />
        <!-- Eyebrow Razor Slit (Modern footballer style) -->
        <line x1="148" y1="102" x2="150" y2="111" stroke="${skinTone.base}" stroke-width="1.8" />
      `;
    }
    // High focused brow
    return `
      <path d="M 98 107 Q 112 102 122 106" stroke="${hair.shadowColor}" stroke-width="3.6" stroke-linecap="round" fill="none" />
      <path d="M 134 106 Q 144 102 158 107" stroke="${hair.shadowColor}" stroke-width="3.6" stroke-linecap="round" fill="none" />
    `;
  };

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%" class="select-none">
      <defs>
        <!-- Background Studio Lighting Gradients -->
        <radialGradient id="bgGlow-${config.seed}" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="${backgroundGlow}" stop-opacity="0.8" />
          <stop offset="60%" stop-color="#070C16" stop-opacity="0.95" />
          <stop offset="100%" stop-color="#04060A" stop-opacity="1" />
        </radialGradient>

        <!-- Studio Rim Lighting -->
        <linearGradient id="rimLight-${config.seed}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.25" />
          <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.05" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.4" />
        </linearGradient>

        <!-- Skin Tone Lighting -->
        <linearGradient id="skinGrad-${config.seed}" x1="30%" y1="10%" x2="70%" y2="90%">
          <stop offset="0%" stop-color="${skinTone.highlight}" />
          <stop offset="45%" stop-color="${skinTone.base}" />
          <stop offset="100%" stop-color="${skinTone.shadow}" />
        </linearGradient>

        <!-- Jersey Fabric Gradient -->
        <linearGradient id="jerseyGrad-${config.seed}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#181E29" />
          <stop offset="60%" stop-color="#0F141D" />
          <stop offset="100%" stop-color="#080B10" />
        </linearGradient>
      </defs>

      <!-- 1. STUDIO BACKGROUND & BOKEH -->
      <rect width="256" height="256" fill="url(#bgGlow-${config.seed})" />
      <!-- Subtle Stadium Floodlight Bokeh -->
      <circle cx="50" cy="50" r="32" fill="#00D4FF" opacity="0.04" filter="blur(8px)" />
      <circle cx="210" cy="65" r="40" fill="${jerseyAccent}" opacity="0.05" filter="blur(10px)" />

      <!-- 2. ATHLETIC NECK & TRAPEZIUS -->
      <path d="M 106 142 L 106 195 L 150 195 L 150 142 Z" fill="${skinTone.shadow}" />
      <!-- Neck muscle contour highlight -->
      <path d="M 112 145 C 114 165, 118 185, 128 190 C 138 185, 142 165, 144 145" fill="none" stroke="${skinTone.base}" stroke-width="1.5" opacity="0.5" />

      <!-- 3. SHOULDERS & SQUADCRAFT DARK ATHLETIC KIT -->
      <!-- Shoulder base -->
      <path d="M 40 256 C 42 216, 75 196, 104 192 L 152 192 C 181 196, 214 216, 216 256 Z" fill="url(#jerseyGrad-${config.seed})" />
      <!-- Collar Ribbing -->
      <path d="M 104 192 C 114 204, 142 204, 152 192 C 142 198, 114 198, 104 192 Z" fill="#090C12" stroke="#262D3D" stroke-width="1.5" />
      <path d="M 102 192 C 114 208, 142 208, 154 192" fill="none" stroke="${jerseyAccent}" stroke-width="2" stroke-linecap="round" opacity="0.85" />
      <!-- Shoulder Seam Piping -->
      <path d="M 52 256 C 54 224, 78 206, 104 194" fill="none" stroke="#252F42" stroke-width="1.5" />
      <path d="M 204 256 C 202 224, 178 206, 152 194" fill="none" stroke="#252F42" stroke-width="1.5" />
      <!-- SquadCraft Athletic Chest Emblem Hint -->
      <polygon points="128,212 133,219 128,224 123,219" fill="${jerseyAccent}" opacity="0.75" />

      <!-- 4. EARS -->
      <!-- Left Ear -->
      <path d="M 84 112 C 78 112, 74 120, 75 130 C 76 138, 80 144, 86 142 Z" fill="${skinTone.shadow}" />
      <path d="M 82 120 C 79 122, 78 128, 81 134" stroke="${skinTone.base}" stroke-width="1.2" fill="none" opacity="0.6" />
      <!-- Right Ear -->
      <path d="M 172 112 C 178 112, 182 120, 181 130 C 180 138, 176 144, 170 142 Z" fill="${skinTone.shadow}" />
      <path d="M 174 120 C 177 122, 178 128, 175 134" stroke="${skinTone.base}" stroke-width="1.2" fill="none" opacity="0.6" />

      <!-- 5. SCULPTED JAW & FACE -->
      <path d="M 84 100 C 84 70, 172 70, 172 100 C 172 136, 156 178, 128 182 C 100 178, 84 136, 84 100 Z" fill="url(#skinGrad-${config.seed})" />

      <!-- Cheekbone & Jaw Definition -->
      <path d="M 88 122 C 94 144, 108 166, 128 174 C 148 166, 162 144, 168 122" fill="none" stroke="${skinTone.shadow}" stroke-width="2" opacity="0.35" />

      <!-- Age Character Details -->
      ${
        ageTier === 'veteran'
          ? `<!-- Veteran subtle brow/eye character lines -->
             <path d="M 104 102 Q 112 100 120 102" stroke="${skinTone.shadow}" stroke-width="1.2" fill="none" opacity="0.4" />
             <path d="M 136 102 Q 144 100 152 102" stroke="${skinTone.shadow}" stroke-width="1.2" fill="none" opacity="0.4" />
             <path d="M 94 120 Q 98 124 94 128" stroke="${skinTone.shadow}" stroke-width="1" fill="none" opacity="0.3" />
             <path d="M 162 120 Q 158 124 162 128" stroke="${skinTone.shadow}" stroke-width="1" fill="none" opacity="0.3" />`
          : ''
      }

      <!-- 6. EYES & BROWS -->
      ${renderEyebrows()}

      <!-- Left Eye -->
      <ellipse cx="110" cy="118" rx="7.5" ry="4.2" fill="#FFFFFF" opacity="0.9" />
      <circle cx="110" cy="118" r="3.4" fill="${eyes.color}" />
      <circle cx="110" cy="118" r="1.8" fill="${eyes.iris}" />
      <circle cx="110" cy="118" r="1.1" fill="#0A0A0A" />
      <circle cx="111.2" cy="116.8" r="0.8" fill="#FFFFFF" /> <!-- Specular reflection -->
      <!-- Left Upper Eyelid -->
      <path d="M 102 118 Q 110 113 118 118" stroke="${skinTone.shadow}" stroke-width="1.6" fill="none" />

      <!-- Right Eye -->
      <ellipse cx="146" cy="118" rx="7.5" ry="4.2" fill="#FFFFFF" opacity="0.9" />
      <circle cx="146" cy="118" r="3.4" fill="${eyes.color}" />
      <circle cx="146" cy="118" r="1.8" fill="${eyes.iris}" />
      <circle cx="146" cy="118" r="1.1" fill="#0A0A0A" />
      <circle cx="147.2" cy="116.8" r="0.8" fill="#FFFFFF" /> <!-- Specular reflection -->
      <!-- Right Upper Eyelid -->
      <path d="M 138 118 Q 146 113 154 118" stroke="${skinTone.shadow}" stroke-width="1.6" fill="none" />

      <!-- 7. ATHLETIC NOSE -->
      <path d="M 128 112 L 126 138 L 122 142 L 134 142 L 130 138 Z" fill="${skinTone.shadow}" opacity="0.3" />
      <path d="M 124 141 Q 128 143 132 141" stroke="${skinTone.shadow}" stroke-width="2" stroke-linecap="round" fill="none" />
      <!-- Nostrils -->
      <ellipse cx="123" cy="141" rx="1.5" ry="0.8" fill="${skinTone.shadow}" />
      <ellipse cx="133" cy="141" rx="1.5" ry="0.8" fill="${skinTone.shadow}" />

      <!-- 8. MOUTH & LIPS -->
      <!-- Focused, determined footballer expression -->
      <path d="M 118 158 Q 128 160 138 158" stroke="${skinTone.lips}" stroke-width="2.2" stroke-linecap="round" fill="none" />
      <path d="M 122 163 Q 128 164 134 163" stroke="${skinTone.shadow}" stroke-width="1.6" stroke-linecap="round" fill="none" opacity="0.6" />

      <!-- 9. FACIAL HAIR (AGE-AWARE) -->
      ${renderFacialHair()}

      <!-- 10. HAIR (TOP LAYER) -->
      ${renderHair()}

      <!-- 11. STUDIO RIM LIGHT OVERLAY -->
      <rect width="256" height="256" fill="url(#rimLight-${config.seed})" pointer-events-none="true" />
    </svg>
  `.trim();
}

// In-memory cache for ultra-fast repeated renders during the active session
const svgDataUriCache = new Map<string, string>();

/**
 * Returns a data URI for the generated portrait SVG
 */
export function getPlayerPortraitDataUri(player: {
  id: string;
  age?: number;
  position?: string;
  nationality?: string;
  portraitSeed?: string;
}): string {
  const cacheKey = player.id || player.portraitSeed || 'unknown';
  if (svgDataUriCache.has(cacheKey)) {
    return svgDataUriCache.get(cacheKey)!;
  }

  const config = getPortraitConfig(player);
  const svg = generatePlayerPortraitSvg(config);
  const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  svgDataUriCache.set(cacheKey, dataUri);
  return dataUri;
}
