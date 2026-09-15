import { describe, it, expect, beforeEach, vi } from 'vitest';
import { repository } from './localStorageRepository.js';

describe('Local Storage Repository', () => {
  beforeEach(() => {
    const store = {};
    vi.stubGlobal('localStorage', {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = value.toString(); },
      clear: () => {
        for (const key in store) delete store[key];
      }
    });
  });

  it('saves and retrieves investments', () => {
    const investments = [{ id: 1, name: 'Google Stock', currentBalance: 1500, monthlyContribution: 100 }];
    repository.saveInvestments(investments);
    const retrieved = repository.getInvestments();
    expect(retrieved).toEqual(investments);
  });

  it('returns empty array when no investments exist', () => {
    const retrieved = repository.getInvestments();
    expect(retrieved).toEqual([]);
  });
  
  it('saves and retrieves goals', () => {
    const goals = [{ id: 1, name: 'House', targetAmount: 500000 }];
    repository.saveGoals(goals);
    const retrieved = repository.getGoals();
    expect(retrieved).toEqual(goals);
  });

  it('saves and retrieves timeline states', () => {
    const stateMap = { 'Nubank_2026-05': true };
    repository.saveTimelineState(stateMap);
    const retrieved = repository.getTimelineState();
    expect(retrieved).toEqual(stateMap);
  });
});
