function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randItem<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)];
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

// ─── Issues ──────────────────────────────────────────────────────────────────
// Tracks every ticket/work-item created across projects and teams.

function generateIssues() {
  const teams = ['Alpha', 'Beta', 'Gamma', 'Platform', 'Infra'];
  const projects = ['web-app', 'mobile-app', 'api-gateway', 'data-pipeline', 'auth-service'];
  const types = ['bug', 'feature', 'task', 'tech_debt'];
  const priorities = ['critical', 'high', 'medium', 'low'];
  const statuses = ['open', 'in_progress', 'in_review', 'done', 'closed'];
  // Weight toward done/closed so most issues are resolved
  const statusWeights = [5, 10, 8, 35, 42];

  const rows: Record<string, unknown>[] = [];
  const start = new Date('2023-01-01');
  const end = new Date('2024-12-31');
  const totalDays = (end.getTime() - start.getTime()) / 86400000;

  for (let i = 0; i < 2000; i++) {
    const createdDate = addDays(start, rand(0, totalDays));
    const type = randItem(types);
    // bugs resolve faster than features
    const resolveDays = type === 'bug' ? rand(1, 14) : rand(3, 45);
    const resolvedDate = addDays(createdDate, resolveDays);

    // Pick status; if resolvedDate > end, force open
    let status: string;
    const roll = rand(1, 100);
    let cumulative = 0;
    status = statuses[statuses.length - 1];
    for (let s = 0; s < statuses.length; s++) {
      cumulative += statusWeights[s];
      if (roll <= cumulative) { status = statuses[s]; break; }
    }
    const isDone = status === 'done' || status === 'closed';

    rows.push({
      id: `ISS-${String(i + 1).padStart(4, '0')}`,
      project: randItem(projects),
      team: randItem(teams),
      type,
      priority: randItem(priorities),
      status,
      created_date: dateStr(createdDate),
      resolved_date: isDone ? dateStr(resolvedDate) : null,
      story_points: rand(1, 13),
      assignee: `dev_${rand(1, 30)}`,
    });
  }
  return rows;
}

// ─── Sprints ──────────────────────────────────────────────────────────────────
// One row per 2-week sprint per team, tracking velocity and quality.

function generateSprints() {
  const teams = ['Alpha', 'Beta', 'Gamma', 'Platform', 'Infra'];
  const rows: Record<string, unknown>[] = [];
  let sprintNum = 1;

  for (const team of teams) {
    let sprintStart = new Date('2023-01-02'); // first Monday of 2023
    const endLimit = new Date('2024-12-31');

    while (sprintStart <= endLimit) {
      const sprintEnd = addDays(sprintStart, 13); // 2-week sprint
      const planned = rand(20, 60);
      // completed = 60–110% of planned, capped at planned+10
      const completed = Math.min(planned + rand(-8, 10), Math.round(planned * 1.1));
      const bugsOpened = rand(0, 8);
      const bugsClosed = rand(0, bugsOpened + 3);

      rows.push({
        id: `SPR-${String(sprintNum).padStart(3, '0')}`,
        team,
        start_date: dateStr(sprintStart),
        end_date: dateStr(sprintEnd),
        planned_points: planned,
        completed_points: Math.max(completed, 0),
        bugs_opened: bugsOpened,
        bugs_closed: bugsClosed,
      });

      sprintStart = addDays(sprintEnd, 1);
      sprintNum++;
    }
  }
  return rows;
}

// ─── Deployments ─────────────────────────────────────────────────────────────
// Every deployment event across environments with outcome and timing.

function generateDeployments() {
  const teams = ['Alpha', 'Beta', 'Gamma', 'Platform', 'Infra'];
  const projects = ['web-app', 'mobile-app', 'api-gateway', 'data-pipeline', 'auth-service'];
  const environments = ['dev', 'staging', 'prod'];
  // prod less frequent, more likely to succeed
  const rows: Record<string, unknown>[] = [];
  const start = new Date('2023-01-01');
  const end = new Date('2024-12-31');
  const totalDays = (end.getTime() - start.getTime()) / 86400000;

  for (let i = 0; i < 3000; i++) {
    const deployDate = addDays(start, rand(0, totalDays));
    const env = randItem(environments);
    // prod has lower failure rate
    const failRate = env === 'prod' ? 8 : 20;
    const roll = rand(1, 100);
    const status = roll <= failRate ? 'failure' : roll <= failRate + 5 ? 'rollback' : 'success';

    rows.push({
      id: `DEP-${String(i + 1).padStart(4, '0')}`,
      date: dateStr(deployDate),
      project: randItem(projects),
      team: randItem(teams),
      environment: env,
      status,
      duration_min: rand(2, 45),
      lead_time_days: rand(1, 30),
    });
  }
  return rows;
}

export const MOCK_DATA = {
  issues: generateIssues(),
  sprints: generateSprints(),
  deployments: generateDeployments(),
};
