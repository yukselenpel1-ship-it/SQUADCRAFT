// Real-world club keywords to warn / prevent imitation
const REAL_WORLD_KEYWORDS = [
  'galatasaray', 'fenerbahçe', 'fenerbahce', 'beşiktaş', 'besiktas', 'trabzonspor', 'trabzon',
  'bursaspor', 'başakşehir', 'basaksehir', 'adana demir', 'ankaragücü', 'göztepe', 'konyaspor',
  'real madrid', 'barcelona', 'atletico', 'valencia', 'sevilla', 'manchester', 'united', 'city',
  'liverpool', 'arsenal', 'chelsea', 'tottenham', 'juventus', 'milan', 'inter', 'roma', 'napoli',
  'lazio', 'bayern', 'dortmund', 'leipzig', 'leverkusen', 'psg', 'paris', 'marseille', 'lyon',
  'monaco', 'ajax', 'psv', 'feyenoord', 'benfica', 'porto', 'sporting', 'celtic', 'rangers'
];

export interface ClubValidationResult {
  isValid: boolean;
  warning?: string;
  error?: string;
}

/**
 * Validates a user-created fictional club name and code.
 */
export function validateDraftClub(name: string, code: string, managerName: string): ClubValidationResult {
  const cleanName = name.trim();
  const cleanCode = code.trim().toUpperCase();
  const cleanManager = managerName.trim();

  if (!cleanName || cleanName.length < 3) {
    return { isValid: false, error: 'Kulüp ismi en az 3 karakter olmalıdır.' };
  }

  if (cleanName.length > 25) {
    return { isValid: false, error: 'Kulüp ismi en fazla 25 karakter olabilir.' };
  }

  if (!cleanCode || cleanCode.length < 2 || cleanCode.length > 4) {
    return { isValid: false, error: 'Kulüp kısaltması 2-4 harf olmalıdır.' };
  }

  if (!cleanManager || cleanManager.length < 2) {
    return { isValid: false, error: 'Teknik direktör ismi girilmelidir.' };
  }

  // Check for real-world club name resemblance
  const lower = cleanName.toLowerCase();
  for (const kw of REAL_WORLD_KEYWORDS) {
    if (lower.includes(kw)) {
      return {
        isValid: true,
        warning: `Dikkat: "${cleanName}" gerçek dünya kulüplerini çağrıştırmaktadır. SquadCraft kurgusal bir evrendir, özgün bir isim önerilir.`,
      };
    }
  }

  return { isValid: true };
}

// Preset fictional club inspirations for quick randomize button
export const FICTIONAL_CLUB_PRESETS = [
  { name: 'Kuzey Fırtınası FK', code: 'KZF', primaryColor: '#1e3a8a', secondaryColor: '#38bdf8' },
  { name: 'Güneş Kıyısı Yıldızları', code: 'GKY', primaryColor: '#ca8a04', secondaryColor: '#fef08a' },
  { name: 'Doruk Dağları SK', code: 'DDS', primaryColor: '#047857', secondaryColor: '#6ee7b7' },
  { name: 'Vadi Muhafızları', code: 'VMH', primaryColor: '#7c2d12', secondaryColor: '#fed7aa' },
  { name: 'Liman Kartalları', code: 'LMK', primaryColor: '#0f172a', secondaryColor: '#94a3b8' },
  { name: 'Zirve Yıldırım FK', code: 'ZYF', primaryColor: '#6b21a8', secondaryColor: '#e9d5ff' },
  { name: 'Körfezkaya Martıları FK', code: 'KKM', primaryColor: '#0369a1', secondaryColor: '#e0f2fe' },
  { name: 'Hisar Muhafız SK', code: 'HMS', primaryColor: '#991b1b', secondaryColor: '#fecaca' },
];
