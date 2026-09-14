import { mount, flushPromises, DOMWrapper } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  beforeEach(() => {
    repository.getIncome.mockReset();
    repository.saveIncome.mockReset();
    repository.saveIncome.mockResolvedValue();
  });

  it('renders the empty state when there are no income sources', async () => {
    repository.getIncome.mockResolvedValue([]);

    const wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    expect(repository.getIncome).toHaveBeenCalled();
    expect(wrapper.find('.empty-state').exists()).toBe(true);
  });

  it('projects a recurring source and shows a monthly total row', async () => {
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    const wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    expect(wrapper.text()).toContain('Salário');
    expect(wrapper.findAll('.income-entry-row').length).toBeGreaterThan(0);
    expect(wrapper.find('.month-totals').exists()).toBe(true);
  });

  it('toggles an entry status between pending and received and persists the change', async () => {
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    const wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    const toggleBtn = wrapper.find('.btn-toggle-status');
    expect(toggleBtn.classes()).not.toContain('received');

    await toggleBtn.trigger('click');
    await flushPromises();

    expect(repository.saveIncome).toHaveBeenCalled();
    const savedSources = repository.saveIncome.mock.calls[0][0];
    expect(savedSources[0].statusOverrides['2026-01']).toBe('received');
  });

  it('adds a new income source through the form', async () => {
    repository.getIncome.mockResolvedValue([]);

    const wrapper = mount(IncomeTracker, { global: i18nStub });
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

  it('edits a source in place without duplicating it', async () => {
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    const wrapper = mount(IncomeTracker, { global: i18nStub });
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

  it('clears statusOverrides when startMonth changes on edit, gated by confirm', async () => {
    const confirmSpy = vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: { '2026-01': 'received' } }
    ]);

    const wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.action-icon-btn').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    await body.find('input[type="month"]').setValue('2026-03');
    await body.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(confirmSpy).toHaveBeenCalled();
    const savedSources = repository.saveIncome.mock.calls[0][0];
    expect(savedSources[0].statusOverrides).toEqual({});
    confirmSpy.mockRestore();
  });

  it('does not clear statusOverrides when only name/amount change on edit', async () => {
    const confirmSpy = vi.spyOn(globalThis, 'confirm');
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: { '2026-01': 'received' } }
    ]);

    const wrapper = mount(IncomeTracker, { global: i18nStub });
    await flushPromises();

    await wrapper.find('.action-icon-btn').trigger('click');
    await flushPromises();

    const body = new DOMWrapper(document.body);
    await body.find('input[type="number"]').setValue(5500);
    await body.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(confirmSpy).not.toHaveBeenCalled();
    const savedSources = repository.saveIncome.mock.calls[0][0];
    expect(savedSources[0].statusOverrides).toEqual({ '2026-01': 'received' });
    confirmSpy.mockRestore();
  });

  it('deletes a source after confirming in the delete modal', async () => {
    repository.getIncome.mockResolvedValue([
      { id: 's1', name: 'Salário', type: 'salario', amount: 5000, startMonth: '2026-01', recurring: true, statusOverrides: {} }
    ]);

    const wrapper = mount(IncomeTracker, { global: i18nStub });
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
});
