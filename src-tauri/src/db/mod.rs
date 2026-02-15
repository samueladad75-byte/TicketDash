pub mod migrations;
pub mod queries;

pub use migrations::*;
pub use queries::*;

use crate::errors::{AppError, DbError};
use rusqlite::Connection;
use std::sync::{Arc, Mutex};

pub struct DbPool(pub Arc<Mutex<Connection>>);

impl DbPool {
    pub fn new(db_path: &str) -> Result<Self, AppError> {
        let conn = Connection::open(db_path).map_err(DbError::from)?;
        initialize_database(&conn)?;
        Ok(DbPool(Arc::new(Mutex::new(conn))))
    }
}
