import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { invokeCommand } from '../../hooks/useTauriInvoke';

interface JiraSettings {
  jira_url: string;
  email: string;
}

export function SettingsView() {
  const { syncStatus, triggerSync } = useAppStore((s) => ({
    syncStatus: s.syncStatus,
    triggerSync: s.triggerSync,
  }));

  const [jiraUrl, setJiraUrl] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const settings = await invokeCommand<JiraSettings | null>('load_jira_settings');
      if (settings) {
        setJiraUrl(settings.jira_url);
        setEmail(settings.email);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  // Load settings on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSettings();
  }, [loadSettings]);

  const handleSaveCredentials = async () => {
    try {
      // Save jiraUrl and email to store
      await invokeCommand('save_jira_settings', {
        jiraUrl,
        email,
      });

      // Save token to keyring
      if (token) {
        await invokeCommand('store_jira_token', { token });
      }

      setSaveStatus('Credentials saved successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      setSaveStatus(`Error: ${error}`);
    }
  };

  const handleSync = async () => {
    await triggerSync();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="bg-[--color-surface-alt] p-6 rounded mb-6">
        <h3 className="font-bold mb-4">Jira Connection</h3>

        <div className="mb-4">
          <label className="block text-sm text-[--color-text-muted] mb-2">Jira URL</label>
          <input
            type="text"
            value={jiraUrl}
            onChange={(e) => setJiraUrl(e.target.value)}
            placeholder="https://yourcompany.atlassian.net"
            className="w-full px-3 py-2 bg-[--color-surface] border border-gray-700 rounded text-[--color-text]"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-[--color-text-muted] mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full px-3 py-2 bg-[--color-surface] border border-gray-700 rounded text-[--color-text]"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-[--color-text-muted] mb-2">API Token</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your Jira API token"
            className="w-full px-3 py-2 bg-[--color-surface] border border-gray-700 rounded text-[--color-text]"
          />
          <a
            href="https://id.atlassian.com/manage-profile/security/api-tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[--color-primary] hover:underline mt-1 inline-block"
          >
            Generate API token →
          </a>
        </div>

        <button
          onClick={handleSaveCredentials}
          className="px-4 py-2 bg-[--color-primary] text-white rounded hover:opacity-80"
        >
          Save Credentials
        </button>

        {saveStatus && (
          <div className="mt-4 text-sm text-[--color-success]">{saveStatus}</div>
        )}
      </div>

      <div className="bg-[--color-surface-alt] p-6 rounded">
        <h3 className="font-bold mb-4">Sync</h3>
        <button
          onClick={handleSync}
          disabled={syncStatus === 'syncing'}
          className="px-4 py-2 bg-[--color-success] text-white rounded hover:opacity-80 disabled:opacity-50"
        >
          {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>
    </div>
  );
}
