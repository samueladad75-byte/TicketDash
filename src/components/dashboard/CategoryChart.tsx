import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CountEntry } from '../../types/aggregation';

interface CategoryChartProps {
  data: CountEntry[];
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function CategoryChart({ data }: CategoryChartProps) {
  return (
    <div className="bg-[--color-surface-alt] p-4 rounded chart-container">
      <h3 className="font-bold mb-4">Tickets by Category</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#2a2a3e',
              border: '1px solid #374151',
              borderRadius: '4px',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
