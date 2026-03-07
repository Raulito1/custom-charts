export type ChartType = 'bar' | 'column' | 'line' | 'pie' | 'area' | 'scatter';

export interface AxisConfig {
  field: string;
  label: string;
  type: 'category' | 'datetime' | 'linear';
}

export interface SeriesConfig {
  field: string;
  name: string;
}

export interface ChartConfig {
  chartType: ChartType;
  title: string;
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  series: SeriesConfig[];
}

export interface QueryResult {
  queryId: string;
  question: string;
  sql: string;
  explanation: string;
  queryTitle: string;
  chartConfig: ChartConfig;
  data: Record<string, unknown>[];
  highchartsOptions: Record<string, unknown>;
  executedAt: string;
  durationMs: number;
}

export interface SavedQuery {
  id: string;
  question: string;
  sqlText: string;
  title: string;
  chartConfig: ChartConfig;
  createdAt: string;
  lastRunAt: string;
}

export interface GridItemLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface LiveboardChart {
  id: string;
  savedQueryId?: string;
  queryResult: QueryResult;
  layout: GridItemLayout;
  pinnedAt: string;
}

export interface Liveboard {
  id: string;
  name: string;
  description?: string;
  charts: LiveboardChart[];
  createdAt: string;
  updatedAt: string;
}

export interface LiveboardSummary {
  id: string;
  name: string;
  description?: string;
  chartCount: number;
  updatedAt: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
