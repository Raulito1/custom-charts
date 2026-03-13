import { isSnowflakeConfigured, executeSnowflakeQuery } from './snowflake.service';
import { executeSql, initSqlEngine } from './sqlEngine.service';
import { MOCK_DATA } from '../mock/data';

// ─── Public types ──────────────────────────────────────────────────────────

export interface ColumnMeta {
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  nullable: boolean;
}

export interface TableSchema {
  name: string;
  columns: ColumnMeta[];
}

export interface FilterColumn {
  table: string;
  column: string;
  label: string;
  options: string[];
}

export interface DateColumn {
  table: string;
  column: string;
  label: string;
}

// ─── Schema cache ──────────────────────────────────────────────────────────

let schemaCache: TableSchema[] | null = null;
let filterCache: FilterColumn[] | null = null;

export function invalidateCache(): void {
  schemaCache = null;
  filterCache = null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function prettify(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function detectType(val: unknown): ColumnMeta['dataType'] {
  if (val == null) return 'string';
  if (typeof val === 'number') return 'number';
  if (typeof val === 'boolean') return 'boolean';
  if (/^\d{4}-\d{2}-\d{2}/.test(String(val))) return 'date';
  return 'string';
}

function normalizeSnowflakeType(sfType: string): ColumnMeta['dataType'] {
  const t = sfType.toUpperCase();
  if (t.includes('CHAR') || t.includes('TEXT') || t === 'STRING' || t === 'VARIANT') return 'string';
  if (['INT', 'FLOAT', 'DECIMAL', 'NUMERIC', 'NUMBER', 'REAL', 'DOUBLE', 'FIXED'].some((x) => t.includes(x))) return 'number';
  if (t.includes('DATE') || t.includes('TIME') || t.includes('TIMESTAMP')) return 'date';
  if (t === 'BOOLEAN') return 'boolean';
  return 'string';
}

// ─── Introspection ─────────────────────────────────────────────────────────

function deriveMockSchema(): TableSchema[] {
  const tables: TableSchema[] = [];
  for (const [tableName, rows] of Object.entries(MOCK_DATA)) {
    if (!Array.isArray(rows) || rows.length === 0) continue;
    const first = rows[0] as Record<string, unknown>;
    tables.push({
      name: tableName,
      columns: Object.entries(first).map(([col, val]) => ({
        name: col,
        dataType: detectType(val),
        nullable: true,
      })),
    });
  }
  return tables;
}

async function introspectSnowflakeSchema(): Promise<TableSchema[]> {
  const schema = process.env.SNOWFLAKE_SCHEMA ?? 'PUBLIC';
  const database = process.env.SNOWFLAKE_DATABASE!;

  const rows = (await executeSnowflakeQuery(`
    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM ${database}.INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = '${schema}'
    ORDER BY TABLE_NAME, ORDINAL_POSITION
  `)) as Record<string, string>[];

  const tableMap = new Map<string, ColumnMeta[]>();
  for (const row of rows) {
    const tbl = row.TABLE_NAME;
    if (!tableMap.has(tbl)) tableMap.set(tbl, []);
    tableMap.get(tbl)!.push({
      name: row.COLUMN_NAME,
      dataType: normalizeSnowflakeType(row.DATA_TYPE),
      nullable: row.IS_NULLABLE === 'YES',
    });
  }
  return Array.from(tableMap.entries()).map(([name, columns]) => ({ name, columns }));
}

export async function getSchema(): Promise<TableSchema[]> {
  if (schemaCache) return schemaCache;

  if (isSnowflakeConfigured()) {
    try {
      schemaCache = await introspectSnowflakeSchema();
      console.log(`[Schema] Introspected ${schemaCache.length} Snowflake tables`);
    } catch (err) {
      console.warn('[Schema] Snowflake introspection failed, falling back to mock:', (err as Error).message);
      schemaCache = deriveMockSchema();
    }
  } else {
    initSqlEngine();
    schemaCache = deriveMockSchema();
    console.log(`[Schema] Using mock schema (${schemaCache.length} tables)`);
  }

  return schemaCache;
}

// ─── Filter suggestions ────────────────────────────────────────────────────

/** Returns low-cardinality string columns with their distinct values. */
export async function getFilterSuggestions(): Promise<FilterColumn[]> {
  if (filterCache) return filterCache;

  const schema = await getSchema();
  const useSnowflake = isSnowflakeConfigured();
  const sfSchema = process.env.SNOWFLAKE_SCHEMA ?? 'PUBLIC';
  const suggestions: FilterColumn[] = [];

  for (const table of schema) {
    for (const col of table.columns) {
      if (col.dataType !== 'string') continue;

      try {
        const sql = useSnowflake
          ? `SELECT DISTINCT "${col.name}" AS val FROM "${sfSchema}"."${table.name}" WHERE "${col.name}" IS NOT NULL ORDER BY 1 LIMIT 200`
          : `SELECT DISTINCT ${col.name} AS val FROM ${table.name} WHERE ${col.name} IS NOT NULL ORDER BY val LIMIT 200`;

        const rows = useSnowflake ? await executeSnowflakeQuery(sql) : executeSql(sql);
        const options = rows.map((r) => String((r as Record<string, unknown>).val)).filter(Boolean);

        // Only suggest columns with 2–50 distinct values (low cardinality)
        if (options.length >= 2 && options.length <= 50) {
          suggestions.push({ table: table.name, column: col.name, label: prettify(col.name), options });
        }
      } catch {
        // Skip columns that fail (e.g., complex types)
      }
    }
  }

  filterCache = suggestions;
  return suggestions;
}

/** Returns all date/timestamp columns, used for the date-range filter. */
export async function getDateColumns(): Promise<DateColumn[]> {
  const schema = await getSchema();
  const result: DateColumn[] = [];
  for (const table of schema) {
    for (const col of table.columns) {
      if (col.dataType === 'date') {
        result.push({ table: table.name, column: col.name, label: `${table.name} › ${prettify(col.name)}` });
      }
    }
  }
  return result;
}

// ─── Dynamic Claude system prompt ─────────────────────────────────────────

export function buildSystemPrompt(tables: TableSchema[], dialect: 'snowflake' | 'alasql'): string {
  const schemaSection = tables
    .map((t) => {
      const header = `### TABLE: ${t.name}`;
      const divider = `|${'-'.repeat(22)}|${'-'.repeat(10)}|${'-'.repeat(13)}|`;
      const colHeader = `| ${'Column'.padEnd(20)} | ${'Type'.padEnd(8)} | Description |`;
      const cols = t.columns.map((c) => `| ${c.name.padEnd(20)} | ${c.dataType.padEnd(8)} | |`).join('\n');
      return `${header}\n${colHeader}\n${divider}\n${cols}`;
    })
    .join('\n\n');

  const sqlRules =
    dialect === 'snowflake'
      ? `## SQL RULES (Snowflake)
- Use Snowflake SQL syntax
- For month grouping: DATE_TRUNC('month', date_column) AS month
- For year grouping: DATE_TRUNC('year', date_column) AS year
- DATEADD / DATEDIFF are available
- Window functions (RANK, ROW_NUMBER, LAG, LEAD) are allowed
- Always include ORDER BY for time series
- LIMIT results to 100 rows maximum
- Aggregate with SUM(), COUNT(), AVG() as appropriate
- Column aliases must use the AS keyword
- Quote identifiers with double quotes if they contain spaces or special characters`
      : `## SQL RULES (ANSI / alasql)
- Use ANSI SQL only — no Snowflake-specific syntax
- For month grouping: SUBSTR(date_column, 1, 7) AS month
- For year grouping: SUBSTR(date_column, 1, 4) AS year
- Do NOT use DATE_TRUNC or EXTRACT — use SUBSTR string operations instead
- Do NOT use window functions (no RANK, ROW_NUMBER, LAG, etc.)
- Always include ORDER BY for time series
- LIMIT results to 100 rows maximum
- Aggregate with SUM(), COUNT(), AVG() as appropriate
- Column aliases must use the AS keyword with no quotes`;

  return `You are a data analytics expert. Convert natural language questions into SQL queries and complete Highcharts chart configurations.

## DATABASE SCHEMA

${schemaSection}

${sqlRules}

## BUILDING highchartsOptions
Return a COMPLETE Highcharts options object — you control all styling: chart type, title, axes, colors, tooltips, plotOptions, responsive rules, dataLabels, etc.

CRITICAL RULE: Do NOT include series[].data arrays. Instead, each series item must declare:
- "_dataFormat": one of the formats below
- "_*Field" keys that map SQL column aliases to data roles

The server reads these underscore keys, injects the real data, then strips them before rendering.

### _dataFormat values

"category_value" — for column, bar, line, area, spline, areaspline
  Required: "_categoryField" (SQL alias → xAxis label), "_valueField" (SQL alias → y number)

"name_y" — for pie
  Required: "_nameField" (SQL alias → slice name), "_valueField" (SQL alias → y number)

"xy" — for scatter
  Required: "_xField" (SQL alias → x number), "_yField" (SQL alias → y number)

"xyz" — for bubble
  Required: "_xField", "_yField", "_zField" (SQL alias → bubble size)

"boxplot" — for boxplot
  Required: "_categoryField", "_lowField", "_q1Field", "_medianField", "_q3Field", "_highField"

### Chart selection guide
- Trend over time → line, area, spline, or areaspline  (category_value)
- Category comparison → column or bar               (category_value)
- Part-to-whole → pie                               (name_y)
- Correlation between two numerics → scatter        (xy)
- Three-variable → bubble                           (xyz)
- Two metrics same categories → two series, both category_value, same _categoryField

## OUTPUT FORMAT
Respond with ONLY valid JSON — no markdown, no code fences, no explanation.

{
  "sql": "<single-line SQL>",
  "queryTitle": "<max 8 words>",
  "explanation": "<one sentence describing what the chart shows>",
  "highchartsOptions": {
    "chart": { "type": "<highcharts series type>" },
    "title": { "text": "<chart title>" },
    "xAxis": { "title": { "text": "<x axis label>" } },
    "yAxis": { "title": { "text": "<y axis label>" } },
    "legend": { "enabled": <true|false> },
    "series": [
      {
        "name": "<series name>",
        "type": "<highcharts series type>",
        "_dataFormat": "<format>",
        "<_*Field keys for the chosen format>": "<SQL column alias>"
      }
    ]
  }
}`.trim();
}
