<template>
  <div class="card">
    <h2>{{ t('tracker.title') }}</h2>
    <p>{{ t('tracker.subtitle') }}</p>

    <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 1.5rem;">
      <div class="horizon-ruler-container" style="width: 100%; background: rgba(0,0,0,0.25); padding: 1.25rem 1.75rem; border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.1); box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <span style="font-weight: 600; color: var(--text-primary); font-size: 1rem;">{{ t('tracker.projHorizon') }}</span>
          <div style="background: var(--primary-accent); color: #000; font-weight: bold; padding: 0.35rem 0.85rem; border-radius: var(--radius-full); font-size: 0.9rem; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);">
            {{ projectionYears }} {{ projectionYears === 1 ? t('tracker.yearSingular') : t('tracker.yearPlural') }} / {{ baseYear + projectionYears }}
          </div>
        </div>
        
        <div class="ruler-wrapper" style="position: relative; padding: 0.5rem 0;">
          <input 
            type="range" 
            id="projection-horizon-ruler" 
            v-model.number="projectionYears" 
            min="1" 
            max="50" 
            step="1" 
            class="ruler-slider" 
          />
          <div class="ruler-ticks" style="display: flex; justify-content: space-between; padding-top: 0.75rem; font-size: 0.8rem; color: var(--text-secondary); pointer-events: none;">
            <span v-for="tick in [0, 10, 20, 30, 40, 50]" :key="tick" style="text-align: center;">
              <span style="display: block; height: 6px; width: 2px; background: rgba(255,255,255,0.25); margin: 0 auto 4px;"></span>
              {{ baseYear + tick }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="!showAddForm" style="display: flex; justify-content: flex-start;">
        <button class="btn btn-primary" @click="triggerAddMode" style="box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
          {{ t('tracker.addInvestment') }}
        </button>
      </div>
    </div>

    <div style="margin-top: 1.5rem;">
      <div class="table-wrapper">
        <table v-if="investments.length > 0">
          <thead>
            <tr>
              <th>{{ t('tracker.table.name') }}</th>
              <th>{{ t('tracker.table.type') }}</th>
              <th>{{ t('tracker.table.investedValue') }}</th>
              <th>{{ t('tracker.table.balance') }}</th>
              <th>{{ t('tracker.table.monthly') }}</th>
              <th>{{ t('tracker.table.increase') }}</th>
              <th>{{ t('tracker.table.rate') }}</th>
              <th>{{ t('tracker.table.goal', { years: projectionYears }) }}</th>
              <th>{{ t('tracker.table.gapAnalysis') }}</th>
              <th>{{ t('tracker.table.actions') }}</th>
            </tr>
          </thead>
          <tbody v-for="(inv, index) in investments" :key="index">
            <tr :style="editingIndex === index ? 'background: rgba(255,255,255,0.05);' : ''">
              <td>
                <span style="display: block; font-weight: bold;">{{ inv.name }}</span>
                <span style="font-size: 0.75rem; color: var(--text-secondary);">{{ t('tracker.startedLabel') }} {{ formatMonth(inv.actualStartDate) }}</span>
              </td>
              <td>{{ getTranslatedType(inv.type) }}</td>
              <td>{{ formatCurrency(inv.computedInvestedValue || inv.investedValue) }}</td>
              <td>{{ formatCurrency(inv.balance) }}</td>
              <td>{{ formatCurrency(inv.monthly) }}</td>
              <td>{{ inv.increase || 0 }}%</td>
              <td>{{ inv.rate }}%</td>
              <td>
                <div style="color: var(--primary-accent); font-weight: bold; margin-bottom: 0.25rem;">
                  {{ formatCurrency(projected(inv)) }}
                </div>
                <div style="background: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; overflow: hidden; width: 100%;">
                  <div :style="`width: ${Math.min(100, (inv.balance / Math.max(1, projected(inv))) * 100)}%; background: linear-gradient(to right, var(--primary-accent), var(--secondary-accent)); height: 100%;`"></div>
                </div>
                <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 2px;">
                  {{ Math.floor((inv.balance / Math.max(1, projected(inv))) * 100) }}% {{ t('tracker.table.achieved') }}
                </div>
              </td>
              <td>
                <div v-if="hasTimeGap(inv)">
                  <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.3;">
                    <div title="Target Year Reference">{{ t('tracker.gap.refYear') }} <strong style="color: var(--text-primary);">{{ inv.earlyStartYear }}</strong></div>
                    <div title="Hypothetical Balance Today if started in Ref Year" style="color: var(--secondary-accent);">{{ t('tracker.gap.tBal') }} {{ formatCurrency(calculateHypotheticalCurrentBalance(inv)) }}</div>
                    <div title="Theoretical Ultimate Goal if started in Ref Year" style="color: var(--text-primary);">{{ t('tracker.gap.tGoal') }} {{ formatCurrency(calculateEarlyTarget(inv)) }}</div>
                  </div>
                  <div title="Required Monthly Apport today to hit T.Goal" style="font-size: 0.8rem; color: #f87171; font-weight: bold; margin-top: 3px; padding-top: 3px; border-top: 1px dashed rgba(255,255,255,0.1);">
                    {{ t('tracker.gap.catchUp') }} {{ formatCurrency(calculateCatchupApport(inv)) }}{{ t('tracker.gap.perMonth') }}
                  </div>
                </div>
                <div v-else style="font-size: 0.75rem; color: var(--text-secondary); font-style: italic;">
                  {{ t('tracker.gap.startedOnTime') }} (<span style="color: var(--primary-accent);">{{ t('tracker.gap.onTrack') }}</span>)
                </div>
              </td>
              <td>
                <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                  <button class="btn btn-secondary" @click="editInv(index)" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">{{ t('tracker.actions.edit') }}</button>
                  <button class="btn btn-secondary" @click="removeInv(index)" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; border-color: #ef4444; color: #ef4444;">{{ t('tracker.actions.del') }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-else style="padding: 3rem 2rem; text-align: center; color: var(--text-secondary); background: rgba(0,0,0,0.15); border-radius: var(--radius-md); border: 1px dashed var(--border-color); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.25rem;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.5;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            <p style="margin: 0; font-size: 0.95rem; font-weight: 500;">{{ t('tracker.noInvestments') }}</p>
          </div>
          <button class="btn btn-primary" @click="triggerAddMode" style="box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); padding: 0.55rem 1.25rem; font-size: 0.85rem;">
            {{ t('tracker.addInvestment') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ADD INVESTMENT MODAL OVERLAY -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showAddForm" class="modal-overlay">
          <div class="modal-content" style="max-width: 550px;">
            <div class="modal-header">
              <h3>{{ t('tracker.addInvestment') }}</h3>
              <button class="close-btn" @click="cancelEdit">&times;</button>
            </div>
            
            <div class="modal-body">
              <div class="grid-2" style="margin-bottom: 0;">
                <fieldset class="form-fieldset">
                  <legend>{{ t('tracker.form.name') }}</legend>
                  <input type="text" v-model="formInv.name" placeholder="e.g. NuBank Savings" />
                </fieldset>
                
                <fieldset class="form-fieldset">
                  <legend>{{ t('tracker.form.type') }}</legend>
                  <select v-model="formInv.type">
                    <option value="Stocks">{{ t('tracker.types.stocks') }}</option>
                    <option value="Crypto">{{ t('tracker.types.crypto') }}</option>
                    <option value="Real Estate">{{ t('tracker.types.realEstate') }}</option>
                    <option value="Savings">{{ t('tracker.types.savings') }}</option>
                    <option value="Other">{{ t('tracker.types.other') }}</option>
                  </select>
                </fieldset>
                
                <fieldset class="form-fieldset">
                  <legend>{{ t('tracker.form.actualStartDate') }}</legend>
                  <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <select v-model="formInv.startMonth" style="flex: 1;">
                      <option value="01">{{ t('tracker.months.01') }}</option><option value="02">{{ t('tracker.months.02') }}</option><option value="03">{{ t('tracker.months.03') }}</option>
                      <option value="04">{{ t('tracker.months.04') }}</option><option value="05">{{ t('tracker.months.05') }}</option><option value="06">{{ t('tracker.months.06') }}</option>
                      <option value="07">{{ t('tracker.months.07') }}</option><option value="08">{{ t('tracker.months.08') }}</option><option value="09">{{ t('tracker.months.09') }}</option>
                      <option value="10">{{ t('tracker.months.10') }}</option><option value="11">{{ t('tracker.months.11') }}</option><option value="12">{{ t('tracker.months.12') }}</option>
                    </select>
                    <input type="number" v-model.number="formInv.startYear" min="1900" :max="currentYear" step="1" style="flex: 1;" placeholder="YYYY" @input="formInv.startYear = formInv.startYear > currentYear ? currentYear : formInv.startYear" />
                  </div>
                  <span v-if="formInv.startYear && formInv.startYear < 1900" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                    ⚠️ {{ t('validation.minYear') }}
                  </span>
                  <span v-if="formInv.startYear && formInv.startYear > currentYear" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                    ⚠️ {{ t('validation.maxYear') }}
                  </span>
                </fieldset>
                
                <fieldset class="form-fieldset">
                  <legend>{{ t('tracker.form.gapYear') }}</legend>
                  <input type="number" v-model.number="formInv.earlyStartYear" min="1900" :max="currentYear" step="1" @input="formInv.earlyStartYear = formInv.earlyStartYear > currentYear ? currentYear : formInv.earlyStartYear" />
                  <span v-if="formInv.earlyStartYear && formInv.earlyStartYear < 1900" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                    ⚠️ {{ t('validation.minYear') }}
                  </span>
                  <span v-if="formInv.earlyStartYear && formInv.earlyStartYear > currentYear" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                    ⚠️ {{ t('validation.maxYear') }}
                  </span>
                </fieldset>
                
                <fieldset class="form-fieldset">
                  <legend>{{ t('tracker.form.currentApport') }}</legend>
                  <input type="number" v-model.number="formInv.monthly" min="0" max="999999999999999" step="0.01" @input="formInv.monthly = formInv.monthly > 999999999999999 ? 999999999999999 : formInv.monthly" />
                  <span v-if="formInv.monthly > 999999999999999" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                    ⚠️ {{ t('validation.maxLimit') }}
                  </span>
                </fieldset>
                
                <fieldset class="form-fieldset">
                  <legend>{{ t('tracker.form.increase') }}</legend>
                  <input type="number" v-model.number="formInv.increase" min="0" max="100" step="0.01" @input="formInv.increase = formInv.increase > 100 ? 100 : formInv.increase" />
                  <span v-if="formInv.increase >= 100" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                    ⚠️ {{ t('validation.maxRate') }}
                  </span>
                </fieldset>
                
                <fieldset class="form-fieldset">
                  <legend>{{ t('tracker.form.investedValue') }}</legend>
                  <input type="number" v-model.number="formInv.investedValue" min="0" max="999999999999999" step="0.01" @input="formInv.investedValue = formInv.investedValue > 999999999999999 ? 999999999999999 : formInv.investedValue" />
                  <span v-if="formInv.investedValue > 999999999999999" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                    ⚠️ {{ t('validation.maxLimit') }}
                  </span>
                </fieldset>
                
                <fieldset class="form-fieldset">
                  <legend>{{ t('tracker.form.balance') }}</legend>
                  <input type="number" v-model.number="formInv.balance" min="0" max="999999999999999" step="0.01" @input="formInv.balance = formInv.balance > 999999999999999 ? 999999999999999 : formInv.balance" />
                  <span v-if="formInv.balance > 999999999999999" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                    ⚠️ {{ t('validation.maxLimit') }}
                  </span>
                  
                  <div style="margin-top: 0.35rem; display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--text-secondary);">
                    <input type="checkbox" v-model="formInv.alreadyMade" id="alreadyMade" style="accent-color: var(--primary-accent);" />
                    <label for="alreadyMade" style="margin: 0; cursor: pointer; color: inherit;">{{ t('tracker.form.alreadyMade') }}</label>
                  </div>
                </fieldset>
                
                <fieldset class="form-fieldset" style="grid-column: span 2; margin-bottom: 0;">
                  <legend>{{ t('tracker.form.rate') }}</legend>
                  <input type="number" v-model.number="formInv.rate" min="0" max="100" step="0.01" @input="formInv.rate = formInv.rate > 100 ? 100 : formInv.rate" />
                  <span v-if="formInv.rate >= 100" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                    ⚠️ {{ t('validation.maxRate') }}
                  </span>
                </fieldset>
              </div>
            </div>
            
            <div v-if="formError" style="color: #ef4444; padding: 0 1.75rem 0.75rem; font-size: 0.85rem; font-weight: 500;">
              {{ formError }}
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="cancelEdit">{{ t('tracker.form.cancel') }}</button>
              <button class="btn btn-primary" @click="saveInvestment">
                {{ t('tracker.form.add') }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- EDIT INVESTMENT SIDEBAR DRAWER PANEL -->
    <Teleport to="body">
      <transition name="slide-panel">
        <div v-if="editingIndex !== null" class="drawer-overlay">
          <div class="drawer-panel" style="max-width: 480px;">
            <div class="drawer-header" style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid var(--border-color);">
              <div>
                <span class="drawer-friend" style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500;">
                  {{ t('tracker.table.type') }}: {{ getTranslatedType(formInv.type) }}
                </span>
                <h3 class="drawer-title" style="margin: 0; font-size: 1.5rem; font-weight: bold; color: var(--text-primary);">
                  {{ formInv.name || t('tracker.form.save') }}
                </h3>
              </div>
              <button class="close-btn" @click="cancelEdit">&times;</button>
            </div>
            
            <div class="drawer-body" style="flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
              <fieldset class="form-fieldset">
                <legend>{{ t('tracker.form.name') }}</legend>
                <input type="text" v-model="formInv.name" placeholder="e.g. NuBank Savings" />
              </fieldset>
              
              <fieldset class="form-fieldset">
                <legend>{{ t('tracker.form.type') }}</legend>
                <select v-model="formInv.type">
                  <option value="Stocks">{{ t('tracker.types.stocks') }}</option>
                  <option value="Crypto">{{ t('tracker.types.crypto') }}</option>
                  <option value="Real Estate">{{ t('tracker.types.realEstate') }}</option>
                  <option value="Savings">{{ t('tracker.types.savings') }}</option>
                  <option value="Other">{{ t('tracker.types.other') }}</option>
                </select>
              </fieldset>
              
              <fieldset class="form-fieldset">
                <legend>{{ t('tracker.form.actualStartDate') }}</legend>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                  <select v-model="formInv.startMonth" style="flex: 1;">
                    <option value="01">{{ t('tracker.months.01') }}</option><option value="02">{{ t('tracker.months.02') }}</option><option value="03">{{ t('tracker.months.03') }}</option>
                    <option value="04">{{ t('tracker.months.04') }}</option><option value="05">{{ t('tracker.months.05') }}</option><option value="06">{{ t('tracker.months.06') }}</option>
                    <option value="07">{{ t('tracker.months.07') }}</option><option value="08">{{ t('tracker.months.08') }}</option><option value="09">{{ t('tracker.months.09') }}</option>
                    <option value="10">{{ t('tracker.months.10') }}</option><option value="11">{{ t('tracker.months.11') }}</option><option value="12">{{ t('tracker.months.12') }}</option>
                  </select>
                  <input type="number" v-model.number="formInv.startYear" min="1900" :max="currentYear" step="1" style="flex: 1;" placeholder="YYYY" @input="formInv.startYear = formInv.startYear > currentYear ? currentYear : formInv.startYear" />
                </div>
                <span v-if="formInv.startYear && formInv.startYear < 1900" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                  ⚠️ {{ t('validation.minYear') }}
                </span>
                <span v-if="formInv.startYear && formInv.startYear > currentYear" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                  ⚠️ {{ t('validation.maxYear') }}
                </span>
              </fieldset>
              
              <fieldset class="form-fieldset">
                <legend>{{ t('tracker.form.gapYear') }}</legend>
                <input type="number" v-model.number="formInv.earlyStartYear" min="1900" :max="currentYear" step="1" @input="formInv.earlyStartYear = formInv.earlyStartYear > currentYear ? currentYear : formInv.earlyStartYear" />
                <span v-if="formInv.earlyStartYear && formInv.earlyStartYear < 1900" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                  ⚠️ {{ t('validation.minYear') }}
                </span>
                <span v-if="formInv.earlyStartYear && formInv.earlyStartYear > currentYear" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                  ⚠️ {{ t('validation.maxYear') }}
                </span>
              </fieldset>
              
              <fieldset class="form-fieldset">
                <legend>{{ t('tracker.form.currentApport') }}</legend>
                <input type="number" v-model.number="formInv.monthly" min="0" max="999999999999999" step="0.01" @input="formInv.monthly = formInv.monthly > 999999999999999 ? 999999999999999 : formInv.monthly" />
                <span v-if="formInv.monthly > 999999999999999" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                  ⚠️ {{ t('validation.maxLimit') }}
                </span>
              </fieldset>
              
              <fieldset class="form-fieldset">
                <legend>{{ t('tracker.form.increase') }}</legend>
                <input type="number" v-model.number="formInv.increase" min="0" max="100" step="0.01" @input="formInv.increase = formInv.increase > 100 ? 100 : formInv.increase" />
                <span v-if="formInv.increase >= 100" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                  ⚠️ {{ t('validation.maxRate') }}
                </span>
              </fieldset>
              
              <fieldset class="form-fieldset">
                <legend>{{ t('tracker.form.investedValue') }}</legend>
                <input type="number" v-model.number="formInv.investedValue" min="0" max="999999999999999" step="0.01" @input="formInv.investedValue = formInv.investedValue > 999999999999999 ? 999999999999999 : formInv.investedValue" />
                <span v-if="formInv.investedValue > 999999999999999" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                  ⚠️ {{ t('validation.maxLimit') }}
                </span>
              </fieldset>
              
              <fieldset class="form-fieldset">
                <legend>{{ t('tracker.form.balance') }}</legend>
                <input type="number" v-model.number="formInv.balance" min="0" max="999999999999999" step="0.01" @input="formInv.balance = formInv.balance > 999999999999999 ? 999999999999999 : formInv.balance" />
                <span v-if="formInv.balance > 999999999999999" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                  ⚠️ {{ t('validation.maxLimit') }}
                </span>
                
                <div style="margin-top: 0.35rem; display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--text-secondary);">
                  <input type="checkbox" v-model="formInv.alreadyMade" id="alreadyMade_edit" style="accent-color: var(--primary-accent);" />
                  <label for="alreadyMade_edit" style="margin: 0; cursor: pointer; color: inherit;">{{ t('tracker.form.alreadyMade') }}</label>
                </div>
              </fieldset>
              
              <fieldset class="form-fieldset" style="margin-bottom: 0;">
                <legend>{{ t('tracker.form.rate') }}</legend>
                <input type="number" v-model.number="formInv.rate" min="0" max="100" step="0.01" @input="formInv.rate = formInv.rate > 100 ? 100 : formInv.rate" />
                <span v-if="formInv.rate >= 100" style="color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500;">
                  ⚠️ {{ t('validation.maxRate') }}
                </span>
              </fieldset>
            </div>
            
            <div style="padding: 1.5rem; border-top: 1px solid var(--border-color); background: var(--surface-color);">
              <div v-if="formError" style="color: #ef4444; margin-bottom: 0.75rem; font-size: 0.85rem; font-weight: 500;">
                {{ formError }}
              </div>
              <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button class="btn btn-secondary" @click="cancelEdit">{{ t('tracker.form.cancel') }}</button>
                <button class="btn btn-primary" @click="saveInvestment">{{ t('tracker.form.save') }}</button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <ConfirmDialog
      :show="showDeleteConfirm"
      :title="t('tracker.confirmDeleteTitle')"
      :message="t('tracker.confirmDelete')"
      :confirm-text="t('tracker.actions.del')"
      :cancel-text="t('tracker.form.cancel')"
      danger
      @confirm="confirmDeleteInv"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, inject, computed } from 'vue';
import { repository } from '../services/indexedDbRepository';
import { calculateCompoundInterest, calculateRequiredMonthlyContribution } from '../services/financialCalculations';
import ConfirmDialog from './ConfirmDialog.vue';

const { t, formatCurrency } = inject('i18n');

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonthStr = `${currentYear}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

// Available years

const investments = ref([]);
const projectionYears = ref(10);
const showDeleteConfirm = ref(false);
const formError = ref('');

const baseYear = computed(() => {
  if (investments.value.length === 0) return currentYear;
  const years = investments.value.map(inv => {
    if (inv.actualStartDate) {
      const [sy] = inv.actualStartDate.split('-');
      const syInt = Number.parseInt(sy);
      if (!Number.isNaN(syInt)) return syInt;
    }
    if (inv.startYear) {
      const syInt = Number.parseInt(inv.startYear);
      if (!Number.isNaN(syInt)) return syInt;
    }
    return currentYear;
  });
  return Math.min(...years);
});

const indexToDelete = ref(null);
const editingIndex = ref(null);
const expandedRows = ref({});
const showAddForm = ref(false);

const defaultForm = {
  name: '',
  type: 'Savings',
  investedValue: 0,
  balance: 0,
  monthly: 0,
  increase: 0,
  rate: 10,
  alreadyMade: false,
  earlyStartYear: currentYear - 5,
  startMonth: String(currentDate.getMonth() + 1).padStart(2, '0'),
  startYear: currentYear
};

const formInv = ref({ ...defaultForm });
let isLoaded = ref(false);

onMounted(async () => {
  investments.value = await repository.getInvestments();
  investments.value.forEach(inv => {
    if (!inv.earlyStartYear) inv.earlyStartYear = currentYear - 5;
    if (!inv.actualStartDate) inv.actualStartDate = currentMonthStr;
    if (inv.investedValue === undefined) inv.investedValue = inv.initialBalance || Number(inv.balance) || 0;
    delete inv.initialBalance; // Clear legacy reference map natively gracefully cleanly safely dynamically intelligently definitively smoothly systematically completely seamlessly perfectly accurately appropriately fundamentally robustly.
  });
  
  if (investments.value.length === 0) {
    showAddForm.value = true;
  }
  isLoaded.value = true;
});

watch(investments, async (newVal) => {
  if (isLoaded.value) {
    try {
      const plainObj = JSON.parse(JSON.stringify(newVal)); // nosonar
      await repository.saveInvestments(plainObj);
    } catch (e) {
      console.error("Failed to strip structural proxies for IndexedDB:", e);
    }
  }
}, { deep: true });

function formatMonth(dateStr) {
  if (!dateStr) return '';
  const [sy, sm] = dateStr.split('-');
  if (Number.parseInt(sy) < 1900) return `${sm}/1900`;
  return `${sm}/${sy}`;
}

function getElapsedMonths(startDateStr) {
  if (!startDateStr) return 0;
  const [sy, sm] = startDateStr.split('-');
  const syInt = Number.parseInt(sy);
  if (Number.isNaN(syInt) || syInt < 1900) return 0;
  const d = new Date();
  return Math.max(0, (d.getFullYear() - syInt) * 12 + (d.getMonth() + 1 - Number.parseInt(sm)));
}

function hasTimeGap(inv) {
  if (!inv.actualStartDate || !inv.earlyStartYear) return false;
  // A gap fundamentally exists natively whenever physical reality trails theoretical progression targets broadly
  const targetOrganicBalance = calculateHypotheticalCurrentBalance(inv);
  return (targetOrganicBalance - inv.balance) > (inv.monthly * 0.75); // Margin of error safety against fractional months or rates
}

function toggleGap(index) {
  if ((currentYear - (investments.value[index].earlyStartYear || currentYear)) > 0) {
    expandedRows.value[index] = !expandedRows.value[index];
  }
}

function triggerAddMode() {
  cancelEdit(); // Reset form logic and hide other open states
  showAddForm.value = true;
}

function saveInvestment() {
  if (!formInv.value.name) return;

  formError.value = '';

  const startY = Number(formInv.value.startYear);
  const earlyY = Number(formInv.value.earlyStartYear);
  if (Number.isNaN(startY) || startY < 1900 || Number.isNaN(earlyY) || earlyY < 1900) {
    formError.value = t('validation.yearMinAlert');
    return;
  }

  const trimmedName = formInv.value.name.trim().toLowerCase();
  const exists = investments.value.some((inv, idx) => inv.name.trim().toLowerCase() === trimmedName && idx !== editingIndex.value);
  if (exists) {
    formError.value = t('tracker.alertExists');
    return;
  }

  const payload = { ...formInv.value };
  payload.actualStartDate = `${payload.startYear}-${payload.startMonth}`;
  delete payload.startYear;
  delete payload.startMonth;

  if (editingIndex.value === null) {
    investments.value.push(payload);
    showAddForm.value = false; // Hide adding layout upon saving explicitly
  } else {
    investments.value[editingIndex.value] = payload;
    editingIndex.value = null;
  }

  formInv.value = { ...defaultForm };
}

function editInv(index) {
  showAddForm.value = false; // Isolate states explicitly
  editingIndex.value = index;
  formError.value = '';
  
  const target = { ...investments.value[index] };
  target.increase = target.increase || 0;
  if (target.investedValue === undefined) {
    target.investedValue = Number(target.balance) || 0;
  }
  if (target.alreadyMade === undefined) {
    target.alreadyMade = false;
  }
  target.earlyStartYear = target.earlyStartYear || (currentYear - 5);
  target.actualStartDate = target.actualStartDate || currentMonthStr;
  
  const [sy, sm] = target.actualStartDate.split('-');
  target.startYear = Number.parseInt(sy);
  target.startMonth = sm;
  
  formInv.value = target;
}

function cancelEdit() {
  editingIndex.value = null;
  showAddForm.value = false;
  formInv.value = { ...defaultForm };
  formError.value = '';
}

function removeInv(index) {
  indexToDelete.value = index;
  showDeleteConfirm.value = true;
}

function confirmDeleteInv() {
  if (indexToDelete.value !== null) {
    const index = indexToDelete.value;
    if (editingIndex.value === index) cancelEdit();
    investments.value.splice(index, 1);
    expandedRows.value[index] = false;
    
    if (investments.value.length === 0) {
      showAddForm.value = true;
    }
    showDeleteConfirm.value = false;
    indexToDelete.value = null;
  }
}

function getTranslatedType(type) {
  if (!type) return '';
  const map = {
    'Stocks': 'tracker.types.stocks',
    'Crypto': 'tracker.types.crypto',
    'Real Estate': 'tracker.types.realEstate',
    'Savings': 'tracker.types.savings',
    'Other': 'tracker.types.other'
  };
  const key = map[type];
  return key ? t(key) : type;
}

function projected(inv) {
  const months = projectionYears.value * 12;
  const monthlyRate = (inv.rate / 100) / 12;
  return calculateCompoundInterest(inv.balance, inv.monthly, monthlyRate, months, inv.increase || 0, getElapsedMonths(inv.actualStartDate));
}

function calculateEarlyOffset(inv) {
  const earlyY = inv.earlyStartYear || currentYear;
  if (earlyY < 1900) return 0;
  return Math.max(0, currentYear - earlyY);
}

function getOriginalApport(inv) {
  const earlyY = inv.earlyStartYear || currentYear;
  if (earlyY < 1900) return inv.monthly;
  const hypotheticalMonthsElapsed = getElapsedMonths(`${earlyY}-01`);
  const yearsPassed = Math.floor(hypotheticalMonthsElapsed / 12);
  
  if (yearsPassed > 0 && inv.increase > 0) {
    return inv.monthly / Math.pow(1 + (inv.increase / 100), yearsPassed);
  }
  return inv.monthly;
}

function calculateHypotheticalCurrentBalance(inv) {
  const earlyY = inv.earlyStartYear || currentYear;
  if (earlyY < 1900) return 0;
  const hypotheticalMonthsElapsed = getElapsedMonths(`${earlyY}-01`);
  const monthlyRate = (inv.rate / 100) / 12;
  const originalApport = getOriginalApport(inv);
  return calculateCompoundInterest(0, originalApport, monthlyRate, hypotheticalMonthsElapsed, inv.increase || 0, 0);
}

function calculateEarlyTarget(inv) {
  const earlyY = inv.earlyStartYear || currentYear;
  if (earlyY < 1900) return 0;
  const hypotheticalMonthsElapsed = getElapsedMonths(`${earlyY}-01`);
  const extendedMonths = (projectionYears.value * 12) + hypotheticalMonthsElapsed;
  const monthlyRate = (inv.rate / 100) / 12;
  const originalApport = getOriginalApport(inv);
  return calculateCompoundInterest(0, originalApport, monthlyRate, extendedMonths, inv.increase || 0, 0);
}

function calculateCatchupApport(inv) {
  const standardMonths = projectionYears.value * 12;
  const monthlyRate = (inv.rate / 100) / 12;
  const targetToHit = calculateEarlyTarget(inv);
  
  if (standardMonths <= 0) return 0;
  // Apply binary search with offset parameters organically
  return calculateRequiredMonthlyContribution(targetToHit, inv.balance, monthlyRate, standardMonths, inv.increase || 0, getElapsedMonths(inv.actualStartDate));
}
</script>

<style scoped>
/* Modals are styled globally in style.css to support sticky headers/footers and centering */

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.75rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.15s ease;
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-primary);
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
  max-width: 480px;
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

/* Premium Interactive 50-Year Ruler Slider */
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
</style>
