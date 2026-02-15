import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TimeSeriesEntry } from '../../types/aggregation';

interface TimelineChartProps {
  data: TimeSeriesEntry[];
}

export function TimelineChart({ data }: TimelineChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-[--color-surface-alt] p-4 rounded chart-container">
        <h3 className="font-bold mb-4">Tickets Over Time</h3>
        <div className="h-[250px] flex items-center justify-center text-[--color-text-muted]">
          Not enough data yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[--color-surface-alt] p-4 rounded chart-container">
      <h3 className="font-bold mb-4">Tickets Over Time</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#2a2a3e',
              border: '1px solid #374151',
              borderRadius: '4px',
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="created" stroke="#3b82f6" name="Created" />
          <Line type="monotone" dataKey="resolved" stroke="#22c55e" name="Resolved" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
