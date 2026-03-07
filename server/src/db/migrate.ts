import 'dotenv/config';
import { pool } from './postgres';

const migrations = [
  {
    name: '001_create_liveboards',
    sql: `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS liveboards (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name        VARCHAR(255) NOT NULL,
        description TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE OR REPLACE FUNCTION trigger_set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS set_liveboards_updated_at ON liveboards;
      CREATE TRIGGER set_liveboards_updated_at
        BEFORE UPDATE ON liveboards
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    `,
  },
  {
    name: '002_create_liveboard_charts',
    sql: `
      CREATE TABLE IF NOT EXISTS liveboard_charts (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        liveboard_id    UUID NOT NULL REFERENCES liveboards(id) ON DELETE CASCADE,
        saved_query_id  UUID,
        title           VARCHAR(255) NOT NULL,
        question        TEXT NOT NULL,
        sql_text        TEXT NOT NULL,
        chart_config    JSONB NOT NULL,
        query_data      JSONB NOT NULL,
        highcharts_opts JSONB NOT NULL,
        layout_x        INTEGER NOT NULL DEFAULT 0,
        layout_y        INTEGER NOT NULL DEFAULT 0,
        layout_w        INTEGER NOT NULL DEFAULT 6,
        layout_h        INTEGER NOT NULL DEFAULT 4,
        pinned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_lc_liveboard_id ON liveboard_charts(liveboard_id);
    `,
  },
  {
    name: '003_create_saved_queries',
    sql: `
      CREATE TABLE IF NOT EXISTS saved_queries (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        question    TEXT NOT NULL,
        sql_text    TEXT NOT NULL,
        title       VARCHAR(255) NOT NULL,
        chart_config JSONB NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    name: '004_migrations_table',
    sql: `
      CREATE TABLE IF NOT EXISTS _migrations (
        name       VARCHAR(255) PRIMARY KEY,
        run_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
];

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    // Ensure migrations table exists first
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name    VARCHAR(255) PRIMARY KEY,
        run_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const m of migrations) {
      const { rows } = await client.query('SELECT 1 FROM _migrations WHERE name = $1', [m.name]);
      if (rows.length > 0) {
        continue; // already run
      }
      await client.query('BEGIN');
      try {
        await client.query(m.sql);
        await client.query('INSERT INTO _migrations(name) VALUES($1)', [m.name]);
        await client.query('COMMIT');
        console.log(`[MIGRATE] ${m.name} ✓`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    client.release();
  }
}

// Allow running directly: tsx src/db/migrate.ts
if (require.main === module) {
  runMigrations()
    .then(() => { console.log('Done'); process.exit(0); })
    .catch((err) => { console.error(err); process.exit(1); });
}
