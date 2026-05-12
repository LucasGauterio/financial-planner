<template>
  <div class="lock-screen" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; padding: 1rem;">
    <div class="card" style="width: 100%; max-width: 420px; text-align: center; padding: 2.5rem; border-radius: var(--radius-md);">
      
      <!-- CREATE NEW PROFILE SCREEN -->
      <div v-if="isCreatingProfile">
        <h2 style="margin-bottom: 0.5rem; color: var(--text-primary);">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px; color: var(--primary-accent);"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
          {{ t('auth.createProfileTitle') }}
        </h2>
        
        <p style="color: var(--text-secondary); margin-bottom: 2rem; font-size: 0.9rem;">
          {{ t('auth.newSetupPinDesc') }}
        </p>

        <form @submit.prevent="submitNewProfile" style="display: flex; flex-direction: column; gap: 1rem; text-align: left;">
          <fieldset class="form-fieldset">
            <legend>{{ t('auth.profileLabel') }}</legend>
            <input 
              type="text" 
              v-model="newProfileName" 
              :placeholder="t('auth.profileNamePlaceholder')"
              required
              autofocus
            />
          </fieldset>

          <!-- MULTI-INPUT DIGITS FOR PROFILE PIN -->
          <fieldset class="form-fieldset" style="border: none !important; background: transparent !important; padding: 0 !important; box-shadow: none !important; margin-bottom: 0.25rem;">
            <legend style="text-align: center; margin-bottom: 0.5rem; width: 100%;">{{ t('auth.pinPlaceholder') }}</legend>
            <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 0.25rem; margin-bottom: 0.5rem;">
              <input
                v-for="(digit, index) in 4"
                :key="index"
                :id="`profile-pin-digit-${index}`"
                type="password"
                v-model="pinDigits[index]"
                maxlength="1"
                inputmode="numeric"
                pattern="[0-9]*"
                class="pin-input"
                @input="handlePinInput(index, $event, false, 'profile-pin-digit')"
                @keydown="handlePinKeydown(index, $event, false, 'profile-pin-digit')"
                @paste="handlePinPaste($event, false, 'profile-pin-digit')"
                required
              />
            </div>
          </fieldset>

          <!-- MULTI-INPUT DIGITS FOR PROFILE PIN CONFIRMATION -->
          <fieldset class="form-fieldset" style="border: none !important; background: transparent !important; padding: 0 !important; box-shadow: none !important;">
            <legend style="text-align: center; margin-bottom: 0.5rem; width: 100%;">{{ t('auth.confirmPinPlaceholder') }}</legend>
            <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 0.25rem; margin-bottom: 0.5rem;">
              <input
                v-for="(digit, index) in 4"
                :key="index"
                :id="`profile-confirm-pin-digit-${index}`"
                type="password"
                v-model="confirmPinDigits[index]"
                maxlength="1"
                inputmode="numeric"
                pattern="[0-9]*"
                class="pin-input"
                @input="handlePinInput(index, $event, true, 'profile-confirm-pin-digit')"
                @keydown="handlePinKeydown(index, $event, true, 'profile-confirm-pin-digit')"
                @paste="handlePinPaste($event, true, 'profile-confirm-pin-digit')"
                required
              />
            </div>
          </fieldset>
          
          <div v-if="errorMsg" style="color: #ef4444; margin-top: 0.25rem; font-size: 0.85rem; text-align: center; font-weight: 500;">
            {{ errorMsg }}
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem;">
            <button 
              type="submit" 
              class="btn btn-primary" 
              style="width: 100%;"
              :disabled="loading"
            >
              {{ loading ? '...' : t('auth.createBtn') }}
            </button>
            
            <button 
              type="button" 
              class="btn btn-secondary" 
              style="width: 100%;"
              @click="cancelCreateProfile"
              :disabled="loading"
            >
              {{ t('auth.backToLogin') }}
            </button>
          </div>
        </form>
        
        <div style="margin-top: 1.5rem; font-size: 0.75rem; color: var(--text-secondary);">
          {{ t('auth.warningNoRecover') }}
        </div>
      </div>

      <!-- STANDARD LOGIN / UNLOCK / SETUP SCREEN -->
      <div v-else>
        <h2 style="margin-bottom: 0.5rem; color: var(--text-primary);">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px; color: var(--primary-accent);"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          {{ status === 'new_setup' ? t('auth.setMasterPassword') : (status === 'migration_needed' ? t('auth.secureYourData') : t('auth.unlockPlanner')) }}
        </h2>
        
        <p style="color: var(--text-secondary); margin-bottom: 2rem; font-size: 0.9rem;">
          {{ 
            status === 'new_setup' 
            ? t('auth.newSetupPinDesc') 
            : (status === 'migration_needed' ? t('auth.migrationDesc') : t('auth.unlockDesc')) 
          }}
        </p>

        <!-- Dynamic Profile Select Row -->
        <div style="display: flex; gap: 0.5rem; align-items: stretch; margin-bottom: 1.25rem; text-align: left;">
          <fieldset class="form-fieldset" style="flex: 1;">
            <legend>{{ t('auth.profileLabel') }}</legend>
            <select v-model="selectedProfile" style="padding: 0.15rem 0; font-size: 0.9rem; border: none; background: transparent; width: 100%; color: var(--text-primary); outline: none;">
              <option v-for="profile in profilesList" :key="profile" :value="profile" style="background: var(--surface-color); color: var(--text-primary);">
                {{ profile === 'default' ? 'Default Profile' : profile }}
              </option>
            </select>
          </fieldset>
          
          <button 
            v-if="selectedProfile !== 'default'"
            type="button" 
            class="btn btn-secondary btn-icon" 
            style="color: #ffffff; background: #dc2626; border-color: #dc2626;"
            @click="handleDeleteProfile(selectedProfile)"
            :title="t('auth.deleteProfileBtn')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>

        <form @submit.prevent="submitPassword" style="display: flex; flex-direction: column; gap: 1rem; text-align: left;">
          
          <!-- BRAND NEW PIN SETUP (OR DATA MIGRATION) -->
          <div v-if="status === 'new_setup' || status === 'migration_needed'" style="display: flex; flex-direction: column; gap: 1rem;">
            <!-- MULTI-INPUT DIGITS FOR NEW PIN SETUP -->
            <fieldset class="form-fieldset" style="border: none !important; background: transparent !important; padding: 0 !important; box-shadow: none !important; margin-bottom: 0.25rem;">
              <legend style="text-align: center; margin-bottom: 0.5rem; width: 100%;">{{ t('auth.pinPlaceholder') }}</legend>
              <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 0.25rem; margin-bottom: 0.5rem;">
                <input
                  v-for="(digit, index) in 4"
                  :key="index"
                  :id="`setup-pin-digit-${index}`"
                  type="password"
                  v-model="pinDigits[index]"
                  maxlength="1"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  class="pin-input"
                  @input="handlePinInput(index, $event, false, 'setup-pin-digit')"
                  @keydown="handlePinKeydown(index, $event, false, 'setup-pin-digit')"
                  @paste="handlePinPaste($event, false, 'setup-pin-digit')"
                  required
                  autofocus
                />
              </div>
            </fieldset>

            <!-- MULTI-INPUT DIGITS FOR PIN CONFIRMATION -->
            <fieldset class="form-fieldset" style="border: none !important; background: transparent !important; padding: 0 !important; box-shadow: none !important;">
              <legend style="text-align: center; margin-bottom: 0.5rem; width: 100%;">{{ t('auth.confirmPinPlaceholder') }}</legend>
              <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 0.25rem; margin-bottom: 0.5rem;">
                <input
                  v-for="(digit, index) in 4"
                  :key="index"
                  :id="`setup-confirm-pin-digit-${index}`"
                  type="password"
                  v-model="confirmPinDigits[index]"
                  maxlength="1"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  class="pin-input"
                  @input="handlePinInput(index, $event, true, 'setup-confirm-pin-digit')"
                  @keydown="handlePinKeydown(index, $event, true, 'setup-confirm-pin-digit')"
                  @paste="handlePinPaste($event, true, 'setup-confirm-pin-digit')"
                  required
                />
              </div>
            </fieldset>
          </div>

          <!-- STANDARD UNLOCK SCREEN (Offers choice between PIN or Old Password) -->
          <div v-else style="display: flex; flex-direction: column; gap: 1rem;">
            
            <!-- Segmented Control method selection -->
            <div style="display: flex; margin-bottom: 0.5rem; background: rgba(0,0,0,0.15); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.25rem;">
              <button 
                type="button" 
                :class="['btn', authMethod === 'pin' ? 'btn-primary' : 'btn-secondary']"
                style="flex: 1; padding: 0.45rem; font-size: 0.85rem; border: none; border-radius: var(--radius-sm); gap: 0.25rem;"
                @click="authMethod = 'pin'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                {{ t('auth.authMethodPin') }}
              </button>
              <button 
                type="button" 
                :class="['btn', authMethod === 'password' ? 'btn-primary' : 'btn-secondary']"
                style="flex: 1; padding: 0.45rem; font-size: 0.85rem; border: none; border-radius: var(--radius-sm); gap: 0.25rem;"
                @click="authMethod = 'password'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                {{ t('auth.authMethodPassword') }}
              </button>
            </div>

            <!-- PIN INPUT METHOD (Auto-submits when 4th digit entered) -->
            <div v-if="authMethod === 'pin'">
              <fieldset class="form-fieldset" style="border: none !important; background: transparent !important; padding: 0 !important; box-shadow: none !important;">
                <legend style="text-align: center; margin-bottom: 0.5rem; width: 100%;">{{ t('auth.pinPlaceholder') }}</legend>
                <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 0.5rem; margin-bottom: 0.5rem;">
                  <input
                    v-for="(digit, index) in 4"
                    :key="index"
                    :id="`pin-digit-${index}`"
                    type="password"
                    v-model="pinDigits[index]"
                    maxlength="1"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    class="pin-input pin-input-large"
                    @input="handlePinInput(index, $event, false, 'pin-digit')"
                    @keydown="handlePinKeydown(index, $event, false, 'pin-digit')"
                    @paste="handlePinPaste($event, false, 'pin-digit')"
                    required
                  />
                </div>
              </fieldset>
            </div>

            <!-- LEGACY PASSWORD METHOD -->
            <div v-else>
              <fieldset class="form-fieldset">
                <legend>{{ t('auth.passwordPlaceholder') }}</legend>
                <input 
                  type="password" 
                  v-model="password" 
                  :placeholder="t('auth.passwordPlaceholder')"
                  required
                  autofocus
                />
              </fieldset>
            </div>

          </div>
          
          <div v-if="errorMsg" style="color: #ef4444; margin-top: 0.25rem; font-size: 0.85rem; text-align: center; font-weight: 500;">
            {{ errorMsg }}
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem;">
            <!-- Unlock button shown explicitly for legacy password or whenever loading is active. If PIN is selected, it can also auto-submit on typing the 4th digit. -->
            <button 
              type="submit" 
              class="btn btn-primary" 
              style="width: 100%;"
              :disabled="loading"
            >
              {{ loading ? '...' : (status === 'locked' ? t('auth.unlockBtn') : t('auth.encryptSaveBtn')) }}
            </button>
            
            <button 
              type="button" 
              class="btn btn-secondary" 
              style="width: 100%;"
              @click="isCreatingProfile = true"
              :disabled="loading"
            >
              {{ t('auth.createProfileBtn') }}
            </button>
          </div>
        </form>
        
        <div v-if="status === 'new_setup' || status === 'migration_needed'" style="margin-top: 1.5rem; font-size: 0.75rem; color: var(--text-secondary);">
          {{ t('auth.warningNoRecover') }}
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject, watch } from 'vue';
import { repository } from '../services/indexedDbRepository';
import { useAuth } from '../composables/useAuth';

