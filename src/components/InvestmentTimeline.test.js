import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import InvestmentTimeline from './InvestmentTimeline.vue';
import { repository } from '../services/indexedDbRepository';

// Mock repository
vi.mock('../services/indexedDbRepository', () => ({
  repository: {
    getInvestments: vi.fn(),
    getTimelineState: vi.fn(),
    saveTimelineState: vi.fn(),
    saveInvestments: vi.fn()
  }
}));

describe('InvestmentTimeline.vue', () => {
  it('renders timeline and handles empty state properly', async () => {
    repository.getInvestments.mockResolvedValue([]);
    repository.getTimelineState.mockResolvedValue({});

    const wrapper = mount(InvestmentTimeline, {
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

    // Wait for onMounted promises to resolve
    await new Promise(r => setTimeout(r, 50));

    expect(wrapper.text()).toContain('timeline.title');
    expect(wrapper.text()).toContain('timeline.empty');
  });
});
