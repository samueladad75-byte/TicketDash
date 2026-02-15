export interface AggregationResult {
  tickets_by_status: CountEntry[];
  tickets_by_priority: CountEntry[];
  tickets_by_category: CountEntry[];
  tickets_over_time: TimeSeriesEntry[];
  resolution_time_by_priority: AvgEntry[];
  summary: SummaryStats;
}

export interface CountEntry {
  name: string;
  count: number;
}

export interface TimeSeriesEntry {
  date: string;
  created: number;
  resolved: number;
}

export interface AvgEntry {
  name: string;
  avg_hours: number;
  median_hours: number;
  count: number;
}

export interface SummaryStats {
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  avg_resolution_hours: number;
  median_resolution_hours: number;
}
