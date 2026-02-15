use serde::Serialize;

#[derive(Serialize)]
pub struct AggregationResult {
    pub tickets_by_status: Vec<CountEntry>,
    pub tickets_by_priority: Vec<CountEntry>,
    pub tickets_by_category: Vec<CountEntry>,
    pub tickets_over_time: Vec<TimeSeriesEntry>,
    pub resolution_time_by_priority: Vec<AvgEntry>,
    pub summary: SummaryStats,
}

#[derive(Serialize)]
pub struct CountEntry {
    pub name: String,
    pub count: u32,
}

#[derive(Serialize)]
pub struct TimeSeriesEntry {
    pub date: String, // "2025-01" (month) or "2025-W03" (week)
    pub created: u32,
    pub resolved: u32,
}

#[derive(Serialize)]
pub struct AvgEntry {
    pub name: String,
    pub avg_hours: f64,
    pub median_hours: f64,
    pub count: u32,
}

#[derive(Serialize)]
pub struct SummaryStats {
    pub total_tickets: u32,
    pub open_tickets: u32,
    pub resolved_tickets: u32,
    pub avg_resolution_hours: f64,
    pub median_resolution_hours: f64,
}
