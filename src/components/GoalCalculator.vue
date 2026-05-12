<template>
  <div class="card">
    <h2>{{ t('goal.title') }}</h2>
    <p>{{ t('goal.subtitle') }}</p>
    
    <div class="grid-2" style="margin-top: 1.5rem;">
      <div>
        <div class="form-group">
          <label>{{ t('goal.targetAmount') }} ({{ currency }})</label>
          <input type="number" v-model="targetAmount" min="0" max="999999999999999" step="0.01" @input="targetAmount = targetAmount > 999999999999999 ? 999999999999999 : targetAmount" />
          <span v-if="targetAmount > 999999999999999" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
            ⚠️ {{ t('validation.maxLimit') }}
          </span>
        </div>
        <div class="form-group">
          <label>{{ t('goal.principal') }} ({{ currency }})</label>
          <input type="number" v-model="principal" min="0" max="999999999999999" step="0.01" @input="principal = principal > 999999999999999 ? 999999999999999 : principal" />
          <span v-if="principal > 999999999999999" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
            ⚠️ {{ t('validation.maxLimit') }}
          </span>
        </div>
        <div class="form-group">
          <label>{{ t('goal.timeHorizon') }}</label>
          <input type="number" v-model="years" min="1" max="100" step="1" @input="years = years > 100 ? 100 : years" />
        </div>
        <div class="form-group">
          <label>{{ t('goal.annualReturn') }}</label>
          <input type="number" v-model="annualRate" min="0" max="100" step="0.01" @input="annualRate = annualRate > 100 ? 100 : annualRate" />
          <span v-if="annualRate >= 100" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
            ⚠️ {{ t('validation.maxRate') }}
          </span>
        </div>
        <div class="form-group">
          <label>{{ t('goal.annualIncrease') }}</label>
          <input type="number" v-model="annualIncrease" min="0" max="100" step="0.01" @input="annualIncrease = annualIncrease > 100 ? 100 : annualIncrease" />
          <span v-if="annualIncrease >= 100" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
            ⚠️ {{ t('validation.maxRate') }}
          </span>
        </div>
      </div>
      
      <div class="flex-center">
        <div class="metric">
          <span class="metric-label">{{ t('goal.reqPMT') }}</span>
          <span class="metric-value" style="color: var(--secondary-accent)">
            {{ formattedPMT }}
          </span>
          
          <div style="height: 1rem;"></div>
          
          <span class="metric-label">{{ t('goal.totalInv') }}</span>
          <span class="metric-value small">{{ formattedInvested }}</span>
          
          <div style="height: 1rem;"></div>
          
          <span class="metric-label">{{ t('goal.totalYield') }}</span>
          <span class="metric-value small" style="color: var(--primary-accent)">{{ formattedYield }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { calculateRequiredMonthlyContribution, calculateCompoundInterest } from '../services/financialCalculations';

const { t, formatCurrency, currency } = inject('i18n');

const targetAmount = ref(1000000); // 1 Million
const principal = ref(10000);
const years = ref(20);
const annualRate = ref(10);
const annualIncrease = ref(0);

const requiredPMT = computed(() => {
  const months = years.value * 12;
  const monthlyRate = (annualRate.value / 100) / 12;
  
  if (months <= 0) return 0;
  return calculateRequiredMonthlyContribution(targetAmount.value, principal.value, monthlyRate, months, annualIncrease.value);
});

const totalInvested = computed(() => {
  if (annualIncrease.value === 0) {
    return principal.value + (requiredPMT.value * (years.value * 12));
  }
  // With increases, we use the 0% interest engine dynamically
  return calculateCompoundInterest(principal.value, requiredPMT.value, 0, years.value * 12, annualIncrease.value);
});

const formattedPMT = computed(() => {
  return formatCurrency(requiredPMT.value);
});

const formattedInvested = computed(() => {
  return formatCurrency(totalInvested.value);
});

const formattedYield = computed(() => {
  const yieldAmount = targetAmount.value - totalInvested.value;
  return formatCurrency(Math.max(0, yieldAmount)).replace(/^[-+]/,""); // Simplified, formatCurrency inherently includes the sign securely 
});
</script>
