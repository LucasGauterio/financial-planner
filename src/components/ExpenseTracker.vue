<template>
  <div class="expense-tracker-container">
    <div class="section-header">
      <div>
        <h2 class="section-title">{{ t('expenses.title') }}</h2>
        <p class="section-subtitle">{{ t('expenses.subtitle') }}</p>
      </div>
      <button class="btn btn-primary" @click="openAddModal">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        {{ t('expenses.addSource') }}
      </button>
    </div>

    <div class="horizon-ruler-container">
      <div class="horizon-ruler-header">
        <span class="horizon-ruler-label">{{ t('expenses.horizon') }}</span>
        <div class="horizon-ruler-badge">
          {{ t('expenses.horizonMonths', { months: horizonMonths }) }} / {{ horizonEndLabel }}
        </div>
      </div>

      <div class="ruler-wrapper">
        <input
          type="range"
          id="expenses-horizon-ruler"
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

    <!-- Stats Dashboard -->
    <div class="stats-grid">
      <div class="card stat-card lent">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        </div>
        <div class="stat-content">
          <span class="stat-label">{{ t('expenses.total') }}</span>
          <span class="stat-val">{{ formatCurrency(stats.total) }}</span>
        </div>
      </div>
      <div class="card stat-card recovered">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
        </div>
        <div class="stat-content">
          <span class="stat-label">{{ t('expenses.paid') }}</span>
          <span class="stat-val success">{{ formatCurrency(stats.paid) }}</span>
        </div>
      </div>
      <div class="card stat-card outstanding">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>
        <div class="stat-content">
          <span class="stat-label">{{ t('expenses.pending') }}</span>
          <span class="stat-val warning">{{ formatCurrency(stats.pending) }}</span>
        </div>
      </div>
      <div class="card stat-card active-count">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v-2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        </div>
        <div class="stat-content">
          <span class="stat-label">{{ t('expenses.sourcesCount') }}</span>
          <span class="stat-val info">{{ sources.length }}</span>
        </div>
      </div>
    </div>

    <div v-if="sources.length === 0" class="card empty-state">
      <h3>{{ t('expenses.empty') }}</h3>
    </div>

    <!-- Sources Grid -->
    <div v-else class="sources-grid">
      <div
        v-for="source in sources"
        :key="source.id"
        class="card source-card"
        @click="openDetailsDrawer(source)"
      >
        <div class="source-card-header">
          <div>
            <span class="source-type">{{ source.type }}</span>
            <h4 class="source-name">{{ source.name }}</h4>
          </div>
          <span class="entry-amount">{{ formatCurrency(source.amount) }}</span>
        </div>

        <div class="source-card-footer">
          <span v-if="source.recurring && source.endMonth" class="badge recurring">{{ t('expenses.form.recurring') }} → {{ source.endMonth }}</span>
          <span v-else-if="source.recurring" class="badge recurring">{{ t('expenses.form.recurring') }}</span>
          <span v-else class="badge one-off">{{ t('expenses.form.startMonth') }}: {{ source.startMonth }}</span>

          <div class="card-actions" @click.stop>
            <button class="action-icon-btn" @click="editSource(source)" :title="t('expenses.editSource')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="action-icon-btn danger" @click="deleteSource(source)" :title="t('expenses.deleteSource')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ form.sourceId ? t('expenses.editSource') : t('expenses.addSource') }}</h3>
            <button class="close-btn" @click="closeAddModal">&times;</button>
          </div>

          <form @submit.prevent="saveSource">
            <div class="modal-body">
              <fieldset class="form-fieldset">
                <legend>{{ t('expenses.form.name') }} *</legend>
                <input type="text" v-model="form.name" required />
              </fieldset>

              <div class="grid-2" style="margin-bottom: 0;">
                <fieldset class="form-fieldset">
                  <legend>{{ t('expenses.form.type') }} *</legend>
                  <input type="text" v-model="form.type" required placeholder="Conta fixa, Gasto variável, Assinatura..." />
                </fieldset>
                <fieldset class="form-fieldset">
                  <legend>{{ t('expenses.form.amount') }} *</legend>
                  <input type="number" step="0.01" min="0.01" max="999999999999999" v-model.number="form.amount" required />
                </fieldset>
              </div>

              <fieldset class="form-fieldset">
                <legend>{{ t('expenses.form.startMonth') }} *</legend>
                <input type="month" v-model="form.startMonth" min="1900-01" max="2200-12" required />
              </fieldset>

              <label class="recurring-toggle">
                <input type="checkbox" v-model="form.recurring" />
                {{ t('expenses.form.recurring') }}
              </label>

              <fieldset v-if="form.recurring" class="form-fieldset">
                <legend>{{ t('expenses.form.endMonth') }}</legend>
                <input type="month" v-model="form.endMonth" :min="form.startMonth" max="2200-12" />
              </fieldset>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeAddModal">{{ t('expenses.form.cancel') }}</button>
              <button type="submit" class="btn btn-primary">{{ form.sourceId ? t('expenses.form.save') : t('expenses.form.add') }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- SOURCE DETAIL DRAWER -->
    <Teleport to="body">
        <div v-if="showDetailsDrawer && selectedSource" class="drawer-overlay">
          <div class="drawer-panel">
            <div class="drawer-header">
              <div>
                <span class="drawer-type">{{ selectedSource.type }}</span>
                <h3 class="drawer-title">{{ selectedSource.name }}</h3>
              </div>
              <button class="close-btn" @click="closeDetailsDrawer">&times;</button>
            </div>

            <div class="drawer-body">
              <div v-if="drawerProjectionGroups.length === 0" class="card empty-state">
                <h3>{{ t('expenses.emptyProjection') }}</h3>
              </div>

              <div v-for="yearGroup in drawerProjectionGroups" :key="yearGroup.year" style="margin-bottom: 1.5rem;">
                <h4 class="year-heading">{{ yearGroup.year }}</h4>

                <div v-for="monthGroup in yearGroup.months" :key="monthGroup.month" class="month-block">
                  <div class="month-block-header">
                    <span class="month-label">{{ monthGroup.label }}</span>
                    <span class="month-totals">
                      <span class="total-paid">{{ t('expenses.paid') }}: {{ formatCurrency(monthGroup.totals.paid) }}</span>
                      <span class="total-pending">{{ t('expenses.pending') }}: {{ formatCurrency(monthGroup.totals.pending) }}</span>
                    </span>
                  </div>

                  <div v-for="entry in monthGroup.entries" :key="`${entry.sourceId}_${entry.month}`" class="expense-entry-row">
                    <div class="entry-right">
                      <template v-if="entry.status !== 'pending'">
                        <span class="actual-amount-label">{{ t('expenses.actualAmount') }}:</span>
                        <input
                          type="number"
                          class="actual-amount-input"
                          :value="displayActualAmount(entry)"
                          @input="setActualAmount(entry, $event.target.value)"
                          @blur="persistExpenses"
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
                        {{ entry.status === 'paid' ? t('expenses.status.paid') : t('expenses.status.pending') }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </Teleport>

    <ConfirmDialog
      :show="showDeleteConfirm"
      :title="t('expenses.confirmDeleteTitle')"
      :message="t('expenses.confirmDelete')"
      :confirm-text="t('expenses.deleteSource')"
      :cancel-text="t('expenses.form.cancel')"
      danger
      @confirm="confirmDeleteSource"
      @cancel="cancelDeleteSource"
    />

    <ConfirmDialog
      :show="showParamsConfirm"
      :title="t('expenses.confirmAlterParamsTitle')"
      :message="t('expenses.confirmAlterParams')"
      :confirm-text="t('expenses.form.save')"
      :cancel-text="t('expenses.form.cancel')"
      danger
      @confirm="confirmParamsChange"
      @cancel="cancelParamsChange"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue';
import { repository } from '../services/indexedDbRepository';
import { generateExpenseProjection, calculateMonthlyTotals } from '../services/expenseCalculations';
import ConfirmDialog from './ConfirmDialog.vue';

const { t, formatCurrency, locale } = inject('i18n');

const sources = ref([]);
const showAddModal = ref(false);
const showDeleteConfirm = ref(false);
const sourceToDelete = ref(null);
const showParamsConfirm = ref(false);
const pendingParamsChange = ref(null);
// Per user request: the horizon slider steps month by month (not year by year), and
// defaults to a near-term view instead of a full year ahead.
const horizonMonths = ref(1);
const currentYear = new Date().getFullYear();
const currentMonthIndex = new Date().getMonth();
const horizonTicks = [0, 60, 120, 180, 240, 300, 360, 420];
const horizonEndLabel = computed(() => {
  const target = new Date(currentYear, currentMonthIndex + horizonMonths.value - 1, 1);
  return new Intl.DateTimeFormat(locale.value, { month: 'short', year: 'numeric' }).format(target);
});
const showDetailsDrawer = ref(false);
const selectedSource = ref(null);

const formDefaults = () => ({
  sourceId: null,
  name: '',
  type: '',
  amount: null,
  startMonth: new Date().toISOString().slice(0, 7),
  recurring: false,
  endMonth: ''
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
  const data = await repository.getExpenses();
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

function editSource(source) {
  form.sourceId = source.id;
  form.name = source.name;
  form.type = source.type;
  form.amount = source.amount;
  form.startMonth = source.startMonth;
  form.recurring = source.recurring;
  form.endMonth = source.endMonth || '';
  showAddModal.value = true;
}

async function saveSource() {
  const newEndMonth = form.recurring && form.endMonth ? form.endMonth : null;

  if (form.sourceId) {
    const index = sources.value.findIndex(s => s.id === form.sourceId);
    if (index !== -1) {
      const existing = sources.value[index];
      const isParamsChanged = existing.startMonth !== form.startMonth
        || existing.recurring !== form.recurring
        || (existing.endMonth || null) !== newEndMonth;

      // Directive 1/2 (dialog-implementation rule): the parameter-change warning is a Vue
      // dialog (ConfirmDialog), not window.confirm(); non-parameter fields still apply
      // immediately regardless of the pending confirmation, mirroring LoanTracker's guard.
      existing.name = form.name;
      existing.type = form.type;
      existing.amount = form.amount;

      if (isParamsChanged) {
        pendingParamsChange.value = { index, startMonth: form.startMonth, recurring: form.recurring, endMonth: newEndMonth };
        showParamsConfirm.value = true;
        return;
      }
    }
  } else {
    sources.value.push({
      id: generateSecureId(),
      name: form.name,
      type: form.type,
      amount: form.amount,
      startMonth: form.startMonth,
      recurring: form.recurring,
      endMonth: newEndMonth,
      statusOverrides: {}
    });
  }

  await repository.saveExpenses(sources.value);
  closeAddModal();
}

async function confirmParamsChange() {
  const pending = pendingParamsChange.value;
  if (pending) {
    const existing = sources.value[pending.index];
    existing.startMonth = pending.startMonth;
    existing.recurring = pending.recurring;
    existing.endMonth = pending.endMonth;
    existing.statusOverrides = {};
  }
  showParamsConfirm.value = false;
  pendingParamsChange.value = null;
  await repository.saveExpenses(sources.value);
  closeAddModal();
}

async function cancelParamsChange() {
  // Per TD-02: on cancel, the parameter change is discarded but the non-parameter
  // fields already applied in saveSource() are kept and persisted.
  showParamsConfirm.value = false;
  pendingParamsChange.value = null;
  await repository.saveExpenses(sources.value);
  closeAddModal();
}

function deleteSource(source) {
  sourceToDelete.value = source;
  showDeleteConfirm.value = true;
}

async function confirmDeleteSource() {
  if (sourceToDelete.value) {
    const deletedId = sourceToDelete.value.id;
    sources.value = sources.value.filter(s => s.id !== deletedId);
    await repository.saveExpenses(sources.value);
    if (selectedSource.value && selectedSource.value.id === deletedId) {
      closeDetailsDrawer();
    }
    showDeleteConfirm.value = false;
    sourceToDelete.value = null;
  }
}

function cancelDeleteSource() {
  showDeleteConfirm.value = false;
  sourceToDelete.value = null;
}

// Per ADR-008: clicking a source card opens a drawer scoped to that source's own
// projection, replacing the previous single combined list.
function openDetailsDrawer(source) {
  selectedSource.value = source;
  showDetailsDrawer.value = true;
}

function closeDetailsDrawer() {
  showDetailsDrawer.value = false;
  selectedSource.value = null;
}

// Builds the `${sourceId}:${YYYY-MM}` -> status map expected by generateExpenseProjection
// from each source's own per-source statusOverrides (TD-01, inherited: sparse map persisted per source).
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
  return generateExpenseProjection(sources.value, horizonMonths.value, flattenedOverrides.value);
});

// Stats dashboard (per ADR-008), scoped to the selected horizon window (bug fix, per
// ADR-014): `projectionEntries` can contain months outside [currentMonth, currentMonth +
// horizonMonths - 1] — catch-up backlog for a source registered before today, or a bounded
// source's full span extending past the horizon (ADR-011) — which must stay in the drawer
// so old months remain reviewable, but must NOT inflate the stats dashboard when the user
// narrows the ruler down to, say, just the current month.
const statsWindowStart = computed(() => `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`);
const statsWindowEnd = computed(() => {
  const end = new Date(currentYear, currentMonthIndex + horizonMonths.value - 1, 1);
  return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;
});
const statsEntries = computed(() => {
  return projectionEntries.value.filter(e => e.month >= statsWindowStart.value && e.month <= statsWindowEnd.value);
});
const stats = computed(() => calculateMonthlyTotals(statsEntries.value));

function groupEntriesByYear(entries) {
  const yearMap = new Map();

  entries.forEach(entry => {
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
        .map(([month, monthEntries]) => {
          const [y, m] = month.split('-').map(Number);
          const label = new Intl.DateTimeFormat(locale.value, { month: 'long' }).format(new Date(y, m - 1, 1));
          return {
            month,
            label,
            entries: monthEntries,
            totals: calculateMonthlyTotals(monthEntries)
          };
        })
    }));
}

// Per ADR-008: the drawer shows only the currently selected source's own entries,
// replacing the previous combined-across-all-sources projectionGroups.
const drawerProjectionGroups = computed(() => {
  if (!selectedSource.value) return [];
  const ownEntries = projectionEntries.value.filter(e => e.sourceId === selectedSource.value.id);
  return groupEntriesByYear(ownEntries);
});

// Read-only: never mutates state. Shows the recorded actualAmount for an entry already
// marked paid, falling back to the expected amount for a legacy string override or one
// the user hasn't edited yet (TD-01).
function displayActualAmount(entry) {
  const source = sources.value.find(s => s.id === entry.sourceId);
  const existing = source?.statusOverrides?.[entry.month];
  if (existing && typeof existing === 'object' && existing.actualAmount != null) {
    return existing.actualAmount;
  }
  return entry.expectedAmount;
}

// Writes (creating/upgrading only this entry's override) in response to explicit user
// input — never called from a template read, so unrelated renders never mutate state.
function setActualAmount(entry, rawValue) {
  const source = sources.value.find(s => s.id === entry.sourceId);
  if (!source) return;
  if (!source.statusOverrides) {
    source.statusOverrides = {};
  }
  let actualAmount = rawValue === '' ? null : Number(rawValue);
  if (Number.isNaN(actualAmount)) actualAmount = null;
  if (actualAmount > 999999999999999) actualAmount = 999999999999999;
  source.statusOverrides[entry.month] = { status: entry.status, actualAmount };
}

async function persistExpenses() {
  await repository.saveExpenses(sources.value);
}

async function toggleStatus(entry) {
  const source = sources.value.find(s => s.id === entry.sourceId);
  if (!source) return;

  if (!source.statusOverrides) {
    source.statusOverrides = {};
  }
  // TD-01: preserve any previously-entered actual amount across pending<->paid
  // toggles, mirroring InvestmentTimeline.vue's toggleCheck defaulting behavior.
  const existing = source.statusOverrides[entry.month];
  const priorActualAmount = typeof existing === 'object' && existing !== null ? existing.actualAmount : null;

  source.statusOverrides[entry.month] = entry.status === 'paid'
    ? { status: 'pending', actualAmount: priorActualAmount }
    : { status: 'paid', actualAmount: priorActualAmount != null ? priorActualAmount : entry.expectedAmount };

  await repository.saveExpenses(sources.value);
}
</script>

<style scoped>
.expense-tracker-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Header (mirrors LoanTracker.vue's title/subtitle/Add button pattern) */
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

/* Horizon ruler slider (mirrors PortfolioTracker.vue, per ADR-009) */
.horizon-ruler-container {
  width: 100%;
  background: rgba(0, 0, 0, 0.25);
  padding: 1.25rem 1.75rem;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
  margin-bottom: 1.5rem;
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

/* Stats dashboard (mirrors LoanTracker.vue) */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: var(--radius-md);
  position: relative;
  overflow: hidden;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
}

.stat-card.lent .stat-icon { color: var(--text-primary); background: rgba(255, 255, 255, 0.08); }
.stat-card.recovered .stat-icon { color: var(--primary-accent); background: rgba(16, 185, 129, 0.1); }
.stat-card.outstanding .stat-icon { color: #fbbf24; background: #2d1f10; }
.stat-card.active-count .stat-icon { color: var(--secondary-accent); background: rgba(59, 130, 246, 0.1); }

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-val {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-val.success { color: var(--primary-accent); }
.stat-val.warning { color: #fbbf24; }
.stat-val.info { color: var(--secondary-accent); }

/* Sources grid (mirrors LoanTracker.vue's loans-grid/loan-card) */
.sources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.source-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 120px;
  position: relative;
}

.source-card:hover .card-actions {
  opacity: 1;
  transform: translateY(0);
}

.source-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.source-type {
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

.source-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 0.15rem;
}

.source-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border-color);
  padding-top: 0.75rem;
  margin-top: 0.5rem;
}

.badge {
  font-size: 0.7rem;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.badge.recurring {
  background: rgba(16, 185, 129, 0.12);
  color: var(--primary-accent);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.badge.one-off {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  text-transform: none;
}

.card-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.25rem;
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transform: translateY(-5px);
  transition: all 0.25s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
}

.action-icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  width: 26px;
  height: 26px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.action-icon-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.action-icon-btn.danger:hover {
  background: #dc2626;
  color: #ffffff;
}

/* Detail drawer (mirrors LoanTracker.vue) */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1000;
}

.drawer-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 460px;
  background: var(--surface-color);
  border-left: 1px solid var(--border-color);
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  animation: drawerIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes drawerIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.drawer-type {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

.drawer-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-primary);
  margin-top: 0.25rem;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.year-heading {
  font-size: 1.25rem;
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

.expense-entry-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0.65rem 1rem;
  background: rgba(255, 255, 255, 0.02);
  margin-bottom: 0.5rem;
  border-radius: var(--radius-sm);
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

.btn-toggle-status.paid {
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
