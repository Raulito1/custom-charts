import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import {
  listLiveboards,
  createLiveboard,
  getLiveboardById,
  updateLiveboard,
  deleteLiveboard,
  addChartToLiveboard,
  removeChartFromLiveboard,
  updateLiveboardLayout,
} from '../services/liveboard.service';
import type { QueryResult, GridItemLayout } from '../types';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await listLiveboards();
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body as { name: string; description?: string };
    if (!name?.trim()) { res.status(400).json({ success: false, error: 'name is required' }); return; }
    const data = await createLiveboard(name.trim(), description);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getLiveboardById(req.params.id);
    if (!data) { res.status(404).json({ success: false, error: 'Liveboard not found' }); return; }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await updateLiveboard(req.params.id, req.body as { name?: string; description?: string });
    if (!data) { res.status(404).json({ success: false, error: 'Liveboard not found' }); return; }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.patch('/:id/layout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { layouts } = req.body as { layouts: { id: string; x: number; y: number; w: number; h: number }[] };
    await updateLiveboardLayout(req.params.id, layouts || []);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

router.post('/:id/charts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queryResult, layout } = req.body as { queryResult: QueryResult; layout: GridItemLayout };
    const defaultLayout: GridItemLayout = { x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3, ...layout };
    const data = await addChartToLiveboard(req.params.id, queryResult, defaultLayout);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

router.delete('/:id/charts/:chartId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await removeChartFromLiveboard(req.params.id, req.params.chartId);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteLiveboard(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

export default router;
