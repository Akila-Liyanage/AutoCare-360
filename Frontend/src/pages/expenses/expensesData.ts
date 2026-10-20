export interface ExpenseLedgerItem {
  id: string;
  date: string;
  year: string;
  vehicle: string;
  service: string;
  provider: string;
  category: 'Diagnostics' | 'Maintenance' | 'Tyres' | 'Repairs' | 'Subscription';
  invoice: string;
  payment: 'PAID' | 'AUTO-PAID' | 'PENDING';
  amount: number;
}

export interface SpendCategoryItem {
  category: string;
  amount: number;
  color: string;
}

export interface RecurringUpcomingItem {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  type: 'recurring' | 'ai-estimate';
}

export const MOCK_EXPENSE_SUMMARY = {
  totalSpend: 172000,
  serviceSpend: 169000,
  recurringSpend: 3000,
  averageServiceCost: 42250,
  serviceInvoiceCount: 4,
  paidInvoicesRatio: '5 of 5',
  overdueCount: 0,
  upcoming90Days: 38500,
  upcomingExpectedCosts: 2,
  budgetUsed: 172000,
  budgetTotal: 240000,
  budgetRemaining: 68000,
  budgetDeadline: '31 Dec 2026',
};

export const MOCK_SPEND_CATEGORIES: SpendCategoryItem[] = [
  {
    category: 'Repairs & parts',
    amount: 120000,
    color: '#0056A2',
  },
  {
    category: 'Diagnostics',
    amount: 28500,
    color: '#00B4EB',
  },
  {
    category: 'Maintenance',
    amount: 12000,
    color: '#22c55e',
  },
  {
    category: 'Tyres & safety',
    amount: 8500,
    color: '#f59e0b',
  },
  {
    category: 'Subscriptions',
    amount: 3000,
    color: '#64748b',
  },
];

export const MOCK_RECURRING_UPCOMING: RecurringUpcomingItem[] = [
  {
    id: 'rec-01',
    title: 'Connected services subscription',
    subtitle: '01 Oct 2026 · recurring monthly',
    amount: 3000,
    type: 'recurring',
  },
  {
    id: 'rec-02',
    title: 'Tyre replacement reserve',
    subtitle: 'AI estimate · due near 86,000 km',
    amount: 35500,
    type: 'ai-estimate',
  },
];

export const MOCK_EXPENSE_LEDGER: ExpenseLedgerItem[] = [
  {
    id: 'exp-01',
    date: '14 Aug 2026',
    year: '2026',
    vehicle: 'Tesla Model S Plaid',
    service: 'Annual safety & electronics diagnostics',
    provider: 'Apex Tech Service Center',
    category: 'Diagnostics',
    invoice: 'INV-2026-184',
    payment: 'PAID',
    amount: 28500,
  },
  {
    id: 'exp-02',
    date: '12 Jul 2026',
    year: '2026',
    vehicle: 'Tesla Model S Plaid',
    service: 'Cabin filter & AC service',
    provider: 'Apex Tech Service Center',
    category: 'Maintenance',
    invoice: 'INV-2026-162',
    payment: 'PAID',
    amount: 12000,
  },
  {
    id: 'exp-03',
    date: '04 May 2026',
    year: '2026',
    vehicle: 'Tesla Model S Plaid',
    service: 'Tyre safety check & rotation',
    provider: 'Perera Auto Works',
    category: 'Tyres',
    invoice: 'INV-2026-091',
    payment: 'PAID',
    amount: 8500,
  },
  {
    id: 'exp-04',
    date: '18 Jan 2026',
    year: '2026',
    vehicle: 'Tesla Model S Plaid',
    service: 'Electric drivetrain & parts repair',
    provider: 'Perera Auto Works',
    category: 'Repairs',
    invoice: 'INV-2026-018',
    payment: 'PAID',
    amount: 120000,
  },
  {
    id: 'exp-05',
    date: '01 Jan 2026',
    year: '2026',
    vehicle: 'Tesla Model S Plaid',
    service: 'Connected services subscription',
    provider: 'Tesla Connected Services',
    category: 'Subscription',
    invoice: 'SUB-2026-01',
    payment: 'AUTO-PAID',
    amount: 3000,
  },
  {
    id: 'exp-06',
    date: '15 Nov 2025',
    year: '2025',
    vehicle: 'Toyota Aqua · WP ABC-1234',
    service: 'Hybrid inverter coolant replacement',
    provider: 'Perera Auto Works',
    category: 'Maintenance',
    invoice: 'INV-2025-412',
    payment: 'PAID',
    amount: 18500,
  },
  {
    id: 'exp-07',
    date: '20 Aug 2025',
    year: '2025',
    vehicle: 'Toyota Aqua · WP ABC-1234',
    service: 'Front brake rotor skimming & pad install',
    provider: 'Apex Tech Service Center',
    category: 'Repairs',
    invoice: 'INV-2025-288',
    payment: 'PAID',
    amount: 22000,
  },
];
