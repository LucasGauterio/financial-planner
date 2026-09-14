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
});
