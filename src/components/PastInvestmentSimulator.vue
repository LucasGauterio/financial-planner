<template>
  <div class="card">
    <h2>{{ t('past.title') }}</h2>
    <p>{{ t('past.subtitle') }}</p>
    
    <div class="grid-2" style="margin-top: 1.5rem;">
      <div>
        <div class="form-group">
          <label>{{ t('past.startYear') }}</label>
          <input type="number" v-model="startYear" min="1900" :max="currentYear" step="1" @input="startYear = startYear > currentYear ? currentYear : startYear" />
          <span v-if="startYear && startYear < 1900" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
            ⚠️ {{ t('validation.minYear') }}
          </span>
          <span v-if="startYear && startYear > currentYear" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
            ⚠️ {{ t('validation.maxYear') }}
          </span>
        </div>
        <div class="form-group">
          <label>{{ t('past.initialAmount') }} ({{ currency }})</label>
          <input type="number" v-model="principal" min="0" max="999999999999999" step="0.01" @input="principal = principal > 999999999999999 ? 999999999999999 : principal" />
          <span v-if="principal > 999999999999999" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
            ⚠️ {{ t('validation.maxLimit') }}
          </span>
        </div>
        <div class="form-group">
          <label>{{ t('past.startingApport') }} ({{ currency }})</label>
          <input type="number" v-model="monthlyContribution" min="0" max="999999999999999" step="0.01" @input="monthlyContribution = monthlyContribution > 999999999999999 ? 999999999999999 : monthlyContribution" />
          <span v-if="monthlyContribution > 999999999999999" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
            ⚠️ {{ t('validation.maxLimit') }}
          </span>
        </div>
        <div class="form-group">
          <label>{{ t('past.annualIncrease') }}</label>
          <input type="number" v-model="annualIncrease" min="0" max="100" step="0.01" @input="annualIncrease = annualIncrease > 100 ? 100 : annualIncrease" />
          <span v-if="annualIncrease >= 100" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
            ⚠️ {{ t('validation.maxRate') }}
          </span>
        </div>
        <div class="form-group">
          <label>{{ t('past.annualRate') }}</label>
          <input type="number" v-model="annualRate" min="0" max="100" step="0.01" @input="annualRate = annualRate > 100 ? 100 : annualRate" />
          <span v-if="annualRate >= 100" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
            ⚠️ {{ t('validation.maxRate') }}
          </span>
        </div>
      </div>
      
      <div class="flex-center">
        <div class="metric">
          <span class="metric-label">{{ t('past.today') }}</span>
          <span class="metric-value">{{ formattedResult }}</span>
          
          <div style="height: 1rem;"></div>
          
          <span class="metric-label">{{ t('past.totalInv') }}</span>
          <span class="metric-value small">{{ formattedInvested }}</span>
          
          <div style="height: 1rem;"></div>
          
          <span class="metric-label">{{ t('past.totalYield') }}</span>
          <span class="metric-value small" style="color: var(--primary-accent)">{{ formattedYield }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { calculateCompoundInterest } from '../services/financialCalculations';

const { t, formatCurrency, currency } = inject('i18n');

const currentYear = new Date().getFullYear();
const startYear = ref(2009);
const principal = ref(0);
const monthlyContribution = ref(1000);
const annualIncrease = ref(0);
const annualRate = ref(12);

const result = computed(() => {
  const sYear = Number(startYear.value);
  if (isNaN(sYear) || sYear < 1900) return 0;
  const months = (currentYear - sYear) * 12;
  const monthlyRate = (annualRate.value / 100) / 12;
  
  if (months <= 0) return principal.value;
  return calculateCompoundInterest(principal.value, monthlyContribution.value, monthlyRate, months, annualIncrease.value);
});

const totalInvested = computed(() => {
  const sYear = Number(startYear.value);
  if (isNaN(sYear) || sYear < 1900) return 0;
  const months = Math.max(0, (currentYear - sYear) * 12);
  // Re-use logic passing 0 interest rate to calculate physical contributions
  return calculateCompoundInterest(principal.value, monthlyContribution.value, 0, months, annualIncrease.value);
});

const formattedResult = computed(() => {
  return formatCurrency(result.value);
});

const formattedInvested = computed(() => {
  return formatCurrency(totalInvested.value);
});

const formattedYield = computed(() => {
  const yieldAmount = result.value - totalInvested.value;
  return formatCurrency(Math.max(0, yieldAmount));
});
</script>
