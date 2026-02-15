use crate::errors::{AppError, DbError};
use rusqlite::Connection;

const SCHEMA_VERSION: i32 = 1;

pub fn initialize_database(conn: &Connection) -> Result<(), AppError> {
    let current_version = get_schema_version(conn)?;

    if current_version == 0 {
        create_schema_v1(conn)?;
        set_schema_version(conn, SCHEMA_VERSION)?;
    } else if current_version < SCHEMA_VERSION {
        migrate_schema(conn, current_version)?;
    }

    Ok(())
}

fn get_schema_version(conn: &Connection) -> Result<i32, AppError> {
    let version: i32 = conn
        .pragma_query_value(None, "user_version", |row| row.get(0))
        .map_err(DbError::from)?;
    Ok(version)
}

fn set_schema_version(conn: &Connection, version: i32) -> Result<(), AppError> {
    conn.pragma_update(None, "user_version", version)
        .map_err(DbError::from)?;
    Ok(())
}

fn create_schema_v1(conn: &Connection) -> Result<(), AppError> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jira_key TEXT NOT NULL UNIQUE,
            summary TEXT NOT NULL,
            status TEXT NOT NULL,
            priority TEXT NOT NULL,
            issue_type TEXT NOT NULL,
            assignee TEXT,
            reporter TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            resolved_at TEXT,
            labels TEXT NOT NULL DEFAULT '',
            project_key TEXT NOT NULL,
            category TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
        CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
        CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at);
        CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
        CREATE INDEX IF NOT EXISTS idx_tickets_jira_key ON tickets(jira_key);

        CREATE TABLE IF NOT EXISTS sync_metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        "#,
    )
    .map_err(|e| DbError::Migration(format!("Failed to create schema v1: {}", e)))?;

    Ok(())
}

fn migrate_schema(_conn: &Connection, _from_version: i32) -> Result<(), AppError> {
    // Future migrations will go here
    Ok(())
}
