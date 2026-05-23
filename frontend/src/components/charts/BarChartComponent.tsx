import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface BarChartComponentProps {
  data: { label: string; value: number }[];
  barColor?: string;
  height?: number;
}

export const BarChartComponent: React.FC<BarChartComponentProps> = ({ 
  data, 
  barColor = '#2563eb', 
  height = 200 
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barSize={28} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis 
          dataKey="label" 
          tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} 
          axisLine={false} 
          tickLine={false} 
        />
        <YAxis 
          tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} 
          axisLine={false} 
          tickLine={false} 
          domain={[0, 100]}
        />
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
          cursor={{ fill: '#f8fafc' }}
        />
        <Bar dataKey="value" fill={barColor} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
