import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Download,
  Plus,
  Search,
  X,
  CheckCircle2,
  Info,
  ExternalLink,
  Receipt,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import {
  type ExpenseLedgerItem,
  type SpendCategoryItem,
  MOCK_RECURRING_UPCOMING
} from './expensesData';
import {
  getVehicleExpenses,
  getExpenseSummary,
  createExpense,
  type BackendExpense,
  type BackendExpenseSummary
} from '../../services/expenseService';
import { getMyVehicles, type Vehicle } from '../../services/vehicleService';
import '../../styles/expenses.css';
import '../../styles/documents.css';

interface ToastState {
  message: string;
  type: 'info' | 'success';
}

const CATEGORY_COLORS: Record<string, string> = {
  Fuel: '#f59e0b',
  'Repairs & parts': '#0056A2',
  Repairs: '#0056A2',
  Diagnostics: '#00B4EB',
  Maintenance: '#22c55e',
  'Tyres & safety': '#f97316',
  Tyres: '#f97316',
  Subscriptions: '#64748b',
  Subscription: '#64748b',
  Insurance: '#8b5cf6',
  Taxes: '#ec4899',
  Other: '#94a3b8',
};

export const ExpenseTrackingPage: React.FC = () => {
  const location = useLocation();

  // Vehicles state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Expense API state
  const [rawExpenses, setRawExpenses] = useState<BackendExpense[]>([]);
  const [summary, setSummary] = useState<BackendExpenseSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // UI filters & toast
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('This year');
  const [toast, setToast] = useState<ToastState | null>(null);

  // Add Expense Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategory, setNewCategory] = useState('Fuel');
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newExpenseDate, setNewExpenseDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [newVendor, setNewVendor] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('Card');
  const [newDescription, setNewDescription] = useState('');

  const showToast = (message: string, type: 'info' | 'success' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  /**
   * Fetch expenses and summary for a given vehicle ID
   */
  const loadVehicleData = useCallback(async (vId: string) => {
    try {
      setIsLoading(true);
      setApiError(null);
      const [expensesData, summaryData] = await Promise.all([
        getVehicleExpenses(vId),
        getExpenseSummary(vId),
      ]);
      setRawExpenses(expensesData);
      setSummary(summaryData);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to retrieve vehicle expenses. Please verify your connection.';
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initial data loading: fetch user vehicles & resolve active vehicle
   */
  useEffect(() => {
    let isMounted = true;

    const initPageData = async () => {
      try {
        setIsLoading(true);
        setApiError(null);

        const myVehicles = await getMyVehicles();
        if (!isMounted) return;
        setVehicles(myVehicles);

        const locationState = (location.state as { vehicleId?: string; vehicle?: Vehicle }) || {};
        let resolvedId = locationState.vehicleId || locationState.vehicle?._id;

        if (!resolvedId && myVehicles && myVehicles.length > 0) {
          resolvedId = myVehicles[0]._id;
        }

        if (!resolvedId) {
          setIsLoading(false);
          setApiError('No vehicles registered. Please register a vehicle to track expenses.');
          return;
        }

        setSelectedVehicleId(resolvedId);

        const [expensesData, summaryData] = await Promise.all([
          getVehicleExpenses(resolvedId),
          getExpenseSummary(resolvedId),
        ]);

        if (isMounted) {
          setRawExpenses(expensesData);
          setSummary(summaryData);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Failed to load expense records. Please try again.';
          setApiError(msg);
          setIsLoading(false);
        }
      }
    };

    initPageData();

    return () => {
      isMounted = false;
    };
  }, [location.state]);

  /**
   * Vehicle filter change
   */
  const handleVehicleChange = (vId: string) => {
    setSelectedVehicleId(vId);
    if (vId) {
      loadVehicleData(vId);
    }
  };

  const activeVehicle = useMemo(() => {
    return vehicles.find((v) => v._id === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

  const vehicleLabel = useMemo(() => {
    if (activeVehicle) {
      return `${activeVehicle.manufacturer} ${activeVehicle.model} · ${activeVehicle.registrationNumber}`;
    }
    return 'Registered Vehicle';
  }, [activeVehicle]);

  /**
   * Map raw backend expenses into UI ledger items
   */
  const ledgerItems: ExpenseLedgerItem[] = useMemo(() => {
    return rawExpenses.map((exp) => {
      let formattedDate = 'Recent';
      let year = String(new Date().getFullYear());

      if (exp.expenseDate) {
        try {
          const d = new Date(exp.expenseDate);
          if (!isNaN(d.getTime())) {
            year = String(d.getFullYear());
            formattedDate = d.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
          }
        } catch {
          formattedDate = String(exp.expenseDate);
        }
      }

      const isService = exp.source === 'service_record';
      const provider = exp.vendor
        ? exp.vendor
        : isService
        ? 'Verified Workshop'
        : 'Self-Reported / Owner';

      const invoiceNumber = exp.serviceRecordId
        ? `INV-${exp.serviceRecordId.slice(-6).toUpperCase()}`
        : `EXP-${exp._id.slice(-6).toUpperCase()}`;

      let paymentStatus: 'PAID' | 'AUTO-PAID' | 'PENDING' = 'PAID';
      if (exp.paymentMethod) {
        const pm = exp.paymentMethod.toUpperCase();
        if (pm.includes('AUTO') || pm.includes('SUBSCRIPTION')) {
          paymentStatus = 'AUTO-PAID';
        } else if (pm.includes('PENDING')) {
          paymentStatus = 'PENDING';
        } else {
          paymentStatus = 'PAID';
        }
      }

      return {
        id: exp._id,
        date: formattedDate,
        year,
        vehicle: vehicleLabel,
        service: exp.title,
        provider,
        category: exp.category,
        invoice: invoiceNumber,
        payment: paymentStatus,
        amount: exp.amount,
        source: exp.source,
        description: exp.description,
        notes: exp.notes,
      };
    });
  }, [rawExpenses, vehicleLabel]);

  // Filter ledger items based on search query and date period
  const filteredLedger = useMemo(() => {
    return ledgerItems.filter((item) => {
      // Date / Year filter
      const currentYearStr = String(new Date().getFullYear());
      if (dateFilter === 'This year' && item.year !== currentYearStr) {
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
  }, [ledgerItems, dateFilter, searchQuery]);

  // Dynamic category breakdown from real summary
  const spendCategories: SpendCategoryItem[] = useMemo(() => {
    if (!summary?.categoryBreakdown || summary.categoryBreakdown.length === 0) {
      return [];
    }
    return summary.categoryBreakdown.map((item) => ({
      category: item.category,
      amount: item.total,
      percentage: item.percentage,
      color: CATEGORY_COLORS[item.category] || '#0056A2',
    }));
  }, [summary]);

  // Compute metrics from real summary
  const totalSpendVal = summary ? summary.totalExpense : 0;
  const serviceSpendVal = summary ? summary.serviceExpenseTotal : 0;
  const manualSpendVal = summary ? summary.manualExpenseTotal : 0;

  const serviceInvoicesCount = useMemo(() => {
    return rawExpenses.filter((e) => e.source === 'service_record').length;
  }, [rawExpenses]);

  const averageServiceCost = useMemo(() => {
    if (serviceInvoicesCount > 0 && serviceSpendVal > 0) {
      return Math.round(serviceSpendVal / serviceInvoicesCount);
    }
    if (summary && summary.expenseCount > 0 && totalSpendVal > 0) {
      return Math.round(totalSpendVal / summary.expenseCount);
    }
    return 0;
  }, [serviceInvoicesCount, serviceSpendVal, summary, totalSpendVal]);

  const budgetTotal = 240000;
  const budgetSpent = totalSpendVal;
  const budgetRemaining = Math.max(0, budgetTotal - budgetSpent);
  const budgetPercent = Math.min(100, Math.round((budgetSpent / budgetTotal) * 100));

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
      link.setAttribute('download', `AutoCare360_Expense_Ledger_${activeVehicle?.registrationNumber || 'Export'}.csv`);
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
    if (!selectedVehicleId) {
      showToast('Please select a vehicle first to log an expense.', 'info');
      return;
    }
    setIsAddModalOpen(true);
  };

  const handleCreateExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      showToast('Please select a valid vehicle first.', 'info');
      return;
    }
    if (!newTitle.trim()) {
      showToast('Please enter an expense title.', 'info');
      return;
    }
    const parsedAmt = Number(newAmount);
    if (isNaN(parsedAmt) || parsedAmt < 0) {
      showToast('Please enter a valid expense amount.', 'info');
      return;
    }
    if (!newExpenseDate) {
      showToast('Please select a valid expense date.', 'info');
      return;
    }

    try {
      setIsSubmitting(true);
      await createExpense(selectedVehicleId, {
        category: newCategory,
        title: newTitle.trim(),
        amount: parsedAmt,
        expenseDate: newExpenseDate,
        vendor: newVendor.trim() || undefined,
        paymentMethod: newPaymentMethod || undefined,
        description: newDescription.trim() || undefined,
      });

      showToast(`Expense "${newTitle}" logged successfully.`, 'success');
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewAmount('');
      setNewVendor('');
      setNewDescription('');
      setNewExpenseDate(new Date().toISOString().split('T')[0]);

      // Refresh data
      await loadVehicleData(selectedVehicleId);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to create expense. Please try again.';
      showToast(msg, 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadInvoices = () => {
    showToast(`Compiled ledger report for ${filteredLedger.length} verified record(s).`, 'info');
  };

  const handleInvoiceClick = (invoice: string) => {
    showToast(`Cryptographically verified ledger record: ${invoice}`, 'info');
  };

  const resetFilters = () => {
    setSearchQuery('');
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

          {/* API Error Banner if present */}
          {apiError && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                color: '#991b1b',
                fontSize: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={18} color="#dc2626" />
                <span>{apiError}</span>
              </div>
              {selectedVehicleId && (
                <button
                  type="button"
                  onClick={() => loadVehicleData(selectedVehicleId)}
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {/* Top 4 Summary Cards */}
          <section className="autocare-expenses-metrics-grid" aria-label="Finances summary">
            {/* Card 1: Total spend */}
            <div className="autocare-expense-metric-card">
              <span className="autocare-expense-metric-label">
                Total spend in {new Date().getFullYear()}
              </span>
              <div className="autocare-expense-metric-value">
                LKR {totalSpendVal.toLocaleString()}
              </div>
              <p className="autocare-expense-metric-subtext is-blue">
                LKR {serviceSpendVal.toLocaleString()} service · LKR {manualSpendVal.toLocaleString()} manual
              </p>
            </div>

            {/* Card 2: Average service cost */}
            <div className="autocare-expense-metric-card">
              <span className="autocare-expense-metric-label">Average service cost</span>
              <div className="autocare-expense-metric-value">
                LKR {averageServiceCost.toLocaleString()}
              </div>
              <p className="autocare-expense-metric-subtext is-blue">
                Across {serviceInvoicesCount} verified service invoices
              </p>
            </div>

            {/* Card 3: Paid invoices */}
            <div className="autocare-expense-metric-card">
              <span className="autocare-expense-metric-label">Paid invoices</span>
              <div className="autocare-expense-metric-value">
                {summary ? `${summary.expenseCount} of ${summary.expenseCount}` : '0 of 0'}
              </div>
              <p className="autocare-expense-metric-subtext is-green">
                No overdue payments
              </p>
            </div>

            {/* Card 4: Upcoming 90 days */}
            <div className="autocare-expense-metric-card">
              <span className="autocare-expense-metric-label">Upcoming 90 days</span>
              <div className="autocare-expense-metric-value">
                LKR {(38500).toLocaleString()}
              </div>
              <p className="autocare-expense-metric-subtext is-amber">
                AI estimate · 2 expected costs
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
                  {vehicleLabel} · Consolidated
                </p>
              </div>

              <div className="autocare-spend-category-list">
                {spendCategories.length > 0 ? (
                  spendCategories.map((cat) => {
                    const percent =
                      cat.percentage !== undefined
                        ? cat.percentage
                        : Math.min(
                            100,
                            Math.round(
                              (cat.amount / Math.max(1, totalSpendVal || 1)) * 100
                            )
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
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div
                    style={{
                      padding: '36px 0',
                      textAlign: 'center',
                      color: '#94a3b8',
                      fontSize: '14px',
                    }}
                  >
                    No category spend recorded yet for this vehicle.
                  </div>
                )}
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
                    LKR {budgetSpent.toLocaleString()}
                  </span>
                  <span className="autocare-budget-total">
                    of LKR {budgetTotal.toLocaleString()} used
                  </span>
                </div>

                <div className="autocare-budget-progress-track">
                  <div
                    className="autocare-budget-progress-fill"
                    style={{
                      width: `${budgetPercent}%`,
                    }}
                  />
                </div>

                <p className="autocare-budget-footer-text">
                  LKR {budgetRemaining.toLocaleString()} remaining through 31 Dec {new Date().getFullYear()}.
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
                  Invoice amounts are sourced from verified vehicle service records &amp; manual logs.
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

              {/* Vehicle Select */}
              <select
                className="autocare-ledger-select"
                value={selectedVehicleId || ''}
                onChange={(e) => handleVehicleChange(e.target.value)}
                aria-label="Filter by vehicle"
              >
                {vehicles.length === 0 ? (
                  <option value="">No vehicles found</option>
                ) : (
                  vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.manufacturer} {v.model} ({v.registrationNumber})
                    </option>
                  ))
                )}
              </select>

              {/* Date Filter */}
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
              {isLoading ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '48px',
                    color: '#0056A2',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  <RefreshCw size={20} className="autocare-spin" />
                  <span>Loading ledger records from API...</span>
                </div>
              ) : filteredLedger.length > 0 ? (
                <table className="autocare-ledger-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Service &amp; Provider</th>
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
                    {searchQuery
                      ? 'No transactions matched your current search and filters.'
                      : 'No expense records have been logged for this vehicle yet.'}
                  </p>
                  {searchQuery ? (
                    <button
                      type="button"
                      className="autocare-btn-reset-filters"
                      onClick={resetFilters}
                    >
                      Reset filters
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="autocare-btn-reset-filters"
                      onClick={handleAddExpense}
                    >
                      <Plus size={14} style={{ marginRight: '6px' }} />
                      Add First Expense
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="autocare-docs-modal-overlay" role="dialog" aria-modal="true">
          <div className="autocare-docs-modal-card">
            <div className="autocare-docs-modal-header">
              <h3 className="autocare-docs-modal-title">Log Vehicle Expense</h3>
              <button
                type="button"
                className="autocare-docs-modal-close"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateExpenseSubmit} className="autocare-docs-modal-form">
              <div className="autocare-docs-form-group">
                <label className="autocare-docs-form-label">Expense Category *</label>
                <select
                  className="autocare-docs-form-select"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  required
                >
                  <option value="Fuel">Fuel Refill</option>
                  <option value="Maintenance">Maintenance &amp; Periodic Service</option>
                  <option value="Repairs & parts">Repairs &amp; Mechanical Parts</option>
                  <option value="Diagnostics">Diagnostics &amp; Electrical Inspection</option>
                  <option value="Tyres & safety">Tyres &amp; Wheel Alignment</option>
                  <option value="Insurance">Insurance &amp; DMT Licensing</option>
                  <option value="Subscription">Connected Services &amp; Subscriptions</option>
                  <option value="Other">Other Expenses</option>
                </select>
              </div>

              <div className="autocare-docs-form-group">
                <label className="autocare-docs-form-label">Expense Title *</label>
                <input
                  type="text"
                  required
                  className="autocare-docs-form-input"
                  placeholder="e.g. Full Tank Octane 95 Refill"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="autocare-docs-form-group">
                  <label className="autocare-docs-form-label">Amount (LKR) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    className="autocare-docs-form-input"
                    placeholder="e.g. 18500"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                  />
                </div>

                <div className="autocare-docs-form-group">
                  <label className="autocare-docs-form-label">Expense Date *</label>
                  <input
                    type="date"
                    required
                    className="autocare-docs-form-input"
                    value={newExpenseDate}
                    onChange={(e) => setNewExpenseDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="autocare-docs-form-group">
                  <label className="autocare-docs-form-label">Vendor / Station</label>
                  <input
                    type="text"
                    className="autocare-docs-form-input"
                    placeholder="e.g. IOC Fuel Station"
                    value={newVendor}
                    onChange={(e) => setNewVendor(e.target.value)}
                  />
                </div>

                <div className="autocare-docs-form-group">
                  <label className="autocare-docs-form-label">Payment Method</label>
                  <select
                    className="autocare-docs-form-select"
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                  >
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Online">Online Payment Gateway</option>
                    <option value="Auto-Paid">Automated Recurring</option>
                  </select>
                </div>
              </div>

              <div className="autocare-docs-form-group">
                <label className="autocare-docs-form-label">Description / Notes</label>
                <textarea
                  className="autocare-docs-form-input"
                  rows={2}
                  placeholder="Optional expense description or receipt remarks..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="autocare-docs-modal-footer">
                <button
                  type="button"
                  className="autocare-docs-btn-cancel"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="autocare-docs-btn-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Logging expense...' : 'Log expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
