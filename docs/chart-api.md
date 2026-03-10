# Chart API — Claude + Highcharts Integration

## Overview

Natural language questions are sent to the server → Claude generates SQL + a Highcharts template → SQL runs against mock data → real data is injected into the template → a fully renderable Highcharts options object is returned to the client.

---

## API Endpoint

```
POST /api/query
Content-Type: application/json

{ "question": "show me bugs by team as a column chart" }
```

### Response Shape

```typescript
{
  success: true,
  data: {
    queryId: string;
    question: string;
    sql: string;                          // generated ANSI SQL
    explanation: string;                  // one-sentence description
    queryTitle: string;                   // max 8 words
    highchartsTemplate: object;           // raw Claude output (with _*Field keys)
    highchartsOptions: object;            // final renderable Highcharts options
    data: Record<string, unknown>[];      // raw SQL result rows
    executedAt: string;                   // ISO timestamp
    durationMs: number;
  }
}
```

---

## What Claude Returns (Raw)

Claude responds with **pure JSON** — no markdown, no code fences. Example:

```json
{
  "sql": "SELECT team, COUNT(*) AS bug_count FROM issues WHERE type = 'bug' GROUP BY team ORDER BY bug_count DESC",
  "queryTitle": "Bugs by Team",
  "explanation": "Shows total bugs filed per engineering team.",
  "highchartsOptions": {
    "chart": { "type": "column" },
    "title": { "text": "Bug Count by Team" },
    "xAxis": { "title": { "text": "Team" } },
    "yAxis": { "title": { "text": "Bug Count" } },
    "legend": { "enabled": false },
    "series": [
      {
        "name": "Bugs",
        "type": "column",
        "_dataFormat": "category_value",
        "_categoryField": "team",
        "_valueField": "bug_count"
      }
    ]
  }
}
```

The `_dataFormat` and `_*Field` keys are **placeholder mappings** — Claude never fills in `series[].data`. The server's `injectData()` function does that after SQL execution.

---

## After `injectData()` — Final Highcharts Options

```json
{
  "credits": { "enabled": false },
  "chart": { "type": "column" },
  "title": { "text": "Bug Count by Team" },
  "xAxis": {
    "title": { "text": "Team" },
    "categories": ["Alpha", "Beta", "Gamma", "Platform", "Infra"]
  },
  "yAxis": { "title": { "text": "Bug Count" } },
  "legend": { "enabled": false },
  "series": [
    {
      "name": "Bugs",
      "type": "column",
      "data": [142, 118, 135, 97, 109]
    }
  ]
}
```

This object is passed directly to `Highcharts.chart(container, options)` on the client.

---

## Supported Data Formats

### `category_value`
For: `column`, `bar`, `line`, `area`, `spline`, `areaspline`

```json
{
  "type": "column",
  "_dataFormat": "category_value",
  "_categoryField": "<SQL alias for x-axis label>",
  "_valueField": "<SQL alias for y number>"
}
```

xAxis categories are automatically populated from `_categoryField`.

---

### `name_y`
For: `pie`, `donut`

```json
{
  "type": "pie",
  "_dataFormat": "name_y",
  "_nameField": "<SQL alias for slice name>",
  "_valueField": "<SQL alias for y number>"
}
```

Produces `data: [{ name: "...", y: 42 }, ...]`

---

### `xy`
For: `scatter`

```json
{
  "type": "scatter",
  "_dataFormat": "xy",
  "_xField": "<SQL alias for x>",
  "_yField": "<SQL alias for y>"
}
```

Produces `data: [[x, y], ...]`

---

### `xyz`
For: `bubble`

```json
{
  "type": "bubble",
  "_dataFormat": "xyz",
  "_xField": "<SQL alias for x>",
  "_yField": "<SQL alias for y>",
  "_zField": "<SQL alias for bubble size>"
}
```

Produces `data: [[x, y, z], ...]`

---

### `boxplot`
For: `boxplot` (requires `highcharts/modules/more` loaded on client)

```json
{
  "type": "boxplot",
  "_dataFormat": "boxplot",
  "_categoryField": "<SQL alias for category>",
  "_lowField": "<SQL alias for min>",
  "_q1Field": "<SQL alias for Q1>",
  "_medianField": "<SQL alias for median>",
  "_q3Field": "<SQL alias for Q3>",
  "_highField": "<SQL alias for max>"
}
```

