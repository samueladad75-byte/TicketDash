use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] DbError),

    #[error("Jira API error: {0}")]
    JiraApi(#[from] JiraError),

    #[error("Credential storage error: {0}")]
    Keyring(String),

    #[error("Sync is already in progress")]
    SyncAlreadyInProgress,

    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

// Tauri requires Serialize for command return errors
impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[derive(Error, Debug)]
pub enum DbError {
    #[error("SQLite error: {0}")]
    Sqlite(#[from] rusqlite::Error),

    #[error("Lock acquisition failed")]
    LockFailed,

    #[error("Migration failed: {0}")]
    Migration(String),
}

#[derive(Error, Debug)]
pub enum JiraError {
    #[error("HTTP request failed: {0}")]
    Http(#[from] reqwest::Error),

    #[error("Authentication failed (401). Check your email and API token.")]
    Unauthorized,

    #[error("Rate limited (429). Retry after {retry_after_secs}s.")]
    RateLimited { retry_after_secs: u64 },

    #[error("Jira returned {status}: {body}")]
    ApiError { status: u16, body: String },

    #[error("Failed to parse Jira response: {0}")]
    ParseError(String),

    #[error("Not configured. Set Jira URL, email, and API token in Settings.")]
    NotConfigured,
}
