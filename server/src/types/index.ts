// ─── NLQ / Query Pipeline ──────────────────────────────────────────────────

export interface NLQRequest {
  question: string;
  liveboardId?: string;
}

export interface ClaudeQueryResponse {
  sql: string;
  queryTitle: string;
  explanation: string;
  // Full Highcharts options with _dataFormat + _*Field series mapping keys.
  // Actual series[].data is NOT present — server injects it via injectData().
  highchartsOptions: Record<string, unknown>;
}

export interface QueryResult {
  queryId: string;
  question: string;
  sql: string;
  explanation: string;
  queryTitle: string;
  highchartsTemplate: Record<string, unknown>; // Claude's template (stored for rerun)
  data: Record<string, unknown>[];
  highchartsOptions: Record<string, unknown>;  // fully rendered (for display)
  executedAt: string;
  durationMs: number;
}

export interface SavedQuery {
  id: string;
  question: string;
  sqlText: string;
  title: string;
  highchartsTemplate: Record<string, unknown>;
  createdAt: string;
  lastRunAt: string;
}

// ─── Liveboard & Chart Cards ───────────────────────────────────────────────

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

// ─── Mock Schema ──────────────────────────────────────────────────────────

export interface MockColumn {
  name: string;
  type: 'VARCHAR' | 'NUMBER' | 'DATE' | 'TIMESTAMP' | 'BOOLEAN';
  description: string;
}

export interface MockTable {
  name: string;
  description: string;
  columns: MockColumn[];
}

// ─── API Wrappers ─────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
