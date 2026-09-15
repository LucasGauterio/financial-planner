import { mount, flushPromises, DOMWrapper } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ExpenseTracker from './ExpenseTracker.vue';
import { repository } from '../services/indexedDbRepository';

vi.mock('../services/indexedDbRepository', () => ({
  repository: {
    getExpenses: vi.fn(),
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

describe('ExpenseTracker.vue', () => {
  let wrapper;

  beforeEach(() => {
    repository.getExpenses.mockReset();
    repository.saveExpenses.mockReset();
    repository.saveExpenses.mockResolvedValue();
    // Pin "today" so fixtures using startMonth: '2026-01' project a deterministic entry
    // count regardless of the real wall-clock date (generateExpenseProjection's horizon
    // catch-up, per the current-month bug fix, is anchored to `new Date()`).
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00'));
  });

  // Several tests open a source's Teleported detail drawer and never explicitly close
  // it before the test ends. @vue/test-utils does not auto-unmount between tests, so
  // without this, that Teleported DOM would leak into document.body across tests and
  // pollute later `DOMWrapper(document.body)` queries.
  afterEach(() => {
    wrapper?.unmount();
    vi.useRealTimers();
  });

  it('renders the empty state when there are no expense sources', async () => {
    repository.getExpenses.mockResolvedValue([]);

    wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    expect(repository.getExpenses).toHaveBeenCalled();
    expect(wrapper.find('.empty-state').exists()).toBe(true);
  });

  it('renders the projection horizon as a month-by-month ruler slider, defaulting to a near-term view (ADR-012)', async () => {
    repository.getExpenses.mockResolvedValue([]);

    wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    const slider = wrapper.find('input.ruler-slider[type="range"]');
    expect(slider.exists()).toBe(true);
    expect(slider.attributes('min')).toBe('1');
    expect(slider.attributes('max')).toBe('420');
    expect(slider.attributes('step')).toBe('1');
    expect(slider.element.value).toBe('1');

    await slider.setValue(10);
    await flushPromises();
    // i18nStub's t() doesn't interpolate params, so assert on the resulting month/year
    // label instead, which still proves the slider's v-model binding drives horizonMonths.
    const target = new Date(new Date().getFullYear(), new Date().getMonth() + 9, 1);
    const expectedLabel = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(target);
    expect(wrapper.find('.horizon-ruler-badge').text()).toContain(expectedLabel);
  });

  it('renders a stats dashboard with total/paid/pending aggregated across the horizon', async () => {
    repository.getExpenses.mockResolvedValue([
      { id: 's1', name: 'Aluguel', type: 'conta fixa', amount: 1500, startMonth: '2026-01', recurring: false, statusOverrides: { '2026-01': { status: 'paid', actualAmount: 1450 } } }
    ]);

    wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    const statVals = wrapper.findAll('.stat-val').map(el => el.text());
    expect(statVals).toContain('$1450');
  });

  it('scopes the stats dashboard to the selected horizon window, excluding catch-up backlog (ADR-014)', async () => {
    // Source registered 7 months before the pinned "today" (2026-01) — the current-month
    // catch-up fix (BUGFIX-001) means projectionEntries spans back to 2025-06, but the
    // stats dashboard must only aggregate the 1-month window actually selected via the
    // ruler (default horizonMonths: 1 → 2026-01 only), not the whole backlog.
    repository.getExpenses.mockResolvedValue([
      { id: 's1', name: 'Aluguel', type: 'conta fixa', amount: 1000, startMonth: '2025-06', recurring: true, statusOverrides: {} }
    ]);

    wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    const statVals = wrapper.findAll('.stat-val').map(el => el.text());
    // 1 month x 1000 pending = 1000, NOT the 8-month backlog total (8000).
    expect(statVals).toContain('$1000');
    expect(statVals).not.toContain('$8000');
  });

  it('scopes the stats dashboard to the selected horizon window, excluding a bounded source\'s overflow beyond it (ADR-014)', async () => {
    // Bounded source (ADR-011) always projects its full span in the drawer regardless of
    // horizon, but the stats dashboard must still respect the selected horizon window.
    repository.getExpenses.mockResolvedValue([
      { id: 's1', name: 'Financiamento', type: 'fixed bill', amount: 1000, startMonth: '2026-01', recurring: true, endMonth: '2027-01', statusOverrides: {} }
    ]);

    wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    const statVals = wrapper.findAll('.stat-val').map(el => el.text());
    // 1-month window x 1000 pending = 1000, NOT the full 13-month bounded span (13000).
    expect(statVals).toContain('$1000');
    expect(statVals).not.toContain('$13000');
  });

  it('renders one card per registered source', async () => {
    repository.getExpenses.mockResolvedValue([
      { id: 's1', name: 'Aluguel', type: 'conta fixa', amount: 1500, startMonth: '2026-01', recurring: true, statusOverrides: {} },
      { id: 's2', name: 'Streaming', type: 'assinatura', amount: 40, startMonth: '2026-02', recurring: false, statusOverrides: {} }
    ]);

    wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    expect(wrapper.text()).toContain('Aluguel');
    expect(wrapper.text()).toContain('Streaming');
    expect(wrapper.findAll('.source-card')).toHaveLength(2);
  });

  it("opening a source's card shows a drawer scoped to only that source's projection", async () => {
    repository.getExpenses.mockResolvedValue([
      { id: 's1', name: 'Aluguel', type: 'conta fixa', amount: 1500, startMonth: '2026-01', recurring: true, statusOverrides: {} },
      { id: 's2', name: 'Streaming', type: 'assinatura', amount: 40, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    const cards = wrapper.findAll('.source-card');
    await cards[0].trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    expect(body.find('.drawer-panel').exists()).toBe(true);
    expect(body.find('.drawer-title').text()).toBe('Aluguel');
    // Default horizon is 1 month (current month only); 1 entry/month for the selected source only.
    expect(body.findAll('.expense-entry-row')).toHaveLength(1);
  });

  it('closes the drawer via the close button', async () => {
    repository.getExpenses.mockResolvedValue([
      { id: 's1', name: 'Aluguel', type: 'conta fixa', amount: 1500, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.source-card').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    await body.find('.drawer-panel .close-btn').trigger('click');
    await flushPromises();

    expect(document.body.querySelector('.drawer-panel')).toBeNull();
  });

  it('toggles an entry status from inside the drawer and persists the change', async () => {
    repository.getExpenses.mockResolvedValue([
      { id: 's1', name: 'Aluguel', type: 'conta fixa', amount: 1500, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.source-card').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    const toggleBtn = body.find('.btn-toggle-status');
    expect(toggleBtn.classes()).not.toContain('paid');

    await toggleBtn.trigger('click');
    await flushPromises();

    expect(repository.saveExpenses).toHaveBeenCalled();
    const savedSources = repository.saveExpenses.mock.calls[0][0];
    expect(savedSources[0].statusOverrides['2026-01']).toEqual({ status: 'paid', actualAmount: 1500 });
  });

  it('reveals an editable actual-amount input defaulting to the expected amount when marked paid (TD-01)', async () => {
    repository.getExpenses.mockResolvedValue([
      { id: 's1', name: 'Aluguel', type: 'conta fixa', amount: 1500, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.source-card').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    expect(body.find('.actual-amount-input').exists()).toBe(false);

    await body.find('.btn-toggle-status').trigger('click');
    await flushPromises();

    const input = body.find('.actual-amount-input');
    expect(input.exists()).toBe(true);
    expect(input.element.value).toBe('1500');
  });

  it('persists an edited actual amount on blur from inside the drawer (TD-01)', async () => {
    repository.getExpenses.mockResolvedValue([
      { id: 's1', name: 'Aluguel', type: 'conta fixa', amount: 1500, startMonth: '2026-01', recurring: true, statusOverrides: { '2026-01': { status: 'paid', actualAmount: 1500 } } }
    ]);

    wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.source-card').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    const input = body.find('.actual-amount-input');
    await input.setValue(1450);
    await input.trigger('blur');
    await flushPromises();

    const savedSources = repository.saveExpenses.mock.calls[0][0];
    expect(savedSources[0].statusOverrides['2026-01']).toMatchObject({ status: 'paid', actualAmount: 1450 });
  });

  it('adds a new expense source through the form', async () => {
    repository.getExpenses.mockResolvedValue([]);

    wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.btn-primary').trigger('click');
    await flushPromises();

    // The add-source form is rendered inside <Teleport to="body">, so it must
    // be queried against document.body rather than the component's own wrapper.
    const body = new DOMWrapper(document.body);

    await body.find('input[type="text"]').setValue('Streaming');
    const typeInput = body.findAll('input[type="text"]')[1];
    await typeInput.setValue('assinatura');
    await body.find('input[type="number"]').setValue(40);
    await body.find('input[type="month"]').setValue('2026-05');

    await body.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(repository.saveExpenses).toHaveBeenCalled();
    const savedSources = repository.saveExpenses.mock.calls[0][0];
    expect(savedSources).toHaveLength(1);
    expect(savedSources[0]).toMatchObject({ name: 'Streaming', type: 'assinatura', amount: 40, startMonth: '2026-05' });
  });

  it('persists an optional endMonth for a recurring source', async () => {
    repository.getExpenses.mockResolvedValue([]);

    wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.btn-primary').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);

    await body.find('input[type="text"]').setValue('Financiamento');
    const typeInput = body.findAll('input[type="text"]')[1];
    await typeInput.setValue('conta fixa');
    await body.find('input[type="number"]').setValue(300);
    await body.find('input[type="month"]').setValue('2026-01');
    await body.find('input[type="checkbox"]').setValue(true);
    await flushPromises();

    const monthInputs = body.findAll('input[type="month"]');
    expect(monthInputs).toHaveLength(2);
    await monthInputs[1].setValue('2026-12');

    await body.find('form').trigger('submit.prevent');
    await flushPromises();

    const savedSources = repository.saveExpenses.mock.calls[0][0];
    expect(savedSources[0]).toMatchObject({ recurring: true, startMonth: '2026-01', endMonth: '2026-12' });
  });

  it('does not persist endMonth for a non-recurring source', async () => {
    repository.getExpenses.mockResolvedValue([]);

    wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.btn-primary').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);

    await body.find('input[type="text"]').setValue('Reparo do carro');
    const typeInput = body.findAll('input[type="text"]')[1];
    await typeInput.setValue('gasto variável');
    await body.find('input[type="number"]').setValue(500);
    await body.find('input[type="month"]').setValue('2026-03');

    await body.find('form').trigger('submit.prevent');
    await flushPromises();

    const savedSources = repository.saveExpenses.mock.calls[0][0];
    expect(savedSources[0]).toMatchObject({ recurring: false, endMonth: null });
  });

  it('edits a source in place without duplicating it, from the card action icon', async () => {
    repository.getExpenses.mockResolvedValue([
      { id: 's1', name: 'Aluguel', type: 'conta fixa', amount: 1500, startMonth: '2026-01', recurring: true, endMonth: null, statusOverrides: {} }
    ]);

    wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.action-icon-btn').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    await body.find('input[type="number"]').setValue(1600);
    await body.find('form').trigger('submit.prevent');
    await flushPromises();

    const savedSources = repository.saveExpenses.mock.calls[0][0];
    expect(savedSources).toHaveLength(1);
    expect(savedSources[0]).toMatchObject({ id: 's1', amount: 1600, startMonth: '2026-01' });
  });

  it('clears statusOverrides when endMonth changes on edit, gated by a ConfirmDialog (not window.confirm)', async () => {
    const confirmSpy = vi.spyOn(globalThis, 'confirm');
    repository.getExpenses.mockResolvedValue([
      { id: 's1', name: 'Financiamento', type: 'conta fixa', amount: 300, startMonth: '2026-01', recurring: true, endMonth: '2026-12', statusOverrides: { '2026-01': 'paid' } }
    ]);

    wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.action-icon-btn').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    const monthInputs = body.findAll('input[type="month"]');
    expect(monthInputs).toHaveLength(2);
    await monthInputs[1].setValue('2026-06');
    await body.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(repository.saveExpenses).not.toHaveBeenCalled();

    const confirmBtn = body.findAll('button').find(b => b.text() === 'expenses.form.save' && b.element.closest('.confirm-dialog-content'));
    await confirmBtn.trigger('click');
    await flushPromises();

    const savedSources = repository.saveExpenses.mock.calls[0][0];
    expect(savedSources[0].statusOverrides).toEqual({});
    expect(savedSources[0].endMonth).toBe('2026-06');
    confirmSpy.mockRestore();
  });

  it('discards the parameter change but keeps other edits when the params ConfirmDialog is cancelled', async () => {
    repository.getExpenses.mockResolvedValue([
      { id: 's1', name: 'Financiamento', type: 'conta fixa', amount: 300, startMonth: '2026-01', recurring: true, endMonth: '2026-12', statusOverrides: { '2026-01': 'paid' } }
    ]);

    wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.action-icon-btn').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    await body.find('input[type="number"]').setValue(350);
    const monthInputs = body.findAll('input[type="month"]');
    await monthInputs[1].setValue('2026-06');
    await body.find('form').trigger('submit.prevent');
    await flushPromises();

    const cancelBtn = body.findAll('button').find(b => b.text() === 'expenses.form.cancel' && b.element.closest('.confirm-dialog-content'));
    await cancelBtn.trigger('click');
    await flushPromises();

    const savedSources = repository.saveExpenses.mock.calls[0][0];
    expect(savedSources[0].endMonth).toBe('2026-12'); // param change discarded
    expect(savedSources[0].amount).toBe(350); // non-param edit kept
    expect(savedSources[0].statusOverrides).toEqual({ '2026-01': 'paid' }); // not cleared
  });

  it('does not open the params ConfirmDialog when only name/amount change on edit', async () => {
    repository.getExpenses.mockResolvedValue([
      { id: 's1', name: 'Aluguel', type: 'conta fixa', amount: 1500, startMonth: '2026-01', recurring: true, endMonth: null, statusOverrides: { '2026-01': 'paid' } }
    ]);

    wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.action-icon-btn').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    await body.find('input[type="number"]').setValue(1600);
    await body.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(document.body.querySelector('.confirm-dialog-content')).toBeNull();
    const savedSources = repository.saveExpenses.mock.calls[0][0];
    expect(savedSources[0].statusOverrides).toEqual({ '2026-01': 'paid' });
  });

  it('deletes a source after confirming in the ConfirmDialog, from the card action icon', async () => {
    repository.getExpenses.mockResolvedValue([
      { id: 's1', name: 'Aluguel', type: 'conta fixa', amount: 1500, startMonth: '2026-01', recurring: true, endMonth: null, statusOverrides: {} }
    ]);

    wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.action-icon-btn.danger').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    const deleteBtn = body.findAll('button').find(b => b.text() === 'expenses.deleteSource');
    await deleteBtn.trigger('click');
    await flushPromises();

    expect(repository.saveExpenses).toHaveBeenCalled();
    const savedSources = repository.saveExpenses.mock.calls[0][0];
    expect(savedSources).toHaveLength(0);
  });

  it('does not delete when the delete ConfirmDialog is cancelled, and does not close on overlay click', async () => {
    repository.getExpenses.mockResolvedValue([
      { id: 's1', name: 'Aluguel', type: 'conta fixa', amount: 1500, startMonth: '2026-01', recurring: true, endMonth: null, statusOverrides: {} }
    ]);

    wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.action-icon-btn.danger').trigger('click');
    await flushPromises();

    const overlay = document.body.querySelector('.modal-overlay');
    overlay.dispatchEvent(new Event('click', { bubbles: true }));
    await flushPromises();
    expect(document.body.querySelector('.confirm-dialog-content')).not.toBeNull();

    const body = new DOMWrapper(document.body);
    const cancelBtn = body.findAll('button').find(b => b.text() === 'expenses.form.cancel');
    await cancelBtn.trigger('click');
    await flushPromises();

    expect(repository.saveExpenses).not.toHaveBeenCalled();
    expect(document.body.querySelector('.confirm-dialog-content')).toBeNull();
  });
});
