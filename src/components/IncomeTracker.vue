<template>
  <div class="income-tracker-container">
    <div class="section-header">
      <div>
        <h2 class="section-title">{{ t('income.title') }}</h2>
        <p class="section-subtitle">{{ t('income.subtitle') }}</p>
      </div>
      <button class="btn btn-primary" @click="openAddModal">{{ t('income.addSource') }}</button>
    </div>

    <div class="grid-2" style="margin-bottom: 2rem;">
      <div class="metric">
        <span class="metric-label">{{ t('income.horizon') }}</span>
        <select v-model.number="horizonYears" class="horizon-select">
          <option v-for="opt in horizonOptions" :key="opt" :value="opt">
            {{ t('income.horizonYears', { years: opt }) }}
          </option>
        </select>
      </div>
      <div class="metric">
        <span class="metric-label">{{ t('income.sourcesCount') }}</span>
        <span class="metric-value small">{{ sources.length }}</span>
      </div>
    </div>

    <div v-if="sources.length === 0" class="card empty-state">
      <h3>{{ t('income.empty') }}</h3>
    </div>

    <div v-else>
      <div v-if="projectionGroups.length === 0" class="card empty-state">
        <h3>{{ t('income.emptyProjection') }}</h3>
      </div>

      <div v-for="yearGroup in projectionGroups" :key="yearGroup.year" style="margin-bottom: 2rem;">
        <h4 class="year-heading">{{ yearGroup.year }}</h4>

        <div v-for="monthGroup in yearGroup.months" :key="monthGroup.month" class="month-block">
          <div class="month-block-header">
            <span class="month-label">{{ monthGroup.label }}</span>
            <span class="month-totals">
              <span class="total-received">{{ t('income.received') }}: {{ formatCurrency(monthGroup.totals.received) }}</span>
              <span class="total-pending">{{ t('income.pending') }}: {{ formatCurrency(monthGroup.totals.pending) }}</span>
              <strong>{{ t('income.total') }}: {{ formatCurrency(monthGroup.totals.total) }}</strong>
            </span>
          </div>

          <div v-for="entry in monthGroup.entries" :key="`${entry.sourceId}_${entry.month}`" class="income-entry-row">
            <div class="entry-info">
              <strong>{{ entry.name }}</strong>
              <span class="entry-type">{{ entry.type }}</span>
            </div>
            <div class="entry-right">
              <span class="entry-amount">{{ formatCurrency(entry.amount) }}</span>
              <button
                class="btn-toggle-status"
                :class="entry.status"
                @click="toggleStatus(entry)"
              >
                {{ entry.status === 'received' ? t('income.status.received') : t('income.status.pending') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ t('income.addSource') }}</h3>
            <button class="close-btn" @click="closeAddModal">&times;</button>
          </div>

          <form @submit.prevent="saveSource">
            <div class="modal-body">
              <fieldset class="form-fieldset">
                <legend>{{ t('income.form.name') }} *</legend>
                <input type="text" v-model="form.name" required />
              </fieldset>

              <div class="grid-2" style="margin-bottom: 0;">
                <fieldset class="form-fieldset">
                  <legend>{{ t('income.form.type') }} *</legend>
                  <input type="text" v-model="form.type" required placeholder="Salário, Dividendo, Pagamento..." />
                </fieldset>
                <fieldset class="form-fieldset">
                  <legend>{{ t('income.form.amount') }} *</legend>
                  <input type="number" step="0.01" min="0.01" max="999999999999999" v-model.number="form.amount" required />
                </fieldset>
              </div>

              <fieldset class="form-fieldset">
                <legend>{{ t('income.form.startMonth') }} *</legend>
                <input type="month" v-model="form.startMonth" min="1900-01" max="2200-12" required />
              </fieldset>

              <label class="recurring-toggle">
                <input type="checkbox" v-model="form.recurring" />
                {{ t('income.form.recurring') }}
              </label>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeAddModal">{{ t('income.form.cancel') }}</button>
              <button type="submit" class="btn btn-primary">{{ t('income.form.add') }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue';
import { repository } from '../services/indexedDbRepository';
import { generateIncomeProjection, calculateMonthlyTotals } from '../services/incomeCalculations';

const { t, formatCurrency, locale } = inject('i18n');

const sources = ref([]);
const showAddModal = ref(false);
const horizonOptions = [1, 5, 10, 35];
const horizonYears = ref(1);

const formDefaults = () => ({
  name: '',
  type: '',
  amount: null,
  startMonth: new Date().toISOString().slice(0, 7),
  recurring: false
});
const form = reactive(formDefaults());

function generateSecureId() {
  if (globalThis.crypto !== undefined) {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    return Date.now().toString(36) + array[0].toString(36).substring(0, 5);
  }
  return Date.now().toString(36) + String(Date.now() % 100000);
}

async function loadSources() {
  const data = await repository.getIncome();
  sources.value = Array.isArray(data) ? data : [];
}

onMounted(() => {
  loadSources();
});

function openAddModal() {
  Object.assign(form, formDefaults());
  showAddModal.value = true;
}

function closeAddModal() {
  showAddModal.value = false;
}

async function saveSource() {
  sources.value.push({
    id: generateSecureId(),
    name: form.name,
    type: form.type,
    amount: form.amount,
    startMonth: form.startMonth,
    recurring: form.recurring,
    statusOverrides: {}
  });

  await repository.saveIncome(sources.value);
  closeAddModal();
}

// Builds the `${sourceId}:${YYYY-MM}` -> status map expected by generateIncomeProjection
// from each source's own per-source statusOverrides (TD-01: sparse map persisted per source).
const flattenedOverrides = computed(() => {
  const map = {};
  sources.value.forEach(source => {
    Object.entries(source.statusOverrides || {}).forEach(([month, status]) => {
      map[`${source.id}:${month}`] = status;
    });
  });
  return map;
});

const projectionEntries = computed(() => {
  return generateIncomeProjection(sources.value, horizonYears.value * 12, flattenedOverrides.value);
});

const projectionGroups = computed(() => {
  const yearMap = new Map();

  projectionEntries.value.forEach(entry => {
    const [yearStr, monthStr] = entry.month.split('-');
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
            totals: calculateMonthlyTotals(entries)
          };
        })
    }));
});

async function toggleStatus(entry) {
  const source = sources.value.find(s => s.id === entry.sourceId);
  if (!source) return;

  if (!source.statusOverrides) {
    source.statusOverrides = {};
  }
  source.statusOverrides[entry.month] = entry.status === 'received' ? 'pending' : 'received';

  await repository.saveIncome(sources.value);
}
</script>

<style scoped>
.income-tracker-container {
  max-width: 1000px;
  margin: 0 auto;
}

.horizon-select {
  margin-top: 0.35rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
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
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.income-entry-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 1rem;
  background: rgba(255, 255, 255, 0.02);
  margin-bottom: 0.5rem;
  border-radius: var(--radius-sm);
}

.entry-info {
  display: flex;
  flex-direction: column;
}

.entry-type {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.entry-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.entry-amount {
  font-weight: bold;
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

.btn-toggle-status.received {
  background: rgba(16, 185, 129, 0.15);
  border-color: var(--primary-accent);
  color: var(--primary-accent);
}

.recurring-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  cursor: pointer;
  color: var(--text-primary);
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  line-height: 1;
}
</style>
