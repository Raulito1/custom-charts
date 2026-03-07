import 'dotenv/config';
import app from './app';
import { runMigrations } from './db/migrate';
import { initSqlEngine } from './services/sqlEngine.service';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function start() {
  try {
    await runMigrations();
    console.log('[DB] Migrations complete');
    initSqlEngine();
    console.log('[SQL] Mock SQL engine ready');
    app.listen(PORT, () => {
      console.log(`[SERVER] Listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[FATAL] Startup failed:', err);
    process.exit(1);
  }
}

start();
