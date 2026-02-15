import { create } from 'zustand';
import { AppStore } from './types';
import { invokeCommand } from '../hooks/useTauriInvoke';
import { Ticket } from '../types/ticket';
import { AggregationResult } from '../types/aggregation';

export const useAppStore = create<AppStore>((set, get) => ({
  // UI
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),

  // Tickets
  tickets: [],
  aggregations: null,
  isLoadingAggregations: false,
  error: null,
  fetchTickets: async () => {
    try {
      const tickets = await invokeCommand<Ticket[]>('get_all_tickets');
      set({ tickets, error: null });
    } catch (error) {
      set({ error: String(error) });
    }
  },
  fetchAggregations: async () => {
    set({ isLoadingAggregations: true });
    try {
      const aggregations = await invokeCommand<AggregationResult>('get_dashboard_data');
      set({ aggregations, isLoadingAggregations: false, error: null });
    } catch (error) {
      set({ isLoadingAggregations: false, error: String(error) });
    }
  },

  // Sync
  syncStatus: 'idle',
  lastSyncAt: null,
  syncError: null,
  syncProgress: null,
  triggerSync: async () => {
    set({ syncStatus: 'syncing', syncError: null, syncProgress: null });
    try {
      // Load settings from store
      const settings = await invokeCommand<{ jira_url: string; email: string } | null>(
        'load_jira_settings',
      );

      if (!settings) {
        throw new Error('No Jira settings found. Please configure in Settings.');
      }

      // TODO: Implement category rule management in settings UI
      // For now, all tickets will be categorized as "Uncategorized"
      // Future: load from settings store and allow users to create custom rules
      const categoryRules = JSON.stringify({ categoryRules: [] });

      const result = await invokeCommand<{ synced: number; last_sync: string }>(
        'trigger_sync',
        {
          jiraUrl: settings.jira_url,
          email: settings.email,
          categoryRulesJson: categoryRules,
        },
      );
      set({ syncStatus: 'success', lastSyncAt: result.last_sync, syncProgress: null });
      // Refresh dashboard
      await get().fetchAggregations();
    } catch (error) {
      set({ syncStatus: 'error', syncError: String(error), syncProgress: null });
    }
  },

  // Filters
  filters: {
    dateRange: null,
    statuses: [],
    categories: [],
    priorities: [],
  },
  setDateRange: (start, end) =>
    set((state) => ({
      filters: { ...state.filters, dateRange: { start, end } },
    })),
  setStatuses: (statuses) =>
    set((state) => ({
      filters: { ...state.filters, statuses },
    })),
  setCategories: (categories) =>
    set((state) => ({
      filters: { ...state.filters, categories },
    })),
  setPriorities: (priorities) =>
    set((state) => ({
      filters: { ...state.filters, priorities },
    })),
  resetFilters: () =>
    set({
      filters: {
        dateRange: null,
        statuses: [],
        categories: [],
        priorities: [],
      },
    }),
}));
