import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useAppStore } from '../stores/useAppStore';
import { SyncProgress } from '../stores/types';

export function useSyncEvents() {
  useEffect(() => {
    const unlisteners: Array<() => void> = [];

    // Register all event listeners and wait for them to complete
    (async () => {
      // Listen for sync progress
      const unlisten1 = await listen<SyncProgress>('sync-progress', (event) => {
        useAppStore.setState({ syncProgress: event.payload });
      });
      unlisteners.push(unlisten1);

      // Listen for sync started
      const unlisten2 = await listen('sync-started', () => {
        useAppStore.setState({ syncStatus: 'syncing', syncError: null, syncProgress: null });
      });
      unlisteners.push(unlisten2);

      // Listen for sync complete
      const unlisten3 = await listen<{ synced: number; last_sync: string }>('sync-complete', (event) => {
        useAppStore.setState({
          syncStatus: 'success',
          lastSyncAt: event.payload.last_sync,
          syncProgress: null,
        });
        // Refresh dashboard data
        useAppStore.getState().fetchAggregations();
        useAppStore.getState().fetchTickets();
      });
      unlisteners.push(unlisten3);

      // Listen for sync error
      const unlisten4 = await listen<string>('sync-error', (event) => {
        useAppStore.setState({
          syncStatus: 'error',
          syncError: event.payload,
          syncProgress: null,
        });
      });
      unlisteners.push(unlisten4);
    })();

    return () => {
      unlisteners.forEach((unlisten) => unlisten());
    };
  }, []);
}
