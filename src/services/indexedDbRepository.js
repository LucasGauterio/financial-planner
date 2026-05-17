/**
 * Repository interface using IndexedDB for asynchronous persistent storage.
 * Incorporates an automatic migration layer to port old LocalStorage data natively,
 * and AES-GCM encryption for zero-trust client security.
 */

import { useAuth } from '../composables/useAuth';
import { encryptData, decryptData, deriveKey } from './cryptoService';

const DB_NAME = 'FinancialPlannerDB';
const DB_VERSION = 1;
const STORE_NAME = 'finance_store';

const INVESTMENTS_KEY = 'financial_planner_investments';
const GOALS_KEY = 'financial_planner_goals';
const TIMELINE_KEY = 'financial_planner_timeline';
const LOANS_KEY = 'financial_planner_loans';
const ENCRYPTION_TEST_KEY = 'financial_planner_auth_check';
const BACKUPS_KEY = 'financial_planner_backups';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const { activeProfile } = useAuth();
    const dbName = activeProfile?.value && activeProfile.value !== 'default'
      ? `${DB_NAME}_${activeProfile.value}`
      : DB_NAME;

    const request = indexedDB.open(dbName, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

function getRaw(key) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

function setRaw(key, value) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

async function decryptValue(rawValue) {
  const { isUnlocked, encryptionKey } = useAuth();
  if (!isUnlocked.value) {
    throw new Error("App is locked.");
  }
  const decrypted = await decryptData(encryptionKey.value, rawValue);
  if (decrypted !== null) {
    return decrypted;
  }
  throw new Error("Data could not be decrypted. Tampering or key lost.");
}

function getMigrationData(key) {
  if (typeof localStorage === 'undefined') return null;
  const lsData = localStorage.getItem(key);
  if (!lsData) return null;
  const parsed = JSON.parse(lsData);
  localStorage.removeItem(key);
  return parsed;
}

async function get(key) {
  try {
    const rawValue = await getRaw(key);

    if (rawValue !== undefined) {
      if (typeof rawValue === 'string') {
        return await decryptValue(rawValue);
      }
      return rawValue; // Plaintext (legacy or migration)
    }

    const migrated = getMigrationData(key);
    if (migrated !== null) {
      return migrated;
    }
    return key === TIMELINE_KEY ? {} : [];
  } catch (error) {
    console.warn("Returning defaults/error due to DB error:", error);
    if (error.message === "App is locked." || error.message.includes("decrypted")) {
      throw error;
    }
    return key === TIMELINE_KEY ? {} : [];
  }
}

async function set(key, value) {
  const { isUnlocked, encryptionKey } = useAuth();
  if (!isUnlocked.value) {
    throw new Error("Cannot save data while app is locked.");
  }
  const encrypted = await encryptData(encryptionKey.value, value);
  await setRaw(key, encrypted);
}

async function getBackupHistory() {
  const history = await get(BACKUPS_KEY);
  return Array.isArray(history) ? history : [];
}

async function saveBackupSnapshot() {
  const { isUnlocked } = useAuth();
  if (!isUnlocked.value) return;

  const currentData = {
      [INVESTMENTS_KEY]: await getRaw(INVESTMENTS_KEY),
      [GOALS_KEY]: await getRaw(GOALS_KEY),
      [TIMELINE_KEY]: await getRaw(TIMELINE_KEY),
      [LOANS_KEY]: await getRaw(LOANS_KEY),
      [ENCRYPTION_TEST_KEY]: await getRaw(ENCRYPTION_TEST_KEY)
  };

  let history = await getBackupHistory();

  const dateStr = new Date().toISOString().split('T')[0];
  
  // Allow multiple snapshots per day
  history.push({
     date: dateStr,
     timestamp: Date.now(),
     data: currentData
  });

  if (history.length > 50) history.shift();
  await set(BACKUPS_KEY, history);
}

// Security Authentication checks
async function checkAuthStatus() {
  const checkToken = await getRaw(ENCRYPTION_TEST_KEY);
  if (checkToken === undefined) {
    // If no test key, check if other data exists in plain text
    const legacyGoals = await getRaw(GOALS_KEY);
    if (legacyGoals !== undefined && typeof legacyGoals !== 'string') {
      return { status: 'migration_needed' };
    }
    // New setup
    return { status: 'new_setup' };
  }
  return { status: 'locked' };
}

let pendingLegacyMigrationData = null;

async function authenticateLegacyPassword(legacyPassword) {
  const legacyKey = await deriveKey(legacyPassword);
  const checkToken = await getRaw(ENCRYPTION_TEST_KEY);
  const decrypted = await decryptData(legacyKey, checkToken);
  if (decrypted === 'VALID_AUTH') {
    async function fetchDecrypted(k) {
      const raw = await getRaw(k);
      if (raw === undefined || raw === null) return null;
      if (typeof raw === 'string') {
        const dec = await decryptData(legacyKey, raw);
        return dec === null ? raw : dec;
      }
      return raw;
    }
    pendingLegacyMigrationData = {
      [INVESTMENTS_KEY]: await fetchDecrypted(INVESTMENTS_KEY),
      [GOALS_KEY]: await fetchDecrypted(GOALS_KEY),
      [TIMELINE_KEY]: await fetchDecrypted(TIMELINE_KEY),
      [LOANS_KEY]: await fetchDecrypted(LOANS_KEY),
      [BACKUPS_KEY]: await fetchDecrypted(BACKUPS_KEY)
    };
    return true;
  }
  return false;
}

async function handleLegacyMigration(key) {
  const encryptedToken = await encryptData(key, 'VALID_AUTH');
  await setRaw(ENCRYPTION_TEST_KEY, encryptedToken);
  
  useAuth().unlock(key);

  for (const [k, val] of Object.entries(pendingLegacyMigrationData)) {
    if (val !== null) {
      const encrypted = await encryptData(key, val);
      await setRaw(k, encrypted);
    }
  }
  pendingLegacyMigrationData = null;
  return true;
}

async function handleSetupOrMigration(key, status) {
  const encryptedToken = await encryptData(key, 'VALID_AUTH');
  await setRaw(ENCRYPTION_TEST_KEY, encryptedToken);
  
  useAuth().unlock(key);
  
  if (status === 'migration_needed') {
    const legacyInv = await getRaw(INVESTMENTS_KEY);
    if (legacyInv) await set(INVESTMENTS_KEY, legacyInv);
    
    const legacyGoal = await getRaw(GOALS_KEY);
    if (legacyGoal) await set(GOALS_KEY, legacyGoal);
    
    const legacyTime = await getRaw(TIMELINE_KEY);
    if (legacyTime) await set(TIMELINE_KEY, legacyTime);
  }
  return true;
}

async function authenticate(password) {
  const key = await deriveKey(password);

  if (pendingLegacyMigrationData) {
    return await handleLegacyMigration(key);
  }

  const statusRes = await checkAuthStatus();

  if (statusRes.status === 'locked') {
    const checkToken = await getRaw(ENCRYPTION_TEST_KEY);
    const decrypted = await decryptData(key, checkToken);
    if (decrypted === 'VALID_AUTH') {
      useAuth().unlock(key);
      return true;
    }
    return false;
  } 
  
  if (statusRes.status === 'new_setup' || statusRes.status === 'migration_needed') {
    return await handleSetupOrMigration(key, statusRes.status);
  }
  return false;
}

export const repository = {
  getInvestments: async () => await get(INVESTMENTS_KEY),
  saveInvestments: async (data) => await set(INVESTMENTS_KEY, data),
  
  getGoals: async () => await get(GOALS_KEY),
  saveGoals: async (data) => await set(GOALS_KEY, data),
  
  getTimelineState: async () => await get(TIMELINE_KEY),
  saveTimelineState: async (state) => await set(TIMELINE_KEY, state),

  getLoans: async () => await get(LOANS_KEY),
  saveLoans: async (data) => await set(LOANS_KEY, data),

  // New Export/Import logic
  exportRawBackup: async () => {
    return {
      [INVESTMENTS_KEY]: await getRaw(INVESTMENTS_KEY),
      [GOALS_KEY]: await getRaw(GOALS_KEY),
      [TIMELINE_KEY]: await getRaw(TIMELINE_KEY),
      [LOANS_KEY]: await getRaw(LOANS_KEY),
      [ENCRYPTION_TEST_KEY]: await getRaw(ENCRYPTION_TEST_KEY)
    };
  },
  importRawBackup: async (backupData) => {
    if (backupData[INVESTMENTS_KEY]) await setRaw(INVESTMENTS_KEY, backupData[INVESTMENTS_KEY]);
    if (backupData[GOALS_KEY]) await setRaw(GOALS_KEY, backupData[GOALS_KEY]);
    if (backupData[TIMELINE_KEY]) await setRaw(TIMELINE_KEY, backupData[TIMELINE_KEY]);
    if (backupData[LOANS_KEY]) await setRaw(LOANS_KEY, backupData[LOANS_KEY]);
    if (backupData[ENCRYPTION_TEST_KEY]) await setRaw(ENCRYPTION_TEST_KEY, backupData[ENCRYPTION_TEST_KEY]);
  },

  getBackupHistory,
  saveBackupSnapshot,
  checkAuthStatus,
  authenticate,
  authenticateLegacyPassword
};
