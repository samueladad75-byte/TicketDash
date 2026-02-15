import { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { TicketFilters } from './TicketFilters';

type SortField = 'jira_key' | 'summary' | 'status' | 'priority' | 'created_at';
type SortDir = 'asc' | 'desc';

export function TicketsView() {
  const { tickets, filters, fetchTickets } = useAppStore((s) => ({
    tickets: s.tickets,
    filters: s.filters,
    fetchTickets: s.fetchTickets,
  }));

  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filteredAndSortedTickets = useMemo(() => {
    let result = [...tickets];

    // Apply filters
    if (filters.statuses.length > 0) {
      result = result.filter((t) => filters.statuses.includes(t.status));
    }
    if (filters.priorities.length > 0) {
      result = result.filter((t) => filters.priorities.includes(t.priority));
    }
    if (filters.categories.length > 0) {
      result = result.filter((t) =>
        t.category ? filters.categories.includes(t.category) : filters.categories.includes('Other'),
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal: string | number = a[sortField] || '';
      let bVal: string | number = b[sortField] || '';

      if (sortField === 'created_at') {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [tickets, filters, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Tickets</h2>

      <TicketFilters />

      <div className="bg-[--color-surface-alt] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('jira_key')}
                >
                  Key <SortIcon field="jira_key" />
                </th>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('summary')}
                >
                  Summary <SortIcon field="summary" />
                </th>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('status')}
                >
                  Status <SortIcon field="status" />
                </th>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('priority')}
                >
                  Priority <SortIcon field="priority" />
                </th>
                <th className="px-4 py-3 text-left">Category</th>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('created_at')}
                >
                  Created <SortIcon field="created_at" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[--color-text-muted]">
                    {tickets.length === 0
                      ? 'No tickets yet. Sync from Jira in Settings.'
                      : 'No tickets match your filters.'}
                  </td>
                </tr>
              ) : (
                filteredAndSortedTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-gray-800 hover:bg-gray-700">
                    <td className="px-4 py-3 font-mono text-sm">{ticket.jira_key}</td>
                    <td className="px-4 py-3">{ticket.summary}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-xs bg-gray-700">{ticket.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          ticket.priority === 'Critical'
                            ? 'bg-red-900 text-red-200'
                            : ticket.priority === 'High'
                              ? 'bg-orange-900 text-orange-200'
                              : ticket.priority === 'Medium'
                                ? 'bg-yellow-900 text-yellow-200'
                                : 'bg-gray-700'
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">{ticket.category || 'Uncategorized'}</td>
                    <td className="px-4 py-3 text-sm text-[--color-text-muted]">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredAndSortedTickets.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-700 text-sm text-[--color-text-muted]">
            Showing {filteredAndSortedTickets.length} of {tickets.length} tickets
          </div>
        )}
      </div>
    </div>
  );
}