const { t } = inject('i18n');
const { 
  activeProfile, 
  profilesList, 
  setActiveProfile, 
  addProfile, 
  deleteProfile 
} = useAuth();

const password = ref('');
const confirmPassword = ref('');
const newProfileName = ref('');
const selectedProfile = ref(activeProfile.value);

const pinDigits = ref(['', '', '', '']);
const confirmPinDigits = ref(['', '', '', '']);

const authMethod = ref('pin'); // 'pin' or 'password'
const isCreatingProfile = ref(false);
const errorMsg = ref('');
const status = ref('locked');
const loading = ref(true);

onMounted(async () => {
  await fetchAuthStatus();
});

// Watch database active profile changes and reload state automatically
watch(activeProfile, async (newVal) => {
  selectedProfile.value = newVal;
  await fetchAuthStatus();
});

// Watch local selector changes to trigger global activeProfile updates
watch(selectedProfile, (newVal) => {
  if (newVal !== activeProfile.value) {
    setActiveProfile(newVal);
  }
});

// Auto-focus first digit of PIN when switching login method
watch(authMethod, (newVal) => {
  if (newVal === 'pin') {
    setTimeout(() => {
      const firstInput = document.getElementById('pin-digit-0');
      if (firstInput) firstInput.focus();
    }, 50);
  }
});

