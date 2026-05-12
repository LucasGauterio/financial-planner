import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import PastInvestmentSimulator from './PastInvestmentSimulator.vue';

const i18nMock = { t: (key) => key, formatCurrency: (val) => val, currency: 'USD' };

describe('PastInvestmentSimulator.vue', () => {
  it('renders the component correctly', () => {
    const wrapper = mount(PastInvestmentSimulator, { global: { provide: { i18n: i18nMock } } });
    expect(wrapper.text()).toContain('past.title');
    expect(wrapper.text()).toContain('past.today');
  });

  it('calculates based on input changes', async () => {
    const wrapper = mount(PastInvestmentSimulator, { global: { provide: { i18n: i18nMock } } });
    const inputs = wrapper.findAll('input[type="number"]');
    // Starting Monthly Apport is the 3rd input
    await inputs[2].setValue(500);
    expect(wrapper.vm.monthlyContribution).toBe(500);
  });
});
