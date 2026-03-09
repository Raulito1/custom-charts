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
