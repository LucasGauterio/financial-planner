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
              <span class="control-label">&nbsp;</span>
              <a href="#" @click.prevent="activeTab = 'privacy'" class="privacy-link" :class="{ active: activeTab === 'privacy' }" :title="t('tabs.privacy')">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px; margin-top: -2px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                {{ t('tabs.privacy') }}
              </a>
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
        <div class="tab-dropdown" ref="simDropdownRef">
          <button
            class="btn"
            :class="simulationTabs.includes(activeTab) ? 'btn-primary' : 'btn-secondary'"
            @click="simDropdownOpen = !simDropdownOpen"
          >
            {{ t('tabs.simulations') }}
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="tab-dropdown-chevron" :class="{ open: simDropdownOpen }"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <transition name="dropdown-fade">
            <div v-if="simDropdownOpen" class="tab-dropdown-menu">
              <button
                class="tab-dropdown-item"
                :class="{ active: activeTab === 'gap' }"
                @click="selectSimulation('gap')"
              >
                {{ t('tabs.timeGap') }}
              </button>
              <button
                class="tab-dropdown-item"
                :class="{ active: activeTab === 'past' }"
                @click="selectSimulation('past')"
              >
                {{ t('tabs.past') }}
              </button>
              <button
                class="tab-dropdown-item"
                :class="{ active: activeTab === 'goal' }"
                @click="selectSimulation('goal')"
              >
                {{ t('tabs.goal') }}
              </button>
            </div>
          </transition>
        </div>
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
          :class="activeTab === 'income' ? 'btn-primary' : 'btn-secondary'"
          @click="activeTab = 'income'"
        >
          {{ t('tabs.income') }}
        </button>
      </div>

      <transition name="fade" mode="out-in">
        <TimeGapComparator v-if="activeTab === 'gap'" />
        <PastInvestmentSimulator v-else-if="activeTab === 'past'" />
        <GoalCalculator v-else-if="activeTab === 'goal'" />
        <PortfolioTracker v-else-if="activeTab === 'portfolio'" />
        <InvestmentTimeline v-else-if="activeTab === 'timeline'" />
        <LoanTracker v-else-if="activeTab === 'loans'" />
        <IncomeTracker v-else-if="activeTab === 'income'" />
        <PrivacyPolicy v-else-if="activeTab === 'privacy'" />
      </transition>
      
      <BackupManager v-if="showBackup" @close="showBackup = false" />
    </div>
  </div>
</template>

<script setup>
import { ref, provide, watch, onMounted, onUnmounted } from 'vue';
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
import IncomeTracker from './components/IncomeTracker.vue';
import PrivacyPolicy from './components/PrivacyPolicy.vue';

const i18n = useI18n();
const { t, locale, currency, setLocale, setCurrency } = i18n;
const { isUnlocked, lock } = useAuth();

// Provide universally for deep descendants if needed organically natively
provide('i18n', i18n);

const activeTab = ref(localStorage.getItem('fp_activeTab') || 'gap');
const showBackup = ref(false);

const simulationTabs = ['gap', 'past', 'goal'];
const simDropdownOpen = ref(false);
const simDropdownRef = ref(null);

function selectSimulation(tab) {
  activeTab.value = tab;
  simDropdownOpen.value = false;
}

function handleClickOutside(event) {
  if (simDropdownRef.value && !simDropdownRef.value.contains(event.target)) {
    simDropdownOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

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

.privacy-link {
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background-color: rgba(255, 255, 255, 0.01);
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

.privacy-link:hover {
  color: var(--primary-accent);
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.08);
}

.privacy-link.active {
  color: var(--primary-accent);
  background-color: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.2);
  font-weight: 600;
}

.tab-dropdown {
  position: relative;
  display: inline-flex;
}

.tab-dropdown-chevron {
  transition: transform 0.2s ease;
}

.tab-dropdown-chevron.open {
  transform: rotate(180deg);
}

.tab-dropdown-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  min-width: 100%;
  display: flex;
  flex-direction: column;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.45);
  padding: 0.35rem;
  gap: 0.15rem;
  z-index: 20;
}

.tab-dropdown-item {
  white-space: nowrap;
  text-align: left;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.55rem 0.85rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.tab-dropdown-item:hover {
  background-color: rgba(255, 255, 255, 0.06);
}

.tab-dropdown-item.active {
  color: var(--primary-accent);
  background-color: rgba(16, 185, 129, 0.12);
  font-weight: 600;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
