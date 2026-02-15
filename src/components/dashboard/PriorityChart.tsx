import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CountEntry } from '../../types/aggregation';

interface PriorityChartProps {
  data: CountEntry[];
}

export function PriorityChart({ data }: PriorityChartProps) {
  return (
    <div className="bg-[--color-surface-alt] p-4 rounded chart-container">
      <h3 className="font-bold mb-4">Tickets by Priority</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#2a2a3e',
              border: '1px solid #374151',
              borderRadius: '4px',
            }}
          />
          <Bar dataKey="count" fill="#22c55e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
