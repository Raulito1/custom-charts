import { pool } from '../db/postgres';
import type { QueryResult, SavedQuery } from '../types';

export async function saveQuery(result: QueryResult): Promise<void> {
  await pool.query(
    `INSERT INTO saved_queries (id, question, sql_text, title, chart_config, created_at, last_run_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET last_run_at = NOW()`,
    [
      result.queryId,
      result.question,
      result.sql,
      result.queryTitle,
      JSON.stringify(result.highchartsTemplate),
    ]
  );
}

export async function listQueries(limit = 50, offset = 0): Promise<SavedQuery[]> {
  const { rows } = await pool.query(
    `SELECT id, question, sql_text, title, chart_config, created_at, last_run_at
     FROM saved_queries
     ORDER BY last_run_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows.map(toSavedQuery);
}

export async function getQueryById(id: string): Promise<SavedQuery | null> {
  const { rows } = await pool.query(
    `SELECT id, question, sql_text, title, chart_config, created_at, last_run_at
     FROM saved_queries WHERE id = $1`,
    [id]
  );
  return rows.length ? toSavedQuery(rows[0]) : null;
}

export async function deleteQueryById(id: string): Promise<void> {
  await pool.query('DELETE FROM saved_queries WHERE id = $1', [id]);
}

function toSavedQuery(row: Record<string, unknown>): SavedQuery {
  return {
    id: String(row.id),
    question: String(row.question),
    sqlText: String(row.sql_text),
    title: String(row.title),
    highchartsTemplate: typeof row.chart_config === 'string'
      ? JSON.parse(row.chart_config)
      : row.chart_config,
    createdAt: String(row.created_at),
    lastRunAt: String(row.last_run_at),
  };
}
