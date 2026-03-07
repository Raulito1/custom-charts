import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface ChartRendererProps {
  options: Record<string, unknown>;
  height?: number;
}

const DEFAULT_THEME: Highcharts.Options = {
  colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'],
  chart: {
    style: { fontFamily: 'inherit' },
    backgroundColor: 'transparent',
    animation: { duration: 400 },
  },
  xAxis: {
    gridLineColor: '#f1f5f9',
    lineColor: '#e2e8f0',
    tickColor: '#e2e8f0',
    labels: { style: { color: '#64748b', fontSize: '11px' } },
    title: { style: { color: '#94a3b8', fontSize: '11px' } },
  } as Highcharts.XAxisOptions,
  yAxis: {
    gridLineColor: '#f1f5f9',
    labels: { style: { color: '#64748b', fontSize: '11px' } },
    title: { style: { color: '#94a3b8', fontSize: '11px' } },
  } as Highcharts.YAxisOptions,
  legend: { itemStyle: { color: '#475569', fontWeight: '500', fontSize: '11px' } },
  plotOptions: {
    series: { animation: { duration: 400 } },
    column: { borderRadius: 4, borderWidth: 0 },
    bar: { borderRadius: 4, borderWidth: 0 },
    pie: { borderWidth: 2, borderColor: '#fff' },
  },
};

export function ChartRenderer({ options, height = 260 }: ChartRendererProps) {
  const merged = Highcharts.merge(DEFAULT_THEME, options, {
    chart: { height },
  });

  return (
    <div className="w-full">
      <HighchartsReact highcharts={Highcharts} options={merged} />
    </div>
  );
}