function clearFormInputs() {
  password.value = '';
  confirmPassword.value = '';
  newProfileName.value = '';
  pinDigits.value = ['', '', '', ''];
  confirmPinDigits.value = ['', '', '', ''];
}

async function fetchAuthStatus() {
  loading.value = true;
  errorMsg.value = '';
  clearFormInputs();
  try {
    const res = await repository.checkAuthStatus();
    status.value = res.status;
    
    // Auto focus PIN or password input when status is fetched
    setTimeout(() => {
      if (status.value === 'new_setup' || status.value === 'migration_needed') {
        const firstInput = document.getElementById('setup-pin-digit-0');
        if (firstInput) firstInput.focus();
      } else if (authMethod.value === 'pin') {
        const firstInput = document.getElementById('pin-digit-0');
        if (firstInput) firstInput.focus();
      }
    }, 100);
  } catch (e) {
    console.error("Failed to check auth status", e);
  } finally {
    loading.value = false;
  }
}

function updatePasswordValue(digits, isConfirm) {
  const fullPin = digits.join('');
  if (isConfirm) {
    confirmPassword.value = fullPin;
  } else {
    password.value = fullPin;
  }
}

function focusNextPinDigit(sanitized, index, idPrefix) {
  if (!sanitized) return;
  if (index >= 3) return;
  const nextInput = document.getElementById(`${idPrefix}-${index + 1}`);
  if (nextInput) {
    nextInput.focus();
  }
}

