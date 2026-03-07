import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import queryRoutes from './routes/query.routes';
import savedQueryRoutes from './routes/savedQuery.routes';
import liveboardRoutes from './routes/liveboard.routes';
import schemaRoutes from './routes/schema.routes';

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use('/api/query', queryRoutes);
app.use('/api/queries', savedQueryRoutes);
app.use('/api/liveboards', liveboardRoutes);
app.use('/api/schema', schemaRoutes);

app.use(errorHandler);

export default app;
