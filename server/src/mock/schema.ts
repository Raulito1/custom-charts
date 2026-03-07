import type { MockTable } from '../types';

export const MOCK_SCHEMA: MockTable[] = [
  {
    name: 'sales',
    description: 'Daily sales transactions by region and product',
    columns: [
      { name: 'date', type: 'DATE', description: 'Transaction date (YYYY-MM-DD), range: 2023-01-01 to 2024-12-31' },
      { name: 'region', type: 'VARCHAR', description: 'Geographic region: North, South, East, West, EMEA, APAC' },
      { name: 'product', type: 'VARCHAR', description: 'Product tier: Starter, Professional, Enterprise' },
      { name: 'revenue', type: 'NUMBER', description: 'Revenue in USD dollars' },
      { name: 'units', type: 'NUMBER', description: 'Number of units sold' },
    ],
  },
  {
    name: 'customers',
    description: 'Customer accounts with MRR',
    columns: [
      { name: 'id', type: 'VARCHAR', description: 'Unique customer ID (e.g. cust_001)' },
      { name: 'name', type: 'VARCHAR', description: 'Company name' },
      { name: 'segment', type: 'VARCHAR', description: 'Customer segment: SMB, Mid-Market, Enterprise' },
      { name: 'signup_date', type: 'DATE', description: 'Date customer signed up (2022-2024)' },
      { name: 'mrr', type: 'NUMBER', description: 'Monthly Recurring Revenue in USD' },
    ],
  },
  {
    name: 'events',
    description: 'Product usage events',
    columns: [
      { name: 'timestamp', type: 'TIMESTAMP', description: 'Event timestamp (2023-2024)' },
      { name: 'user_id', type: 'VARCHAR', description: 'Customer ID (references customers.id)' },
      { name: 'event_type', type: 'VARCHAR', description: 'Event type: page_view, feature_used, login, export' },
    ],
  },
];
