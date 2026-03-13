import { Router } from 'express';
import { getSchema, getFilterSuggestions, getDateColumns } from '../services/schema.service';
import { isSnowflakeConfigured } from '../services/snowflake.service';

const router = Router();

/** GET /api/schema — full table + column metadata */
router.get('/', async (_req, res, next) => {
  try {
    const tables = await getSchema();
    res.json({
      success: true,
      data: {
        dialect: isSnowflakeConfigured() ? 'snowflake' : 'alasql',
        tables,
      },
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/schema/filter-suggestions — low-cardinality columns with distinct values */
router.get('/filter-suggestions', async (_req, res, next) => {
  try {
    const [filterColumns, dateColumns] = await Promise.all([getFilterSuggestions(), getDateColumns()]);
    res.json({ success: true, data: { filterColumns, dateColumns } });
  } catch (err) {
    next(err);
  }
});

export default router;
