import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AvgEntry } from '../../types/aggregation';

interface ResolutionTimeChartProps {
  data: AvgEntry[];
}

export function ResolutionTimeChart({ data }: ResolutionTimeChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-[--color-surface-alt] p-4 rounded chart-container">
        <h3 className="font-bold mb-4">Avg Resolution Time by Priority</h3>
        <div className="h-[250px] flex items-center justify-center text-[--color-text-muted]">
          Not enough data yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[--color-surface-alt] p-4 rounded chart-container">
      <h3 className="font-bold mb-4">Avg Resolution Time by Priority</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#2a2a3e',
              border: '1px solid #374151',
              borderRadius: '4px',
            }}
          />
          <Bar dataKey="avg_hours" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
