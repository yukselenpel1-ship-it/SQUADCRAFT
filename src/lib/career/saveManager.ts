import { CareerSaveDataV3, CareerSaveDataV2, CareerSaveDataV1 } from './types';
import { generateClubScouts } from '../scouting/scoutGenerator';
import { generatePlayerHiddenProfile } from '../scouting/playerPersonality';
import { initializeClubAcademy } from '../youth/academyQuality';
import { MOCK_CLUBS } from '../data/mockData';

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

import {
  saveCareerToIndexedDB,
  loadCareerFromIndexedDB,
  loadCareerMetadata,
  deleteCareerFromIndexedDB,
  clearCareerMetadata,
  SaveResult,
} from './careerStorage';

export async function saveCareerState(data: any): Promise<SaveResult> {
  try {
    if (typeof window === 'undefined') return { success: false, error: 'SSR' };

    let preparedData = data;
    if (data.saveVersion === 2) {
      preparedData = migrateV2toV3(data as CareerSaveDataV2);
    }

    // 1. Canonical Storage: IndexedDB
    const result = await saveCareerToIndexedDB(preparedData as CareerSaveDataV3);

    // 2. Best-effort backup to localStorage if under 2MB (won't throw or block)
    try {
      const serialized = JSON.stringify(preparedData);
      if (serialized.length < 2 * 1024 * 1024) {
        localStorage.setItem(SAVE_KEY_V3, serialized);
      }
    } catch {
      // Ignored: IndexedDB is canonical
    }

    return result;
  } catch (err) {
    console.error('SquadCraft Save Error:', err);
    return { success: false, error: err };
  }
}

export function saveCareerStateSync(data: any): boolean {
  try {
    if (typeof window === 'undefined') return false;
    saveCareerState(data).catch((e) => console.warn('Async save warning:', e));
    return true;
  } catch {
    return false;
  }
}

/**
 * Detects and repairs saves corrupted by repeated migration multiplications.
 * Specifically checks for budgets that were multiplied by powers of 2 beyond legitimate gameplay bounds.
 */
export function repairCorruptedEconomy(data: CareerSaveDataV3): boolean {
  if (!data || !data.clubs) return false;
  let repaired = false;

  // Calculate purchases and sales per club from transferHistory
  const purchasesByClub: Record<string, number> = {};
  const salesByClub: Record<string, number> = {};

  (data.transferHistory || []).forEach((t: any) => {
    if (t.toClubId && t.fee) {
      purchasesByClub[t.toClubId] = (purchasesByClub[t.toClubId] || 0) + Number(t.fee);
    }
    if (t.fromClubId && t.fee) {
      salesByClub[t.fromClubId] = (salesByClub[t.fromClubId] || 0) + Math.round(Number(t.fee) * 0.85);
    }
  });

  data.clubs = data.clubs.map((c: any) => {
    const mockClub = MOCK_CLUBS.find((m) => m.id === c.id);
    const baseBudget = mockClub ? mockClub.transferBudget * 2 : 50_000_000;
    const spent = purchasesByClub[c.id] || 0;
    const earned = salesByClub[c.id] || 0;
    const legitimateBudget = Math.max(1_000_000, baseBudget - spent + earned);

    // If budget is heavily corrupted (e.g. > €120M and > 2.5x legitimate budget):
    // Normal maximum budget in SquadCraft with v2 is €74M (Zirve).
    // An inflated budget like €409.6M or €1.638T is an obvious result of 2^N multiplications.
    if (c.transferBudget > 120_000_000 && c.transferBudget > legitimateBudget * 2.5) {
      console.warn(
        `[EconomyRepair] Corrupted budget detected for club ${c.name} (${c.id}): €${c.transferBudget.toLocaleString('tr-TR')}. Restoring to legitimate budget: €${legitimateBudget.toLocaleString('tr-TR')}`
      );
      repaired = true;
      return {
        ...c,
        transferBudget: legitimateBudget,
      };
    }
    return c;
  });

  // Repair and synchronize user club finances
  if (data.finances && data.userClubId) {
    const userClub = data.clubs.find((c: any) => c.id === data.userClubId) || data.clubs[0];
    if (data.finances.transferBudget > 120_000_000 || (repaired && data.finances.transferBudget !== userClub.transferBudget)) {
      console.warn(
        `[EconomyRepair] Synchronizing finances.transferBudget from €${data.finances.transferBudget.toLocaleString('tr-TR')} to €${userClub.transferBudget.toLocaleString('tr-TR')}`
      );
      data.finances = {
        ...data.finances,
        transferBudget: userClub.transferBudget,
      };
      repaired = true;
    }
  }

  if (repaired) {
    data.careerEconomyVersion = 2;
  }

  return repaired;
}

if (typeof window !== 'undefined') {
  (window as any).__repairCareerEconomy = repairCorruptedEconomy;
}

export function applyEconomyAndContractMigrations(data: CareerSaveDataV3): CareerSaveDataV3 {
  let needsSave = false;

  // 0. Repair corrupted economy if save was inflated by previous repeated migrations
  const wasRepaired = repairCorruptedEconomy(data);
  if (wasRepaired) {
    needsSave = true;
  }

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
    if (typeof window === 'undefined' && typeof localStorage === 'undefined') return null;

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
    const meta = loadCareerMetadata();
    if (meta && meta.exists) return true;

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
    clearCareerMetadata();
    localStorage.removeItem(SAVE_KEY_V3);
    localStorage.removeItem(SAVE_KEY_V2);
    localStorage.removeItem(SAVE_KEY_V1);
    deleteCareerFromIndexedDB().catch((e) => console.warn('IDB clear warning:', e));
    return true;
  } catch {
    return false;
  }
}

export async function clearCareerSaveAsync(): Promise<boolean> {
  const res = await deleteCareerFromIndexedDB();
  return res.success;
}


