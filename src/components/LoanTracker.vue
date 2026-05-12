<template>
  <div class="loan-tracker-container">
    <!-- Header Section -->
    <div class="section-header">
      <div>
        <h2 class="section-title">{{ t('loans.title') }}</h2>
        <p class="section-subtitle">{{ t('loans.subtitle') }}</p>
      </div>
      <button class="btn btn-primary" @click="openAddModal">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        {{ t('loans.addLoan') }}
      </button>
    </div>

    <!-- Stats Dashboard Block -->
    <div class="stats-grid">
      <div class="card stat-card lent">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        </div>
        <div class="stat-content">
          <span class="stat-label">{{ t('loans.totalLent') }}</span>
          <span class="stat-val">{{ formatCurrency(stats.totalLent) }}</span>
        </div>
      </div>
      <div class="card stat-card recovered">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
        </div>
        <div class="stat-content">
          <span class="stat-label">{{ t('loans.recovered') }}</span>
          <span class="stat-val success">{{ formatCurrency(stats.totalRecovered) }}</span>
        </div>
      </div>
      <div class="card stat-card outstanding">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>
        <div class="stat-content">
          <span class="stat-label">{{ t('loans.outstanding') }}</span>
          <span class="stat-val warning">{{ formatCurrency(stats.outstandingBalance) }}</span>
        </div>
      </div>
      <div class="card stat-card active-count">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v-2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        </div>
        <div class="stat-content">
          <span class="stat-label">{{ t('loans.activeCount') }}</span>
          <span class="stat-val info">{{ stats.activeLoansCount }}</span>
        </div>
      </div>
    </div>

    <!-- Filters Row -->
    <div class="filters-row">
      <div class="filter-tabs">
        <button 
          v-for="f in ['active', 'completed', 'archived', 'all']" 
          :key="f"
          class="filter-tab-btn"
          :class="{ active: activeFilter === f }"
          @click="activeFilter = f"
        >
          {{ t(`loans.filters.${f}`) }}
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredLoans.length === 0" class="card empty-state">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
      </div>
      <h3>{{ t('loans.empty') }}</h3>
    </div>

    <!-- Loans Grid -->
    <div v-else class="loans-grid">
      <div 
        v-for="loan in filteredLoans" 
        :key="loan.id" 
        class="card loan-card"
        @click="openDetailsDrawer(loan)"
      >
        <div class="loan-card-header">
          <div>
            <span class="friend-name">{{ loan.friendName }}</span>
            <h4 class="loan-name">{{ loan.loanName }}</h4>
          </div>
          <span :class="['badge', loan.type]">
            {{ loan.type === 'casual' ? t('loans.typeCasual') : t('loans.typeCredit') }}
          </span>
        </div>

        <!-- Progress Bar Details -->
        <div class="progress-container">
          <div class="progress-text">
            <span class="progress-label">
              <template v-if="loan.type === 'casual'">
                {{ formatCurrency(summaries[loan.id].totalPaid) }} / {{ formatCurrency(summaries[loan.id].totalLent) }}
              </template>
              <template v-else>
                {{ t('loans.stats.paidCount', { paid: summaries[loan.id].paidInstallmentsCount, total: summaries[loan.id].totalInstallmentsCount }) }}
              </template>
            </span>
            <span class="progress-pct">{{ t('loans.stats.recoveredPct', { pct: summaries[loan.id].progressPercent }) }}</span>
          </div>
          <div class="progress-bar-bg">
            <div 
              class="progress-bar-fill" 
              :style="{ width: `${summaries[loan.id].progressPercent}%` }"
              :class="loan.type"
            ></div>
          </div>
        </div>

        <!-- Details Footer -->
        <div class="loan-card-footer">
          <div class="footer-metrics">
            <div class="metric-mini">
              <span class="lbl">{{ t('loans.outstanding') }}</span>
              <span class="val" :class="{ success: summaries[loan.id].remainingBalance === 0 }">
                {{ formatCurrency(summaries[loan.id].remainingBalance) }}
              </span>
            </div>
            
            <div v-if="loan.type === 'credit' && summaries[loan.id].nextInstallment" class="metric-mini align-right">
              <span class="lbl">{{ t('timeline.expected') }}</span>
              <span class="val-sm">{{ formatDate(summaries[loan.id].nextInstallment.dueDate) }}</span>
            </div>
          </div>

          <!-- Actions Overlay -->
          <div class="card-actions" @click.stop>
            <button class="action-icon-btn" @click="editLoan(loan)" :title="t('loans.editLoan')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="action-icon-btn" @click="toggleArchive(loan)" :title="loan.archived ? t('loans.unarchiveLoan') : t('loans.archiveLoan')">
              <svg v-if="loan.archived" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
            </button>
            <button class="action-icon-btn danger" @click="deleteLoan(loan)" :title="t('loans.deleteLoan')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ADD/EDIT LOAN MODAL -->
    <transition name="fade">
      <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ form.loanId ? t('loans.editLoan') : t('loans.addLoan') }}</h3>
            <button class="close-btn" @click="closeAddModal">&times;</button>
          </div>

          <form @submit.prevent="saveLoan" style="display: flex; flex-direction: column; flex: 1; overflow: hidden; margin: 0;">
            <div class="modal-body">
              <!-- Loan Type (Disabled in Edit Mode) -->
              <fieldset class="form-fieldset">
                <legend>{{ t('loans.form.type') }}</legend>
                <div class="type-selector" style="margin-top: 0.35rem; border: none; padding: 0; background: transparent;">
                  <label class="type-option" :class="{ selected: form.type === 'casual', disabled: form.loanId }" style="flex: 1;">
                    <input 
                      type="radio" 
                      value="casual" 
                      v-model="form.type" 
                      :disabled="!!form.loanId"
                      style="display: none;" 
                    />
                    <span>{{ t('loans.typeCasual') }}</span>
                  </label>
                  <label class="type-option" :class="{ selected: form.type === 'credit', disabled: form.loanId }" style="flex: 1;">
                    <input 
                      type="radio" 
                      value="credit" 
                      v-model="form.type" 
                      :disabled="!!form.loanId"
                      style="display: none;" 
                    />
                    <span>{{ t('loans.typeCredit') }}</span>
                  </label>
                </div>
              </fieldset>

              <div class="grid-2" style="margin-bottom: 0;">
                <!-- Friend Name -->
                <fieldset class="form-fieldset">
                  <legend>{{ t('loans.form.friendName') }} *</legend>
                  <input type="text" v-model="form.friendName" required />
                </fieldset>

                <!-- Loan Name -->
                <fieldset class="form-fieldset">
                  <legend>{{ t('loans.form.loanName') }} *</legend>
                  <input type="text" v-model="form.loanName" required />
                </fieldset>
              </div>

              <!-- DYNAMIC FORM SECTIONS BASED ON TYPE -->
              <!-- 1. CASUAL LOAN SECTION -->
              <transition name="fade" mode="out-in">
                <div v-if="form.type === 'casual'" key="casual-form" class="dynamic-form-fields">
                  <div class="grid-2" style="margin-bottom: 0;">
                    <fieldset class="form-fieldset">
                      <legend>{{ t('loans.form.amountLent') }} *</legend>
                      <input type="number" step="0.01" min="0.01" max="999999999999999" v-model.number="form.totalAmount" required @input="form.totalAmount = form.totalAmount > 999999999999999 ? 999999999999999 : form.totalAmount" />
                      <span v-if="form.totalAmount > 999999999999999" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                        ⚠️ {{ t('validation.maxLimit') }}
                      </span>
                    </fieldset>
                    <fieldset class="form-fieldset">
                      <legend>{{ t('loans.form.dateLent') }} *</legend>
                      <input type="date" v-model="form.dateLent" min="1900-01-01" max="2200-12-31" required />
                      <span v-if="form.dateLent && parseInt(form.dateLent.split('-')[0]) < 1900" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                        ⚠️ {{ t('validation.minYear') }}
                      </span>
                      <span v-if="form.dateLent && parseInt(form.dateLent.split('-')[0]) > 2200" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                        ⚠️ {{ t('validation.maxYear') }}
                      </span>
                    </fieldset>
                  </div>
                </div>

                <!-- 2. CREDIT CARD LIMIT LOAN SECTION -->
                <div v-else-if="form.type === 'credit'" key="credit-form" class="dynamic-form-fields">
                  <div class="grid-2" style="margin-bottom: 0;">
                    <fieldset class="form-fieldset">
                      <legend>{{ t('loans.form.totalAmount') }} *</legend>
                      <input type="number" step="0.01" min="0.01" max="999999999999999" v-model.number="form.totalAmount" required @input="form.totalAmount = form.totalAmount > 999999999999999 ? 999999999999999 : form.totalAmount" />
                      <span v-if="form.totalAmount > 999999999999999" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                        ⚠️ {{ t('validation.maxLimit') }}
                      </span>
                    </fieldset>
                    <fieldset class="form-fieldset">
                      <legend>{{ t('loans.form.installmentsCount') }} *</legend>
                      <input type="number" min="1" max="120" v-model.number="form.installmentsCount" required />
                    </fieldset>
                  </div>

                  <div class="grid-2" style="margin-bottom: 0;">
                    <fieldset class="form-fieldset">
                      <legend>{{ t('loans.form.startMonth') }} *</legend>
                      <input type="month" v-model="form.startMonth" min="1900-01" max="2200-12" required />
                      <span v-if="form.startMonth && parseInt(form.startMonth.split('-')[0]) < 1900" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                        ⚠️ {{ t('validation.minYear') }}
                      </span>
                      <span v-if="form.startMonth && parseInt(form.startMonth.split('-')[0]) > 2200" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                        ⚠️ {{ t('validation.maxYear') }}
                      </span>
                    </fieldset>
                    <fieldset class="form-fieldset">
                      <legend>{{ t('loans.form.dueDay') }} *</legend>
                      <input type="number" min="1" max="31" v-model.number="form.dueDay" required />
                    </fieldset>
                  </div>

                  <fieldset class="form-fieldset">
                    <legend>{{ t('loans.form.cardName') }}</legend>
                    <input type="text" v-model="form.cardName" placeholder="Visa, Mastercard, etc." />
                  </fieldset>
                  
                  <div v-if="form.totalAmount && form.installmentsCount" class="estimated-installment">
                    <span>{{ t('loans.form.installmentAmount') }}:</span>
                    <strong>{{ formatCurrency(form.totalAmount / form.installmentsCount) }} /mo</strong>
                  </div>
                </div>
              </transition>

              <!-- Notes -->
              <fieldset class="form-fieldset" style="margin-bottom: 0;">
                <legend>{{ t('loans.form.notes') }}</legend>
                <textarea v-model="form.notes" rows="2" class="notes-textarea" style="border: none !important; background: transparent !important; resize: none; padding: 0.15rem 0 !important; outline: none !important; width: 100%; color: var(--text-primary); font-family: var(--font-sans);"></textarea>
              </fieldset>
            </div>

            <!-- Form Actions inside fixed footer -->
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeAddModal">
                {{ t('loans.form.cancel') }}
              </button>
              <button type="submit" class="btn btn-primary">
                {{ form.loanId ? t('loans.form.save') : t('loans.form.add') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- DETAILED LOAN DRAWER (RIGHT PANEL) -->
    <transition name="slide-panel">
      <div v-if="showDetailsDrawer && selectedLoan" class="drawer-overlay" @click.self="closeDetailsDrawer">
        <div class="drawer-panel">
          <!-- Drawer Header -->
          <div class="drawer-header">
            <div>
              <span class="drawer-friend">{{ selectedLoan.friendName }}</span>
              <h3 class="drawer-title">{{ selectedLoan.loanName }}</h3>
              <span :class="['badge', selectedLoan.type]">
                {{ selectedLoan.type === 'casual' ? t('loans.typeCasual') : t('loans.typeCredit') }}
              </span>
            </div>
            <button class="close-btn" @click="closeDetailsDrawer">&times;</button>
          </div>

          <!-- Drawer Content -->
          <div class="drawer-body">
            <!-- Summary Metrics Card -->
            <div class="card detail-summary-card">
              <div class="drawer-metric">
                <span class="lbl">{{ t('loans.totalLent') }}</span>
                <span class="val">{{ formatCurrency(drawerSummary.totalLent) }}</span>
              </div>
              <div class="drawer-metric">
                <span class="lbl">{{ t('loans.recovered') }}</span>
                <span class="val success">{{ formatCurrency(drawerSummary.totalPaid) }}</span>
              </div>
              <div class="drawer-metric">
                <span class="lbl">{{ t('loans.outstanding') }}</span>
                <span class="val warning">{{ formatCurrency(drawerSummary.remainingBalance) }}</span>
              </div>
            </div>

            <div v-if="selectedLoan.notes" class="drawer-notes-block">
              <h5>{{ t('loans.form.notes') }}</h5>
              <p>{{ selectedLoan.notes }}</p>
            </div>

            <!-- CASUAL LOAN: LEDGER & RECORD FORM -->
            <div v-if="selectedLoan.type === 'casual'" class="drawer-section">
              <h4>{{ t('loans.casual.ledgerTitle') }}</h4>
              
              <!-- Repayment Log -->
              <div v-if="selectedLoan.payments.length === 0" class="empty-ledger">
                {{ t('loans.casual.noPayments') }}
              </div>
              <div v-else class="payment-ledger-list">
                <div v-for="pay in sortedPayments" :key="pay.id" class="ledger-item">
                  <div class="ledger-meta">
                    <span class="ledger-date">{{ formatDate(pay.date) }}</span>
                    <p v-if="pay.notes" class="ledger-note">{{ pay.notes }}</p>
                  </div>
                  <div class="ledger-right">
                    <span class="ledger-amount">{{ formatCurrency(pay.amount) }}</span>
                    <button class="delete-payment-btn" @click="deleteRepayment(pay.id)" title="Delete payment">
                      &times;
                    </button>
                  </div>
                </div>
              </div>

              <!-- Record Repayment Inline Form -->
              <div v-if="drawerSummary.remainingBalance > 0" class="card inline-payment-form">
                <h5>{{ t('loans.casual.paymentFormTitle') }}</h5>
                <form @submit.prevent="addRepayment">
                  <div class="grid-2" style="margin-bottom: 0.5rem;">
                    <div class="form-group small">
                      <label>{{ t('loans.casual.amountPaid') }} *</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0.01" 
                        :max="drawerSummary.remainingBalance" 
                        v-model.number="paymentForm.amount" 
                        required 
                        @input="paymentForm.amount = paymentForm.amount > drawerSummary.remainingBalance ? drawerSummary.remainingBalance : paymentForm.amount"
                      />
                    </div>
                    <div class="form-group small">
                      <label>{{ t('loans.casual.datePaid') }} *</label>
                      <input type="date" v-model="paymentForm.date" min="1900-01-01" max="2200-12-31" required />
                      <span v-if="paymentForm.date && parseInt(paymentForm.date.split('-')[0]) < 1900" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                        ⚠️ {{ t('validation.minYear') }}
                      </span>
                      <span v-if="paymentForm.date && parseInt(paymentForm.date.split('-')[0]) > 2200" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                        ⚠️ {{ t('validation.maxYear') }}
                      </span>
                    </div>
                  </div>
                  <div class="form-group small" style="margin-bottom: 0.75rem;">
                    <label>{{ t('loans.casual.paymentNotes') }}</label>
                    <input type="text" v-model="paymentForm.notes" />
                  </div>
                  <button type="submit" class="btn btn-primary btn-sm" style="width: 100%;">
                    {{ t('loans.casual.addPaymentBtn') }}
                  </button>
                </form>
              </div>
            </div>

            <!-- CREDIT LIMIT LOAN: SCHEDULE CHECKLIST -->
            <div v-else-if="selectedLoan.type === 'credit'" class="drawer-section">
              <h4>{{ t('loans.credit.installmentsTitle') }}</h4>
              
              <div class="installments-schedule-list">
                <div 
                  v-for="inst in selectedLoan.installments" 
                  :key="inst.number" 
                  class="installment-item"
                  :class="{ paid: inst.status === 'paid' }"
                >
                  <div class="inst-info">
                    <span class="inst-num">
                      {{ t('loans.credit.installmentNum', { num: inst.number, total: selectedLoan.installmentsCount }) }}
                    </span>
                    <span class="inst-date">
                      {{ formatDate(inst.dueDate) }}
                      <span v-if="inst.status === 'paid' && inst.paymentDate" class="inst-pay-date">
                        ({{ t('loans.credit.paymentDate') }} {{ formatDate(inst.paymentDate) }})
                      </span>
                    </span>
                  </div>
                  
                  <div class="inst-right">
                    <span class="inst-amount">{{ formatCurrency(inst.amount) }}</span>
                    <button 
                      class="btn btn-toggle-paid" 
                      :class="inst.status"
                      @click="toggleInstallmentStatus(inst)"
                    >
                      {{ inst.status === 'paid' ? t('loans.credit.paidShort') : t('loans.credit.pendingShort') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from '../composables/useI18n';
import { repository } from '../services/indexedDbRepository';
import { 
  generateCreditCardInstallments, 
  calculateCasualLoanSummary, 
  calculateCreditLoanSummary 
} from '../services/loanCalculations';

const { t, formatCurrency, locale } = useI18n();

// Component States
const loans = ref([]);
const activeFilter = ref('active');
const showAddModal = ref(false);
const showDetailsDrawer = ref(false);
const selectedLoan = ref(null);

// Form States
const formDefaults = () => ({
  loanId: null,
  type: 'casual',
  friendName: '',
  loanName: '',
  totalAmount: null,
  dateLent: new Date().toISOString().split('T')[0],
  startMonth: new Date().toISOString().slice(0, 7),
  dueDay: 10,
  installmentsCount: 12,
  cardName: '',
  notes: ''
});
const form = reactive(formDefaults());

const paymentForm = reactive({
  amount: null,
  date: new Date().toISOString().split('T')[0],
  notes: ''
});

// Load Loans on Mount
async function loadLoans() {
  const data = await repository.getLoans();
  loans.value = Array.isArray(data) ? data : [];
}

onMounted(() => {
  loadLoans();
});

// Computed Loan Summaries
const summaries = computed(() => {
  const result = {};
  loans.value.forEach(loan => {
    if (loan.type === 'casual') {
      result[loan.id] = calculateCasualLoanSummary(loan);
    } else {
      result[loan.id] = calculateCreditLoanSummary(loan);
    }
  });
  return result;
});

// Dynamic drawer summary for currently open loan
const drawerSummary = computed(() => {
  if (!selectedLoan.value) return {};
  return summaries.value[selectedLoan.value.id] || {};
});

// Sorted Payments list for Casual Loan detail
const sortedPayments = computed(() => {
  if (!selectedLoan.value || !selectedLoan.value.payments) return [];
  return [...selectedLoan.value.payments].sort((a, b) => new Date(b.date) - new Date(a.date));
});

// Aggregate Global Stats (excluding archived)
const stats = computed(() => {
  let totalLent = 0;
  let totalRecovered = 0;
  let activeLoansCount = 0;

  loans.value.forEach(loan => {
    if (loan.archived) return;

    const summ = summaries.value[loan.id];
    if (summ) {
      totalLent += summ.totalLent;
      totalRecovered += summ.totalPaid;
      if (summ.remainingBalance > 0) {
        activeLoansCount++;
      }
    }
  });

  return {
    totalLent,
    totalRecovered,
    outstandingBalance: Math.max(0, totalLent - totalRecovered),
    activeLoansCount
  };
});

// Filtered Loans for Grid
const filteredLoans = computed(() => {
  return loans.value.filter(loan => {
    const summ = summaries.value[loan.id];
    if (!summ) return false;

    if (activeFilter.value === 'archived') {
      return loan.archived;
    }
    
    // Non-archived flows
    if (loan.archived) return false;

    if (activeFilter.value === 'active') {
      return summ.remainingBalance > 0;
    }
    if (activeFilter.value === 'completed') {
      return summ.remainingBalance === 0;
    }
    return true; // 'all'
  });
});

// Modal Actions
function openAddModal() {
  Object.assign(form, formDefaults());
  showAddModal.value = true;
}

function closeAddModal() {
  showAddModal.value = false;
}

function editLoan(loan) {
  form.loanId = loan.id;
  form.type = loan.type;
  form.friendName = loan.friendName;
  form.loanName = loan.loanName;
  form.totalAmount = loan.type === 'casual' ? loan.amountLent : loan.totalAmount;
  form.dateLent = loan.dateLent || new Date().toISOString().split('T')[0];
  form.startMonth = loan.startMonth || new Date().toISOString().slice(0, 7);
  form.dueDay = loan.dueDay || 10;
  form.installmentsCount = loan.installmentsCount || 12;
  form.cardName = loan.cardName || '';
  form.notes = loan.notes || '';
  
  showAddModal.value = true;
}

// Drawer Actions
function openDetailsDrawer(loan) {
  selectedLoan.value = loan;
  paymentForm.amount = null;
  paymentForm.date = new Date().toISOString().split('T')[0];
  paymentForm.notes = '';
  showDetailsDrawer.value = true;
}

function closeDetailsDrawer() {
  showDetailsDrawer.value = false;
  selectedLoan.value = null;
}

// Format date local helper
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00'); // Prevent timezone shift
  return date.toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Core Operations: Save / Delete / Archive / Payment updates
async function saveLoan() {
  // Validate dates/years
  if (form.type === 'casual') {
    if (form.dateLent) {
      const year = parseInt(form.dateLent.split('-')[0]);
      if (isNaN(year) || year < 1900) {
        alert("The lent date cannot be before year 1900.");
        return;
      }
    }
  } else {
    if (form.startMonth) {
      const year = parseInt(form.startMonth.split('-')[0]);
      if (isNaN(year) || year < 1900) {
        alert("The starting month cannot be before year 1900.");
        return;
      }
    }
  }

  if (form.loanId) {
    // Edit existing
    const index = loans.value.findIndex(l => l.id === form.loanId);
    if (index !== -1) {
      const existing = loans.value[index];
      existing.friendName = form.friendName;
      existing.loanName = form.loanName;
      existing.notes = form.notes;
      
      if (existing.type === 'casual') {
        existing.amountLent = form.totalAmount;
        existing.dateLent = form.dateLent;
      } else {
        // Regenerating installments is tricky if some are paid, let's keep installments if count/amount did not alter
        if (existing.totalAmount !== form.totalAmount || existing.installmentsCount !== form.installmentsCount || existing.startMonth !== form.startMonth || existing.dueDay !== form.dueDay) {
          if (confirm("Altering these credit parameters will RE-GENERATE all installments, clearing past payment flags. Continue?")) {
            existing.totalAmount = form.totalAmount;
            existing.installmentsCount = form.installmentsCount;
            existing.startMonth = form.startMonth;
            existing.dueDay = form.dueDay;
            existing.cardName = form.cardName;
            existing.installments = generateCreditCardInstallments(form.totalAmount, form.installmentsCount, form.startMonth, form.dueDay);
          }
        } else {
          existing.cardName = form.cardName;
        }
      }
    }
  } else {
    // New setup
    const newLoan = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      type: form.type,
      friendName: form.friendName,
      loanName: form.loanName,
      notes: form.notes,
      archived: false
    };

    if (form.type === 'casual') {
      newLoan.amountLent = form.totalAmount;
      newLoan.dateLent = form.dateLent;
      newLoan.payments = [];
    } else {
      newLoan.totalAmount = form.totalAmount;
      newLoan.installmentsCount = form.installmentsCount;
      newLoan.startMonth = form.startMonth;
      newLoan.dueDay = form.dueDay;
      newLoan.cardName = form.cardName;
      newLoan.installments = generateCreditCardInstallments(form.totalAmount, form.installmentsCount, form.startMonth, form.dueDay);
    }

    loans.value.push(newLoan);
  }

  await repository.saveLoans(loans.value);
  closeAddModal();
  await loadLoans();
}

async function deleteLoan(loan) {
  if (confirm(t('loans.confirmDelete'))) {
    loans.value = loans.value.filter(l => l.id !== loan.id);
    await repository.saveLoans(loans.value);
    if (selectedLoan.value && selectedLoan.value.id === loan.id) {
      closeDetailsDrawer();
    }
    await loadLoans();
  }
}

async function toggleArchive(loan) {
  const index = loans.value.findIndex(l => l.id === loan.id);
  if (index !== -1) {
    loans.value[index].archived = !loans.value[index].archived;
    await repository.saveLoans(loans.value);
    await loadLoans();
  }
}

// Repayment Actions for CASUAL LOANS
async function addRepayment() {
  if (!selectedLoan.value || !paymentForm.amount) return;

  if (paymentForm.date) {
    const year = parseInt(paymentForm.date.split('-')[0]);
    if (isNaN(year) || year < 1900) {
      alert("The payment date cannot be before year 1900.");
      return;
    }
  }

  const newPayment = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    amount: parseFloat(paymentForm.amount),
    date: paymentForm.date,
    notes: paymentForm.notes
  };

  const index = loans.value.findIndex(l => l.id === selectedLoan.value.id);
  if (index !== -1) {
    loans.value[index].payments.push(newPayment);
    await repository.saveLoans(loans.value);
    
    // Reset payment form
    paymentForm.amount = null;
    paymentForm.date = new Date().toISOString().split('T')[0];
    paymentForm.notes = '';
    
    // Sync references
    selectedLoan.value = loans.value[index];
  }
}

async function deleteRepayment(paymentId) {
  if (!selectedLoan.value) return;

  const index = loans.value.findIndex(l => l.id === selectedLoan.value.id);
  if (index !== -1) {
    loans.value[index].payments = loans.value[index].payments.filter(p => p.id !== paymentId);
    await repository.saveLoans(loans.value);
    
    // Sync references
    selectedLoan.value = loans.value[index];
  }
}

// Repayment Actions for CREDIT LOANS
async function toggleInstallmentStatus(installment) {
  if (!selectedLoan.value) return;

  const index = loans.value.findIndex(l => l.id === selectedLoan.value.id);
  if (index !== -1) {
    const instIndex = loans.value[index].installments.findIndex(i => i.number === installment.number);
    if (instIndex !== -1) {
      const inst = loans.value[index].installments[instIndex];
      if (inst.status === 'paid') {
        inst.status = 'pending';
        inst.paymentDate = '';
      } else {
        inst.status = 'paid';
        inst.paymentDate = new Date().toISOString().split('T')[0];
      }
      
      await repository.saveLoans(loans.value);
      // Sync references
      selectedLoan.value = loans.value[index];
    }
  }
}
</script>

<style scoped>
.loan-tracker-container {
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
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

/* Stats Block styling */
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

.stat-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 100% 100%, rgba(255,255,255,0.02) 0%, transparent 60%);
  pointer-events: none;
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
.stat-card.outstanding .stat-icon { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
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

.stat-val.success { background: linear-gradient(135deg, #10b981, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.stat-val.warning { background: linear-gradient(135deg, #f59e0b, #fbbf24); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.stat-val.info { background: linear-gradient(135deg, #3b82f6, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

/* Filter Tabs */
.filters-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  padding: 0.25rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.filter-tab-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.filter-tab-btn:hover {
  color: var(--text-primary);
}

.filter-tab-btn.active {
  background: var(--surface-color);
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
}

/* Loans Grid */
.loans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.loan-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 190px;
  position: relative;
}

.loan-card:hover .card-actions {
  opacity: 1;
  transform: translateY(0);
}

.loan-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.friend-name {
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

.loan-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 0.15rem;
}

.badge {
  font-size: 0.7rem;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.badge.casual {
  background: rgba(16, 185, 129, 0.12);
  color: var(--primary-accent);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.badge.credit {
  background: rgba(59, 130, 246, 0.12);
  color: var(--secondary-accent);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

/* Progress bar inside card */
.progress-container {
  margin: 1rem 0;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  margin-bottom: 0.4rem;
}

.progress-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.progress-pct {
  color: var(--text-primary);
  font-weight: bold;
}

.progress-bar-bg {
  height: 6px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-bar-fill.casual {
  background: linear-gradient(to right, #059669, var(--primary-accent));
}

.progress-bar-fill.credit {
  background: linear-gradient(to right, #2563eb, var(--secondary-accent));
}

/* Card footer metrics & actions */
.loan-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-top: 1px solid var(--border-color);
  padding-top: 0.75rem;
  margin-top: 0.5rem;
}

.footer-metrics {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.metric-mini {
  display: flex;
  flex-direction: column;
}

.metric-mini.align-right {
  align-items: flex-end;
}

.metric-mini .lbl {
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.metric-mini .val {
  font-size: 0.95rem;
  font-weight: bold;
  color: var(--text-primary);
}

.metric-mini .val.success {
  color: var(--primary-accent);
}

.metric-mini .val-sm {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-primary);
}

/* Hover action buttons overlay */
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
  box-shadow: 0 4px 15px rgba(0,0,0,0.5);
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
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* Empty State Styling */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  gap: 1rem;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.02);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

/* Modals are styled globally in style.css to support sticky headers/footers and centering */

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.15s ease;
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-primary);
}

/* Radio Tab selectors for forms */
.type-selector {
  display: flex;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color);
  padding: 0.25rem;
  border-radius: var(--radius-sm);
}

.type-option {
  flex: 1;
  text-align: center;
  padding: 0.6rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  color: var(--text-secondary);
}

.type-option:hover {
  color: var(--text-primary);
}

.type-option.selected {
  background: var(--surface-color);
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.type-option.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.dynamic-form-fields {
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.notes-textarea {
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  padding: 0.75rem;
  font-family: var(--font-sans);
  width: 100%;
  resize: vertical;
}

.notes-textarea:focus {
  outline: none;
  border-color: var(--primary-accent);
}

.estimated-installment {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  margin-bottom: 1.25rem;
}

.estimated-installment strong {
  color: var(--primary-accent);
  font-size: 1.1rem;
}

.form-actions-row {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  border-top: 1px solid var(--border-color);
  padding-top: 1.25rem;
}

/* Slide Panel Detail Drawer styling (Premium Pattern) */
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
  box-shadow: -10px 0 30px rgba(0,0,0,0.5);
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

.drawer-friend {
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
  margin-bottom: 0.5rem;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-summary-card {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.01);
}

.drawer-metric {
  display: flex;
  flex-direction: column;
}

.drawer-metric .lbl {
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.drawer-metric .val {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: bold;
  color: var(--text-primary);
  margin-top: 0.2rem;
}

.drawer-metric .val.success { color: var(--primary-accent); }
.drawer-metric .val.warning { color: #f59e0b; }

.drawer-notes-block {
  background: rgba(255, 255, 255, 0.02);
  border-left: 3px solid var(--secondary-accent);
  padding: 0.75rem 1rem;
  border-radius: 4px;
}

.drawer-notes-block h5 {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.drawer-notes-block p {
  font-size: 0.85rem;
  color: var(--text-primary);
}

.drawer-section h4 {
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

/* Payments ledger styling */
.empty-ledger {
  text-align: center;
  color: var(--text-secondary);
  padding: 1.5rem;
  font-size: 0.85rem;
}

.payment-ledger-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  max-height: 250px;
  overflow-y: auto;
}

.ledger-item {
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.6rem 0.85rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.2s ease;
}

.ledger-item:hover {
  transform: scale(1.01);
}

.ledger-meta {
  display: flex;
  flex-direction: column;
}

.ledger-date {
  font-size: 0.8rem;
  color: var(--text-primary);
  font-weight: 500;
}

.ledger-note {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.2;
}

.ledger-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ledger-amount {
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--primary-accent);
}

.delete-payment-btn {
  background: transparent;
  border: none;
  font-size: 1.15rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.15s ease;
  line-height: 1;
}

.delete-payment-btn:hover {
  color: #ef4444;
}

/* Inline record form inside details drawer */
.inline-payment-form {
  padding: 1rem;
  border: 1px solid rgba(16, 185, 129, 0.15);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.05);
}

.inline-payment-form h5 {
  font-size: 0.85rem;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
  color: var(--primary-accent);
}

.form-group.small {
  margin-bottom: 0.5rem;
  gap: 0.25rem;
}

.form-group.small label {
  font-size: 0.7rem;
}

.form-group.small input {
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

/* Installments schedule list styling */
.installments-schedule-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.installment-item {
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid var(--border-color);
  padding: 0.65rem 0.85rem;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.25s ease;
}

.installment-item.paid {
  border-color: rgba(16, 185, 129, 0.15);
  background: rgba(16, 185, 129, 0.01);
}

.inst-info {
  display: flex;
  flex-direction: column;
}

.inst-num {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
}

.inst-date {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.inst-pay-date {
  color: var(--primary-accent);
  font-weight: 500;
  margin-left: 0.25rem;
}

.inst-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.inst-amount {
  font-size: 0.85rem;
  font-weight: bold;
}

.installment-item.paid .inst-amount {
  color: var(--primary-accent);
  text-decoration: line-through;
  opacity: 0.6;
}

.btn-toggle-paid {
  border: 1px solid var(--border-color);
  background: transparent;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
  width: 70px;
  text-align: center;
  transition: all 0.2s ease;
}

.btn-toggle-paid.pending {
  color: var(--text-secondary);
}

.btn-toggle-paid.pending:hover {
  background: rgba(16, 185, 129, 0.1);
  border-color: var(--primary-accent);
  color: var(--primary-accent);
}

.btn-toggle-paid.paid {
  background: rgba(16, 185, 129, 0.15);
  border-color: var(--primary-accent);
  color: var(--primary-accent);
}

.btn-toggle-paid.paid:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #ef4444;
}

/* Animations declarations */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-panel-enter-active, .slide-panel-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-panel-enter-from, .slide-panel-leave-to {
  opacity: 0;
}
.slide-panel-enter-from .drawer-panel, .slide-panel-leave-to .drawer-panel {
  transform: translateX(100%);
}
</style>
