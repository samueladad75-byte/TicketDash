import { useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { SummaryCards } from './SummaryCards';
import { StatusChart } from './StatusChart';
import { PriorityChart } from './PriorityChart';
import { CategoryChart } from './CategoryChart';
import { TimelineChart } from './TimelineChart';
import { ResolutionTimeChart } from './ResolutionTimeChart';

export function DashboardView() {
  const { aggregations, isLoadingAggregations, fetchAggregations } = useAppStore((s) => ({
    aggregations: s.aggregations,
    isLoadingAggregations: s.isLoadingAggregations,
    fetchAggregations: s.fetchAggregations,
  }));

  useEffect(() => {
    fetchAggregations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoadingAggregations) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[--color-text-muted]">Loading dashboard...</div>
      </div>
    );
  }

  if (!aggregations) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-[--color-text-muted] mb-4">
            No data yet. Connect to Jira in Settings to sync your tickets.
          </div>
          <button
            onClick={() => useAppStore.getState().setActiveView('settings')}
            className="px-4 py-2 bg-[--color-primary] text-white rounded hover:opacity-80"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-[--color-primary] text-white rounded hover:opacity-80"
        >
          Export PDF
        </button>
      </div>

      <SummaryCards stats={aggregations.summary} />

      <div className="grid grid-cols-2 gap-4 mb-4">
        <StatusChart data={aggregations.tickets_by_status} />
        <PriorityChart data={aggregations.tickets_by_priority} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CategoryChart data={aggregations.tickets_by_category} />
        <TimelineChart data={aggregations.tickets_over_time} />
      </div>

      <div className="mt-4">
        <ResolutionTimeChart data={aggregations.resolution_time_by_priority} />
      </div>
    </div>
  );
}
