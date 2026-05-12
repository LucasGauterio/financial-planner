<template>
  <div class="card">
    <h2>{{ t('timegap.title') }}</h2>
    <p>{{ t('timegap.subtitle') }}</p>
    
    <div class="grid-2" style="margin-top: 1.5rem;">
      <div>
        <div class="form-group">
          <label>{{ t('timegap.targetAmount') }} ({{ currency }})</label>
          <input type="number" v-model="targetAmount" min="0" max="999999999999999" step="0.01" @input="targetAmount = targetAmount > 999999999999999 ? 999999999999999 : targetAmount" />
          <span v-if="targetAmount > 999999999999999" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
            ⚠️ {{ t('validation.maxLimit') }}
          </span>
        </div>
        <div class="form-group">
          <label>{{ t('timegap.goalEndYear') }}</label>
          <input type="number" v-model="endYear" min="1900" max="2200" step="1" @input="endYear = endYear > 2200 ? 2200 : endYear" />
          <span v-if="endYear && endYear < 1900" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
            ⚠️ {{ t('validation.minYear') }}
          </span>
          <span v-else-if="endYear && endYear > 2200" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
            ⚠️ {{ t('validation.maxYear') }}
          </span>
        </div>
        <div class="form-group">
          <label>{{ t('timegap.earlyStart') }}</label>
          <input type="number" v-model="earlyStartYear" min="1900" :max="currentYear" step="1" @input="earlyStartYear = earlyStartYear > currentYear ? currentYear : earlyStartYear" />
          <span v-if="earlyStartYear && earlyStartYear < 1900" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
            ⚠️ {{ t('validation.minYear') }}
          </span>
          <span v-if="earlyStartYear && earlyStartYear > currentYear" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
            ⚠️ {{ t('validation.maxYear') }}
          </span>
        </div>
        <div class="form-group">
          <label>{{ t('timegap.annualReturn') }}</label>
          <input type="number" v-model="annualRate" min="0" max="100" step="0.01" @input="annualRate = annualRate > 100 ? 100 : annualRate" />
          <span v-if="annualRate >= 100" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
            ⚠️ {{ t('validation.maxRate') }}
          </span>
        </div>
      </div>
      
      <div class="flex-center" style="align-items: stretch; height: 100%;">
        <div class="card" style="width: 100%; display: flex; flex-direction: column; background: rgba(0,0,0,0.2); border: none; padding: 1.5rem; justify-content: space-between;">
          <div>
            <h4 style="color: var(--primary-accent); margin-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">{{ t('timegap.scenarioA', { year: earlyStartYear }) }}</h4>
            <div class="metric" style="margin-bottom: 1rem;">
              <span class="metric-label">{{ t('timegap.reqPMT') }}</span>
              <span class="metric-value small">{{ formatCurrency(earlyPmt) }}</span>
            </div>
            
            <div class="metric">
              <span class="metric-label">{{ t('timegap.todayYield') }}</span>
              <span class="metric-value small" style="color: var(--text-primary); font-size: 1.5rem;">{{ formatCurrency(yieldIfStartedEarly) }}</span>
            </div>
          </div>
          
          <div style="margin-top: 2rem;">
            <h4 style="color: var(--secondary-accent); margin-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">{{ t('timegap.scenarioB', { year: currentYear }) }}</h4>
            <div class="metric">
              <span class="metric-label">{{ t('timegap.reqPMT') }}</span>
              <span class="metric-value small" style="color: var(--secondary-accent);">{{ formatCurrency(currentPmt) }}</span>
            </div>
          </div>
          
          <div style="margin-top: 2rem; padding-top: 1rem; border-top: 2px dashed rgba(255,255,255,0.1);">
            <div class="metric">
              <span class="metric-label">{{ t('timegap.costWait') }}</span>
              <p style="font-size: 0.9rem; color: #f87171; line-height: 1.4; margin-top: 0.5rem;" v-html="t('timegap.costDesc', { 
                  year: earlyStartYear,
                  multiplier: '<strong style=\'color: #fff;\'>' + payloadGapMultiplier + '</strong>',
                  diff: formatCurrency(currentPmt - earlyPmt)
                })">
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { calculateRequiredMonthlyContribution, calculateCompoundInterest } from '../services/financialCalculations';

const { t, formatCurrency, currency } = inject('i18n');

const currentYear = new Date().getFullYear();
const targetAmount = ref(1000000); 
const endYear = ref(2045);
const earlyStartYear = ref(2015);
const annualRate = ref(10);

const earlyPmt = computed(() => {
  const eYear = Number(endYear.value);
  const esYear = Number(earlyStartYear.value);
  if (isNaN(eYear) || eYear < 1900 || isNaN(esYear) || esYear < 1900 || eYear <= esYear) return 0;
  
  const months = (eYear - esYear) * 12;
  const monthlyRate = (annualRate.value / 100) / 12;
  if (months <= 0) return 0;
  return calculateRequiredMonthlyContribution(targetAmount.value, 0, monthlyRate, months);
});

const currentPmt = computed(() => {
  const eYear = Number(endYear.value);
  if (isNaN(eYear) || eYear < 1900 || eYear <= currentYear) return 0;
  
  const months = (eYear - currentYear) * 12;
  const monthlyRate = (annualRate.value / 100) / 12;
  if (months <= 0) return 0;
  return calculateRequiredMonthlyContribution(targetAmount.value, 0, monthlyRate, months);
});

const yieldIfStartedEarly = computed(() => {
  const esYear = Number(earlyStartYear.value);
  if (isNaN(esYear) || esYear < 1900 || esYear >= currentYear) return 0;
  
  const elapsedMonthsSinceEarly = (currentYear - esYear) * 12;
  const monthlyRate = (annualRate.value / 100) / 12;
  if (elapsedMonthsSinceEarly <= 0) return 0;
  return calculateCompoundInterest(0, earlyPmt.value, monthlyRate, elapsedMonthsSinceEarly);
});

const payloadGapMultiplier = computed(() => {
  if (earlyPmt.value === 0) return 0;
  return (currentPmt.value / earlyPmt.value).toFixed(1);
});
</script>
