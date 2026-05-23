import React from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';

interface RadarChartComponentProps {
  data: { subject: string; A: number; fullMark: number }[];
  height?: number;
}

export const RadarChartComponent: React.FC<RadarChartComponentProps> = ({
  data,
  height = 220
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis 
          dataKey="subject" 
          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
        />
        <PolarRadiusAxis 
          angle={30} 
          domain={[0, 100]} 
          tick={{ fill: '#94a3b8', fontSize: 9 }}
          axisLine={false}
        />
        <Radar 
          name="Skills Analytics" 
          dataKey="A" 
          stroke="#4F46E5" 
          fill="#4F46E5" 
          fillOpacity={0.25} 
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
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};
