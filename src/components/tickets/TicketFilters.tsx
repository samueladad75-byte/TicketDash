import { useAppStore } from '../../stores/useAppStore';

export function TicketFilters() {
  const { filters, setStatuses, setCategories, setPriorities, resetFilters } = useAppStore(
    (s) => ({
      filters: s.filters,
      setStatuses: s.setStatuses,
      setCategories: s.setCategories,
      setPriorities: s.setPriorities,
      resetFilters: s.resetFilters,
    }),
  );

  return (
    <div className="bg-[--color-surface-alt] p-4 rounded mb-4 no-print">
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <label className="block text-sm text-[--color-text-muted] mb-1">Status</label>
          <select
            className="w-full px-3 py-2 bg-[--color-surface] border border-gray-700 rounded text-[--color-text]"
            value={filters.statuses[0] || ''}
            onChange={(e) => setStatuses(e.target.value ? [e.target.value] : [])}
          >
            <option value="">All</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm text-[--color-text-muted] mb-1">Priority</label>
          <select
            className="w-full px-3 py-2 bg-[--color-surface] border border-gray-700 rounded text-[--color-text]"
            value={filters.priorities[0] || ''}
            onChange={(e) => setPriorities(e.target.value ? [e.target.value] : [])}
          >
            <option value="">All</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm text-[--color-text-muted] mb-1">Category</label>
          <select
            className="w-full px-3 py-2 bg-[--color-surface] border border-gray-700 rounded text-[--color-text]"
            value={filters.categories[0] || ''}
            onChange={(e) => setCategories(e.target.value ? [e.target.value] : [])}
          >
            <option value="">All</option>
            <option value="Password">Password</option>
            <option value="VPN">VPN</option>
            <option value="Hardware">Hardware</option>
            <option value="Application">Application</option>
            <option value="Access">Access</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="pt-6">
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:opacity-80"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