function shouldAutoSubmitPin(isConfirm, fullPin, idPrefix) {
  if (isConfirm) return false;
  if (fullPin.length !== 4) return false;
  if (idPrefix !== 'pin-digit') return false;
  if (status.value !== 'locked') return false;
  return true;
}

// Custom input, backspace and copy-paste handling for Multi-Input PIN Boxes
function handlePinInput(index, event, isConfirm = false, idPrefix = 'pin-digit') {
  const digits = isConfirm ? confirmPinDigits.value : pinDigits.value;
  const val = event.target.value;
  
  // Keep only numeric characters and grab the last digit
  const sanitized = val.replaceAll(/\D/g, '').slice(-1);
  digits[index] = sanitized;
  
  updatePasswordValue(digits, isConfirm);

  // Auto-focus next field
  focusNextPinDigit(sanitized, index, idPrefix);

  // Auto-submit login on standard PIN unlock screen when 4th digit is input
  const fullPin = digits.join('');
  if (shouldAutoSubmitPin(isConfirm, fullPin, idPrefix)) {
    submitPassword();
  }
}

function handlePinKeydown(index, event, isConfirm = false, idPrefix = 'pin-digit') {
  if (event.key !== 'Backspace') return;

  const digits = isConfirm ? confirmPinDigits.value : pinDigits.value;
  if (!digits[index] && index > 0) {
    // Focus previous and clear it
    const prevInput = document.getElementById(`${idPrefix}-${index - 1}`);
    if (prevInput) {
      prevInput.focus();
      digits[index - 1] = '';
      updatePasswordValue(digits, isConfirm);
    }
  } else {
    // Clear current
    digits[index] = '';
    updatePasswordValue(digits, isConfirm);
  }
}

function handlePinPaste(event, isConfirm = false, idPrefix = 'pin-digit') {
  event.preventDefault();
  const digits = isConfirm ? confirmPinDigits.value : pinDigits.value;
  const pasteData = event.clipboardData.getData('text').trim().slice(0, 4);
  if (/^\d{1,4}$/.test(pasteData)) {
    const arr = pasteData.split('');
    for (let i = 0; i < 4; i++) {
      digits[i] = arr[i] || '';
    }
    const fullPin = digits.join('');
    if (isConfirm) {
      confirmPassword.value = fullPin;
    } else {
      password.value = fullPin;
    }
    
    // Focus last filled or next input
    const focusIndex = Math.min(pasteData.length, 3);
    const focusInput = document.getElementById(`${idPrefix}-${focusIndex}`);
    if (focusInput) {
      focusInput.focus();
    }
    
    // Auto-submit login if 4 digits pasted
    if (!isConfirm && fullPin.length === 4 && idPrefix === 'pin-digit' && status.value === 'locked') {
      submitPassword();
    }
  }
}

