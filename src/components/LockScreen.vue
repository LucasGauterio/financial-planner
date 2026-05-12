<template>
  <div class="lock-screen" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh;">
    <div style="background: var(--surface-color); padding: 2rem; border-radius: 8px; border: 1px solid var(--border-color); width: 100%; max-width: 400px; text-align: center;">
      <h2 style="margin-bottom: 1rem; color: var(--text-primary);">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        {{ status === 'new_setup' ? 'Set Master Password' : (status === 'migration_needed' ? 'Secure Your Data' : 'Unlock Planner') }}
      </h2>
      
      <p style="color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 0.9rem;">
        {{ 
          status === 'new_setup' 
          ? 'Enter a strong password to encrypt your financial data on this device.' 
          : (status === 'migration_needed' ? 'Enter a password to encrypt your existing unprotected data.' : 'Enter your master password to decrypt your data.') 
        }}
      </p>

      <form @submit.prevent="submitPassword">
        <input 
          type="password" 
          v-model="password" 
          placeholder="Password"
          style="width: 100%; padding: 0.75rem; margin-bottom: 1rem; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-primary);"
          required
          autofocus
        />
        
        <div v-if="errorMsg" style="color: #ef4444; margin-bottom: 1rem; font-size: 0.85rem;">
          {{ errorMsg }}
        </div>

        <button 
          type="submit" 
          class="btn btn-primary" 
          style="width: 100%;"
          :disabled="loading"
        >
          {{ loading ? '...' : (status === 'locked' ? 'Unlock' : 'Encrypt & Save') }}
        </button>
      </form>
      
      <div v-if="status === 'new_setup' || status === 'migration_needed'" style="margin-top: 1rem; font-size: 0.75rem; color: var(--text-secondary);">
        <strong>WARNING:</strong> Data is encrypted client-side. If you lose this password, your data cannot be recovered.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { repository } from '../services/indexedDbRepository';
import { useAuth } from '../composables/useAuth';

const password = ref('');
const errorMsg = ref('');
const status = ref('locked');
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await repository.checkAuthStatus();
    status.value = res.status;
  } catch (e) {
    console.error("Failed to check auth status", e);
  } finally {
    loading.value = false;
  }
});

async function submitPassword() {
  if (!password.value) return;
  
  loading.value = true;
  errorMsg.value = '';
  
  try {
    const success = await repository.authenticate(password.value);
    if (!success) {
      errorMsg.value = 'Incorrect password.';
    } else {
      // Force page reload or trigger reactive state
      // (The useAuth unlock is already called inside authenticate)
      // Any data that needs to be loaded by components will be fetched automatically.
    }
  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    loading.value = false;
  }
}
</script>
