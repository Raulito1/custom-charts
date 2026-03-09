import { pool } from '../db/postgres';
import { v4 as uuidv4 } from 'uuid';
import type { Liveboard, LiveboardChart, LiveboardSummary, QueryResult, GridItemLayout } from '../types';

// ─── Liveboards ───────────────────────────────────────────────────────────

export async function listLiveboards(): Promise<LiveboardSummary[]> {
  const { rows } = await pool.query(`
    SELECT l.id, l.name, l.description, l.updated_at,
           COUNT(lc.id)::int AS chart_count
    FROM liveboards l
    LEFT JOIN liveboard_charts lc ON lc.liveboard_id = l.id
    GROUP BY l.id
    ORDER BY l.updated_at DESC
  `);
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    description: r.description ? String(r.description) : undefined,
    chartCount: Number(r.chart_count),
    updatedAt: String(r.updated_at),
  }));
}

export async function createLiveboard(name: string, description?: string): Promise<Liveboard> {
  const { rows } = await pool.query(
    `INSERT INTO liveboards (name, description) VALUES ($1, $2) RETURNING *`,
    [name, description || null]
  );
  return { ...toLiveboard(rows[0]), charts: [] };
}

export async function getLiveboardById(id: string): Promise<Liveboard | null> {
  const { rows } = await pool.query('SELECT * FROM liveboards WHERE id = $1', [id]);
  if (!rows.length) return null;
  const liveboard = toLiveboard(rows[0]);
  liveboard.charts = await getLiveboardCharts(id);
  return liveboard;
}

export async function updateLiveboard(
  id: string,
  updates: { name?: string; description?: string }
): Promise<Liveboard | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (updates.name !== undefined) { fields.push(`name = $${idx++}`); values.push(updates.name); }
  if (updates.description !== undefined) { fields.push(`description = $${idx++}`); values.push(updates.description); }
  if (!fields.length) return getLiveboardById(id);

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE liveboards SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  if (!rows.length) return null;
  const liveboard = toLiveboard(rows[0]);
  liveboard.charts = await getLiveboardCharts(id);
  return liveboard;
}

export async function deleteLiveboard(id: string): Promise<void> {
  await pool.query('DELETE FROM liveboards WHERE id = $1', [id]);
}

// ─── Charts ───────────────────────────────────────────────────────────────

export async function addChartToLiveboard(
  liveboardId: string,
  queryResult: QueryResult,
  layout: GridItemLayout
): Promise<LiveboardChart> {
  const id = uuidv4();
  const { rows } = await pool.query(
    `INSERT INTO liveboard_charts
     (id, liveboard_id, saved_query_id, title, question, sql_text, chart_config, query_data, highcharts_opts,
      layout_x, layout_y, layout_w, layout_h)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      id,
      liveboardId,
      queryResult.queryId,
      queryResult.queryTitle,
      queryResult.question,
      queryResult.sql,
      JSON.stringify(queryResult.highchartsTemplate),
      JSON.stringify(queryResult.data),
      JSON.stringify(queryResult.highchartsOptions),
      layout.x, layout.y, layout.w, layout.h,
    ]
  );
  return toChart(rows[0]);
}

export async function removeChartFromLiveboard(liveboardId: string, chartId: string): Promise<void> {
  await pool.query(
    'DELETE FROM liveboard_charts WHERE id = $1 AND liveboard_id = $2',
    [chartId, liveboardId]
  );
}

export async function updateLiveboardLayout(
  liveboardId: string,
  layouts: { id: string; x: number; y: number; w: number; h: number }[]
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const l of layouts) {
      await client.query(
        `UPDATE liveboard_charts
         SET layout_x = $1, layout_y = $2, layout_w = $3, layout_h = $4
         WHERE id = $5 AND liveboard_id = $6`,
        [l.x, l.y, l.w, l.h, l.id, liveboardId]
      );
    }
    // Touch liveboard updated_at
    await client.query('UPDATE liveboards SET updated_at = NOW() WHERE id = $1', [liveboardId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

async function getLiveboardCharts(liveboardId: string): Promise<LiveboardChart[]> {
  const { rows } = await pool.query(
    `SELECT * FROM liveboard_charts WHERE liveboard_id = $1 ORDER BY pinned_at ASC`,
    [liveboardId]
  );
  return rows.map(toChart);
}

function toLiveboard(r: Record<string, unknown>): Liveboard {
  return {
    id: String(r.id),
    name: String(r.name),
    description: r.description ? String(r.description) : undefined,
    charts: [],
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

function toChart(r: Record<string, unknown>): LiveboardChart {
  const parseJson = (v: unknown) =>
    typeof v === 'string' ? JSON.parse(v) : v;

  return {
    id: String(r.id),
    savedQueryId: r.saved_query_id ? String(r.saved_query_id) : undefined,
    layout: {
      x: Number(r.layout_x),
      y: Number(r.layout_y),
      w: Number(r.layout_w),
      h: Number(r.layout_h),
      minW: 3,
      minH: 3,
    },
    pinnedAt: String(r.pinned_at),
    queryResult: {
      queryId: String(r.saved_query_id || r.id),
      question: String(r.question),
      sql: String(r.sql_text),
      explanation: '',
      queryTitle: String(r.title),
      highchartsTemplate: parseJson(r.chart_config),
      data: parseJson(r.query_data),
      highchartsOptions: parseJson(r.highcharts_opts),
      executedAt: String(r.pinned_at),
      durationMs: 0,
    },
  };
}
