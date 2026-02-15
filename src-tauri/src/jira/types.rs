use serde::Deserialize;

#[derive(Deserialize)]
pub struct JiraSearchResponse {
    pub issues: Vec<JiraIssue>,
    #[serde(rename = "nextPageToken")]
    pub next_page_token: Option<String>,
}

#[derive(Deserialize)]
pub struct JiraIssue {
    pub key: String,
    pub fields: JiraFields,
}

#[derive(Deserialize)]
pub struct JiraFields {
    pub summary: String,
    pub status: NameField,
    pub priority: NameField,
    pub issuetype: NameField,
    pub assignee: Option<DisplayNameField>,
    pub reporter: Option<DisplayNameField>,
    pub created: String,
    pub updated: String,
    pub resolutiondate: Option<String>,
    pub labels: Vec<String>,
    pub project: KeyField,
}

#[derive(Deserialize)]
pub struct NameField {
    pub name: String,
}

#[derive(Deserialize)]
pub struct DisplayNameField {
    #[serde(rename = "displayName")]
    pub display_name: String,
}

#[derive(Deserialize)]
pub struct KeyField {
    pub key: String,
}
