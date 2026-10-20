export interface ExpenseLedgerItem {
  id: string;
  date: string;
  year: string;
  vehicle: string;
  service: string;
  provider: string;
  category: string;
  invoice: string;
  payment: string;
  amount: number;
  source?: 'service_record' | 'manual';
  description?: string;
  notes?: string;
}

export interface SpendCategoryItem {
  category: string;
  amount: number;
  color: string;
  percentage?: number;
}

export interface RecurringUpcomingItem {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  type: 'recurring' | 'ai-estimate';
}

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