Produces `data: [[low, q1, median, q3, high], ...]`

---

## Multi-Series Example

Two series on the same chart share the same `_categoryField`:

```json
{
  "series": [
    {
      "name": "Bugs Opened",
      "type": "line",
      "_dataFormat": "category_value",
      "_categoryField": "sprint_id",
      "_valueField": "bugs_opened"
    },
    {
      "name": "Bugs Closed",
      "type": "line",
      "_dataFormat": "category_value",
      "_categoryField": "sprint_id",
      "_valueField": "bugs_closed"
    }
  ]
}
```

---

## Example Prompts by Chart Type

| Prompt | Chart type emitted |
|---|---|
| "bugs by team as a column chart" | `column` + `category_value` |
| "bug distribution by priority as a pie" | `pie` + `name_y` |
| "scatter plot of deployment duration vs lead time" | `scatter` + `xy` |
| "bubble chart of duration vs lead time, size = story points" | `bubble` + `xyz` |
| "area chart of deployments per month" | `area` + `category_value` |
| "bugs opened vs closed per sprint as two lines" | two `line` series |
| "bar chart of average story points by project" | `bar` + `category_value` |
| "sprint velocity trend for Team Alpha" | `spline` + `category_value` |

You can always specify the chart type explicitly in your question, or leave it out and let Claude pick the most appropriate type.

---

## How Data Flows (End-to-End)

The LLM is **never involved in data retrieval**. It only produces the SQL query and a template describing how to map columns to chart roles. Your server handles everything else.

```
User asks a question
        ↓
Claude returns SQL + Highcharts template (_*Field placeholders, no data arrays)
        ↓
Your server runs the SQL → gets raw rows from DB
        ↓
injectData() reads _*Field keys → builds correct data arrays for the chart type
        ↓
Client receives final Highcharts options → renders chart
```

Claude never sees the query results. The `_*Field` keys are just column name hints — they tell `injectData()` which SQL alias maps to which chart role (x-axis, y-axis, bubble size, etc.).

---

## Why `_dataFormat` Exists

`_dataFormat` is **not** the chart type — it describes the **shape of the data array** that Highcharts expects for a given chart type. Different chart types require different array structures, so `injectData()` needs to know which format to build.

| `_dataFormat` | Array built by `injectData()` | Used by chart types |
|---|---|---|
| `category_value` | `data: [142, 118, 97]` + `xAxis.categories` | column, bar, line, area, spline |
| `name_y` | `data: [{ name: "Alpha", y: 142 }]` | pie, donut |
| `xy` | `data: [[3, 142], [5, 118]]` | scatter |
| `xyz` | `data: [[3, 142, 8], [5, 118, 3]]` | bubble |
| `boxplot` | `data: [[10, 25, 40, 60, 90]]` | boxplot |

Chart type and data format are set **independently**. Claude sets `chart.type` for Highcharts and `_dataFormat` so `injectData()` knows what array shape to produce.

---

## Full Worked Examples

### Example 1 — Column Chart: Bugs by Team

**Prompt:** `"show me bugs by team"`

**Claude returns (template):**
```json
{
  "sql": "SELECT team, COUNT(*) AS bug_count FROM issues WHERE type = 'bug' GROUP BY team ORDER BY bug_count DESC",
  "queryTitle": "Bugs by Team",
  "explanation": "Total bugs filed per engineering team.",
  "highchartsOptions": {
    "chart": { "type": "column" },
    "title": { "text": "Bug Count by Team" },
    "xAxis": { "title": { "text": "Team" } },
    "yAxis": { "title": { "text": "Bug Count" } },
    "legend": { "enabled": false },
    "series": [
      {
        "name": "Bugs",
        "type": "column",
        "_dataFormat": "category_value",
        "_categoryField": "team",
        "_valueField": "bug_count"
      }
    ]
  }
}
```

**SQL result rows:**
```json
[
  { "team": "Alpha",    "bug_count": 142 },
  { "team": "Beta",     "bug_count": 118 },
  { "team": "Gamma",    "bug_count": 135 },
  { "team": "Platform", "bug_count":  97 },
  { "team": "Infra",    "bug_count": 109 }
]
```

