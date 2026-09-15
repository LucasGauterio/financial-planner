<template>
  <div class="cash-flow-container">
    <div class="section-header">
      <div>
        <h2 class="section-title">{{ t('cashFlow.title') }}</h2>
        <p class="section-subtitle">{{ t('cashFlow.subtitle') }}</p>
      </div>
    </div>

    <div class="horizon-ruler-container">
      <div class="horizon-ruler-header">
        <span class="horizon-ruler-label">{{ t('cashFlow.horizon') }}</span>
        <div class="horizon-ruler-badge">
          {{ t('cashFlow.horizonMonths', { months: horizonMonths }) }} / {{ horizonEndLabel }}
        </div>
      </div>

      <div class="ruler-wrapper">
        <input
          type="range"
          id="cashflow-horizon-ruler"
          v-model.number="horizonMonths"
          min="1"
          max="420"
          step="1"
          class="ruler-slider"
        />
        <div class="ruler-ticks">
          <span v-for="tick in horizonTicks" :key="tick">
            <span class="ruler-tick-mark"></span>
            {{ currentYear + tick / 12 }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="incomeSources.length === 0 && expenseSources.length === 0" class="card empty-state">
      <h3>{{ t('cashFlow.empty') }}</h3>
    </div>

    <div v-else>
      <div v-if="projectionGroups.length === 0" class="card empty-state">
        <h3>{{ t('cashFlow.emptyProjection') }}</h3>
      </div>

      <div v-for="yearGroup in projectionGroups" :key="yearGroup.year" style="margin-bottom: 2rem;">
        <h4 class="year-heading">{{ yearGroup.year }}</h4>

        <div v-for="monthGroup in yearGroup.months" :key="monthGroup.month" class="month-block">
          <div class="month-block-header">
            <span class="month-label">{{ monthGroup.label }}</span>
            <span class="month-totals">
              <span class="total-received">{{ t('income.status.received') }}: {{ formatCurrency(monthGroup.totals.received) }}</span>
              <span class="total-paid">{{ t('expenses.status.paid') }}: {{ formatCurrency(monthGroup.totals.paid) }}</span>
              <span class="total-pending">{{ t('income.pending') }}: {{ formatCurrency(monthGroup.totals.pending) }}</span>
              <strong class="total-net" :class="{ negative: monthGroup.totals.net < 0 }">{{ t('cashFlow.net') }}: {{ formatCurrency(monthGroup.totals.net) }}</strong>
            </span>
          </div>

          <div v-for="entry in monthGroup.entries" :key="`${entry.kind}_${entry.sourceId}_${entry.month}`" class="cash-flow-entry-row">
            <div class="entry-info">
              <span class="kind-badge" :class="entry.kind">{{ t(`cashFlow.kind.${entry.kind}`) }}</span>
              <strong>{{ entry.name }}</strong>
              <span class="entry-type">{{ entry.type }}</span>
            </div>
            <div class="entry-right">
              <template v-if="entry.status !== 'pending'">
                <span class="actual-amount-label">{{ t(entry.kind === 'income' ? 'income.actualAmount' : 'expenses.actualAmount') }}:</span>
                <input
                  type="number"
                  class="actual-amount-input"
                  :value="displayActualAmount(entry)"
                  @input="setActualAmount(entry, $event.target.value)"
                  @blur="persistEntry(entry)"
                  step="0.01"
                  max="999999999999999"
                />
              </template>
              <span v-else class="entry-amount">{{ formatCurrency(entry.amount) }}</span>
              <button
                class="btn-toggle-status"
                :class="entry.status"
                @click="toggleStatus(entry)"
              >
                {{ statusLabel(entry) }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { repository } from '../services/indexedDbRepository';
import { buildCashFlowEntries, calculateCombinedMonthlyTotals } from '../services/cashFlowCalculations';

const { t, formatCurrency, locale } = inject('i18n');

const incomeSources = ref([]);
const expenseSources = ref([]);
// Per user request: match the same month-by-month ruler slider used in Portfolio,
// Income, and Expense trackers (ADR-012), instead of the previous year-based dropdown.
const horizonMonths = ref(1);
const currentYear = new Date().getFullYear();
const currentMonthIndex = new Date().getMonth();
const horizonTicks = [0, 60, 120, 180, 240, 300, 360, 420];
const horizonEndLabel = computed(() => {
  const target = new Date(currentYear, currentMonthIndex + horizonMonths.value - 1, 1);
  return new Intl.DateTimeFormat(locale.value, { month: 'short', year: 'numeric' }).format(target);
});

// Independent load from the repository (TD-02) — this screen does not share
// in-memory state with IncomeTracker.vue / ExpenseTracker.vue.
async function loadSources() {
  const [income, expenses] = await Promise.all([repository.getIncome(), repository.getExpenses()]);
  incomeSources.value = Array.isArray(income) ? income : [];
  expenseSources.value = Array.isArray(expenses) ? expenses : [];
}

onMounted(() => {
  loadSources();
});

function flattenOverrides(sources) {
  const map = {};
  sources.forEach(source => {
    Object.entries(source.statusOverrides || {}).forEach(([month, status]) => {
      map[`${source.id}:${month}`] = status;
    });
  });
  return map;
}

const projectionEntries = computed(() => {
  return buildCashFlowEntries(
    incomeSources.value,
    expenseSources.value,
    horizonMonths.value,
    flattenOverrides(incomeSources.value),
    flattenOverrides(expenseSources.value)
  );
});

const projectionGroups = computed(() => {
  const yearMap = new Map();

  projectionEntries.value.forEach(entry => {
    const [yearStr] = entry.month.split('-');
    if (!yearMap.has(yearStr)) {
      yearMap.set(yearStr, new Map());
    }
    const monthsMap = yearMap.get(yearStr);
    if (!monthsMap.has(entry.month)) {
      monthsMap.set(entry.month, []);
    }
    monthsMap.get(entry.month).push(entry);
  });

  return Array.from(yearMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, monthsMap]) => ({
      year,
      months: Array.from(monthsMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, entries]) => {
          const [y, m] = month.split('-').map(Number);
          const label = new Intl.DateTimeFormat(locale.value, { month: 'long' }).format(new Date(y, m - 1, 1));
          return {
            month,
            label,
            entries,
            totals: calculateCombinedMonthlyTotals(entries)
          };
        })
    }));
});

