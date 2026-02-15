use crate::errors::{AppError, DbError};
use crate::models::{AggregationResult, AvgEntry, CountEntry, SummaryStats, Ticket, TimeSeriesEntry};
use rusqlite::{Connection, params, OptionalExtension};

pub fn upsert_ticket(conn: &Connection, ticket: &Ticket) -> Result<(), AppError> {
    conn.execute(
        r#"
        INSERT INTO tickets (
            jira_key, summary, status, priority, issue_type, assignee, reporter,
            created_at, updated_at, resolved_at, labels, project_key, category
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
        ON CONFLICT(jira_key) DO UPDATE SET
            summary = excluded.summary,
            status = excluded.status,
            priority = excluded.priority,
            issue_type = excluded.issue_type,
            assignee = excluded.assignee,
            reporter = excluded.reporter,
            updated_at = excluded.updated_at,
            resolved_at = excluded.resolved_at,
            labels = excluded.labels,
            category = excluded.category
        "#,
        params![
            ticket.jira_key,
            ticket.summary,
            ticket.status,
            ticket.priority,
            ticket.issue_type,
            ticket.assignee,
            ticket.reporter,
            ticket.created_at,
            ticket.updated_at,
            ticket.resolved_at,
            ticket.labels,
            ticket.project_key,
            ticket.category,
        ],
    )
    .map_err(DbError::from)?;

    Ok(())
}

pub fn get_tickets(conn: &Connection) -> Result<Vec<Ticket>, AppError> {
    let mut stmt = conn
        .prepare(
            "SELECT id, jira_key, summary, status, priority, issue_type, assignee, reporter, \
             created_at, updated_at, resolved_at, labels, project_key, category \
             FROM tickets ORDER BY created_at DESC",
        )
        .map_err(DbError::from)?;

    let tickets = stmt
        .query_map([], |row| {
            Ok(Ticket {
                id: row.get(0)?,
                jira_key: row.get(1)?,
                summary: row.get(2)?,
                status: row.get(3)?,
                priority: row.get(4)?,
                issue_type: row.get(5)?,
                assignee: row.get(6)?,
                reporter: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
                resolved_at: row.get(10)?,
                labels: row.get(11)?,
                project_key: row.get(12)?,
                category: row.get(13)?,
            })
        })
        .map_err(DbError::from)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(DbError::from)?;

    Ok(tickets)
}

pub fn get_aggregations(conn: &Connection) -> Result<AggregationResult, AppError> {
    let tickets_by_status = get_count_by_field(conn, "status")?;
    let tickets_by_priority = get_count_by_field(conn, "priority")?;
    let tickets_by_category = get_count_by_field(conn, "category")?;
    let tickets_over_time = get_tickets_over_time(conn)?;
    let resolution_time_by_priority = get_resolution_time_by_priority(conn)?;
    let summary = get_summary_stats(conn)?;

    Ok(AggregationResult {
        tickets_by_status,
        tickets_by_priority,
        tickets_by_category,
        tickets_over_time,
        resolution_time_by_priority,
        summary,
    })
}

fn get_count_by_field(conn: &Connection, field: &str) -> Result<Vec<CountEntry>, AppError> {
    // Whitelist of allowed field names to prevent SQL injection
    let allowed_fields = ["status", "priority", "category"];
    if !allowed_fields.contains(&field) {
        return Err(AppError::Internal(format!("Invalid field name: {}", field)));
    }

    // Safe to use now that field is validated
    let query = format!(
        "SELECT COALESCE({}, 'Uncategorized') as name, COUNT(*) as count FROM tickets GROUP BY {} ORDER BY count DESC",
        field, field
    );

    let mut stmt = conn.prepare(&query).map_err(DbError::from)?;
    let entries = stmt
        .query_map([], |row| {
            Ok(CountEntry {
                name: row.get(0)?,
                count: row.get(1)?,
            })
        })
        .map_err(DbError::from)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(DbError::from)?;

    Ok(entries)
}

fn get_tickets_over_time(conn: &Connection) -> Result<Vec<TimeSeriesEntry>, AppError> {
    // Group by month and count created/resolved tickets
    let mut stmt = conn.prepare(
        r#"
        SELECT
            strftime('%Y-%m', created_at) as month,
            COUNT(*) as created_count,
            SUM(CASE WHEN resolved_at IS NOT NULL AND strftime('%Y-%m', resolved_at) = strftime('%Y-%m', created_at) THEN 1 ELSE 0 END) as resolved_count
        FROM tickets
        WHERE created_at IS NOT NULL
        GROUP BY month
        ORDER BY month ASC
        LIMIT 12
        "#
    ).map_err(DbError::from)?;

    let entries = stmt
        .query_map([], |row| {
            Ok(TimeSeriesEntry {
                date: row.get(0)?,
                created: row.get(1)?,
                resolved: row.get(2)?,
            })
        })
        .map_err(DbError::from)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(DbError::from)?;

    Ok(entries)
}

fn get_resolution_time_by_priority(conn: &Connection) -> Result<Vec<AvgEntry>, AppError> {
    // Calculate average resolution time in calendar hours (not business hours yet)
    // TODO: Implement business hours calculation using time_calc::business_hours_between

    // Get list of priorities first
    let priorities: Vec<String> = conn
        .prepare("SELECT DISTINCT priority FROM tickets WHERE resolved_at IS NOT NULL ORDER BY priority")
        .map_err(DbError::from)?
        .query_map([], |row| row.get(0))
        .map_err(DbError::from)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(DbError::from)?;

    let mut entries = Vec::new();

    for priority in priorities {
        // Calculate average
        let avg_hours: f64 = conn
            .query_row(
                "SELECT AVG((julianday(resolved_at) - julianday(created_at)) * 24) FROM tickets WHERE priority = ?1 AND resolved_at IS NOT NULL",
                [&priority],
                |row| row.get(0),
            )
            .optional()
            .map_err(DbError::from)?
            .unwrap_or(0.0);

        // Calculate median
        let count: u32 = conn
            .query_row(
                "SELECT COUNT(*) FROM tickets WHERE priority = ?1 AND resolved_at IS NOT NULL",
                [&priority],
                |row| row.get(0),
            )
            .map_err(DbError::from)?;

        let median_hours: f64 = if count > 0 {
            conn.query_row(
                r#"
                SELECT (julianday(resolved_at) - julianday(created_at)) * 24
                FROM tickets
                WHERE priority = ?1 AND resolved_at IS NOT NULL
                ORDER BY (julianday(resolved_at) - julianday(created_at))
                LIMIT 1
                OFFSET ?2
                "#,
                params![&priority, count / 2],
                |row| row.get(0),
            )
            .optional()
            .map_err(DbError::from)?
            .unwrap_or(0.0)
        } else {
            0.0
        };

        entries.push(AvgEntry {
            name: priority,
            avg_hours,
            median_hours,
            count,
        });
    }

    // Sort by priority order
    entries.sort_by_key(|e| match e.name.as_str() {
        "Critical" => 1,
        "High" => 2,
        "Medium" => 3,
        "Low" => 4,
        _ => 5,
    });

    Ok(entries)
}

fn get_summary_stats(conn: &Connection) -> Result<SummaryStats, AppError> {
    let total_tickets: u32 = conn
        .query_row("SELECT COUNT(*) FROM tickets", [], |row| row.get(0))
        .map_err(DbError::from)?;

    let open_tickets: u32 = conn
        .query_row(
            "SELECT COUNT(*) FROM tickets WHERE resolved_at IS NULL",
            [],
            |row| row.get(0),
        )
        .map_err(DbError::from)?;

    let resolved_tickets = total_tickets - open_tickets;

    // Calculate average resolution time in calendar hours for resolved tickets
    let avg_resolution_hours: f64 = conn
        .query_row(
            "SELECT AVG((julianday(resolved_at) - julianday(created_at)) * 24) FROM tickets WHERE resolved_at IS NOT NULL",
            [],
            |row| row.get(0),
        )
        .optional()
        .map_err(DbError::from)?
        .unwrap_or(0.0);

    // Calculate median resolution time (50th percentile)
    let median_resolution_hours: f64 = conn
        .query_row(
            r#"
            SELECT (julianday(resolved_at) - julianday(created_at)) * 24 as hours
            FROM tickets
            WHERE resolved_at IS NOT NULL
            ORDER BY hours
            LIMIT 1
            OFFSET (SELECT COUNT(*) FROM tickets WHERE resolved_at IS NOT NULL) / 2
            "#,
            [],
            |row| row.get(0),
        )
        .optional()
        .map_err(DbError::from)?
        .unwrap_or(0.0);

    Ok(SummaryStats {
        total_tickets,
        open_tickets,
        resolved_tickets,
        avg_resolution_hours,
        median_resolution_hours,
    })
}

pub fn get_sync_metadata(conn: &Connection, key: &str) -> Result<Option<String>, AppError> {
    let result: Option<String> = conn
        .query_row(
            "SELECT value FROM sync_metadata WHERE key = ?1",
            params![key],
            |row| row.get(0),
        )
        .optional()
        .map_err(DbError::from)?;
    Ok(result)
}

pub fn set_sync_metadata(conn: &Connection, key: &str, value: &str) -> Result<(), AppError> {
    conn.execute(
        "INSERT OR REPLACE INTO sync_metadata (key, value) VALUES (?1, ?2)",
        params![key, value],
    )
    .map_err(DbError::from)?;
    Ok(())
}
