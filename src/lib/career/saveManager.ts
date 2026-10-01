import { CareerSaveDataV3, CareerSaveDataV2, CareerSaveDataV1 } from './types';
import { generateClubScouts } from '../scouting/scoutGenerator';
import { generatePlayerHiddenProfile } from '../scouting/playerPersonality';
import { initializeClubAcademy } from '../youth/academyQuality';

export const SAVE_KEY_V3 = 'SquadCraftSaveV3';
export const SAVE_KEY_V2 = 'SquadCraftSaveV2';
export const SAVE_KEY_V1 = 'SquadCraftSaveV1';

export function migrateV2toV3(v2: CareerSaveDataV2): CareerSaveDataV3 {
  const userClub = v2.clubs?.find((c) => c.id === v2.userClubId) || v2.clubs?.[0];
  const initialScouts = generateClubScouts(v2.userClubId || 'kalyon-doruk', userClub?.reputation || 75);
  const academy = initializeClubAcademy(userClub || { id: v2.userClubId, name: 'Kulüp', balance: 10000000, reputation: 75 } as any, v2.seasonYear || '2026/27');

  const hiddenProfiles: Record<string, any> = {};
  if (v2.players) {
    for (const p of v2.players) {
      hiddenProfiles[p.id] = generatePlayerHiddenProfile(p);
    }
  }

  return {
    ...v2,
    saveVersion: 3,
    activeNegotiations: v2.activeNegotiations || [],
    transferHistory: v2.transferHistory || [],
    futureCommitments: v2.futureCommitments || [],
    scouts: (v2 as any).scouts || initialScouts,
    scoutingAssignments: (v2 as any).scoutingAssignments || [],
    scoutingKnowledge: (v2 as any).scoutingKnowledge || {},
    scoutingReports: (v2 as any).scoutingReports || [],
    activeLoans: (v2 as any).activeLoans || [],
    academyFacilities: (v2 as any).academyFacilities || academy,
    youthPlayers: (v2 as any).youthPlayers || [],
    playerHiddenProfiles: (v2 as any).playerHiddenProfiles || hiddenProfiles,
    careerEconomyVersion: 2,
    managerContract: (v2 as any).managerContract || {
      yearsLeft: 2,
      weeklySalary: 45000,
      status: 'ACTIVE',
    },
    seasonNumber: (v2 as any).seasonNumber || 1,
  };
}

export function migrateV1toV2(v1: CareerSaveDataV1): CareerSaveDataV2 {
  return {
    ...v1,
    saveVersion: 2,
    activeNegotiations: [],
    transferHistory: [],
    futureCommitments: [],
  };
}

export function migrateV1toV3(v1: CareerSaveDataV1): CareerSaveDataV3 {
  const v2 = migrateV1toV2(v1);
  return migrateV2toV3(v2);
}

export function saveCareerState(data: any): boolean {
  try {
    if (typeof window === 'undefined') return false;

    if (data.saveVersion === 2) {
      const v3 = migrateV2toV3(data as CareerSaveDataV2);
      localStorage.setItem(SAVE_KEY_V3, JSON.stringify(v3));
      localStorage.setItem(SAVE_KEY_V2, JSON.stringify(data));
      return true;
    }

    const serialized = JSON.stringify(data);
    localStorage.setItem(SAVE_KEY_V3, serialized);
    return true;
  } catch (err) {
    console.error('SquadCraft Save Error:', err);
    return false;
  }
}

export function applyEconomyAndContractMigrations(data: CareerSaveDataV3): CareerSaveDataV3 {
  let needsSave = false;

  // 1. One-time versioned budget migration (+100% / x2 across user and AI clubs)
  if (!data.careerEconomyVersion || data.careerEconomyVersion < 2) {
    if (data.clubs) {
      data.clubs = data.clubs.map((c: any) => ({
        ...c,
        transferBudget: Math.round(c.transferBudget * 2),
      }));
    }
    if (data.finances) {
      data.finances = {
        ...data.finances,
        transferBudget: Math.round(data.finances.transferBudget * 2),
      };
    }
    data.careerEconomyVersion = 2;
    needsSave = true;
  }

  // 2. Manager contract migration
  if (!data.managerContract) {
    data.managerContract = {
      yearsLeft: 2,
      weeklySalary: 45000,
      status: 'ACTIVE',
    };
    needsSave = true;
  }

  // 3. Season number migration
  if (!data.seasonNumber) {
    data.seasonNumber = 1;
    needsSave = true;
  }

  if (needsSave) {
    saveCareerState(data);
  }

  return data;
}

export function loadCareerState(): CareerSaveDataV3 | null {
  try {
    if (typeof window === 'undefined') return null;

    // 1. Check V3 first
    const itemV3 = localStorage.getItem(SAVE_KEY_V3);
    if (itemV3) {
      const parsed = JSON.parse(itemV3);
      if (parsed && parsed.saveVersion === 3 && parsed.currentDate && parsed.clubs) {
        return applyEconomyAndContractMigrations(parsed as CareerSaveDataV3);
      }
      if (parsed && parsed.saveVersion === 2 && parsed.currentDate && parsed.clubs) {
        const migrated = migrateV2toV3(parsed as CareerSaveDataV2);
        return applyEconomyAndContractMigrations(migrated);
      }
    }

    // 2. Check V2 for migration
    const itemV2 = localStorage.getItem(SAVE_KEY_V2);
    if (itemV2) {
      const parsedV2 = JSON.parse(itemV2);
      if (parsedV2 && parsedV2.saveVersion === 2 && parsedV2.currentDate && parsedV2.clubs) {
        const migrated = migrateV2toV3(parsedV2 as CareerSaveDataV2);
        saveCareerState(migrated);
        return applyEconomyAndContractMigrations(migrated);
      }
    }

    // 3. Check V1 for migration
    const itemV1 = localStorage.getItem(SAVE_KEY_V1);
    if (itemV1) {
      const parsedV1 = JSON.parse(itemV1);
      if (parsedV1 && (parsedV1.saveVersion === 1 || !parsedV1.saveVersion) && parsedV1.currentDate && parsedV1.clubs) {
        const migrated = migrateV1toV3(parsedV1 as CareerSaveDataV1);
        saveCareerState(migrated);
        return applyEconomyAndContractMigrations(migrated);
      }
    }

    return null;
  } catch (err) {
    console.error('SquadCraft Load Error:', err);
    return null;
  }
}

export function hasCareerSave(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return Boolean(
      localStorage.getItem(SAVE_KEY_V3) ||
      localStorage.getItem(SAVE_KEY_V2) ||
      localStorage.getItem(SAVE_KEY_V1)
    );
  } catch {
    return false;
  }
}

export function clearCareerSave(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    localStorage.removeItem(SAVE_KEY_V3);
    localStorage.removeItem(SAVE_KEY_V2);
    localStorage.removeItem(SAVE_KEY_V1);
    return true;
  } catch {
    return false;
  }
}


