/**
 * Repository interface for app data.
 * Currently uses LocalStorage, but can be replaced by an API client later.
 */

const INVESTMENTS_KEY = 'financial_planner_investments';
const GOALS_KEY = 'financial_planner_goals';

export const repository = {
  /**
   * Retrieves investments from storage.
   * @returns {Array} Array of investments.
   */
  getInvestments: () => {
    const data = localStorage.getItem(INVESTMENTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Saves investments to storage.
   * @param {Array} investments - Array of investments to save.
   */
  saveInvestments: (investments) => {
    localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(investments));
  },

  /**
   * Retrieves goals from storage.
   * @returns {Array} Array of goals.
   */
  getGoals: () => {
    const data = localStorage.getItem(GOALS_KEY);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Saves goals to storage.
   * @param {Array} goals - Array of goals to save.
   */
  saveGoals: (goals) => {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  },

  /**
   * Retrieves the checked state of timeline deposits.
   * @returns {Object} A map of checked timeline IDs.
   */
  getTimelineState: () => {
    const data = localStorage.getItem('financial_planner_timeline');
    return data ? JSON.parse(data) : {};
  },

  /**
   * Saves the checked state of timeline deposits.
   * @param {Object} state - Object map of string IDs to booleans.
   */
  saveTimelineState: (state) => {
    localStorage.setItem('financial_planner_timeline', JSON.stringify(state));
  }
};
