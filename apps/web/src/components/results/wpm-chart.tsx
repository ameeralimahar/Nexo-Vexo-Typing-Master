'use client';

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface WpmChartProps {
  data: Array<{ t: number; wpm: number }>;
}

export function WpmChart({ data }: WpmChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        Not enough data to chart.
      </div>
    );
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="wpmFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="t"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            unit="s"
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 8,
              color: 'hsl(var(--card-foreground))',
              fontSize: 12,
            }}
            labelFormatter={(l) => `${l}s`}
            formatter={(v: number) => [`${v} WPM`, 'Net WPM']}
          />
          <Area
            type="monotone"
            dataKey="wpm"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            fill="url(#wpmFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
