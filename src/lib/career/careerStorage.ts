/**
 * SquadCraft Canonical Career Storage Layer
 * 
 * Primary Canonical Storage: IndexedDB ("SquadCraftDB" -> "careerSaves" -> key "mainCareer")
 * Fast Metadata Cache: localStorage ("SquadCraftCareerMeta", < 1KB)
 * 
 * Supports:
 * - Large ~2000 player career universes (~2.8MB - 6MB+)
 * - Reliable Mobile Safari & Standalone PWA persistence
 * - Zero QuotaExceededError risk
 * - Legacy localStorage V3/V2 automatic lossless migration
 * - Transactional acknowledgments
 */

import { CareerSaveDataV3, CareerSaveDataV2 } from './types';
import { migrateV2toV3, applyEconomyAndContractMigrations, SAVE_KEY_V3, SAVE_KEY_V2 } from './saveManager';

export const DB_NAME = 'SquadCraftDB';
export const DB_VERSION = 1;
export const STORE_NAME = 'careerSaves';
export const MAIN_CAREER_KEY = 'mainCareer';
export const META_KEY = 'SquadCraftCareerMeta';

export interface CareerSaveMeta {
  saveVersion: number;
  exists: boolean;
  userClubId: string;
  clubName: string;
  seasonYear: string;
  currentDate: string;
  managerName?: string;
  updatedAt: string;
  playerCount?: number;
  byteSize?: number;
}

export interface SaveResult {
  success: boolean;
  error?: any;
  byteSize?: number;
}

/**
 * Open or upgrade SquadCraft IndexedDB
 */
export function openCareerDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };

    request.onblocked = () => {
      console.warn('[SquadCraftDB] Database blocked by open connections in other tabs');
    };
  });
}

/**
 * Save complete CareerSaveDataV3 to IndexedDB (Canonical Store)
 * Also updates lightweight metadata in localStorage
 */
