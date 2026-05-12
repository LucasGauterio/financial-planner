import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import TimeGapComparator from './TimeGapComparator.vue';

const i18nMock = { t: (key) => key, formatCurrency: (val) => val, currency: 'USD' };

describe('TimeGapComparator.vue', () => {
  it('renders title', () => {
    const wrapper = mount(TimeGapComparator, { global: { provide: { i18n: i18nMock } } });
    expect(wrapper.text()).toContain('timegap.title');
  });

  it('displays the early start year logic correctly', async () => {
    const wrapper = mount(TimeGapComparator, { global: { provide: { i18n: i18nMock } } });
    const inputs = wrapper.findAll('input[type="number"]');
    // "Early" Start Year is the 3rd input
    const earlyStartInput = inputs[2];
    await earlyStartInput.setValue(2010);
    
    expect(wrapper.text()).toContain('timegap.scenarioA');
  });
});
