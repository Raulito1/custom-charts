import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { callClaude } from '../services/claude.service';
import { executeSql } from '../services/sqlEngine.service';
import { saveQuery, listQueries, getQueryById, deleteQueryById } from '../services/query.service';
import type { QueryResult } from '../types';

/**
 * Injects SQL result rows into a Highcharts options template produced by Claude.
 * Each series item in the template has _dataFormat + _*Field mapping keys instead
 * of a real data array. This function reads those keys, builds the data arrays,
 * strips all underscore keys, and returns fully renderable Highcharts options.
 */
function injectData(
  template: Record<string, unknown>,
  data: Record<string, unknown>[]
): Record<string, unknown> {
  const rawSeries = (template.series as Record<string, unknown>[]) ?? [];
  const sharedCategories: string[] = [];

  const filledSeries = rawSeries.map((s) => {
    const fmt = s._dataFormat as string;

    // Copy non-underscore keys only
    const filled: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(s)) {
      if (!k.startsWith('_')) filled[k] = v;
    }

    switch (fmt) {
      case 'category_value': {
        const catF = s._categoryField as string;
        const valF = s._valueField as string;
        if (sharedCategories.length === 0) {
          sharedCategories.push(...data.map((r) => String(r[catF] ?? '')));
        }
        filled.data = data.map((r) => Number(r[valF] ?? 0));
        break;
      }
      case 'name_y': {
        filled.data = data.map((r) => ({
          name: String(r[s._nameField as string] ?? ''),
          y: Number(r[s._valueField as string] ?? 0),
        }));
        break;
      }
      case 'xy': {
        filled.data = data.map((r) => [
          Number(r[s._xField as string] ?? 0),
          Number(r[s._yField as string] ?? 0),
        ]);
        break;
      }
      case 'xyz': {
        filled.data = data.map((r) => [
          Number(r[s._xField as string] ?? 0),
          Number(r[s._yField as string] ?? 0),
          Number(r[s._zField as string] ?? 0),
        ]);
        break;
      }
      case 'boxplot': {
        const catF = s._categoryField as string;
        if (sharedCategories.length === 0 && catF) {
          sharedCategories.push(...data.map((r) => String(r[catF] ?? '')));
        }
        filled.data = data.map((r) => [
          Number(r[s._lowField as string] ?? 0),
          Number(r[s._q1Field as string] ?? 0),
          Number(r[s._medianField as string] ?? 0),
          Number(r[s._q3Field as string] ?? 0),
          Number(r[s._highField as string] ?? 0),
        ]);
        break;
      }
      default:
        filled.data = [];
    }

    return filled;
  });

  const result: Record<string, unknown> = {
    credits: { enabled: false },
    ...template,
    series: filledSeries,
  };

  if (sharedCategories.length > 0) {
    result.xAxis = {
      ...(typeof template.xAxis === 'object' && template.xAxis !== null ? template.xAxis : {}),
      categories: sharedCategories,
    };
  }

  return result;
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
    const highchartsOptions = injectData(claudeResult.highchartsOptions, data);
    const durationMs = Date.now() - start;

    const queryResult: QueryResult = {
      queryId: uuidv4(),
      question: question.trim(),
      sql: claudeResult.sql,
      explanation: claudeResult.explanation,
      queryTitle: claudeResult.queryTitle,
      highchartsTemplate: claudeResult.highchartsOptions,
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
    const highchartsOptions = injectData(saved.highchartsTemplate, data);
    const durationMs = Date.now() - start;

    const queryResult: QueryResult = {
      queryId: uuidv4(),
      question: saved.question,
      sql: saved.sqlText,
      explanation: '',
      queryTitle: saved.title,
      highchartsTemplate: saved.highchartsTemplate,
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
