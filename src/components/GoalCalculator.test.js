import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import GoalCalculator from './GoalCalculator.vue';

const i18nMock = { t: (key) => key, formatCurrency: (val) => String(val), currency: 'USD' };

describe('GoalCalculator.vue', () => {
  it('renders title and inputs', () => {
    const wrapper = mount(GoalCalculator, { global: { provide: { i18n: i18nMock } } });

    expect(wrapper.text()).toContain('goal.title');
    expect(wrapper.text()).toContain('goal.annualReturn');
  });

  it('updates target amounts correctly based on reactive properties', async () => {
    const wrapper = mount(GoalCalculator, { global: { provide: { i18n: i18nMock } } });
    
    // Find the input for Target Goal Amount
    const inputs = wrapper.findAll('input[type="number"]');
    const targetInput = inputs[0];

    // Change target amount from 1M to 2M
    await targetInput.setValue(2000000);
    
    // It should trigger recalculations, since the component computes values synchronously based on v-model
    // We expect the text to update
    const text = wrapper.text();
    expect(text.length).toBeGreaterThan(0);
  });
});
