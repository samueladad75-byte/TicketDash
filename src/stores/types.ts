import { Ticket } from '../types/ticket';
import { AggregationResult } from '../types/aggregation';

export interface FilterState {
  dateRange: { start: string; end: string } | null;
  statuses: string[];
  categories: string[];
  priorities: string[];
}

export interface UISlice {
  activeView: 'dashboard' | 'tickets' | 'settings';
  setActiveView: (view: 'dashboard' | 'tickets' | 'settings') => void;
}

export interface TicketSlice {
  tickets: Ticket[];
  aggregations: AggregationResult | null;
  isLoadingAggregations: boolean;
  error: string | null;
  fetchTickets: () => Promise<void>;
  fetchAggregations: () => Promise<void>;
}

export interface SyncProgress {
  phase: string;
  current: number;
  total: number | null;
}

export interface SyncSlice {
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncAt: string | null;
  syncError: string | null;
  syncProgress: SyncProgress | null;
  triggerSync: () => Promise<void>;
}

export interface FilterSlice {
  filters: FilterState;
  setDateRange: (start: string, end: string) => void;
  setStatuses: (statuses: string[]) => void;
  setCategories: (categories: string[]) => void;
  setPriorities: (priorities: string[]) => void;
  resetFilters: () => void;
}

export type AppStore = UISlice & TicketSlice & SyncSlice & FilterSlice;
