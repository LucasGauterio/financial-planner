<template>
  <div class="expense-tracker-container">
    <div class="section-header">
      <div>
        <h2 class="section-title">{{ t('expenses.title') }}</h2>
        <p class="section-subtitle">{{ t('expenses.subtitle') }}</p>
      </div>
      <button class="btn btn-primary" @click="openAddModal">{{ t('expenses.addSource') }}</button>
    </div>

    <div class="grid-2" style="margin-bottom: 2rem;">
      <div class="metric">
        <span class="metric-label">{{ t('expenses.horizon') }}</span>
        <select v-model.number="horizonYears" class="horizon-select">
          <option v-for="opt in horizonOptions" :key="opt" :value="opt">
            {{ t('expenses.horizonYears', { years: opt }) }}
          </option>
        </select>
      </div>
      <div class="metric">
        <span class="metric-label">{{ t('expenses.sourcesCount') }}</span>
        <span class="metric-value small">{{ sources.length }}</span>
      </div>
    </div>

    <div v-if="sources.length === 0" class="card empty-state">
      <h3>{{ t('expenses.empty') }}</h3>
    </div>

    <div v-else>
      <div class="sources-list" style="margin-bottom: 2rem;">
        <div v-for="source in sources" :key="source.id" class="expense-entry-row source-row">
          <div class="entry-info">
            <strong>{{ source.name }}</strong>
            <span class="entry-type">{{ source.type }}</span>
          </div>
          <div class="entry-right">
            <span class="entry-amount">{{ formatCurrency(source.amount) }}</span>
            <button class="action-icon-btn" @click="editSource(source)" :title="t('expenses.editSource')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="action-icon-btn danger" @click="deleteSource(source)" :title="t('expenses.deleteSource')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="projectionGroups.length === 0" class="card empty-state">
        <h3>{{ t('expenses.emptyProjection') }}</h3>
      </div>

      <div v-for="yearGroup in projectionGroups" :key="yearGroup.year" style="margin-bottom: 2rem;">
        <h4 class="year-heading">{{ yearGroup.year }}</h4>

        <div v-for="monthGroup in yearGroup.months" :key="monthGroup.month" class="month-block">
          <div class="month-block-header">
            <span class="month-label">{{ monthGroup.label }}</span>
            <span class="month-totals">
              <span class="total-paid">{{ t('expenses.paid') }}: {{ formatCurrency(monthGroup.totals.paid) }}</span>
              <span class="total-pending">{{ t('expenses.pending') }}: {{ formatCurrency(monthGroup.totals.pending) }}</span>
              <strong>{{ t('expenses.total') }}: {{ formatCurrency(monthGroup.totals.total) }}</strong>
            </span>
          </div>

          <div v-for="entry in monthGroup.entries" :key="`${entry.sourceId}_${entry.month}`" class="expense-entry-row">
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
                {{ entry.status === 'paid' ? t('expenses.status.paid') : t('expenses.status.pending') }}
              </button>
            </div>
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
const horizonOptions = [1, 5, 10, 35];
const horizonYears = ref(1);

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
    sources.value = sources.value.filter(s => s.id !== sourceToDelete.value.id);
    await repository.saveExpenses(sources.value);
    showDeleteConfirm.value = false;
    sourceToDelete.value = null;
  }
}

function cancelDeleteSource() {
  showDeleteConfirm.value = false;
  sourceToDelete.value = null;
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
  return generateExpenseProjection(sources.value, horizonYears.value * 12, flattenedOverrides.value);
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
  source.statusOverrides[entry.month] = entry.status === 'paid' ? 'pending' : 'paid';

  await repository.saveExpenses(sources.value);
}
</script>

<style scoped>
.expense-tracker-container {
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

.expense-entry-row {
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
</style>
