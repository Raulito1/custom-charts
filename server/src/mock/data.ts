function seasonalMultiplier(date: Date): number {
  const month = date.getMonth(); // 0-based
  // Q4 (Oct-Dec) peak, Q1 slight dip
  const factors = [0.85, 0.80, 0.90, 0.95, 1.00, 1.05, 1.05, 1.00, 1.05, 1.15, 1.20, 1.25];
  return factors[month];
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSalesData() {
  const regions = ['North', 'South', 'East', 'West', 'EMEA', 'APAC'];
  const products = ['Starter', 'Professional', 'Enterprise'];
  const productBase: Record<string, number> = { Starter: 8000, Professional: 25000, Enterprise: 75000 };
  const rows: Record<string, unknown>[] = [];

  const start = new Date('2023-01-01');
  const end = new Date('2024-12-31');
  // Generate monthly data to keep dataset manageable (~144 region*product combinations * 24 months)
  for (let d = new Date(start); d <= end; ) {
    const dateStr = d.toISOString().slice(0, 10);
    for (const region of regions) {
      for (const product of products) {
        const base = productBase[product];
        const mul = seasonalMultiplier(d);
        const revenue = Math.round((base + rand(-base * 0.2, base * 0.2)) * mul);
        rows.push({
          date: dateStr,
          region,
          product,
          revenue,
          units: rand(5, 80),
        });
      }
    }
    // advance by ~week (7 days) for a denser but not huge dataset
    d.setDate(d.getDate() + 7);
  }
  return rows;
}

function generateCustomers() {
  const segments = ['SMB', 'Mid-Market', 'Enterprise'];
  const mrrBySegment: Record<string, [number, number]> = {
    SMB: [200, 2000],
    'Mid-Market': [2000, 15000],
    Enterprise: [15000, 100000],
  };
  const companies = [
    'Acme Corp', 'Globex', 'Initech', 'Umbrella Inc', 'Stark Industries',
    'Wayne Enterprises', 'Dunder Mifflin', 'Pied Piper', 'Hooli', 'Weyland Corp',
    'Bluth Company', 'Vandelay Industries', 'Prestige Worldwide', 'Los Pollos',
    'Nakatomi Corp', 'Soylent Corp', 'Massive Dynamic', 'Cyberdyne', 'InGen',
    'Tyrell Corp', 'OCP', 'Virtucon', 'Oscorp', 'Rand Corp', 'Sterling Cooper',
  ];

  return Array.from({ length: 500 }, (_, i) => {
    const segment = segments[i % 3];
    const [mrrMin, mrrMax] = mrrBySegment[segment];
    const signupDate = new Date(2022, 0, 1);
    signupDate.setDate(signupDate.getDate() + rand(0, 730));
    return {
      id: `cust_${String(i + 1).padStart(3, '0')}`,
      name: `${companies[i % companies.length]} ${Math.floor(i / companies.length) + 1}`,
      segment,
      signup_date: signupDate.toISOString().slice(0, 10),
      mrr: rand(mrrMin, mrrMax),
    };
  });
}

function generateEvents() {
  const eventTypes = ['page_view', 'feature_used', 'login', 'export'];
  const rows: Record<string, unknown>[] = [];
  const start = new Date('2023-01-01').getTime();
  const end = new Date('2024-12-31').getTime();

  for (let i = 0; i < 5000; i++) {
    const ts = new Date(start + Math.random() * (end - start));
    rows.push({
      timestamp: ts.toISOString().replace('T', ' ').slice(0, 19),
      user_id: `cust_${String(rand(1, 500)).padStart(3, '0')}`,
      event_type: eventTypes[rand(0, eventTypes.length - 1)],
    });
  }
  return rows;
}

export const MOCK_DATA = {
  sales: generateSalesData(),
  customers: generateCustomers(),
  events: generateEvents(),
};
