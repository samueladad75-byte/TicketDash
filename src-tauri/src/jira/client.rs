use crate::errors::{AppError, JiraError};
use crate::jira::types::JiraSearchResponse;
use crate::models::Ticket;
use base64::Engine;

pub struct JiraClient {
    base_url: String,
    auth_header: String,
    client: reqwest::Client,
}

impl JiraClient {
    pub fn new(jira_url: &str, email: &str, token: &str) -> Result<Self, AppError> {
        let base_url = format!("{}/rest/api/3", jira_url.trim_end_matches('/'));
        let auth_header = Self::create_auth_header(email, token);
        let client = reqwest::Client::new();

        Ok(JiraClient {
            base_url,
            auth_header,
            client,
        })
    }

    fn create_auth_header(email: &str, token: &str) -> String {
        let credentials = format!("{}:{}", email, token);
        let encoded = base64::engine::general_purpose::STANDARD.encode(credentials);
        format!("Basic {}", encoded)
    }

    pub async fn fetch_tickets(
        &self,
        last_sync_ts: Option<&str>,
    ) -> Result<Vec<Ticket>, AppError> {
        let mut all_tickets = Vec::new();
        let mut next_page_token: Option<String> = None;

        loop {
            let jql = if let Some(ts) = last_sync_ts {
                format!(
                    "assignee = currentUser() AND updated >= \"{}\" ORDER BY updated ASC",
                    ts
                )
            } else {
                "assignee = currentUser() ORDER BY created DESC".to_string()
            };

            let response = self.search_jql(&jql, next_page_token.as_deref()).await?;

            for issue in response.issues {
                let ticket = Self::convert_issue_to_ticket(issue);
                all_tickets.push(ticket);
            }

            if response.next_page_token.is_none() {
                break;
            }
            next_page_token = response.next_page_token;
        }

        Ok(all_tickets)
    }

    async fn search_jql(
        &self,
        jql: &str,
        next_page_token: Option<&str>,
    ) -> Result<JiraSearchResponse, AppError> {
        let mut body = serde_json::json!({
            "jql": jql,
            "maxResults": 100,
            "fields": [
                "summary", "status", "priority", "issuetype",
                "assignee", "reporter", "created", "updated",
                "resolutiondate", "labels", "project"
            ]
        });

        if let Some(token) = next_page_token {
            body["nextPageToken"] = serde_json::json!(token);
        }

        let url = format!("{}/search/jql", self.base_url);
        let response = self
            .client
            .post(&url)
            .header("Authorization", &self.auth_header)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(JiraError::from)?;

        let status = response.status();

        if status.is_success() {
            let search_response: JiraSearchResponse = response
                .json()
                .await
                .map_err(|e| JiraError::ParseError(e.to_string()))?;
            Ok(search_response)
        } else if status.as_u16() == 401 {
            Err(JiraError::Unauthorized.into())
        } else if status.as_u16() == 429 {
            let retry_after = response
                .headers()
                .get("Retry-After")
                .and_then(|v| v.to_str().ok())
                .and_then(|v| v.parse::<u64>().ok())
                .unwrap_or_else(|| {
                    log::warn!("Rate limited but Retry-After header missing or invalid, defaulting to 60 seconds");
                    60
                });

            // Cap retry at 5 minutes to prevent unreasonable waits
            let retry_after = retry_after.min(300);

            Err(JiraError::RateLimited {
                retry_after_secs: retry_after,
            }
            .into())
        } else {
            let body = response
                .text()
                .await
                .unwrap_or_else(|_| "Failed to read error response".to_string());
            Err(JiraError::ApiError {
                status: status.as_u16(),
                body,
            }
            .into())
        }
    }

    fn convert_issue_to_ticket(issue: crate::jira::types::JiraIssue) -> Ticket {
        Ticket {
            id: 0, // Will be set by database
            jira_key: issue.key,
            summary: issue.fields.summary,
            status: issue.fields.status.name,
            priority: issue.fields.priority.name,
            issue_type: issue.fields.issuetype.name,
            assignee: issue.fields.assignee.map(|a| a.display_name),
            reporter: issue.fields.reporter.map(|r| r.display_name),
            created_at: issue.fields.created,
            updated_at: issue.fields.updated,
            resolved_at: issue.fields.resolutiondate,
            labels: issue.fields.labels.join(","),
            project_key: issue.fields.project.key,
            category: None, // Will be set by categorizer
        }
    }
}
