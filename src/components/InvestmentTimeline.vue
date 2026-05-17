<template>
  <div class="card">
    <h2>{{ t('timeline.title') }}</h2>
    <p>{{ t('timeline.subtitle') }}</p>

    <div v-if="timelineGroups.length === 0" style="margin-top: 1rem;">
      <p style="color: var(--text-secondary);">{{ t('timeline.empty') }}</p>
    </div>
    
    <div v-else style="margin-top: 2rem;">
      <div style="margin-bottom: 2rem; padding: 1.5rem; background: var(--surface-color); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text-primary);">{{ t('timeline.progressTitle') }}</h3>
        
        <div class="grid-2" style="margin-bottom: 1.5rem;">
          <div class="metric">
            <span class="metric-label">{{ t('timeline.theoreticalFuture') }}</span>
            <span class="metric-value small">{{ formatCurrency(theoreticalTotal) }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">{{ t('timeline.actualVerified') }}</span>
            <span class="metric-value small" style="color: var(--primary-accent);">{{ formatCurrency(realLifeTotal) }}</span>
          </div>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); height: 12px; border-radius: 6px; overflow: hidden; width: 100%;">
          <div :style="`width: ${Math.min(100, (realLifeTotal / Math.max(1, theoreticalTotal)) * 100)}%; background: linear-gradient(to right, var(--secondary-accent), var(--primary-accent)); height: 100%; transition: width 0.5s ease;`"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">
          <span>0%</span>
          <span>{{ Math.floor((realLifeTotal / Math.max(1, theoreticalTotal)) * 100) }}% {{ t('timeline.relativePlan') }}</span>
        </div>
      </div>

      <!-- ARCHIVE -->
      <div v-if="pastTimelineGroups.length > 0" style="margin-bottom: 2rem;">
        <button class="btn btn-secondary" @click="showArchive = !showArchive" style="width: 100%; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2);">
          <span>{{ t('timeline.archive') }} ({{ pastTimelineGroups.length }})</span>
          <span>{{ showArchive ? '▲' : '▼' }}</span>
        </button>
        
        <div v-show="showArchive" style="margin-top: 1.5rem; padding-left: 1rem; border-left: 2px solid rgba(255,255,255,0.1);">
          <div v-for="group in pastTimelineGroups" :key="group.label" style="margin-bottom: 2rem;">
            <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1rem; color: var(--secondary-accent);">{{ group.label }}</h4>
            <div v-for="item in group.items" :key="item.id" style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: rgba(255,255,255,0.02); margin-bottom: 0.5rem; border-radius: var(--radius-sm); border-left: 4px solid transparent;" :style="stateMap[item.id]?.checked ? 'border-left-color: var(--primary-accent); background: rgba(16, 185, 129, 0.05);' : ''">
              <div style="flex: 1;">
                <strong style="display: block;">{{ item.invName }}</strong> 
                <span style="color: var(--text-secondary); font-size: 0.8rem;">{{ t('timeline.expected') }} {{ formatCurrency(item.amount) }}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; justify-content: flex-end;">
                <div v-if="stateMap[item.id]?.checked" style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                  <div style="display: flex; align-items: center; gap: 0.25rem;">
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">{{ t('timeline.apport') }}:</span>
                    <input type="number" v-model.number="stateMap[item.id].actualValue" @input="stateMap[item.id].actualValue = stateMap[item.id].actualValue > 999999999999999 ? 999999999999999 : stateMap[item.id].actualValue" @blur="saveState" step="0.01" max="999999999999999" style="width: 90px; padding: 0.25rem 0.5rem; font-size: 0.85rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: var(--radius-sm);" />
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.25rem;">
                    <span style="font-size: 0.8rem; color: var(--secondary-accent);">{{ t('timeline.reportedBalance') }}:</span>
                    <input type="number" v-model.number="stateMap[item.id].reportedBalance" @input="stateMap[item.id].reportedBalance = stateMap[item.id].reportedBalance > 999999999999999 ? 999999999999999 : stateMap[item.id].reportedBalance" @blur="saveState" step="0.01" max="999999999999999" placeholder="" style="width: 100px; padding: 0.25rem 0.5rem; font-size: 0.85rem; background: rgba(0,0,0,0.2); border: 1px solid var(--secondary-accent); color: var(--secondary-accent); border-radius: var(--radius-sm);" />
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;" @click="toggleCheck(item.id, item.amount)">
                  <span :style="stateMap[item.id]?.checked ? 'color: var(--primary-accent); font-weight: bold;' : 'color: var(--text-secondary);'">
                    {{ stateMap[item.id]?.checked ? t('timeline.status.done') : t('timeline.status.pending') }}
                  </span>
                  <input type="checkbox" :checked="stateMap[item.id]?.checked" @click.stop="toggleCheck(item.id, item.amount)" style="width: 1.25rem; height: 1.25rem; accent-color: var(--primary-accent); cursor: pointer;" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- CURRENT AND FUTURE -->
      <div v-for="group in activeTimelineGroups" :key="group.label" style="margin-bottom: 2rem;">
        <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1rem; color: var(--secondary-accent);">{{ group.label }}</h4>
        <div v-for="item in group.items" :key="item.id" style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: rgba(255,255,255,0.02); margin-bottom: 0.5rem; border-radius: var(--radius-sm); border-left: 4px solid transparent;" :style="stateMap[item.id]?.checked ? 'border-left-color: var(--primary-accent); background: rgba(16, 185, 129, 0.05);' : ''">
          <div style="flex: 1;">
            <strong style="display: block;">{{ item.invName }}</strong> 
            <span style="color: var(--text-secondary); font-size: 0.8rem;">{{ t('timeline.expected') }} {{ formatCurrency(item.amount) }}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; justify-content: flex-end;">
            <div v-if="stateMap[item.id]?.checked" style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 0.25rem;">
                <span style="font-size: 0.8rem; color: var(--text-secondary);">{{ t('timeline.apport') }}:</span>
                <input type="number" v-model.number="stateMap[item.id].actualValue" @input="stateMap[item.id].actualValue = stateMap[item.id].actualValue > 999999999999999 ? 999999999999999 : stateMap[item.id].actualValue" @blur="saveState" step="0.01" max="999999999999999" style="width: 90px; padding: 0.25rem 0.5rem; font-size: 0.85rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: var(--radius-sm);" />
              </div>
              <div style="display: flex; align-items: center; gap: 0.25rem;">
                <span style="font-size: 0.8rem; color: var(--secondary-accent);">{{ t('timeline.reportedBalance') }}:</span>
                <input type="number" v-model.number="stateMap[item.id].reportedBalance" @input="stateMap[item.id].reportedBalance = stateMap[item.id].reportedBalance > 999999999999999 ? 999999999999999 : stateMap[item.id].reportedBalance" @blur="saveState" step="0.01" max="999999999999999" placeholder="" style="width: 100px; padding: 0.25rem 0.5rem; font-size: 0.85rem; background: rgba(0,0,0,0.2); border: 1px solid var(--secondary-accent); color: var(--secondary-accent); border-radius: var(--radius-sm);" />
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;" @click="toggleCheck(item.id, item.amount)">
              <span :style="stateMap[item.id]?.checked ? 'color: var(--primary-accent); font-weight: bold;' : 'color: var(--text-secondary);'">
                {{ stateMap[item.id]?.checked ? t('timeline.status.done') : t('timeline.status.pending') }}
              </span>
              <input type="checkbox" :checked="stateMap[item.id]?.checked" @click.stop="toggleCheck(item.id, item.amount)" style="width: 1.25rem; height: 1.25rem; accent-color: var(--primary-accent); cursor: pointer;" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject } from 'vue';
