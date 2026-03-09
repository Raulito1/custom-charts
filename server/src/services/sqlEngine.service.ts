// eslint-disable-next-line @typescript-eslint/no-require-imports
const alasql = require('alasql');
import { MOCK_DATA } from '../mock/data';

let initialized = false;

export function initSqlEngine(): void {
  if (initialized) return;

  alasql('CREATE TABLE IF NOT EXISTS issues');
  alasql.tables.issues.data = MOCK_DATA.issues;

  alasql('CREATE TABLE IF NOT EXISTS sprints');
  alasql.tables.sprints.data = MOCK_DATA.sprints;

  alasql('CREATE TABLE IF NOT EXISTS deployments');
  alasql.tables.deployments.data = MOCK_DATA.deployments;

  initialized = true;
  console.log(
    `[SQL] Tables loaded — issues:${MOCK_DATA.issues.length} sprints:${MOCK_DATA.sprints.length} deployments:${MOCK_DATA.deployments.length}`
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
