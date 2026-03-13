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

/** Generic filter — any column name mapped to selected string values. */
export interface FilterState {
  columns: Record<string, string[]>;
  dateFrom: string | null;
  dateTo: string | null;
  dateColumn: string | null;
}

/** A filterable column discovered from the schema, with its distinct values. */
export interface FilterColumn {
  table: string;
  column: string;
  label: string;
  options: string[];
}

/** A date column available for date-range filtering. */
export interface DateColumn {
  table: string;
  column: string;
  label: string;
}

export const EMPTY_FILTERS: FilterState = {
  columns: {},
  dateFrom: null,
  dateTo: null,
  dateColumn: null,
};

export function hasActiveFilters(f: FilterState): boolean {
  return (
    Object.values(f.columns).some((v) => v.length > 0) ||
    f.dateFrom !== null ||
    f.dateTo !== null
  );
}

export interface QueryResult {
  queryId: string;
  question: string;
  sql: string;
  explanation: string;
  queryTitle: string;
  chartConfig: ChartConfig;
  highchartsTemplate?: Record<string, unknown>;
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
