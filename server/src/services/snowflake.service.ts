import snowflake from 'snowflake-sdk';

export function isSnowflakeConfigured(): boolean {
  return !!(
    process.env.SNOWFLAKE_ACCOUNT &&
    process.env.SNOWFLAKE_USER &&
    process.env.SNOWFLAKE_PASSWORD &&
    process.env.SNOWFLAKE_DATABASE
  );
}

let connection: snowflake.Connection | null = null;

async function getConnection(): Promise<snowflake.Connection> {
  if (connection) return connection;

  const conn = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT!,
    username: process.env.SNOWFLAKE_USER!,
    password: process.env.SNOWFLAKE_PASSWORD!,
    database: process.env.SNOWFLAKE_DATABASE!,
    schema: process.env.SNOWFLAKE_SCHEMA ?? 'PUBLIC',
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    role: process.env.SNOWFLAKE_ROLE,
  });

  await new Promise<void>((resolve, reject) => {
    conn.connect((err) => (err ? reject(err) : resolve()));
  });

  connection = conn;
  console.log('[Snowflake] Connected');
  return conn;
}

export async function executeSnowflakeQuery(sql: string): Promise<Record<string, unknown>[]> {
  const conn = await getConnection();
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText: sql,
      complete: (err, _stmt, rows) => {
        if (err) reject(new Error(`Snowflake query failed: ${err.message}`));
        else resolve((rows ?? []) as Record<string, unknown>[]);
      },
    });
  });
}

/** Resets the cached connection (useful for reconnect after credential changes) */
export function resetConnection(): void {
  connection = null;
}
