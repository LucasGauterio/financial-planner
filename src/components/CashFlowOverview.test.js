import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CashFlowOverview from './CashFlowOverview.vue';
import { repository } from '../services/indexedDbRepository';

vi.mock('../services/indexedDbRepository', () => ({
  repository: {
    getIncome: vi.fn(),
    getExpenses: vi.fn(),
    saveIncome: vi.fn(),
    saveExpenses: vi.fn()
  }
}));

const i18nStub = {
  provide: {
    i18n: {
      t: (key) => key,
      formatCurrency: (val) => `$${val}`,
      locale: { value: 'en-US' }
    }
  }
};

describe('CashFlowOverview.vue', () => {
  beforeEach(() => {
    repository.getIncome.mockReset();
    repository.getExpenses.mockReset();
    repository.saveIncome.mockReset();
    repository.saveExpenses.mockReset();
    repository.saveIncome.mockResolvedValue();
    repository.saveExpenses.mockResolvedValue();
    // Pin "today" so fixtures using startMonth: '2026-01' project a deterministic entry
    // count regardless of the real wall-clock date (the projection horizon catch-up, per
    // the current-month bug fix, is anchored to `new Date()`).
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the empty state when there are no income or expense sources', async () => {
    repository.getIncome.mockResolvedValue([]);
    repository.getExpenses.mockResolvedValue([]);

    const wrapper = mount(CashFlowOverview, { global: i18nStub });
    await flushPromises();

    expect(repository.getIncome).toHaveBeenCalled();
    expect(repository.getExpenses).toHaveBeenCalled();
    expect(wrapper.find('.empty-state').exists()).toBe(true);
  });

  it('renders the projection horizon as a month-by-month ruler slider, matching Portfolio/Income/Expense (ADR-013)', async () => {
    repository.getIncome.mockResolvedValue([]);
    repository.getExpenses.mockResolvedValue([]);

    const wrapper = mount(CashFlowOverview, { global: i18nStub });
    await flushPromises();

    const slider = wrapper.find('input.ruler-slider[type="range"]');
    expect(slider.exists()).toBe(true);
    expect(slider.attributes('min')).toBe('1');
    expect(slider.attributes('max')).toBe('420');
    expect(slider.attributes('step')).toBe('1');
    expect(slider.element.value).toBe('1');
  });

  it('merges income and expense entries into a single month-grouped list', async () => {
    repository.getIncome.mockResolvedValue([
      { id: 'i1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);
    repository.getExpenses.mockResolvedValue([
      { id: 'e1', name: 'Aluguel', type: 'conta fixa', amount: 1500, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    const wrapper = mount(CashFlowOverview, { global: i18nStub });
    await flushPromises();

    expect(wrapper.text()).toContain('Salário');
    expect(wrapper.text()).toContain('Aluguel');
    // Default horizon is 1 month (current month only); both sources are monthly-recurring, so 1 entry each.
    expect(wrapper.findAll('.cash-flow-entry-row').length).toBe(2);
    expect(wrapper.find('.month-totals').exists()).toBe(true);
  });

  it('toggling an income entry persists via saveIncome only', async () => {
    repository.getIncome.mockResolvedValue([
      { id: 'i1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);
    repository.getExpenses.mockResolvedValue([
      { id: 'e1', name: 'Aluguel', type: 'conta fixa', amount: 1500, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    const wrapper = mount(CashFlowOverview, { global: i18nStub });
    await flushPromises();

    const incomeRow = wrapper.findAll('.cash-flow-entry-row').find(r => r.text().includes('Salário'));
    await incomeRow.find('.btn-toggle-status').trigger('click');
    await flushPromises();

    expect(repository.saveIncome).toHaveBeenCalled();
    expect(repository.saveExpenses).not.toHaveBeenCalled();
    const savedIncome = repository.saveIncome.mock.calls[0][0];
    expect(savedIncome[0].statusOverrides['2026-01']).toEqual({ status: 'received', actualAmount: 5000 });
  });

  it('toggling an expense entry persists via saveExpenses only', async () => {
    repository.getIncome.mockResolvedValue([
      { id: 'i1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);
    repository.getExpenses.mockResolvedValue([
      { id: 'e1', name: 'Aluguel', type: 'conta fixa', amount: 1500, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    const wrapper = mount(CashFlowOverview, { global: i18nStub });
    await flushPromises();

    const expenseRow = wrapper.findAll('.cash-flow-entry-row').find(r => r.text().includes('Aluguel'));
    await expenseRow.find('.btn-toggle-status').trigger('click');
    await flushPromises();

    expect(repository.saveExpenses).toHaveBeenCalled();
    expect(repository.saveIncome).not.toHaveBeenCalled();
    const savedExpenses = repository.saveExpenses.mock.calls[0][0];
    expect(savedExpenses[0].statusOverrides['2026-01']).toEqual({ status: 'paid', actualAmount: 1500 });
  });

  it('reveals and persists an editable actual amount the same way the owning tracker does', async () => {
    repository.getIncome.mockResolvedValue([
      { id: 'i1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: { '2026-01': { status: 'received', actualAmount: 5000 } } }
    ]);
    repository.getExpenses.mockResolvedValue([]);

    const wrapper = mount(CashFlowOverview, { global: i18nStub });
    await flushPromises();

    const input = wrapper.find('.actual-amount-input');
    expect(input.exists()).toBe(true);
    await input.setValue(4800);
    await input.trigger('blur');
    await flushPromises();

    const savedIncome = repository.saveIncome.mock.calls[0][0];
    expect(savedIncome[0].statusOverrides['2026-01']).toMatchObject({ status: 'received', actualAmount: 4800 });
  });

  it("month header totals match cashFlowCalculations' combined output", async () => {
    repository.getIncome.mockResolvedValue([
      { id: 'i1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: { '2026-01': { status: 'received', actualAmount: 4800 } } }
    ]);
    repository.getExpenses.mockResolvedValue([
      { id: 'e1', name: 'Aluguel', type: 'conta fixa', amount: 1500, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    const wrapper = mount(CashFlowOverview, { global: i18nStub });
    await flushPromises();

    expect(wrapper.find('.total-received').text()).toContain('4800');
    expect(wrapper.find('.total-pending').text()).toContain('1500');
    // net = (received 4800 + pendingIncome 0) - (paid 0 + pendingExpense 1500) = 3300,
    // not the previous (buggy) sum of every entry regardless of kind.
    expect(wrapper.find('.total-net').text()).toContain('3300');
  });

  it('shows a negative net (styled distinctly) when expenses exceed income for the month (bug fix)', async () => {
    repository.getIncome.mockResolvedValue([
      { id: 'i1', name: 'Salário', type: 'salario', amount: 1000, startMonth: '2026-01', recurring: true, statusOverrides: { '2026-01': { status: 'received', actualAmount: 1000 } } }
    ]);
    repository.getExpenses.mockResolvedValue([
      { id: 'e1', name: 'Aluguel', type: 'conta fixa', amount: 2500, startMonth: '2026-01', recurring: true, statusOverrides: { '2026-01': { status: 'paid', actualAmount: 2500 } } }
    ]);

    const wrapper = mount(CashFlowOverview, { global: i18nStub });
    await flushPromises();

    const netEl = wrapper.find('.total-net');
    expect(netEl.text()).toContain('-1500');
    expect(netEl.classes()).toContain('negative');
  });
});
