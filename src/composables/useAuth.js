import { ref } from 'vue';

const encryptionKey = ref(null);
const isUnlocked = ref(false);

let timeoutTimer = null;
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

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

// Add global listeners for user activity
if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', resetIdleTimeout);
  window.addEventListener('keydown', resetIdleTimeout);
  window.addEventListener('click', resetIdleTimeout);
  window.addEventListener('scroll', resetIdleTimeout);
  
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
    lock,
    unlock
  };
}
