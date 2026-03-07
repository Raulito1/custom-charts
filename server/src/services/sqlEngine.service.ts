// eslint-disable-next-line @typescript-eslint/no-require-imports
const alasql = require('alasql');
import { MOCK_DATA } from '../mock/data';

let initialized = false;

export function initSqlEngine(): void {
  if (initialized) return;

  alasql('CREATE TABLE IF NOT EXISTS sales');
  alasql.tables.sales.data = MOCK_DATA.sales;

  alasql('CREATE TABLE IF NOT EXISTS customers');
  alasql.tables.customers.data = MOCK_DATA.customers;

  alasql('CREATE TABLE IF NOT EXISTS events');
  alasql.tables.events.data = MOCK_DATA.events;

  initialized = true;
  console.log(
    `[SQL] Tables loaded — sales:${MOCK_DATA.sales.length} customers:${MOCK_DATA.customers.length} events:${MOCK_DATA.events.length}`
  );
}

export function executeSql(sql: string): Record<string, unknown>[] {
  if (!initialized) initSqlEngine();
  try {
    const result = alasql(sql);
    if (!Array.isArray(result)) {
      throw new Error('Query did not return a result set');
    }
    return (result as Record<string, unknown>[]).slice(0, 500);
  } catch (err) {
    throw new Error(`SQL execution failed: ${(err as Error).message}`);
  }
}