function statusLabel(entry) {
  if (entry.kind === 'income') {
    return entry.status === 'received' ? t('income.status.received') : t('income.status.pending');
  }
  return entry.status === 'paid' ? t('expenses.status.paid') : t('expenses.status.pending');
}

function sourcesFor(kind) {
  return kind === 'income' ? incomeSources.value : expenseSources.value;
}

function persistEntry(entry) {
  return entry.kind === 'income'
    ? repository.saveIncome(incomeSources.value)
    : repository.saveExpenses(expenseSources.value);
}

// Read-only: never mutates state (same discipline as IncomeTracker.vue / ExpenseTracker.vue).
function displayActualAmount(entry) {
  const source = sourcesFor(entry.kind).find(s => s.id === entry.sourceId);
  const existing = source?.statusOverrides?.[entry.month];
  if (existing && typeof existing === 'object' && existing.actualAmount != null) {
    return existing.actualAmount;
  }
  return entry.expectedAmount;
}

function setActualAmount(entry, rawValue) {
  const source = sourcesFor(entry.kind).find(s => s.id === entry.sourceId);
  if (!source) return;
  if (!source.statusOverrides) {
    source.statusOverrides = {};
  }
  let actualAmount = rawValue === '' ? null : Number(rawValue);
  if (Number.isNaN(actualAmount)) actualAmount = null;
  if (actualAmount > 999999999999999) actualAmount = 999999999999999;
  source.statusOverrides[entry.month] = { status: entry.status, actualAmount };
}

