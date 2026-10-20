import React, { useState, useMemo } from 'react';
import {
  Download,
  Plus,
  Search,
  X,
  CheckCircle2,
  Info,
  ExternalLink,
  Receipt
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import {
  MOCK_EXPENSE_SUMMARY,
  MOCK_SPEND_CATEGORIES,
  MOCK_RECURRING_UPCOMING,
  MOCK_EXPENSE_LEDGER,
  type ExpenseLedgerItem
} from './expensesData';
import '../../styles/expenses.css';

interface ToastState {
  message: string;
  type: 'info' | 'success';
}

export const ExpenseTrackingPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('Tesla Model S Plaid');
  const [dateFilter, setDateFilter] = useState('This year');
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: 'info' | 'success' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  // Filter ledger items based on search query, vehicle, and date period
  const filteredLedger = useMemo(() => {
    return MOCK_EXPENSE_LEDGER.filter((item: ExpenseLedgerItem) => {
      // Vehicle filter
      if (vehicleFilter !== 'All vehicles' && item.vehicle !== vehicleFilter) {
        return false;
      }

      // Date / Year filter
      if (dateFilter === 'This year' && item.year !== '2026') {
        return false;
      }
      if (dateFilter === '2025' && item.year !== '2025') {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesService = item.service.toLowerCase().includes(query);
        const matchesProvider = item.provider.toLowerCase().includes(query);
        const matchesInvoice = item.invoice.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        return matchesService || matchesProvider || matchesInvoice || matchesCategory;
      }

      return true;
    });
  }, [searchQuery, vehicleFilter, dateFilter]);

  // Client-side CSV export trigger
  const handleExportCSV = () => {
    try {
      const headers = ['Date', 'Vehicle', 'Service', 'Provider', 'Category', 'Invoice', 'Payment Status', 'Amount (LKR)'];
      const rows = filteredLedger.map((row) => [
        `"${row.date}"`,
        `"${row.vehicle}"`,
        `"${row.service.replace(/"/g, '""')}"`,
        `"${row.provider.replace(/"/g, '""')}"`,
        `"${row.category}"`,
        `"${row.invoice}"`,
        `"${row.payment}"`,
        row.amount
      ]);

      const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `AutoCare360_Expense_Ledger_${new Date().getFullYear()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Exported ${filteredLedger.length} ledger record(s) to CSV successfully.`, 'success');
    } catch {
      showToast('Export failed. Please try again.', 'info');
    }
  };

  const handleAddExpense = () => {
    showToast('Add expense manual receipt entry modal will be activated in upcoming phase.', 'info');
  };

  const handleDownloadInvoices = () => {
    showToast('Preparing batch invoice package for verified records (mock preview).', 'info');
  };

  const handleInvoiceClick = (invoice: string) => {
    showToast(`Viewing cryptographically verified invoice: ${invoice}`, 'info');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setVehicleFilter('All vehicles');
    setDateFilter('All time');
  };

  return (
    <div className="autocare-expenses-page">
      <Navbar />

      <main className="autocare-expenses-main">
        <div className="autocare-expenses-container">
          {/* Top Header Row */}
          <div className="autocare-expenses-header-row">
            <div className="autocare-expenses-title-group">
              <span className="autocare-expenses-eyebrow">OWNER FINANCES</span>
              <h1 className="autocare-expenses-title">Expense tracking</h1>
              <p className="autocare-expenses-subtitle">
                Consolidated spend overview across verified workshop invoices and recurring subscriptions.
              </p>
            </div>

            <div className="autocare-expenses-actions">
              <button
                type="button"
                className="autocare-btn-export-csv"
                onClick={handleExportCSV}
                title="Export current ledger to CSV"
              >
                <Download size={16} />
                Export CSV
              </button>
              <button
                type="button"
                className="autocare-btn-add-expense"
                onClick={handleAddExpense}
              >
                <Plus size={16} />
                Add expense
              </button>
            </div>
          </div>

          {/* Top 4 Summary Cards */}
          <section className="autocare-expenses-metrics-grid" aria-label="Finances summary">
            {/* Card 1: Total spend in 2026 */}
            <div className="autocare-expense-metric-card">
              <span className="autocare-expense-metric-label">Total spend in 2026</span>
              <div className="autocare-expense-metric-value">
                LKR {MOCK_EXPENSE_SUMMARY.totalSpend.toLocaleString()}
              </div>
              <p className="autocare-expense-metric-subtext is-blue">
                LKR {MOCK_EXPENSE_SUMMARY.serviceSpend.toLocaleString()} service · LKR {MOCK_EXPENSE_SUMMARY.recurringSpend.toLocaleString()} recurring
              </p>
            </div>

            {/* Card 2: Average service cost */}
            <div className="autocare-expense-metric-card">
              <span className="autocare-expense-metric-label">Average service cost</span>
              <div className="autocare-expense-metric-value">
                LKR {MOCK_EXPENSE_SUMMARY.averageServiceCost.toLocaleString()}
              </div>
              <p className="autocare-expense-metric-subtext is-blue">
                Across {MOCK_EXPENSE_SUMMARY.serviceInvoiceCount} verified service invoices
              </p>
            </div>

            {/* Card 3: Paid invoices */}
            <div className="autocare-expense-metric-card">
              <span className="autocare-expense-metric-label">Paid invoices</span>
              <div className="autocare-expense-metric-value">
                {MOCK_EXPENSE_SUMMARY.paidInvoicesRatio}
              </div>
              <p className="autocare-expense-metric-subtext is-green">
                No overdue payments
              </p>
            </div>

            {/* Card 4: Upcoming 90 days */}
            <div className="autocare-expense-metric-card">
              <span className="autocare-expense-metric-label">Upcoming 90 days</span>
              <div className="autocare-expense-metric-value">
                LKR {MOCK_EXPENSE_SUMMARY.upcoming90Days.toLocaleString()}
              </div>
              <p className="autocare-expense-metric-subtext is-amber">
                AI estimate · {MOCK_EXPENSE_SUMMARY.upcomingExpectedCosts} expected costs
              </p>
            </div>
          </section>

          {/* Middle Row Grid: Spend by Category + Recurring & Budget */}
          <div className="autocare-expenses-middle-grid">
            {/* Left Column: Spend by category */}
            <div className="autocare-expenses-card">
              <div className="autocare-expenses-card-header">
                <h2 className="autocare-expenses-card-title">Spend by category</h2>
                <p className="autocare-expenses-card-subtitle">
                  Tesla Model S Plaid · 01 Jan–30 Sep 2026
                </p>
              </div>

              <div className="autocare-spend-category-list">
                {MOCK_SPEND_CATEGORIES.map((cat) => {
                  const percent = Math.min(
                    100,
                    Math.round((cat.amount / MOCK_EXPENSE_SUMMARY.totalSpend) * 100)
                  );
                  return (
                    <div key={cat.category} className="autocare-spend-category-item">
                      <div className="autocare-spend-category-info">
                        <span className="autocare-spend-category-name">{cat.category}</span>
                        <span className="autocare-spend-category-amount">
                          LKR {cat.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="autocare-spend-progress-track">
                        <div
                          className="autocare-spend-progress-fill"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: cat.color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column Stack */}
            <div className="autocare-expenses-right-stack">
              {/* Recurring & Upcoming */}
              <div className="autocare-expenses-card">
                <div className="autocare-expenses-card-header">
                  <h2 className="autocare-expenses-card-title">Recurring & upcoming</h2>
                  <p className="autocare-expenses-card-subtitle">
                    Estimated and scheduled maintenance commitments.
                  </p>
                </div>

                <div className="autocare-recurring-list">
                  {MOCK_RECURRING_UPCOMING.map((item) => (
                    <div key={item.id} className="autocare-recurring-item">
                      <div className="autocare-recurring-left">
                        <span className="autocare-recurring-title">{item.title}</span>
                        <span className="autocare-recurring-sub">{item.subtitle}</span>
                      </div>
                      <span className="autocare-recurring-amount">
                        LKR {item.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Annual Maintenance Budget */}
              <div className="autocare-budget-card">
                <h3 className="autocare-budget-title">Annual maintenance budget</h3>
                <div className="autocare-budget-figures">
                  <span className="autocare-budget-spent">
                    LKR {MOCK_EXPENSE_SUMMARY.budgetUsed.toLocaleString()}
                  </span>
                  <span className="autocare-budget-total">
                    of LKR {MOCK_EXPENSE_SUMMARY.budgetTotal.toLocaleString()} used
                  </span>
                </div>

                <div className="autocare-budget-progress-track">
                  <div
                    className="autocare-budget-progress-fill"
                    style={{
                      width: `${(MOCK_EXPENSE_SUMMARY.budgetUsed / MOCK_EXPENSE_SUMMARY.budgetTotal) * 100}%`
                    }}
                  />
                </div>

                <p className="autocare-budget-footer-text">
                  LKR {MOCK_EXPENSE_SUMMARY.budgetRemaining.toLocaleString()} remaining through {MOCK_EXPENSE_SUMMARY.budgetDeadline}.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Section: Itemized Expense Ledger */}
          <section className="autocare-ledger-card" aria-label="Itemized expense ledger">
            <div className="autocare-ledger-header-row">
              <div className="autocare-ledger-title-group">
                <h2 className="autocare-ledger-title">Itemized expense ledger</h2>
                <p className="autocare-ledger-subtitle">
                  Invoice amounts are sourced from verified vehicle service records.
                </p>
              </div>

              <button
                type="button"
                className="autocare-btn-download-invoices"
                onClick={handleDownloadInvoices}
              >
                <Download size={15} />
                Download invoices
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="autocare-ledger-filters-bar">
              <div className="autocare-ledger-search-box">
                <Search size={16} className="autocare-ledger-search-icon" />
                <input
                  type="text"
                  className="autocare-ledger-search-input"
                  placeholder="Search service, garage or invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="autocare-ledger-search-clear"
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <select
                className="autocare-ledger-select"
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                aria-label="Filter by vehicle"
              >
                <option value="Tesla Model S Plaid">Tesla Model S Plaid</option>
                <option value="Toyota Aqua · WP ABC-1234">Toyota Aqua · WP ABC-1234</option>
                <option value="All vehicles">All vehicles</option>
              </select>

              <select
                className="autocare-ledger-select"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                aria-label="Filter by period"
              >
                <option value="This year">This year</option>
                <option value="2025">2025</option>
                <option value="All time">All time</option>
              </select>
            </div>

            {/* Ledger Table */}
            <div className="autocare-ledger-table-wrap">
              {filteredLedger.length > 0 ? (
                <table className="autocare-ledger-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Service & Provider</th>
                      <th>Category</th>
                      <th>Invoice</th>
                      <th>Payment</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLedger.map((row) => (
                      <tr key={row.id}>
                        <td className="autocare-col-date">{row.date}</td>
                        <td className="autocare-col-service">
                          <div className="autocare-service-main">{row.service}</div>
                          <div className="autocare-service-provider">{row.provider}</div>
                        </td>
                        <td className="autocare-col-category">{row.category}</td>
                        <td>
                          <button
                            type="button"
                            className="autocare-invoice-link"
                            onClick={() => handleInvoiceClick(row.invoice)}
                            style={{ background: 'none', border: 'none', padding: 0, font: 'inherit' }}
                          >
                            {row.invoice}
                            <ExternalLink size={12} />
                          </button>
                        </td>
                        <td>
                          <span
                            className={`autocare-payment-badge ${
                              row.payment === 'AUTO-PAID'
                                ? 'is-auto-paid'
                                : row.payment === 'PAID'
                                ? 'is-paid'
                                : 'is-pending'
                            }`}
                          >
                            {row.payment}
                          </span>
                        </td>
                        <td className="autocare-col-amount">
                          LKR {row.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="autocare-ledger-empty">
                  <Receipt size={36} color="#94a3b8" />
                  <h3 className="autocare-ledger-empty-title">No expense records found</h3>
                  <p className="autocare-ledger-empty-sub">
                    No transactions matched your current search and filters.
                  </p>
                  <button
                    type="button"
                    className="autocare-btn-reset-filters"
                    onClick={resetFilters}
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`autocare-expenses-toast ${
            toast.type === 'success' ? 'is-success' : 'is-info'
          }`}
          role="alert"
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <Info size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ExpenseTrackingPage;
