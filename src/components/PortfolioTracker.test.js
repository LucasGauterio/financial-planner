import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import PortfolioTracker from './PortfolioTracker.vue';
import { repository } from '../services/indexedDbRepository';

// Mock repository
vi.mock('../services/indexedDbRepository', () => ({
  repository: {
    getInvestments: vi.fn(),
    saveInvestments: vi.fn()
  }
}));

describe('PortfolioTracker.vue', () => {
  it('renders portfolio tracker and handles mock data', async () => {
    repository.getInvestments.mockResolvedValue([
      { name: 'Tesla Stock', type: 'Stocks', balance: 5000, monthly: 100, rate: 10 }
    ]);

    const wrapper = mount(PortfolioTracker, {
      global: {
        provide: {
          i18n: {
            t: (key) => key,
            formatCurrency: (val) => `$${val}`,
            locale: { value: 'en-US' }
          }
        }
      }
    });

    expect(wrapper.text()).toContain('tracker.title');

    // Wait for onMounted promises to resolve
    await new Promise(r => setTimeout(r, 50));

    expect(repository.getInvestments).toHaveBeenCalled();
    expect(wrapper.text()).toContain('Tesla Stock');
  });
});