**Final Highcharts options (after `injectData()`):**
```json
{
  "credits": { "enabled": false },
  "chart": { "type": "column" },
  "title": { "text": "Bug Count by Team" },
  "xAxis": {
    "title": { "text": "Team" },
    "categories": ["Alpha", "Beta", "Gamma", "Platform", "Infra"]
  },
  "yAxis": { "title": { "text": "Bug Count" } },
  "legend": { "enabled": false },
  "series": [
    { "name": "Bugs", "type": "column", "data": [142, 118, 135, 97, 109] }
  ]
}
```

---

### Example 2 — Pie Chart: Issues by Priority

**Prompt:** `"show issue distribution by priority as a pie chart"`

**Claude returns (template):**
```json
{
  "sql": "SELECT priority, COUNT(*) AS total FROM issues GROUP BY priority ORDER BY total DESC",
  "queryTitle": "Issues by Priority",
  "explanation": "Distribution of all issues across priority levels.",
  "highchartsOptions": {
    "chart": { "type": "pie" },
    "title": { "text": "Issues by Priority" },
    "legend": { "enabled": true },
    "series": [
      {
        "name": "Issues",
        "type": "pie",
        "_dataFormat": "name_y",
        "_nameField": "priority",
        "_valueField": "total"
      }
    ]
  }
}
```

**SQL result rows:**
```json
[
  { "priority": "medium",   "total": 612 },
  { "priority": "high",     "total": 489 },
  { "priority": "low",      "total": 341 },
  { "priority": "critical", "total": 158 }
]
```

**Final Highcharts options (after `injectData()`):**
```json
{
  "chart": { "type": "pie" },
  "title": { "text": "Issues by Priority" },
  "series": [
    {
      "name": "Issues",
      "type": "pie",
      "data": [
        { "name": "medium",   "y": 612 },
        { "name": "high",     "y": 489 },
        { "name": "low",      "y": 341 },
        { "name": "critical", "y": 158 }
      ]
    }
  ]
}
```

---

### Example 3 — Scatter Chart: Deployment Duration vs Lead Time

**Prompt:** `"scatter plot of deployment duration vs lead time"`

**Claude returns (template):**
```json
{
  "sql": "SELECT duration_min, lead_time_days FROM deployments WHERE status = 'success' LIMIT 100",
  "queryTitle": "Duration vs Lead Time",
  "explanation": "Correlation between pipeline duration and lead time for successful deployments.",
  "highchartsOptions": {
    "chart": { "type": "scatter" },
    "title": { "text": "Deployment Duration vs Lead Time" },
    "xAxis": { "title": { "text": "Duration (min)" } },
    "yAxis": { "title": { "text": "Lead Time (days)" } },
    "legend": { "enabled": false },
    "series": [
      {
        "name": "Deployments",
        "type": "scatter",
        "_dataFormat": "xy",
        "_xField": "duration_min",
        "_yField": "lead_time_days"
      }
    ]
  }
}
```

**SQL result rows (sample):**
```json
[
  { "duration_min": 12, "lead_time_days": 3 },
  { "duration_min": 45, "lead_time_days": 8 },
  { "duration_min": 28, "lead_time_days": 5 }
]
```

**Final Highcharts options (after `injectData()`):**
```json
{
  "chart": { "type": "scatter" },
  "title": { "text": "Deployment Duration vs Lead Time" },
  "series": [
    {
      "name": "Deployments",
      "type": "scatter",
      "data": [[12, 3], [45, 8], [28, 5]]
    }
  ]
}
```

---

### Example 4 — Multi-Series Line: Bugs Opened vs Closed per Sprint

**Prompt:** `"bugs opened vs closed per sprint as two lines"`

