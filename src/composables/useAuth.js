import { ref } from 'vue';

const encryptionKey = ref(null);
const isUnlocked = ref(false);

const activeProfile = ref(localStorage.getItem('financial_planner_active_profile') || 'default');
const profilesList = ref(JSON.parse(localStorage.getItem('financial_planner_profiles') || '["default"]'));

let timeoutTimer = null;
const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

async function lock() {
  if (isUnlocked.value) {
    try {
      // Dynamic import to prevent circular dependencies
      const { repository } = await import('../services/indexedDbRepository');
      await repository.saveBackupSnapshot();
    } catch (e) {
      console.error("Auto-backup before lock failed", e);
    }
  }
  encryptionKey.value = null;
  isUnlocked.value = false;
  if (timeoutTimer) clearTimeout(timeoutTimer);
  console.log("App locked due to manual request or inactivity.");
}

function resetIdleTimeout() {
  if (timeoutTimer) clearTimeout(timeoutTimer);
  
  if (isUnlocked.value) {
    timeoutTimer = setTimeout(() => {
      lock();
    }, IDLE_TIMEOUT_MS);
  }
}

function unlock(key) {
  encryptionKey.value = key;
  isUnlocked.value = true;
  resetIdleTimeout();
}

function setActiveProfile(profileName) {
  activeProfile.value = profileName;
  localStorage.setItem('financial_planner_active_profile', profileName);
  lock();
}

function addProfile(profileName) {
  const cleanName = profileName.trim();
  if (!cleanName) return false;
  if (profilesList.value.includes(cleanName)) return false;
  profilesList.value.push(cleanName);
  localStorage.setItem('financial_planner_profiles', JSON.stringify(profilesList.value));
  setActiveProfile(cleanName);
  return true;
}

async function deleteProfile(profileName) {
  if (profileName === 'default') return false;
  
  profilesList.value = profilesList.value.filter(p => p !== profileName);
  localStorage.setItem('financial_planner_profiles', JSON.stringify(profilesList.value));
  
  try {
    const dbName = `FinancialPlannerDB_${profileName}`;
    if (globalThis.indexedDB !== undefined) {
      indexedDB.deleteDatabase(dbName);
    }
  } catch (e) {
    console.error("Failed to delete DB for profile", profileName, e);
  }
  
  if (activeProfile.value === profileName) {
    setActiveProfile('default');
  }
  return true;
}

// Add global listeners for user activity
if (globalThis.window !== undefined) {
  globalThis.addEventListener('mousemove', resetIdleTimeout);
  globalThis.addEventListener('keydown', resetIdleTimeout);
  globalThis.addEventListener('click', resetIdleTimeout);
  globalThis.addEventListener('scroll', resetIdleTimeout);
  
  document.addEventListener('visibilitychange', async () => {
     if (document.visibilityState === 'hidden' && isUnlocked.value) {
         try {
             const { repository } = await import('../services/indexedDbRepository');
             await repository.saveBackupSnapshot();
         } catch(e) {
             console.error("Visibility auto-backup failed", e);
         }
     }
  });
}

export function useAuth() {
  return {
    encryptionKey,
    isUnlocked,
    activeProfile,
    profilesList,
    setActiveProfile,
    addProfile,
    deleteProfile,
    lock,
    unlock
  };
}
