import { mount, flushPromises, DOMWrapper } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DataExport from './DataExport.vue';
import { repository } from '../services/indexedDbRepository';
import { exportAllToSpreadsheet } from '../services/spreadsheetExportService';

vi.mock('../services/indexedDbRepository', () => ({
  repository: {
    getIncome: vi.fn(),
    getExpenses: vi.fn(),
    getLoans: vi.fn(),
    getInvestments: vi.fn(),
    getTimelineState: vi.fn()
  }
}));

vi.mock('../services/spreadsheetExportService', () => ({
  buildIncomeRows: vi.fn(() => []),
  buildExpenseRows: vi.fn(() => []),
  buildLoanRows: vi.fn(() => []),
  buildPortfolioRows: vi.fn(() => []),
  buildCashFlowRows: vi.fn(() => []),
  buildTimelineRows: vi.fn(() => []),
  exportAllToSpreadsheet: vi.fn()
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

describe('DataExport.vue', () => {
  beforeEach(() => {
    repository.getIncome.mockReset().mockResolvedValue([]);
    repository.getExpenses.mockReset().mockResolvedValue([]);
    repository.getLoans.mockReset().mockResolvedValue([]);
    repository.getInvestments.mockReset().mockResolvedValue([]);
    repository.getTimelineState.mockReset().mockResolvedValue({});
    exportAllToSpreadsheet.mockReset();
  });

  // ConfirmDialog Teleports to document.body, which vitest's jsdom environment
  // does not reset between tests in the same file — without this, a dialog left
  // open by one test leaks into the next test's document.body queries.
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('loads every domain independently on mount', async () => {
    const wrapper = mount(DataExport, { global: i18nStub });
    await flushPromises();

    expect(repository.getIncome).toHaveBeenCalled();
    expect(repository.getExpenses).toHaveBeenCalled();
    expect(repository.getLoans).toHaveBeenCalled();
    expect(repository.getInvestments).toHaveBeenCalled();
    expect(repository.getTimelineState).toHaveBeenCalled();
    expect(wrapper.exists()).toBe(true);
  });

  it('opens the ConfirmDialog (not a native confirm()) when the export button is clicked', async () => {
    const confirmSpy = vi.spyOn(globalThis, 'confirm');
    const wrapper = mount(DataExport, { global: i18nStub });
    await flushPromises();

    expect(document.body.querySelector('.confirm-dialog-content')).toBeNull();

    await wrapper.find('.export-card .btn-primary').trigger('click');

    expect(document.body.querySelector('.confirm-dialog-content')).not.toBeNull();
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(exportAllToSpreadsheet).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('calls the export service with all six domains only after the dialog is confirmed', async () => {
    const wrapper = mount(DataExport, { global: i18nStub });
    await flushPromises();
    await wrapper.find('.export-card .btn-primary').trigger('click');

    const body = new DOMWrapper(document.body);
    const confirmBtn = body.findAll('button').find(b => b.text() === 'dataExport.exportButton' && b.element.closest('.confirm-dialog-content'));
    await confirmBtn.trigger('click');
    await flushPromises();

    expect(exportAllToSpreadsheet).toHaveBeenCalledTimes(1);
    const arg = exportAllToSpreadsheet.mock.calls[0][0];
    expect(Object.keys(arg).sort()).toEqual(['cashFlow', 'expenses', 'income', 'loans', 'portfolio', 'timeline']);
    expect(document.body.querySelector('.confirm-dialog-content')).toBeNull();
    expect(wrapper.find('.export-status').text()).toBe('dataExport.statusSuccess');
  });

  it('closes the dialog without exporting when cancelled', async () => {
    const wrapper = mount(DataExport, { global: i18nStub });
    await flushPromises();
    await wrapper.find('.export-card .btn-primary').trigger('click');

    const body = new DOMWrapper(document.body);
    const cancelBtn = body.findAll('button').find(b => b.text() === 'dataExport.cancelBtn' && b.element.closest('.confirm-dialog-content'));
    await cancelBtn.trigger('click');
    await flushPromises();

    expect(exportAllToSpreadsheet).not.toHaveBeenCalled();
    expect(document.body.querySelector('.confirm-dialog-content')).toBeNull();
  });

  it('shows an error status message when the export service throws', async () => {
    exportAllToSpreadsheet.mockImplementation(() => { throw new Error('boom'); });
    const wrapper = mount(DataExport, { global: i18nStub });
    await flushPromises();
    await wrapper.find('.export-card .btn-primary').trigger('click');

    const body = new DOMWrapper(document.body);
    const confirmBtn = body.findAll('button').find(b => b.text() === 'dataExport.exportButton' && b.element.closest('.confirm-dialog-content'));
    await confirmBtn.trigger('click');
    await flushPromises();

    expect(wrapper.find('.export-status.error').exists()).toBe(true);
  });
});