import { repository } from '../services/indexedDbRepository';

const { t, formatCurrency, locale } = inject('i18n');

const timelineGroups = ref([]);
const showArchive = ref(false);
const activeTimelineGroups = computed(() => timelineGroups.value.filter(g => !g.isPast));
const pastTimelineGroups = computed(() => timelineGroups.value.filter(g => g.isPast));

const stateMap = ref({});
const investments = ref([]);

onMounted(async () => {
  investments.value = await repository.getInvestments();
  const rawState = await repository.getTimelineState();
  
  // Data Migration hook: if old state map has true/false instead of object {checked: true, actualValue: num}
  const migratedState = {};
  for(const [key, value] of Object.entries(rawState)) {
    if (typeof value === 'boolean') {
      migratedState[key] = { checked: value, actualValue: 0 }; // We don't know the exact base value without inverse lookup, handle dynamically
    } else {
      migratedState[key] = value;
    }
  }
  stateMap.value = migratedState;
  
  generateTimeline();
});

function toggleCheck(id, defaultExpected) {
  if (stateMap.value[id]) {
    // Toggle
    stateMap.value[id].checked = !stateMap.value[id].checked;
    if (stateMap.value[id].checked) {
      stateMap.value[id].actualValue = stateMap.value[id].actualValue || defaultExpected;
      if (stateMap.value[id].reportedBalance === undefined) {
        stateMap.value[id].reportedBalance = null;
      }
    }
  } else {
    stateMap.value[id] = { checked: true, actualValue: defaultExpected, reportedBalance: null };
  }
  saveState();
}

