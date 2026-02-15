import { useAppStore } from './stores/useAppStore';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { TicketsView } from './components/tickets/TicketsView';
import { SettingsView } from './components/settings/SettingsView';
import { SyncProgressBar } from './components/common/SyncProgressBar';
import { useSyncEvents } from './hooks/useSyncEvents';

function App() {
  const activeView = useAppStore((s) => s.activeView);

  // Set up Tauri event listeners for sync progress
  useSyncEvents();

  return (
    <div className="flex h-screen bg-[--color-surface] text-[--color-text]">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'tickets' && <TicketsView />}
        {activeView === 'settings' && <SettingsView />}
      </main>
      <SyncProgressBar />
    </div>
  );
}

export default App;
