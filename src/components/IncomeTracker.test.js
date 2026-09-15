import { mount, flushPromises, DOMWrapper } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import IncomeTracker from './IncomeTracker.vue';
import { repository } from '../services/indexedDbRepository';

vi.mock('../services/indexedDbRepository', () => ({
  repository: {
    getIncome: vi.fn(),
    saveIncome: vi.fn()
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

describe('IncomeTracker.vue', () => {
  let wrapper;

  beforeEach(() => {
    repository.getIncome.mockReset();
    repository.saveIncome.mockReset();
    repository.saveIncome.mockResolvedValue();
    // Pin "today" so fixtures using startMonth: '2026-01' project a deterministic entry
    // count regardless of the real wall-clock date (generateIncomeProjection's horizon
    // catch-up, per the current-month bug fix, is anchored to `new Date()`).
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00'));
  });

  // Several tests open a source's Teleported detail drawer and never explicitly close
  // it before the test ends. @vue/test-utils does not auto-unmount between tests, so
  // without this, that Teleported DOM would leak into document.body across tests and
  // pollute later `DOMWrapper(document.body)` queries (e.g. a stale drawer's
  // `.actual-amount-input` being found instead of the current test's own).
  afterEach(() => {
    wrapper?.unmount();
    vi.useRealTimers();
  });

  it('renders the empty state when there are no income sources', async () => {
    repository.getIncome.mockResolvedValue([]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    expect(repository.getIncome).toHaveBeenCalled();
    expect(wrapper.find('.empty-state').exists()).toBe(true);
  });

  it('renders the projection horizon as a month-by-month ruler slider, defaulting to a near-term view (ADR-012)', async () => {
    repository.getIncome.mockResolvedValue([]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
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

  it('renders a stats dashboard with total/received/pending aggregated across the horizon', async () => {
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: false, statusOverrides: { '2026-01': { status: 'received', actualAmount: 4800 } } }
    ]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    const statVals = wrapper.findAll('.stat-val').map(el => el.text());
    expect(statVals).toContain('$4800');
  });

  it('scopes the stats dashboard to the selected horizon window, excluding catch-up backlog (ADR-014)', async () => {
    // Source registered 7 months before the pinned "today" (2026-01) — the current-month
    // catch-up fix (BUGFIX-001) means projectionEntries spans back to 2025-06, but the
    // stats dashboard must only aggregate the 1-month window actually selected via the
    // ruler (default horizonMonths: 1 → 2026-01 only), not the whole backlog.
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Salário', type: 'salario', amount: 1000, startMonth: '2025-06', recurring: true, statusOverrides: {} }
    ]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    const statVals = wrapper.findAll('.stat-val').map(el => el.text());
    // 1 month x 1000 pending = 1000, NOT the 8-month backlog total (8000).
    expect(statVals).toContain('$1000');
    expect(statVals).not.toContain('$8000');
  });

  it('scopes the stats dashboard to the selected horizon window, excluding a bounded source\'s overflow beyond it (ADR-014)', async () => {
    // Bounded source (ADR-011) always projects its full span in the drawer regardless of
    // horizon, but the stats dashboard must still respect the selected horizon window.
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Consultoria', type: 'contrato', amount: 1000, startMonth: '2026-01', recurring: true, endMonth: '2027-01', statusOverrides: {} }
    ]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    const statVals = wrapper.findAll('.stat-val').map(el => el.text());
    // 1-month window x 1000 pending = 1000, NOT the full 13-month bounded span (13000).
    expect(statVals).toContain('$1000');
    expect(statVals).not.toContain('$13000');
  });

  it('renders one card per registered source', async () => {
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: {} },
      { id: 's2', name: 'Dividendo', type: 'dividendo', amount: 200, startMonth: '2026-02', recurring: false, statusOverrides: {} }
    ]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    expect(wrapper.text()).toContain('Salário');
    expect(wrapper.text()).toContain('Dividendo');
    expect(wrapper.findAll('.source-card')).toHaveLength(2);
  });

  it("opening a source's card shows a drawer scoped to only that source's projection", async () => {
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: {} },
      { id: 's2', name: 'Dividendo', type: 'dividendo', amount: 200, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    const cards = wrapper.findAll('.source-card');
    await cards[0].trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    expect(body.find('.drawer-panel').exists()).toBe(true);
    expect(body.find('.drawer-title').text()).toBe('Salário');
    // Default horizon is 1 month (current month only); 1 entry/month for the selected source only.
    expect(body.findAll('.income-entry-row')).toHaveLength(1);
  });

  it('closes the drawer via the close button', async () => {
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.source-card').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    await body.find('.drawer-panel .close-btn').trigger('click');
    await flushPromises();

    expect(document.body.querySelector('.drawer-panel')).toBeNull();
  });

  it('toggles an entry status from inside the drawer and persists the change', async () => {
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.source-card').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    const toggleBtn = body.find('.btn-toggle-status');
    expect(toggleBtn.classes()).not.toContain('received');

    await toggleBtn.trigger('click');
    await flushPromises();

    expect(repository.saveIncome).toHaveBeenCalled();
    const savedSources = repository.saveIncome.mock.calls[0][0];
    expect(savedSources[0].statusOverrides['2026-01']).toEqual({ status: 'received', actualAmount: 5000 });
  });

  it('reveals an editable actual-amount input defaulting to the expected amount when marked received (TD-01)', async () => {
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.source-card').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    expect(body.find('.actual-amount-input').exists()).toBe(false);

    await body.find('.btn-toggle-status').trigger('click');
    await flushPromises();

    const input = body.find('.actual-amount-input');
    expect(input.exists()).toBe(true);
    expect(input.element.value).toBe('5000');
  });

  it('persists an edited actual amount on blur from inside the drawer (TD-01)', async () => {
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: { '2026-01': { status: 'received', actualAmount: 5000 } } }
    ]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.source-card').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    const input = body.find('.actual-amount-input');
    await input.setValue(4800);
    await input.trigger('blur');
    await flushPromises();

    const savedSources = repository.saveIncome.mock.calls[0][0];
    expect(savedSources[0].statusOverrides['2026-01']).toMatchObject({ status: 'received', actualAmount: 4800 });
  });

  it('adds a new income source through the form', async () => {
    repository.getIncome.mockResolvedValue([]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.btn-primary').trigger('click');
    await flushPromises();

    // The add-source form is rendered inside <Teleport to="body">, so it must
    // be queried against document.body rather than the component's own wrapper.
    const body = new DOMWrapper(document.body);

    await body.find('input[type="text"]').setValue('Dividendos XPTO');
    const typeInput = body.findAll('input[type="text"]')[1];
    await typeInput.setValue('dividendo');
    await body.find('input[type="number"]').setValue(200);
    await body.find('input[type="month"]').setValue('2026-05');

    await body.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(repository.saveIncome).toHaveBeenCalled();
    const savedSources = repository.saveIncome.mock.calls[0][0];
    expect(savedSources).toHaveLength(1);
    expect(savedSources[0]).toMatchObject({ name: 'Dividendos XPTO', type: 'dividendo', amount: 200, startMonth: '2026-05' });
  });

  it('persists an optional endMonth for a recurring source (ADR-010)', async () => {
    repository.getIncome.mockResolvedValue([]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.btn-primary').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);

    await body.find('input[type="text"]').setValue('Consultoria');
    const typeInput = body.findAll('input[type="text"]')[1];
    await typeInput.setValue('contrato');
    await body.find('input[type="number"]').setValue(3000);
    await body.find('input[type="month"]').setValue('2026-01');
    await body.find('input[type="checkbox"]').setValue(true);
    await flushPromises();

    const monthInputs = body.findAll('input[type="month"]');
    expect(monthInputs).toHaveLength(2);
    await monthInputs[1].setValue('2026-12');

    await body.find('form').trigger('submit.prevent');
    await flushPromises();

    const savedSources = repository.saveIncome.mock.calls[0][0];
    expect(savedSources[0]).toMatchObject({ recurring: true, startMonth: '2026-01', endMonth: '2026-12' });
  });

  it('does not persist endMonth for a non-recurring source (ADR-010)', async () => {
    repository.getIncome.mockResolvedValue([]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.btn-primary').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);

    await body.find('input[type="text"]').setValue('Bônus');
    const typeInput = body.findAll('input[type="text"]')[1];
    await typeInput.setValue('payment');
    await body.find('input[type="number"]').setValue(500);
    await body.find('input[type="month"]').setValue('2026-03');

    await body.find('form').trigger('submit.prevent');
    await flushPromises();

    const savedSources = repository.saveIncome.mock.calls[0][0];
    expect(savedSources[0]).toMatchObject({ recurring: false, endMonth: null });
  });

  it('edits a source in place without duplicating it, from the card action icon', async () => {
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.action-icon-btn').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    await body.find('input[type="number"]').setValue(5500);
    await body.find('form').trigger('submit.prevent');
    await flushPromises();

    const savedSources = repository.saveIncome.mock.calls[0][0];
    expect(savedSources).toHaveLength(1);
    expect(savedSources[0]).toMatchObject({ id: 's1', amount: 5500, startMonth: '2026-01' });
  });

  it('clears statusOverrides when startMonth changes on edit, gated by a ConfirmDialog (not window.confirm)', async () => {
    const confirmSpy = vi.spyOn(globalThis, 'confirm');
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: { '2026-01': 'received' } }
    ]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.action-icon-btn').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    await body.find('input[type="month"]').setValue('2026-03');
    await body.find('form').trigger('submit.prevent');
    await flushPromises();

    // No native dialog is ever used (dialog-implementation rule, Directive 1).
    expect(confirmSpy).not.toHaveBeenCalled();
    // The save is deferred until the ConfirmDialog's own Confirm button is clicked.
    expect(repository.saveIncome).not.toHaveBeenCalled();

    const confirmBtn = body.findAll('button').find(b => b.text() === 'income.form.save' && b.element.closest('.confirm-dialog-content'));
    await confirmBtn.trigger('click');
    await flushPromises();

    const savedSources = repository.saveIncome.mock.calls[0][0];
    expect(savedSources[0].statusOverrides).toEqual({});
    expect(savedSources[0].startMonth).toBe('2026-03');
    confirmSpy.mockRestore();
  });

  it('clears statusOverrides when endMonth changes on edit, gated by a ConfirmDialog (not window.confirm) (ADR-010)', async () => {
    const confirmSpy = vi.spyOn(globalThis, 'confirm');
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Consultoria', type: 'contrato', amount: 3000, startMonth: '2026-01', recurring: true, endMonth: '2026-12', statusOverrides: { '2026-01': 'received' } }
    ]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
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
    expect(repository.saveIncome).not.toHaveBeenCalled();

    const confirmBtn = body.findAll('button').find(b => b.text() === 'income.form.save' && b.element.closest('.confirm-dialog-content'));
    await confirmBtn.trigger('click');
    await flushPromises();

    const savedSources = repository.saveIncome.mock.calls[0][0];
    expect(savedSources[0].statusOverrides).toEqual({});
    expect(savedSources[0].endMonth).toBe('2026-06');
    confirmSpy.mockRestore();
  });

  it('discards the parameter change but keeps other edits when the params ConfirmDialog is cancelled', async () => {
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: { '2026-01': 'received' } }
    ]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.action-icon-btn').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    await body.find('input[type="number"]').setValue(6000);
    await body.find('input[type="month"]').setValue('2026-03');
    await body.find('form').trigger('submit.prevent');
    await flushPromises();

    const cancelBtn = body.findAll('button').find(b => b.text() === 'income.form.cancel' && b.element.closest('.confirm-dialog-content'));
    await cancelBtn.trigger('click');
    await flushPromises();

    const savedSources = repository.saveIncome.mock.calls[0][0];
    expect(savedSources[0].startMonth).toBe('2026-01'); // param change discarded
    expect(savedSources[0].amount).toBe(6000); // non-param edit kept
    expect(savedSources[0].statusOverrides).toEqual({ '2026-01': 'received' }); // not cleared
  });

  it('does not open the params ConfirmDialog when only name/amount change on edit', async () => {
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: { '2026-01': 'received' } }
    ]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.action-icon-btn').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    await body.find('input[type="number"]').setValue(5500);
    await body.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(document.body.querySelector('.confirm-dialog-content')).toBeNull();
    const savedSources = repository.saveIncome.mock.calls[0][0];
    expect(savedSources[0].statusOverrides).toEqual({ '2026-01': 'received' });
  });

  it('deletes a source after confirming in the ConfirmDialog, from the card action icon', async () => {
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.action-icon-btn.danger').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    const deleteBtn = body.findAll('button').find(b => b.text() === 'income.deleteSource');
    await deleteBtn.trigger('click');
    await flushPromises();

    expect(repository.saveIncome).toHaveBeenCalled();
    const savedSources = repository.saveIncome.mock.calls[0][0];
    expect(savedSources).toHaveLength(0);
  });

  it('does not delete when the delete ConfirmDialog is cancelled, and does not close on overlay click', async () => {
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.action-icon-btn.danger').trigger('click');
    await flushPromises();

    const overlay = document.body.querySelector('.modal-overlay');
    overlay.dispatchEvent(new Event('click', { bubbles: true }));
    await flushPromises();
    expect(document.body.querySelector('.confirm-dialog-content')).not.toBeNull();

    const body = new DOMWrapper(document.body);
    const cancelBtn = body.findAll('button').find(b => b.text() === 'income.form.cancel');
    await cancelBtn.trigger('click');
    await flushPromises();

    expect(repository.saveIncome).not.toHaveBeenCalled();
    expect(document.body.querySelector('.confirm-dialog-content')).toBeNull();
  });
});
