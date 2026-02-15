import { SummaryStats } from '../../types/aggregation';

interface SummaryCardsProps {
  stats: SummaryStats;
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      <div className="bg-[--color-surface-alt] p-4 rounded">
        <div className="text-[--color-text-muted] text-sm">Total Tickets</div>
        <div className="text-2xl font-bold">{stats.total_tickets}</div>
      </div>
      <div className="bg-[--color-surface-alt] p-4 rounded">
        <div className="text-[--color-text-muted] text-sm">Open</div>
        <div className="text-2xl font-bold text-[--color-warning]">{stats.open_tickets}</div>
      </div>
      <div className="bg-[--color-surface-alt] p-4 rounded">
        <div className="text-[--color-text-muted] text-sm">Resolved</div>
        <div className="text-2xl font-bold text-[--color-success]">{stats.resolved_tickets}</div>
      </div>
      <div className="bg-[--color-surface-alt] p-4 rounded">
        <div className="text-[--color-text-muted] text-sm">Avg Resolution</div>
        <div className="text-2xl font-bold">
          {stats.avg_resolution_hours > 0
            ? `${stats.avg_resolution_hours.toFixed(1)}h`
            : 'N/A'}
        </div>
      </div>
    </div>
  );
}
