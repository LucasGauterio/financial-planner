<template>
  <div class="data-export-container">
    <div class="section-header">
      <div>
        <h2 class="section-title">{{ t('dataExport.title') }}</h2>
        <p class="section-subtitle">{{ t('dataExport.subtitle') }}</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="card stat-card lent">
        <div class="stat-content">
          <span class="stat-label">{{ t('tabs.income') }}</span>
          <span class="stat-val">{{ incomeSources.length }}</span>
        </div>
      </div>
      <div class="card stat-card outstanding">
        <div class="stat-content">
          <span class="stat-label">{{ t('tabs.expenses') }}</span>
          <span class="stat-val warning">{{ expenseSources.length }}</span>
        </div>
      </div>
      <div class="card stat-card recovered">
        <div class="stat-content">
          <span class="stat-label">{{ t('tabs.loans') }}</span>
          <span class="stat-val success">{{ loans.length }}</span>
        </div>
      </div>
      <div class="card stat-card active-count">
        <div class="stat-content">
          <span class="stat-label">{{ t('tabs.portfolio') }}</span>
          <span class="stat-val info">{{ investments.length }}</span>
        </div>
      </div>
    </div>

    <div class="card export-card">
      <p class="export-description">{{ t('dataExport.description') }}</p>
      <button class="btn btn-primary" @click="showExportConfirm = true">
        {{ t('dataExport.exportButton') }}
      </button>
      <div v-if="statusMsg" class="export-status" :class="{ error: statusIsError }">
        {{ statusMsg }}
      </div>
    </div>

    <ConfirmDialog
      :show="showExportConfirm"
      :title="t('dataExport.confirmTitle')"
      :message="t('dataExport.confirmMessage')"
      :confirm-text="t('dataExport.exportButton')"
      :cancel-text="t('dataExport.cancelBtn')"
      @confirm="confirmExport"
      @cancel="showExportConfirm = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue';
import { repository } from '../services/indexedDbRepository';
import {
  buildIncomeRows,
  buildExpenseRows,
  buildLoanRows,
  buildPortfolioRows,
  buildCashFlowRows,
  buildTimelineRows,
  exportAllToSpreadsheet
} from '../services/spreadsheetExportService';
import ConfirmDialog from './ConfirmDialog.vue';

const { t } = inject('i18n');

const incomeSources = ref([]);
const expenseSources = ref([]);
const loans = ref([]);
const investments = ref([]);
const timelineState = ref({});

const showExportConfirm = ref(false);
const statusMsg = ref('');
const statusIsError = ref(false);

// Independent load from the repository, mirroring CashFlowOverview.vue (TD-02) —
// this screen does not share in-memory state with any other tracker.
async function loadDomains() {
  const [income, expenses, loanData, investmentData, timelineData] = await Promise.all([
    repository.getIncome(),
    repository.getExpenses(),
    repository.getLoans(),
    repository.getInvestments(),
    repository.getTimelineState()
  ]);
  incomeSources.value = Array.isArray(income) ? income : [];
  expenseSources.value = Array.isArray(expenses) ? expenses : [];
  loans.value = Array.isArray(loanData) ? loanData : [];
  investments.value = Array.isArray(investmentData) ? investmentData : [];
  timelineState.value = timelineData && typeof timelineData === 'object' ? timelineData : {};
}

onMounted(() => {
  loadDomains();
});

// TD-02: horizon fixed to the app-wide ceiling (420 months / 35 years) so the export
// always covers every projected entry, independent of any tracker's own selected horizon.
const EXPORT_HORIZON_MONTHS = 420;

function confirmExport() {
  showExportConfirm.value = false;
  try {
    exportAllToSpreadsheet({
      income: buildIncomeRows(incomeSources.value, EXPORT_HORIZON_MONTHS),
      expenses: buildExpenseRows(expenseSources.value, EXPORT_HORIZON_MONTHS),
      loans: buildLoanRows(loans.value),
      portfolio: buildPortfolioRows(investments.value),
      cashFlow: buildCashFlowRows(incomeSources.value, expenseSources.value, EXPORT_HORIZON_MONTHS),
      timeline: buildTimelineRows(investments.value, timelineState.value)
    });
    statusIsError.value = false;
    statusMsg.value = t('dataExport.statusSuccess');
  } catch (err) {
    statusIsError.value = true;
    statusMsg.value = t('dataExport.statusError', { error: err.message });
  }
}
</script>

<style scoped>
.data-export-container {
  max-width: 1000px;
  margin: 0 auto;
}

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
}

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

.export-card {
  text-align: center;
  padding: 2.5rem 2rem;
}

.export-description {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.export-status {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: var(--primary-accent);
}

.export-status.error {
  color: #ef4444;
}
</style>