export async function saveCareerToIndexedDB(data: CareerSaveDataV3): Promise<SaveResult> {
  try {
    if (typeof window === 'undefined') {
      return { success: false, error: 'SSR environment' };
    }

    // Ensure migrations are applied
    const preparedData = applyEconomyAndContractMigrations(data);
    const serialized = JSON.stringify(preparedData);
    const byteSize = new Blob([serialized]).size;

    const db = await openCareerDB();

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const putRequest = store.put(preparedData, MAIN_CAREER_KEY);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error || new Error('Failed to put career in IndexedDB'));
      transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction error'));
      transaction.onabort = () => reject(new Error('IndexedDB transaction aborted'));
    });

    // Update lightweight metadata in localStorage (< 1KB) for instant UI detection
    const userClub = preparedData.clubs?.find((c) => c.id === preparedData.userClubId) || preparedData.clubs?.[0];
    const meta: CareerSaveMeta = {
      saveVersion: 3,
      exists: true,
      userClubId: preparedData.userClubId,
      clubName: userClub?.name || 'Kulüp',
      seasonYear: preparedData.seasonYear,
      currentDate: preparedData.currentDate,
      managerName: preparedData.managerProfile?.name,
      updatedAt: new Date().toISOString(),
      playerCount: preparedData.players?.length || 0,
      byteSize,
    };
    saveCareerMetadata(meta);

    // Diagnostics in dev
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SquadCraftDB] Career saved successfully. Size: ${(byteSize / (1024 * 1024)).toFixed(2)} MB (${byteSize} bytes)`);
    }

    return { success: true, byteSize };
  } catch (error) {
    console.error('[SquadCraftDB] Save error:', error);
    return { success: false, error };
  }
}

/**
 * Load complete CareerSaveDataV3 from IndexedDB (Canonical Store)
 * Falls back to lossless legacy localStorage migration if IndexedDB is empty
 */
export async function loadCareerFromIndexedDB(): Promise<CareerSaveDataV3 | null> {
  try {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return null;
    }

    const db = await openCareerDB();

    const idbData = await new Promise<CareerSaveDataV3 | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(MAIN_CAREER_KEY);

      getRequest.onsuccess = () => {
        resolve(getRequest.result || null);
      };
      getRequest.onerror = () => {
        reject(getRequest.error || new Error('Failed to read from IndexedDB'));
      };
    });

    if (idbData && idbData.clubs && idbData.userClubId) {
      return applyEconomyAndContractMigrations(idbData);
    }

    // Step 2: Lossless legacy migration from localStorage
    const migratedData = await migrateLegacyLocalStorage();
    if (migratedData) {
      return migratedData;
    }

    return null;
  } catch (error) {
    console.error('[SquadCraftDB] Load error:', error);
    // Attempt fallback to legacy localStorage on read error
    return migrateLegacyLocalStorage();
  }
}

/**
 * Delete Career from IndexedDB & clear metadata
 */
export async function deleteCareerFromIndexedDB(): Promise<{ success: boolean }> {
  try {
    if (typeof window === 'undefined') return { success: true };

    clearCareerMetadata();

    // Also clear legacy localStorage keys so they don't resurrect
    try {
      localStorage.removeItem(SAVE_KEY_V3);
      localStorage.removeItem(SAVE_KEY_V2);
      localStorage.removeItem('squadcraft_career_save_v1');
    } catch {}

    if (!window.indexedDB) return { success: true };

    const db = await openCareerDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const delRequest = store.delete(MAIN_CAREER_KEY);

      delRequest.onsuccess = () => resolve();
      delRequest.onerror = () => reject(delRequest.error);
    });

    console.log('[SquadCraftDB] Career successfully deleted from IndexedDB and storage cleared.');
    return { success: true };
  } catch (err) {
    console.error('[SquadCraftDB] Delete error:', err);
    return { success: false };
  }
}

/**
 * Save lightweight metadata to localStorage (< 1KB)
 */
export function saveCareerMetadata(meta: CareerSaveMeta): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch (e) {
    console.warn('[SquadCraftDB] Failed to write metadata to localStorage:', e);
  }
}

/**
 * Load lightweight metadata from localStorage synchronously (< 1KB)
 */
export function loadCareerMetadata(): CareerSaveMeta | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CareerSaveMeta;
    if (parsed && parsed.exists) return parsed;
    return null;
  } catch {
    return null;
  }
}

/**
 * Clear metadata from localStorage
 */
export function clearCareerMetadata(): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(META_KEY);
  } catch {}
}

/**
 * Lossless migration from legacy localStorage V3/V2 into IndexedDB
 */
export async function migrateLegacyLocalStorage(): Promise<CareerSaveDataV3 | null> {
  try {
    if (typeof window === 'undefined') return null;

    let rawV3 = localStorage.getItem(SAVE_KEY_V3);
    let parsed: any = null;

    if (rawV3) {
      try {
        parsed = JSON.parse(rawV3);
      } catch (e) {
        console.warn('[SquadCraftDB] Failed to parse legacy V3 save JSON:', e);
      }
    }

    if (!parsed) {
      const rawV2 = localStorage.getItem(SAVE_KEY_V2);
      if (rawV2) {
        try {
          const parsedV2 = JSON.parse(rawV2);
          parsed = migrateV2toV3(parsedV2 as CareerSaveDataV2);
        } catch {}
      }
    }

    if (parsed && parsed.clubs && parsed.userClubId) {
      console.log('[SquadCraftDB] Found valid legacy localStorage save. Migrating to IndexedDB...');
      const prepared = applyEconomyAndContractMigrations(parsed);
      const res = await saveCareerToIndexedDB(prepared);

      if (res.success) {
        console.log('[SquadCraftDB] Legacy save migration to IndexedDB successful! Preserving as backup.');
        return prepared;
      }
    }

    return null;
  } catch (err) {
    console.error('[SquadCraftDB] Legacy migration error:', err);
    return null;
  }
}

/**
 * Development & diagnostic helper
 */
export async function getCareerStorageDiagnostics(): Promise<{
  storageType: string;
  byteSize: number;
  exists: boolean;
  lastSave?: string;
  userClubId?: string;
  playerCount?: number;
}> {
  const meta = loadCareerMetadata();
  const idbCareer = await loadCareerFromIndexedDB();

  if (idbCareer) {
    const serialized = JSON.stringify(idbCareer);
    const byteSize = new Blob([serialized]).size;
    return {
      storageType: 'IndexedDB (SquadCraftDB)',
      byteSize,
      exists: true,
      lastSave: idbCareer.savedAt || meta?.updatedAt,
      userClubId: idbCareer.userClubId,
      playerCount: idbCareer.players?.length,
    };
  }

  return {
    storageType: 'None',
    byteSize: 0,
    exists: false,
  };
}
