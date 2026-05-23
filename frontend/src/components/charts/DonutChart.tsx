import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface DonutChartProps {
  data: { name: string; value: number }[];
  colors?: string[];
  height?: number;
}

const DEFAULT_COLORS = ["#2563eb", "#16a34a", "#d97706", "#EF4444", "#06B6D4"];

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  colors = DEFAULT_COLORS,
  height = 160
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie 
          data={data} 
          cx="50%" 
          cy="50%" 
          innerRadius={48} 
          outerRadius={68} 
          paddingAngle={4} 
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={`cell-${i}`} fill={colors[i % colors.length]} className="focus:outline-none" />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            borderRadius: "16px", 
            border: "none", 
            boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
            fontFamily: "sans-serif",
            fontWeight: 600,
            fontSize: "12px",
            color: "#1e293b",
            background: "#ffffff"
          }} 
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