async function toggleStatus(entry) {
  const source = sourcesFor(entry.kind).find(s => s.id === entry.sourceId);
  if (!source) return;

  if (!source.statusOverrides) {
    source.statusOverrides = {};
  }
  const doneStatus = entry.kind === 'income' ? 'received' : 'paid';
  const existing = source.statusOverrides[entry.month];
  const priorActualAmount = typeof existing === 'object' && existing !== null ? existing.actualAmount : null;

  source.statusOverrides[entry.month] = entry.status === doneStatus
    ? { status: 'pending', actualAmount: priorActualAmount }
    : { status: doneStatus, actualAmount: priorActualAmount != null ? priorActualAmount : entry.expectedAmount };

  await persistEntry(entry);
}
</script>

<style scoped>
.cash-flow-container {
  max-width: 1000px;
  margin: 0 auto;
}

/* Header (mirrors LoanTracker.vue's title/subtitle pattern) */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-title {
  font-size: 2rem;
  background: linear-gradient(135deg, var(--primary-accent), var(--secondary-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Horizon ruler slider (mirrors PortfolioTracker.vue / IncomeTracker.vue / ExpenseTracker.vue) */
.horizon-ruler-container {
  width: 100%;
  background: rgba(0, 0, 0, 0.25);
  padding: 1.25rem 1.75rem;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
  margin-bottom: 2rem;
}

.horizon-ruler-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.horizon-ruler-label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
}

.horizon-ruler-badge {
  background: var(--primary-accent);
  color: #000;
  font-weight: bold;
  padding: 0.35rem 0.85rem;
  border-radius: var(--radius-full);
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
}

.ruler-wrapper {
  position: relative;
  padding: 0.5rem 0;
}

.ruler-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  transition: background 0.15s ease;
  cursor: pointer;
}

.ruler-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--primary-accent);
  cursor: pointer;
  box-shadow: 0 0 10px var(--primary-accent);
  transition: transform 0.1s ease;
}

.ruler-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.ruler-slider::-moz-range-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--primary-accent);
  cursor: pointer;
  box-shadow: 0 0 10px var(--primary-accent);
  border: none;
  transition: transform 0.1s ease;
}

.ruler-slider::-moz-range-thumb:hover {
  transform: scale(1.15);
}

.ruler-ticks {
  display: flex;
  justify-content: space-between;
  padding-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  pointer-events: none;
}

.ruler-ticks span {
  text-align: center;
}

.ruler-tick-mark {
  display: block;
  height: 6px;
  width: 2px;
  background: rgba(255, 255, 255, 0.25);
  margin: 0 auto 4px;
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
}

.year-heading {
  font-size: 1.5rem;
  color: var(--secondary-accent);
  margin-bottom: 1rem;
}

.month-block {
  margin-bottom: 1.5rem;
}

.month-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
  margin-bottom: 0.75rem;
}

.month-label {
  font-weight: 600;
  text-transform: capitalize;
  color: var(--text-primary);
}

.month-totals {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.total-net.negative {
  color: #ef4444;
}

.cash-flow-entry-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 1rem;
  background: rgba(255, 255, 255, 0.02);
  margin-bottom: 0.5rem;
  border-radius: var(--radius-sm);
  gap: 0.75rem;
  flex-wrap: wrap;
}

.entry-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.entry-type {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.kind-badge {
  font-size: 0.7rem;
  font-weight: bold;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  text-transform: uppercase;
}

.kind-badge.income {
  background: rgba(16, 185, 129, 0.15);
  color: var(--primary-accent);
}

.kind-badge.expense {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.entry-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.entry-amount {
  font-weight: bold;
}

.actual-amount-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.actual-amount-input {
  width: 90px;
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
}

.btn-toggle-status {
  border: 1px solid var(--border-color);
  background: transparent;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
  width: 90px;
  color: var(--text-secondary);
}

.btn-toggle-status.received,
.btn-toggle-status.paid {
  background: rgba(16, 185, 129, 0.15);
  border-color: var(--primary-accent);
  color: var(--primary-accent);
}
</style>