function generateTimeline() {
  const groups = [];
  const currentDate = new Date();
  
  let maxHistoricalMonths = 0;
  if (investments.value && investments.value.length > 0) {
    investments.value.forEach(inv => {
      if (inv.actualStartDate) {
        const [sy, sm] = inv.actualStartDate.split('-');
        const elapsed = (currentDate.getFullYear() - Number.parseInt(sy)) * 12 + (currentDate.getMonth() + 1 - Number.parseInt(sm));
        if (elapsed > maxHistoricalMonths) maxHistoricalMonths = elapsed;
      }
    });
  }
  
  // Iterate from the earliest historical start date to 24 months organically in the future
  for (let m = -maxHistoricalMonths; m < 24; m++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + m, 1);
    
    // Natively hook translation formats instead of hardcoded en-US explicitly safely
    const monthLabel = new Intl.DateTimeFormat(locale.value, { month: 'long', year: 'numeric' }).format(d);
    
    const groupKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    const items = investments.value.map(inv => {
      let elapsedPrior = 0;
      if (inv.actualStartDate) {
        const [sy, sm] = inv.actualStartDate.split('-');
        elapsedPrior = (currentDate.getFullYear() - Number.parseInt(sy)) * 12 + (currentDate.getMonth() + 1 - Number.parseInt(sm));
      }
      
      // If elapsedPrior + m < 0, this specific investment hadn't aggressively physically launched natively yet
      if (elapsedPrior + m < 0) return null;
      
      // If current month investment already included inside initial principal natively, optionally skip "m=0" natively
      if (m === 0 && inv.alreadyMade) return null;
      
      let amount = Number.parseFloat(inv.monthly);
      if (inv.increase && inv.increase > 0) {
        const newAnniversaries = Math.floor((elapsedPrior + m) / 12) - Math.floor(elapsedPrior / 12);
        if (newAnniversaries !== 0) {
          amount = amount * Math.pow(1 + (inv.increase / 100), newAnniversaries);
        }
      }
      return {
        id: `${inv.name}_${groupKey}`,
        invName: inv.name,
        type: inv.type,
        amount: amount,
      };
    }).filter(i => i !== null && i.amount > 0);
    
    if (items.length > 0) {
      groups.push({
        label: monthLabel,
        groupKey,
        isPast: m < 0,
        items
      });
      // Safety backward compatibility for migrated boolean maps without values
      items.forEach(i => {
        if (stateMap.value[i.id] && stateMap.value[i.id].actualValue === 0) {
           stateMap.value[i.id].actualValue = i.amount; 
        }
      });
    }
  }
  
  timelineGroups.value = groups;
}

function saveState() {
  try {
    const plainObj = JSON.parse(JSON.stringify(stateMap.value)); // nosonar
    repository.saveTimelineState(plainObj);
    
    // Dynamic Balance Synchronization organically natively
    if (investments.value && investments.value.length > 0) {
      const updatedInvs = JSON.parse(JSON.stringify(investments.value)); // nosonar
      updatedInvs.forEach(inv => {
         let currentBal = Number.parseFloat(inv.investedValue || 0);
         let currentInvested = Number.parseFloat(inv.investedValue || 0);
         
         // Extract and organically sort keys explicitly filtering this investment specifically
         const sortedKeys = Object.keys(plainObj)
           .filter(k => k.startsWith(inv.name + "_"))
           .sort((a, b) => a.split('_')[1].localeCompare(b.split('_')[1]));
         
         for (const key of sortedKeys) {
           const state = plainObj[key];
           if (state.checked) {
              const apport = Number.parseFloat(state.actualValue || 0);
              currentInvested += apport;
              
              if (state.reportedBalance !== null && state.reportedBalance !== undefined && state.reportedBalance !== '') {
                 // Explicitly overridden dynamically
                 currentBal = Number.parseFloat(state.reportedBalance);
              } else {
                 // Increment mathematically iteratively purely off apports inherently precisely securely logically inherently natively gracefully safely properly
                 currentBal += apport;
              }
           }
         }
         inv.balance = currentBal;
         inv.computedInvestedValue = currentInvested;
      });
      
      // Save synchronized balances back to core portfolio database structurally
      repository.saveInvestments(updatedInvs);
      investments.value = updatedInvs;
    }
  } catch (e) {
    console.error("Failed to strip structural proxies for IndexedDB:", e);
  }
}

const theoreticalTotal = computed(() => {
  let sum = investments.value.reduce((acc, inv) => acc + Number.parseFloat(inv.investedValue || 0), 0);
  timelineGroups.value.forEach(g => {
    g.items.forEach(item => sum += item.amount);
  });
  return sum;
});

const realLifeTotal = computed(() => {
  return investments.value.reduce((acc, inv) => acc + Number.parseFloat(inv.balance || 0), 0);
});

</script>
