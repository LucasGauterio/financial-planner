<template>
  <div class="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000;">
    <div style="background: var(--surface-color); border-radius: 8px; width: 100%; max-width: 460px; border: 1px solid var(--border-color); height: 500px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6); animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
      
      <!-- FIXED HEADER SECTION AT THE TOP (Never Scrolls) -->
      <div style="padding: 1.5rem; border-bottom: 1px solid var(--border-color); flex-shrink: 0;">
        <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-size: 1.5rem; font-family: var(--font-display); font-weight: bold;">
          {{ t('backup.title') }}
        </h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0 0 1.25rem 0; line-height: 1.4;">
          {{ t('backup.subtitle') }}
        </p>
        
        <!-- FUNCTION BUTTONS -->
        <div style="display: flex; gap: 0.5rem; margin: 0;">
          <button class="btn btn-secondary" style="flex: 1; padding: 0.6rem 0.25rem; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.25rem;" @click="exportBackup" :title="t('backup.exportTitle')">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            {{ t('backup.exportBtn') }}
          </button>
          
          <label class="btn btn-secondary" style="flex: 1; text-align: center; cursor: pointer; padding: 0.6rem 0.25rem; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.25rem; margin: 0;" :title="t('backup.importTitle')">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            {{ t('backup.importBtn') }}
            <input type="file" style="display: none;" accept=".json" @change="importBackup" />
          </label>
          
          <button class="btn btn-primary" style="flex: 1; padding: 0.6rem 0.25rem; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.25rem;" @click="createManualSnapshot" :title="t('backup.snapshotTitle')">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            {{ t('backup.snapshotBtn') }}
          </button>
        </div>
        
        <div v-if="importMsg" style="margin-top: 0.75rem; font-size: 0.8rem; text-align: center; color: var(--primary-accent); background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.12); padding: 0.4rem; border-radius: 4px; animation: fadeIn 0.25s ease;">
          {{ importMsg }}
        </div>
      </div>
      
      <!-- AREA: SNAPSHOT HISTORY (Wrapper Container) -->
      <div style="flex: 1; display: flex; flex-direction: column; padding: 1.25rem 1.5rem; background: rgba(0,0,0,0.12); overflow: hidden;">
        <h4 style="margin: 0 0 0.75rem 0; font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; flex-shrink: 0;">
          {{ t('backup.historyTitle') }}
        </h4>
        
        <!-- ONLY THE ITEMS CONTENT SCROLLS -->
        <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; padding-right: 2px;">
          <!-- Empty Snapshots list -->
          <div v-if="history.length === 0" style="font-size: 0.85rem; color: var(--text-secondary); text-align: center; padding: 2.5rem 1rem; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.4;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>{{ t('backup.noSnapshots') }}</span>
          </div>
          
          <!-- List container -->
          <div v-else style="display: flex; flex-direction: column; gap: 0.5rem;">
            <div 
              v-for="(snap, index) in reversedHistory" 
              :key="index" 
              style="display: flex; justify-content: space-between; align-items: center; background: var(--surface-color); padding: 0.6rem 0.85rem; border-radius: 6px; border: 1px solid var(--border-color); transition: transform 0.2s ease;"
              class="snapshot-history-row"
            >
              <div>
                 <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">{{ snap.date }}</div>
                 <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 0.1rem;">{{ formatTime(snap.timestamp) }}</div>
              </div>
              <div style="display: flex; gap: 0.35rem;">
                <button 
                  class="btn btn-secondary" 
                  style="padding: 0.3rem 0.5rem; display: flex; align-items: center; justify-content: center;" 
                  @click="downloadSnapshot(snap)" 
                  :title="t('backup.downloadTooltip')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </button>
                <button 
                  class="btn btn-secondary" 
                  style="padding: 0.3rem 0.6rem; font-size: 0.75rem; font-weight: bold;" 
                  @click="restoreSnapshot(snap)"
                >
                  {{ t('backup.restoreBtn') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- FIXED FOOTER AT THE BOTTOM (Never Scrolls) -->
      <div style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; flex-shrink: 0;">
        <button class="btn btn-secondary" style="padding: 0.55rem 1.5rem; width: 100%; font-weight: bold;" @click="$emit('close')">
          {{ t('backup.closeBtn') }}
        </button>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from '../composables/useI18n';
import { repository } from '../services/indexedDbRepository';
import { useAuth } from '../composables/useAuth';
import { decryptData } from '../services/cryptoService';

const emit = defineEmits(['close']);
const { t, locale } = useI18n();

const importMsg = ref('');
const history = ref([]);

const reversedHistory = computed(() => {
   return [...history.value].reverse();
});

async function loadHistory() {
   history.value = await repository.getBackupHistory();
}

onMounted(() => {
   loadHistory();
});

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

async function createManualSnapshot() {
   await repository.saveBackupSnapshot();
   await loadHistory();
}

async function restoreSnapshot(snap) {
   const confirmMsg = t('backup.confirmRestore', { date: snap.date });
   if (confirm(confirmMsg)) {
       try {
           importMsg.value = t('backup.statusRestoring');
           await repository.importRawBackup(snap.data);
           globalThis.location.reload();
       } catch (e) {
           importMsg.value = t('backup.statusRestoreFailed', { error: e.message });
       }
   }
}

async function downloadSnapshot(snap) {
  try {
    const dataStr = JSON.stringify(snap.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    const timeStr = new Date(snap.timestamp).toISOString().replaceAll(/[:.]/g, '-');
    link.download = `financial_planner_snapshot_${timeStr}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert(t('backup.errorDownloadFailed', { error: err.message }));
  }
}

async function exportBackup() {
  try {
    const data = await repository.exportRawBackup();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `financial_planner_backup_${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert(t('backup.errorExportFailed', { error: err.message }));
  }
}

async function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  importMsg.value = t('backup.statusReading');
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data || typeof data !== 'object') {
      throw new Error(t('backup.errorInvalidFormat'));
    }
    
    const authCheckToken = data['financial_planner_auth_check'];
    if (authCheckToken) {
       const { encryptionKey } = useAuth();
       if (!encryptionKey.value) throw new Error(t('backup.errorAppLocked'));
       
       const decrypted = await decryptData(encryptionKey.value, authCheckToken);
       if (decrypted !== 'VALID_AUTH') {
          importMsg.value = t('backup.errorDifferentPassword');
          return;
       }
    }

    await repository.importRawBackup(data);
    importMsg.value = t('backup.importSuccess');
    setTimeout(() => {
      globalThis.location.reload();
    }, 1000);
  } catch (err) {
    importMsg.value = err.message || t('backup.errorParsing');
  }
}
</script>

<style scoped>
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.snapshot-history-row:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}
</style>
