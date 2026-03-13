import { Router } from 'express';
import { executeQuery, runFiltered } from '../controllers/query.controller';

const router = Router();
router.post('/', executeQuery);
router.post('/run-filtered', runFiltered);

export default router;
