export interface Ticket {
  id: number;
  jira_key: string;
  summary: string;
  status: string;
  priority: string;
  issue_type: string;
  assignee: string | null;
  reporter: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  labels: string;
  project_key: string;
  category: string | null;
}