async function submitPassword() {
  if (!password.value) return;
  
  loading.value = true;
  errorMsg.value = '';
  
  // Enforce 4-digit PIN for new setups/migrations
  if (status.value === 'new_setup' || status.value === 'migration_needed') {
    if (!/^\d{4}$/.test(password.value)) {
      errorMsg.value = t('auth.pinRequired');
      loading.value = false;
      return;
    }
    if (password.value !== confirmPassword.value) {
      errorMsg.value = t('auth.passwordMismatch');
      loading.value = false;
      return;
    }
  }
  
  try {
    const success = await repository.authenticate(password.value);
    if (!success) {
      errorMsg.value = t('auth.incorrectPassword');
      // If unlock failed with PIN, clear the pin input fields
      if (status.value === 'locked' && authMethod.value === 'pin') {
        pinDigits.value = ['', '', '', ''];
        password.value = '';
        setTimeout(() => {
          const firstInput = document.getElementById('pin-digit-0');
          if (firstInput) firstInput.focus();
        }, 100);
      }
    }
  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    loading.value = false;
  }
}

async function submitNewProfile() {
  const trimmedName = newProfileName.value.trim();
  if (!trimmedName || !password.value) return;
  
  // Enforce 4-digit PIN for brand new profiles
  if (!/^\d{4}$/.test(password.value)) {
    errorMsg.value = t('auth.pinRequired');
    return;
  }
  
  if (password.value !== confirmPassword.value) {
    errorMsg.value = t('auth.passwordMismatch');
    return;
  }
  
  if (profilesList.value.includes(trimmedName)) {
    errorMsg.value = t('auth.profileExists');
    return;
  }
  
  loading.value = true;
  errorMsg.value = '';
  
  try {
    // 1. Add the profile and switch to it
    const profileAdded = addProfile(trimmedName);
    
    if (profileAdded) {
      // 2. Set password & initialize DB
      const success = await repository.authenticate(password.value);
      if (success) {
        // Successful login & initialization of new dynamic profile db
        clearFormInputs();
        isCreatingProfile.value = false;
      } else {
        errorMsg.value = "Failed to encrypt the profile database.";
      }
    } else {
      errorMsg.value = "Could not add profile.";
    }
  } catch (error) {
    errorMsg.value = error.message;
  } finally {
    loading.value = false;
  }
}

function cancelCreateProfile() {
  isCreatingProfile.value = false;
  errorMsg.value = '';
  clearFormInputs();
  // Auto focus PIN first input
  setTimeout(() => {
    if (authMethod.value === 'pin') {
      const firstInput = document.getElementById('pin-digit-0');
      if (firstInput) firstInput.focus();
    }
  }, 100);
}

async function handleDeleteProfile(pName) {
  if (pName === 'default') return;
  
  const confirmed = confirm(t('auth.confirmDeleteProfile', { name: pName }));
  if (confirmed) {
    loading.value = true;
    try {
      await deleteProfile(pName);
    } catch (e) {
      console.error("Failed to delete profile", e);
    } finally {
      loading.value = false;
    }
  }
}
</script>

<style scoped>
/* Increase selector specificity to override style.css's '.form-fieldset input' which enforces 'border: none !important' */
.form-fieldset input.pin-input {
  width: 2.75rem !important;
  height: 3.25rem !important;
  text-align: center !important;
  font-size: 1.5rem !important;
  font-weight: bold !important;
  border-radius: var(--radius-sm) !important;
  border: 1px solid rgba(255, 255, 255, 0.22) !important; /* Forces visible border */
  background: rgba(0, 0, 0, 0.25) !important; /* Forces darker visible background */
  color: var(--text-primary) !important;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  outline: none !important;
}

.form-fieldset input.pin-input:focus {
  border-color: var(--primary-accent) !important;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25) !important;
  background: rgba(0, 0, 0, 0.4) !important;
}

.form-fieldset input.pin-input-large {
  width: 3.25rem !important;
  height: 3.5rem !important;
  font-size: 1.75rem !important;
}
</style>