**Claude returns (template):**
```json
{
  "sql": "SELECT id AS sprint_id, bugs_opened, bugs_closed FROM sprints WHERE team = 'Alpha' ORDER BY start_date",
  "queryTitle": "Bug Trend Team Alpha",
  "explanation": "Bugs opened vs closed each sprint for Team Alpha.",
  "highchartsOptions": {
    "chart": { "type": "line" },
    "title": { "text": "Bugs Opened vs Closed — Team Alpha" },
    "xAxis": { "title": { "text": "Sprint" } },
    "yAxis": { "title": { "text": "Bug Count" } },
    "legend": { "enabled": true },
    "series": [
      {
        "name": "Bugs Opened",
        "type": "line",
        "_dataFormat": "category_value",
        "_categoryField": "sprint_id",
        "_valueField": "bugs_opened"
      },
      {
        "name": "Bugs Closed",
        "type": "line",
        "_dataFormat": "category_value",
        "_categoryField": "sprint_id",
        "_valueField": "bugs_closed"
      }
    ]
  }
}
```

**Final Highcharts options (after `injectData()`):**
```json
{
  "chart": { "type": "line" },
  "title": { "text": "Bugs Opened vs Closed — Team Alpha" },
  "xAxis": {
    "title": { "text": "Sprint" },
    "categories": ["SPR-001", "SPR-006", "SPR-011", "SPR-016", "SPR-021"]
  },
  "yAxis": { "title": { "text": "Bug Count" } },
  "legend": { "enabled": true },
  "series": [
    { "name": "Bugs Opened", "type": "line", "data": [8, 12, 6, 9, 11] },
    { "name": "Bugs Closed", "type": "line", "data": [5, 10, 8, 7, 13] }
  ]
}
```

---

## Key Files

| File | Role |
|---|---|
| `server/src/services/claude.service.ts` | System prompt + Anthropic API call |
| `server/src/controllers/query.controller.ts` | `injectData()` — maps `_*Field` keys to real data arrays |
| `server/src/services/sqlEngine.service.ts` | alasql mock SQL execution |
| `server/src/mock/data.ts` | SDLC mock data (issues, sprints, deployments) |
| `server/src/types/index.ts` | `ClaudeQueryResponse`, `QueryResult` types |
| `client/src/components/chart/ChartRenderer.tsx` | Renders final `highchartsOptions` via Highcharts |

---

## Database Schema (Mock)

### `issues`
| Column | Type | Values |
|---|---|---|
| id | VARCHAR | ISS-0001 … |
| project | VARCHAR | web-app, mobile-app, api-gateway, data-pipeline, auth-service |
| team | VARCHAR | Alpha, Beta, Gamma, Platform, Infra |
| type | VARCHAR | bug, feature, task, tech_debt |
| priority | VARCHAR | critical, high, medium, low |
| status | VARCHAR | open, in_progress, in_review, done, closed |
| created_date | DATE | 2023-01-01 – 2024-12-31 |
| resolved_date | DATE | NULL if unresolved |
| story_points | NUMBER | 1, 2, 3, 5, 8, 13 |
| assignee | VARCHAR | developer ID |

### `sprints`
| Column | Type | Description |
|---|---|---|
| id | VARCHAR | SPR-001 … |
| team | VARCHAR | Alpha, Beta, Gamma, Platform, Infra |
| start_date | DATE | Sprint start |
| end_date | DATE | Sprint end |
| planned_points | NUMBER | Points planned |
| completed_points | NUMBER | Points completed |
| bugs_opened | NUMBER | New bugs during sprint |
| bugs_closed | NUMBER | Bugs resolved during sprint |

### `deployments`
| Column | Type | Description |
|---|---|---|
| id | VARCHAR | DEP-0001 … |
| date | DATE | 2023-01-01 – 2024-12-31 |
| project | VARCHAR | web-app, mobile-app, api-gateway, data-pipeline, auth-service |
| team | VARCHAR | Alpha, Beta, Gamma, Platform, Infra |
| environment | VARCHAR | dev, staging, prod |
| status | VARCHAR | success, failure, rollback |
| duration_min | NUMBER | Pipeline duration in minutes |
| lead_time_days | NUMBER | Days from first commit to deploy |

---

## SQL Rules (enforced via system prompt)

- ANSI SQL only — no `DATE_TRUNC`, no `QUALIFY`, no window functions
- Month grouping: `SUBSTR(created_date, 1, 7) AS month`
- Year grouping: `SUBSTR(created_date, 1, 4) AS year`
- Open issues: `WHERE status IN ('open', 'in_progress', 'in_review')`
- Always `ORDER BY` for time series
- Max 100 rows (`LIMIT 100`)
