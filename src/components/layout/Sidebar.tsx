import { useAppStore } from '../../stores/useAppStore';

export function Sidebar() {
  const { activeView, setActiveView } = useAppStore((s) => ({
    activeView: s.activeView,
    setActiveView: s.setActiveView,
  }));

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard' },
    { id: 'tickets' as const, label: 'Tickets' },
    { id: 'settings' as const, label: 'Settings' },
  ];

  return (
    <div className="w-64 bg-[--color-surface-alt] border-r border-gray-700 flex flex-col no-print">
      <div className="p-6">
        <h1 className="text-xl font-bold">Ticket Dashboard</h1>
      </div>
      <nav className="flex-1 px-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full text-left px-4 py-3 rounded mb-2 transition ${
              activeView === item.id
                ? 'bg-[--color-primary] text-white'
                : 'text-[--color-text-muted] hover:bg-gray-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
