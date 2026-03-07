import { Router } from 'express';
import { MOCK_SCHEMA } from '../mock/schema';
import { MOCK_DATA } from '../mock/data';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      tables: MOCK_SCHEMA,
      rowCounts: {
        sales: MOCK_DATA.sales.length,
        customers: MOCK_DATA.customers.length,
        events: MOCK_DATA.events.length,
      },
    },
  });
});

export default router;
