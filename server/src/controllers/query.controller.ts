import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { callClaude } from '../services/claude.service';
import { executeSql } from '../services/sqlEngine.service';
import { saveQuery, listQueries, getQueryById, deleteQueryById } from '../services/query.service';
import type { ChartConfig, QueryResult } from '../types';

function assembleHighchartsOptions(
  data: Record<string, unknown>[],
  config: ChartConfig
): Record<string, unknown> {
  const { chartType, title, xAxis, yAxis, series } = config;

  const base = {
    credits: { enabled: false },
    title: { text: title, style: { fontSize: '14px', fontWeight: '600' } },
    chart: { type: chartType },
    legend: { enabled: series.length > 1 },
    responsive: {
      rules: [{ condition: { maxWidth: 400 }, chartOptions: { legend: { enabled: false } } }],
    },
  };

  if (chartType === 'pie') {
    return {
      ...base,
      series: [
        {
          type: 'pie',
          name: series[0]?.name || yAxis.label,
          data: data.map((row) => ({
            name: String(row[xAxis.field] ?? ''),
            y: Number(row[series[0]?.field ?? yAxis.field] ?? 0),
          })),
        },
      ],
    };
  }

  const categories = data.map((row) => String(row[xAxis.field] ?? ''));

  return {
    ...base,
    xAxis: { categories, title: { text: xAxis.label } },
    yAxis: { title: { text: yAxis.label } },
    series: series.map((s) => ({
      type: chartType,
      name: s.name,
      data: data.map((row) => Number(row[s.field] ?? 0)),
    })),
  };
}

export async function executeQuery(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { question } = req.body as { question: string };
    if (!question?.trim()) {
      res.status(400).json({ success: false, error: 'question is required' });
      return;
    }

    const start = Date.now();
    const claudeResult = await callClaude(question.trim());
    const data = executeSql(claudeResult.sql);
    const highchartsOptions = assembleHighchartsOptions(data, claudeResult.chartConfig);
    const durationMs = Date.now() - start;

    const queryResult: QueryResult = {
      queryId: uuidv4(),
      question: question.trim(),
      sql: claudeResult.sql,
      explanation: claudeResult.explanation,
      queryTitle: claudeResult.queryTitle,
      chartConfig: claudeResult.chartConfig,
      data,
      highchartsOptions,
      executedAt: new Date().toISOString(),
      durationMs,
    };

    // Persist to saved_queries
    await saveQuery(queryResult);

    res.json({ success: true, data: queryResult });
  } catch (err) {
    next(err);
  }
}

export async function listSavedQueries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10), 100);
    const offset = parseInt(String(req.query.offset || '0'), 10);
    const queries = await listQueries(limit, offset);
    res.json({ success: true, data: queries });
  } catch (err) {
    next(err);
  }
}

export async function rerunQuery(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const saved = await getQueryById(req.params.id);
    if (!saved) {
      res.status(404).json({ success: false, error: 'Query not found' });
      return;
    }

    const start = Date.now();
    const data = executeSql(saved.sqlText);
    const highchartsOptions = assembleHighchartsOptions(data, saved.chartConfig);
    const durationMs = Date.now() - start;

    const queryResult: QueryResult = {
      queryId: uuidv4(),
      question: saved.question,
      sql: saved.sqlText,
      explanation: '',
      queryTitle: saved.title,
      chartConfig: saved.chartConfig,
      data,
      highchartsOptions,
      executedAt: new Date().toISOString(),
      durationMs,
    };

    res.json({ success: true, data: queryResult });
  } catch (err) {
    next(err);
  }
}

export async function deleteQuery(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteQueryById(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}
