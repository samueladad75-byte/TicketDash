import { useAppStore } from '../../stores/useAppStore';

export function SyncProgressBar() {
  const { syncStatus, syncProgress } = useAppStore((s) => ({
    syncStatus: s.syncStatus,
    syncProgress: s.syncProgress,
  }));

  if (syncStatus !== 'syncing' || !syncProgress) {
    return null;
  }

  const progressPercent = syncProgress.total
    ? Math.round((syncProgress.current / syncProgress.total) * 100)
    : 0;

  const phaseLabels: Record<string, string> = {
    fetching: 'Fetching tickets from Jira...',
    categorizing: 'Categorizing tickets...',
    saving: 'Saving to database...',
  };

  const phaseLabel = phaseLabels[syncProgress.phase] || 'Syncing...';

  return (
    <div className="fixed bottom-4 right-4 bg-[--color-surface-alt] p-4 rounded-lg shadow-lg border border-gray-700 min-w-80">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">{phaseLabel}</div>
        <div className="text-sm text-[--color-text-muted]">
          {syncProgress.total
            ? `${syncProgress.current} / ${syncProgress.total}`
            : `${syncProgress.current}`}
        </div>
      </div>

      {syncProgress.total && (
        <>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[--color-primary] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-xs text-[--color-text-muted] mt-1 text-right">{progressPercent}%</div>
        </>
      )}

      {!syncProgress.total && (
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-[--color-primary] border-t-transparent rounded-full" />
          <span className="text-sm text-[--color-text-muted]">In progress...</span>
        </div>
      )}
    </div>
  );
}
