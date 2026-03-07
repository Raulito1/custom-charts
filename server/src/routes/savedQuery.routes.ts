import { Router } from 'express';
import { listSavedQueries, rerunQuery, deleteQuery } from '../controllers/query.controller';

const router = Router();
router.get('/', listSavedQueries);
router.post('/:id/run', rerunQuery);
router.delete('/:id', deleteQuery);

export default router;
