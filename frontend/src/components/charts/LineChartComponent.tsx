import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface LineChartComponentProps {
  data: { label: string; value: number }[];
  lineColor?: string;
  gradientColor?: string;
  height?: number;
}

export const LineChartComponent: React.FC<LineChartComponentProps> = ({
  data,
  lineColor = '#2563eb',
  gradientColor = '#2563eb',
  height = 160
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart 
        data={data} 
        margin={{ 
          top: 10, 
          right: 10, 
          left: -20, 
          bottom: isMobile ? 35 : 0 
        }}
      >
        <defs>
          <linearGradient id="areaColorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={gradientColor} stopOpacity={0.18} />
            <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis 
          dataKey="label" 
          tick={{ fontSize: isMobile ? 9 : 11, fill: "#94a3b8", fontWeight: 600 }} 
          axisLine={false} 
          tickLine={false} 
          angle={isMobile ? -35 : 0}
          textAnchor={isMobile ? "end" : undefined}
          height={isMobile ? 55 : 30}
          tickFormatter={(value) => {
            if (isMobile && typeof value === 'string') {
              // Strip " Department" from end to fit nicely in mobile views
              return value.replace(/[\s\-_]+department$/i, '');
            }
            return value;
          }}
        />
        <YAxis 
          tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} 
          axisLine={false} 
          tickLine={false} 
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
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke={lineColor} 
          strokeWidth={2.5} 
          fill="url(#areaColorGradient)" 
          dot={{ fill: lineColor, r: 4, strokeWidth: 1 }} 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
