<template>
  <div class="app-container">
    <LockScreen v-if="!isUnlocked" />
    
    <div v-else>
      <header class="app-header">
        <div class="header-content">
          <div class="brand-section">
            <h1 class="brand-title">
              {{ t('header.title') }}
            </h1>
            <p class="brand-subtitle">{{ t('header.subtitle') }}</p>
          </div>
          <div class="controls-section">
            <div class="control-group">
              <label class="control-label" for="lang-select">{{ t('settings.language') }}</label>
              <select id="lang-select" :value="locale" @change="setLocale($event.target.value)" class="control-select">
                <option value="en-US">{{ t('settings.languageEn') }}</option>
                <option value="pt-BR">{{ t('settings.languagePt') }}</option>
              </select>
            </div>
            <div class="control-group">
              <label class="control-label" for="curr-select">{{ t('settings.currency') }}</label>
              <select id="curr-select" :value="currency" @change="setCurrency($event.target.value)" class="control-select">
                <option value="BRL">R$ (BRL)</option>
                <option value="USD">$ (USD)</option>
              </select>
            </div>
            <div class="control-group">
              <span class="control-label">Security</span>
              <div class="security-buttons">
                <button class="btn btn-secondary btn-icon" @click="showBackup = true" title="Backup / Restore">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                </button>
                <button class="btn btn-secondary btn-icon" @click="lock" title="Lock App">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div class="tabs">
        <button 
          class="btn" 
          :class="activeTab === 'gap' ? 'btn-primary' : 'btn-secondary'"
          @click="activeTab = 'gap'"
        >
          {{ t('tabs.timeGap') }}
        </button>
        <button 
          class="btn" 
          :class="activeTab === 'past' ? 'btn-primary' : 'btn-secondary'"
          @click="activeTab = 'past'"
        >
          {{ t('tabs.past') }}
        </button>
        <button 
          class="btn" 
          :class="activeTab === 'goal' ? 'btn-primary' : 'btn-secondary'"
          @click="activeTab = 'goal'"
        >
          {{ t('tabs.goal') }}
        </button>
        <button 
          class="btn" 
          :class="activeTab === 'portfolio' ? 'btn-primary' : 'btn-secondary'"
          @click="activeTab = 'portfolio'"
        >
          {{ t('tabs.portfolio') }}
        </button>
        <button 
          class="btn" 
          :class="activeTab === 'timeline' ? 'btn-primary' : 'btn-secondary'"
          @click="activeTab = 'timeline'"
        >
          {{ t('tabs.timeline') }}
        </button>
        <button 
          class="btn" 
          :class="activeTab === 'loans' ? 'btn-primary' : 'btn-secondary'"
          @click="activeTab = 'loans'"
        >
          {{ t('tabs.loans') }}
        </button>
        <button 
          class="btn" 
          :class="activeTab === 'privacy' ? 'btn-primary' : 'btn-secondary'"
          @click="activeTab = 'privacy'"
        >
          {{ t('tabs.privacy') }}
        </button>
      </div>

      <transition name="fade" mode="out-in">
        <TimeGapComparator v-if="activeTab === 'gap'" />
        <PastInvestmentSimulator v-else-if="activeTab === 'past'" />
        <GoalCalculator v-else-if="activeTab === 'goal'" />
        <PortfolioTracker v-else-if="activeTab === 'portfolio'" />
        <InvestmentTimeline v-else-if="activeTab === 'timeline'" />
        <LoanTracker v-else-if="activeTab === 'loans'" />
        <PrivacyPolicy v-else-if="activeTab === 'privacy'" />
      </transition>
      
      <BackupManager v-if="showBackup" @close="showBackup = false" />
    </div>
  </div>
</template>

<script setup>
import { ref, provide, watch } from 'vue';
import { useI18n } from './composables/useI18n';
import { useAuth } from './composables/useAuth';
import PortfolioTracker from './components/PortfolioTracker.vue';
import InvestmentTimeline from './components/InvestmentTimeline.vue';
import GoalCalculator from './components/GoalCalculator.vue';
import PastInvestmentSimulator from './components/PastInvestmentSimulator.vue';
import TimeGapComparator from './components/TimeGapComparator.vue';
import LockScreen from './components/LockScreen.vue';
import BackupManager from './components/BackupManager.vue';
import LoanTracker from './components/LoanTracker.vue';
import PrivacyPolicy from './components/PrivacyPolicy.vue';

const i18n = useI18n();
const { t, locale, currency, setLocale, setCurrency } = i18n;
const { isUnlocked, lock } = useAuth();

// Provide universally for deep descendants if needed organically natively
provide('i18n', i18n);

const activeTab = ref(localStorage.getItem('fp_activeTab') || 'gap');
const showBackup = ref(false);

// Persist tab state dynamically whenever structurally altered across boundaries
watch(activeTab, (newTab) => {
  localStorage.setItem('fp_activeTab', newTab);
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
