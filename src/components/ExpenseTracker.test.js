import { mount, flushPromises, DOMWrapper } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  beforeEach(() => {
    repository.getExpenses.mockReset();
    repository.saveExpenses.mockReset();
    repository.saveExpenses.mockResolvedValue();
  });

  it('renders the empty state when there are no expense sources', async () => {
    repository.getExpenses.mockResolvedValue([]);

    const wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    expect(repository.getExpenses).toHaveBeenCalled();
    expect(wrapper.find('.empty-state').exists()).toBe(true);
  });

  it('projects a recurring source and shows a monthly total row', async () => {
    repository.getExpenses.mockResolvedValue([
      { id: 's1', name: 'Aluguel', type: 'conta fixa', amount: 1500, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    const wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    expect(wrapper.text()).toContain('Aluguel');
    expect(wrapper.findAll('.expense-entry-row').length).toBeGreaterThan(0);
    expect(wrapper.find('.month-totals').exists()).toBe(true);
  });

  it('toggles an entry status between pending and paid and persists the change', async () => {
    repository.getExpenses.mockResolvedValue([
      { id: 's1', name: 'Aluguel', type: 'conta fixa', amount: 1500, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    const wrapper = mount(ExpenseTracker, { global: i18nStub });
    await flushPromises();

    const toggleBtn = wrapper.find('.btn-toggle-status');
    expect(toggleBtn.classes()).not.toContain('paid');

    await toggleBtn.trigger('click');
    await flushPromises();

    expect(repository.saveExpenses).toHaveBeenCalled();
    const savedSources = repository.saveExpenses.mock.calls[0][0];
    expect(savedSources[0].statusOverrides['2026-01']).toBe('paid');
  });

  it('adds a new expense source through the form', async () => {
    repository.getExpenses.mockResolvedValue([]);

    const wrapper = mount(ExpenseTracker, { global: i18nStub });
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

    const wrapper = mount(ExpenseTracker, { global: i18nStub });
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

    const wrapper = mount(ExpenseTracker, { global: i18nStub });
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

  it('edits a source in place without duplicating it', async () => {
    repository.getExpenses.mockResolvedValue([
      { id: 's1', name: 'Aluguel', type: 'conta fixa', amount: 1500, startMonth: '2026-01', recurring: true, endMonth: null, statusOverrides: {} }
    ]);

    const wrapper = mount(ExpenseTracker, { global: i18nStub });
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

    const wrapper = mount(ExpenseTracker, { global: i18nStub });
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

    const wrapper = mount(ExpenseTracker, { global: i18nStub });
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

    const wrapper = mount(ExpenseTracker, { global: i18nStub });
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

  it('deletes a source after confirming in the ConfirmDialog', async () => {
    repository.getExpenses.mockResolvedValue([
      { id: 's1', name: 'Aluguel', type: 'conta fixa', amount: 1500, startMonth: '2026-01', recurring: true, endMonth: null, statusOverrides: {} }
    ]);

    const wrapper = mount(ExpenseTracker, { global: i18nStub });
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

    const wrapper = mount(ExpenseTracker, { global: i18nStub });
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
