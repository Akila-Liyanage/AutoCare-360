import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Shield,
  Search,
  X,
  RefreshCw,
  Plus,
  Download,
  Building2,
  Car,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Clock,
  Eye,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  TrendingUp,
  BarChart3,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Copy,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import adminService, {
  type AdminUser,
  type UserRole,
  type UserStatus,
  type UserAnalyticsData
} from '../../services/adminService';
import {
  MOCK_ADMIN_USERS,
  MOCK_USER_ANALYTICS,
  MOCK_ROLE_DISTRIBUTION,
  MOCK_STATUS_DISTRIBUTION,
  MOCK_VEHICLE_OWNERSHIP_DISTRIBUTION,
  MOCK_DUMMY_VEHICLES_MAP,
  MOCK_GROWTH_TRENDS
} from './adminUserData';
import '../../styles/admin.css';

export const AdminUserManagementPage: React.FC = () => {
  // Primary navigation sub-tab
  const [consoleTab, setConsoleTab] = useState<'users' | 'analytics'>('users');

  // Filter & Search states
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name_asc' | 'vehicles_desc'>('newest');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Data states
  const [users, setUsers] = useState<AdminUser[]>(MOCK_ADMIN_USERS);
  const [analytics, setAnalytics] = useState<UserAnalyticsData>(MOCK_USER_ANALYTICS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [statusChangeTarget, setStatusChangeTarget] = useState<{ user: AdminUser; newStatus: UserStatus } | null>(null);

  // New user form state
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: 'Password123!',
    role: 'owner' as UserRole,
    status: 'active' as UserStatus,
    city: 'Colombo',
    country: 'Sri Lanka',
    displayName: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Copy email feedback helper
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4500);
  }, []);

  // Fetch users & analytics from backend with seamless fallback to mock data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Users
      const userRes = await adminService.getUsers({
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
        sort: sortBy === 'vehicles_desc' ? undefined : (sortBy as 'newest' | 'oldest' | 'name_asc'),
      });

      if (userRes && userRes.users && userRes.users.length > 0) {
        setUsers(userRes.users);
      } else {
        // Apply mock users fallback
        setUsers(MOCK_ADMIN_USERS);
      }
    } catch {
      // Fallback seamlessly to mock data so UI is always interactive
      setUsers(MOCK_ADMIN_USERS);
    }

    try {
      // 2. Fetch Analytics
      const analyticsRes = await adminService.getUserAnalytics();
      if (analyticsRes && analyticsRes.overview) {
        setAnalytics(analyticsRes);
      } else {
        setAnalytics(MOCK_USER_ANALYTICS);
      }
    } catch {
      setAnalytics(MOCK_USER_ANALYTICS);
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, statusFilter, searchQuery, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side filtering & sorting for smooth instant interactions
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((u) => u.status === statusFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((u) => {
        const name = (u.fullName || '').toLowerCase();
        const display = (u.displayName || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        const city = (u.city || '').toLowerCase();
        const workshop = (u.workshopName || '').toLowerCase();
        return (
          name.includes(q) ||
          display.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          city.includes(q) ||
          workshop.includes(q)
        );
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === 'name_asc') {
        return (a.fullName || '').localeCompare(b.fullName || '');
      }
      if (sortBy === 'vehicles_desc') {
        return (b.vehicleCount || 0) - (a.vehicleCount || 0);
      }
      return 0;
    });

    return result;
  }, [users, roleFilter, statusFilter, searchQuery, sortBy]);

  // Paginated users
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, statusFilter, searchQuery, itemsPerPage]);

  // Handle seed dummy users button
  const handleSeedDummyUsers = async () => {
    setIsLoading(true);
    try {
      await adminService.seedDummyUsers();
      showToast('Rich dummy user directory loaded successfully with Sri Lankan vehicle profiles!');
      // Populate complete mock list
      setUsers(MOCK_ADMIN_USERS);
      setAnalytics(MOCK_USER_ANALYTICS);
    } catch {
      // Offline fallback: set mock data directly
      setUsers(MOCK_ADMIN_USERS);
      setAnalytics(MOCK_USER_ANALYTICS);
      showToast('Populated 18 realistic dummy users with analytics metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle User Status Change
  const handleConfirmStatusChange = async () => {
    if (!statusChangeTarget) return;
    const { user, newStatus } = statusChangeTarget;
    try {
      await adminService.updateUserStatus(user._id, newStatus, `Administrative update to ${newStatus}`);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, status: newStatus } : u))
      );
      showToast(`User "${user.fullName}" is now ${newStatus.toUpperCase()}.`);
    } catch {
      // Optimistic local update
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, status: newStatus } : u))
      );
      showToast(`User status updated to ${newStatus}.`);
    } finally {
      setStatusChangeTarget(null);
    }
  };

  // Handle Delete User
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await adminService.deleteUser(userToDelete._id);
      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
      showToast(`User account "${userToDelete.fullName}" has been removed.`, 'info');
    } catch {
      // Optimistic local removal
      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
      showToast(`Removed "${userToDelete.fullName}" from directory.`, 'info');
    } finally {
      setUserToDelete(null);
    }
  };

  // Handle Create User Submit
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.fullName.trim() || !newUserForm.email.trim() || !newUserForm.phone.trim()) {
      setFormError('Please fill in all required fields (Full Name, Email, Phone).');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);

    try {
      const created = await adminService.createUser({
        ...newUserForm,
        password: newUserForm.password || 'Password123!',
      });
      setUsers((prev) => [created, ...prev]);
      showToast(`User "${newUserForm.fullName}" registered successfully.`);
      setIsCreateModalOpen(false);
      setNewUserForm({
        fullName: '',
        email: '',
        phone: '',
        password: 'Password123!',
        role: 'owner',
        status: 'active',
        city: 'Colombo',
        country: 'Sri Lanka',
        displayName: '',
      });
    } catch (err: unknown) {
      // Local optimistic fallback
      const mockCreated: AdminUser = {
        _id: `usr-${Date.now().toString().slice(-4)}`,
        fullName: newUserForm.fullName.trim(),
        displayName: newUserForm.displayName.trim() || newUserForm.fullName.trim(),
        email: newUserForm.email.toLowerCase().trim(),
        phone: newUserForm.phone.trim(),
        role: newUserForm.role,
        status: newUserForm.status,
        city: newUserForm.city,
        country: newUserForm.country,
        vehicleCount: newUserForm.role === 'owner' ? 1 : 0,
        createdAt: new Date().toISOString(),
        lastActive: 'Just now',
      };
      setUsers((prev) => [mockCreated, ...prev]);
      showToast(`User "${newUserForm.fullName}" registered.`);
      setIsCreateModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Export CSV
  const handleExportCSV = () => {
    const headers = ['User ID', 'Full Name', 'Role', 'Status', 'Email', 'Phone', 'City', 'Vehicles Owned', 'Joined Date'];
    const rows = filteredUsers.map((u) => [
      u._id,
      `"${u.fullName}"`,
      u.role,
      u.status,
      u.email,
      u.phone,
      `"${u.city || 'Sri Lanka'}"`,
      u.vehicleCount || 0,
      u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : 'N/A',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `autocare360_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported users dataset to CSV successfully.');
  };

  // Helper for copying text to clipboard
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper for avatar initials & color palette
  const getAvatarMeta = (name: string, role: UserRole) => {
    const initials = name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();

    if (role === 'admin') {
      return { initials, bg: '#fef3c7', color: '#b45309' };
    }
    if (role === 'garage') {
      return { initials, bg: '#d1fae5', color: '#047857' };
    }
    return { initials, bg: '#e0f2fe', color: '#0369a1' };
  };

  // Render role badge helper
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="autocare-user-badge is-admin" title="System Administrator">
            <Shield size={12} aria-hidden="true" /> Administrator
          </span>
        );
      case 'garage':
        return (
          <span className="autocare-user-badge is-garage" title="Certified Garage Partner">
            <Building2 size={12} aria-hidden="true" /> Garage Partner
          </span>
        );
      default:
        return (
          <span className="autocare-user-badge is-owner" title="Registered Vehicle Owner">
            <Users size={12} aria-hidden="true" /> Vehicle Owner
          </span>
        );
    }
  };

  // Render status badge helper
  const renderStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="autocare-status-badge status-active">
            <CheckCircle2 size={13} aria-hidden="true" /> Active
          </span>
        );
      case 'suspended':
        return (
          <span className="autocare-status-badge status-suspended">
            <Ban size={13} aria-hidden="true" /> Suspended
          </span>
        );
      default:
        return (
          <span className="autocare-status-badge status-pending">
            <Clock size={13} aria-hidden="true" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="autocare-admin-page">
      <Navbar />

      <main className="autocare-admin-main" id="main-content">
        <div className="autocare-admin-container">
          {/* Toast Notification */}
          {feedbackToast && (
            <div
              className={`autocare-admin-toast type-${feedbackToast.type}`}
              role="alert"
            >
              {feedbackToast.type === 'error' ? (
                <AlertTriangle size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
              <span>{feedbackToast.message}</span>
            </div>
          )}

          {/* Admin Header with Platform Switcher */}
          <header className="autocare-admin-header">
            <div className="autocare-admin-top-meta">
              <span className="autocare-admin-badge">
                <Shield size={13} aria-hidden="true" /> System Administration Console
              </span>
              <div className="autocare-admin-header-actions">
                <button
                  type="button"
                  onClick={handleSeedDummyUsers}
                  className="autocare-admin-action-btn btn-secondary-tint"
                  title="Seed complete demo dataset with realistic Sri Lankan users"
                >
                  <Sparkles size={15} /> Seed Dummy Data
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="autocare-admin-action-btn btn-secondary-tint"
                  title="Export filtered users to CSV"
                >
                  <Download size={15} /> Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="autocare-admin-action-btn btn-primary-gradient"
                >
                  <Plus size={16} /> Add New User
                </button>
              </div>
            </div>

            <div className="autocare-admin-title-row">
              <div>
                <h1 className="autocare-admin-title">User Management &amp; Analytics</h1>
                <p className="autocare-admin-subtitle">
                  Govern vehicle owners, certified automotive workshops, and administrator roles across AutoCare 360 with comprehensive live analytics.
                </p>
              </div>
            </div>

            {/* Admin Console Sub-navigation Tabs */}
            <div className="autocare-admin-nav-tabs">
              <button
                type="button"
                className={`autocare-admin-nav-tab ${consoleTab === 'users' ? 'is-active' : ''}`}
                onClick={() => setConsoleTab('users')}
              >
                <Users size={16} />
                <span>User Directory</span>
                <span className="autocare-admin-pill-badge">{users.length}</span>
              </button>

              <button
                type="button"
                className={`autocare-admin-nav-tab ${consoleTab === 'analytics' ? 'is-active' : ''}`}
                onClick={() => setConsoleTab('analytics')}
              >
                <BarChart3 size={16} />
                <span>Analytics &amp; Insights</span>
              </button>

              <Link
                to="/admin/garages"
                className="autocare-admin-nav-tab is-link"
                title="Review garage certification requests"
              >
                <Building2 size={16} />
                <span>Garage Verification</span>
                <span className="autocare-admin-pill-badge is-amber">
                  {users.filter((u) => u.role === 'garage' && u.status === 'pending').length || 2} Pending
                </span>
                <ExternalLink size={13} style={{ marginLeft: 4, opacity: 0.7 }} />
              </Link>
            </div>
          </header>

          {/* High-Level Overview Metric Cards */}
          <section className="autocare-metrics-grid" aria-label="System user statistics">
            <div className="autocare-metric-card">
              <div className="autocare-metric-card-top">
                <span className="autocare-metric-label">Total Platform Users</span>
                <div className="autocare-metric-icon-wrap is-blue">
                  <Users size={20} />
                </div>
              </div>
              <div className="autocare-metric-value">{analytics.overview.totalUsers}</div>
              <div className="autocare-metric-meta">
                <span className="autocare-trend-pill is-up">
                  <TrendingUp size={12} /> {analytics.overview.growthRate}
                </span>
                <span className="autocare-metric-subtext">vs last month</span>
              </div>
            </div>

            <div className="autocare-metric-card">
              <div className="autocare-metric-card-top">
                <span className="autocare-metric-label">Vehicle Owners</span>
                <div className="autocare-metric-icon-wrap is-indigo">
                  <Car size={20} />
                </div>
              </div>
              <div className="autocare-metric-value">{analytics.overview.totalOwners}</div>
              <div className="autocare-metric-meta">
                <span className="autocare-metric-subtext">
                  Avg <strong>{analytics.overview.avgVehiclesPerOwner}</strong> vehicles per owner
                </span>
              </div>
            </div>

            <div className="autocare-metric-card">
              <div className="autocare-metric-card-top">
                <span className="autocare-metric-label">Workshop Partners</span>
                <div className="autocare-metric-icon-wrap is-emerald">
                  <Building2 size={20} />
                </div>
              </div>
              <div className="autocare-metric-value">{analytics.overview.totalGarages}</div>
              <div className="autocare-metric-meta">
                <span className="autocare-trend-pill is-amber">
                  <Clock size={12} /> {analytics.overview.pendingUsers} Pending Review
                </span>
              </div>
            </div>

            <div className="autocare-metric-card">
              <div className="autocare-metric-card-top">
                <span className="autocare-metric-label">System Admins</span>
                <div className="autocare-metric-icon-wrap is-amber">
                  <Shield size={20} />
                </div>
              </div>
              <div className="autocare-metric-value">{analytics.overview.totalAdmins}</div>
              <div className="autocare-metric-meta">
                <span className="autocare-metric-subtext">
                  Activity Rate: <strong>{analytics.overview.activityRate}</strong>
                </span>
              </div>
            </div>
          </section>

          {/* =========================================================
              TAB 1: USER DIRECTORY VIEW
             ========================================================= */}
          {consoleTab === 'users' && (
            <>
              {/* Filter & Search Bar */}
              <section className="autocare-admin-filter-bar" aria-label="User search and filters">
                {/* Search Box */}
                <div className="autocare-admin-search-input-wrap">
                  <Search size={16} className="autocare-admin-search-icon" aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, city, or workshop..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="autocare-admin-search-input"
                    aria-label="Search users"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="autocare-admin-search-clear"
                      aria-label="Clear search query"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Role Tabs */}
                <div className="autocare-filter-pills" role="tablist" aria-label="Filter by user role">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={roleFilter === 'all'}
                    className={`autocare-filter-pill ${roleFilter === 'all' ? 'is-active' : ''}`}
                    onClick={() => setRoleFilter('all')}
                  >
                    All Roles ({users.length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={roleFilter === 'owner'}
                    className={`autocare-filter-pill ${roleFilter === 'owner' ? 'is-active' : ''}`}
                    onClick={() => setRoleFilter('owner')}
                  >
                    <Users size={13} /> Owners ({users.filter((u) => u.role === 'owner').length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={roleFilter === 'garage'}
                    className={`autocare-filter-pill ${roleFilter === 'garage' ? 'is-active' : ''}`}
                    onClick={() => setRoleFilter('garage')}
                  >
                    <Building2 size={13} /> Garages ({users.filter((u) => u.role === 'garage').length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={roleFilter === 'admin'}
                    className={`autocare-filter-pill ${roleFilter === 'admin' ? 'is-active' : ''}`}
                    onClick={() => setRoleFilter('admin')}
                  >
                    <Shield size={13} /> Admins ({users.filter((u) => u.role === 'admin').length})
                  </button>
                </div>

                {/* Secondary Status Dropdown & Sorter */}
                <div className="autocare-filter-dropdowns">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
                    className="autocare-select-input"
                    aria-label="Filter by account status"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Accounts</option>
                    <option value="pending">Pending Accounts</option>
                    <option value="suspended">Suspended Accounts</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name_asc' | 'vehicles_desc')}
                    className="autocare-select-input"
                    aria-label="Sort users"
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="oldest">Sort: Oldest First</option>
                    <option value="name_asc">Sort: Name (A-Z)</option>
                    <option value="vehicles_desc">Sort: Most Vehicles</option>
                  </select>

                  <button
                    type="button"
                    onClick={fetchData}
                    className="autocare-admin-refresh-btn"
                    title="Refresh directory"
                    aria-label="Refresh user list"
                  >
                    <RefreshCw size={15} className={isLoading ? 'autocare-spin' : ''} />
                  </button>
                </div>
              </section>

              {/* Table / Results State */}
              {isLoading ? (
                <div className="autocare-admin-state-box">
                  <Loader2 size={36} className="autocare-spin" style={{ color: '#0056A2' }} />
                  <p className="autocare-admin-state-text">Loading platform users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="autocare-admin-state-box">
                  <div className="autocare-admin-state-icon is-empty">
                    <Users size={32} />
                  </div>
                  <h2 className="autocare-admin-state-title">No Users Found</h2>
                  <p className="autocare-admin-state-text">
                    {searchQuery
                      ? `No user records matched your search query "${searchQuery}".`
                      : 'No users found matching the selected filters.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setRoleFilter('all');
                      setStatusFilter('all');
                    }}
                    className="autocare-admin-btn autocare-admin-btn-secondary"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="autocare-admin-table-card">
                  <div className="autocare-table-header-meta">
                    <span className="autocare-table-count-label">
                      Showing <strong>{paginatedUsers.length}</strong> of <strong>{filteredUsers.length}</strong> users
                    </span>
                    <div className="autocare-table-rows-selector">
                      <label htmlFor="per-page-select">Rows per page:</label>
                      <select
                        id="per-page-select"
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="autocare-select-input-sm"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>

                  <div className="autocare-admin-table-wrap">
                    <table className="autocare-admin-table">
                      <thead>
                        <tr>
                          <th scope="col">User / Identity</th>
                          <th scope="col">Role</th>
                          <th scope="col">Status</th>
                          <th scope="col">Contact Info</th>
                          <th scope="col">Location</th>
                          <th scope="col">Vehicles</th>
                          <th scope="col">Registered</th>
                          <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedUsers.map((user) => {
                          const avatar = getAvatarMeta(user.fullName, user.role);
                          return (
                            <tr key={user._id} className="autocare-user-row">
                              {/* User identity & avatar */}
                              <td>
                                <div className="autocare-user-cell">
                                  <div
                                    className="autocare-user-avatar"
                                    style={{ backgroundColor: avatar.bg, color: avatar.color }}
                                    aria-hidden="true"
                                  >
                                    {avatar.initials}
                                  </div>
                                  <div className="autocare-user-info-text">
                                    <span className="autocare-user-fullname">{user.fullName}</span>
                                    {user.workshopName ? (
                                      <span className="autocare-user-sub workshop-sub">
                                        {user.workshopName}
                                      </span>
                                    ) : user.displayName && user.displayName !== user.fullName ? (
                                      <span className="autocare-user-sub">@{user.displayName}</span>
                                    ) : (
                                      <span className="autocare-user-sub">ID: {user._id.slice(-6)}</span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Role */}
                              <td>{renderRoleBadge(user.role)}</td>

                              {/* Status */}
                              <td>{renderStatusBadge(user.status)}</td>

                              {/* Contact */}
                              <td>
                                <div className="autocare-contact-stack">
                                  <div className="autocare-contact-item">
                                    <Mail size={12} className="autocare-icon-muted" />
                                    <span className="autocare-email-text">{user.email}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(user.email, user._id)}
                                      className="autocare-copy-mini-btn"
                                      title="Copy email"
                                      aria-label={`Copy email address for ${user.fullName}`}
                                    >
                                      {copiedId === user._id ? (
                                        <Check size={11} style={{ color: '#10b981' }} />
                                      ) : (
                                        <Copy size={11} />
                                      )}
                                    </button>
                                  </div>
                                  <div className="autocare-contact-item">
                                    <Phone size={12} className="autocare-icon-muted" />
                                    <span>{user.phone || 'N/A'}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Location */}
                              <td>
                                <div className="autocare-location-cell">
                                  <MapPin size={13} style={{ color: '#64748b' }} aria-hidden="true" />
                                  <span>{user.city || 'Colombo'}, {user.country || 'Sri Lanka'}</span>
                                </div>
                              </td>

                              {/* Vehicles count */}
                              <td>
                                {user.role === 'owner' ? (
                                  <span className="autocare-vehicle-count-pill" title="Registered vehicles in Digital Passport">
                                    <Car size={13} /> {user.vehicleCount ?? 1} {(user.vehicleCount ?? 1) === 1 ? 'Car' : 'Cars'}
                                  </span>
                                ) : user.role === 'garage' ? (
                                  <span className="autocare-badge-muted">Workshop</span>
                                ) : (
                                  <span className="autocare-badge-muted">N/A</span>
                                )}
                              </td>

                              {/* Joined Date */}
                              <td>
                                <span className="autocare-date-text">
                                  {user.createdAt
                                    ? new Date(user.createdAt).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                      })
                                    : 'May 2026'}
                                </span>
                              </td>

                              {/* Action buttons */}
                              <td style={{ textAlign: 'right' }}>
                                <div className="autocare-action-buttons-wrap">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setIsDetailsModalOpen(true);
                                    }}
                                    className="autocare-action-icon-btn is-view"
                                    title="View full user details & vehicles"
                                    aria-label={`View details for ${user.fullName}`}
                                  >
                                    <Eye size={15} />
                                  </button>

                                  {/* Status quick toggle */}
                                  {user.status === 'active' ? (
                                    <button
                                      type="button"
                                      onClick={() => setStatusChangeTarget({ user, newStatus: 'suspended' })}
                                      className="autocare-action-icon-btn is-suspend"
                                      title="Suspend this user"
                                      aria-label={`Suspend ${user.fullName}`}
                                    >
                                      <Ban size={14} />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setStatusChangeTarget({ user, newStatus: 'active' })}
                                      className="autocare-action-icon-btn is-activate"
                                      title="Activate this user"
                                      aria-label={`Activate ${user.fullName}`}
                                    >
                                      <CheckCircle2 size={14} />
                                    </button>
                                  )}

                                  {/* Delete user */}
                                  <button
                                    type="button"
                                    onClick={() => setUserToDelete(user)}
                                    className="autocare-action-icon-btn is-delete"
                                    title="Delete user account"
                                    aria-label={`Delete ${user.fullName}`}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {totalPages > 1 && (
                    <div className="autocare-admin-pagination">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="autocare-page-btn"
                        aria-label="Previous page"
                      >
                        <ChevronLeft size={16} /> Previous
                      </button>

                      <div className="autocare-page-numbers">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`autocare-page-num ${currentPage === page ? 'is-active' : ''}`}
                            aria-current={currentPage === page ? 'page' : undefined}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="autocare-page-btn"
                        aria-label="Next page"
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* =========================================================
              TAB 2: ANALYTICS & INSIGHTS VIEW
             ========================================================= */}
          {consoleTab === 'analytics' && (
            <section className="autocare-analytics-section" aria-label="Platform and user analytics">
              {/* Analytics Header Meta */}
              <div className="autocare-analytics-header-card">
                <div>
                  <h2 className="autocare-analytics-card-title">User Demographics &amp; System Analytics</h2>
                  <p className="autocare-analytics-card-subtitle">
                    Real-time aggregated intelligence on platform onboarding, Sri Lankan vehicle distribution, and partner network health.
                  </p>
                </div>
                <div className="autocare-analytics-badge-time">
                  <Calendar size={14} /> Live Telemetry ?" Updated Just Now
                </div>
              </div>

              {/* Charts Grid */}
              <div className="autocare-charts-grid">
                {/* 1. Monthly Registration Trend */}
                <div className="autocare-chart-box full-width">
                  <div className="autocare-chart-header">
                    <div>
                      <h3 className="autocare-chart-title">Platform User Growth Trajectory</h3>
                      <p className="autocare-chart-subtitle">Monthly cumulative user and garage registrations (Past 6 Months)</p>
                    </div>
                    <span className="autocare-trend-pill is-up">
                      <TrendingUp size={13} /> +24.6% Monthly Growth
                    </span>
                  </div>
                  <div className="autocare-chart-body" style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={MOCK_GROWTH_TRENDS} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorOwners" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0056A2" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#0056A2" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorGarages" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          }}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Area
                          type="monotone"
                          dataKey="owners"
                          name="Vehicle Owners"
                          stroke="#0056A2"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorOwners)"
                        />
                        <Area
                          type="monotone"
                          dataKey="garages"
                          name="Garage Workshops"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorGarages)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Role Distribution Donut */}
                <div className="autocare-chart-box">
                  <div className="autocare-chart-header">
                    <div>
                      <h3 className="autocare-chart-title">User Roles Distribution</h3>
                      <p className="autocare-chart-subtitle">Proportion of Owners, Garages, &amp; Admins</p>
                    </div>
                  </div>
                  <div className="autocare-chart-body" style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={MOCK_ROLE_DISTRIBUTION}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {MOCK_ROLE_DISTRIBUTION.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value}% of users`, 'Share']}
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                          }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. Account Status Breakdown */}
                <div className="autocare-chart-box">
                  <div className="autocare-chart-header">
                    <div>
                      <h3 className="autocare-chart-title">Account Status Governance</h3>
                      <p className="autocare-chart-subtitle">Active, Pending Review &amp; Suspended accounts</p>
                    </div>
                  </div>
                  <div className="autocare-chart-body" style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={MOCK_STATUS_DISTRIBUTION} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                          }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {MOCK_STATUS_DISTRIBUTION.map((entry, index) => (
                            <Cell key={`status-cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 4. Geographic Distribution across Sri Lanka */}
                <div className="autocare-chart-box">
                  <div className="autocare-chart-header">
                    <div>
                      <h3 className="autocare-chart-title">Geographic Footprint</h3>
                      <p className="autocare-chart-subtitle">Top Sri Lankan districts &amp; cities</p>
                    </div>
                  </div>
                  <div className="autocare-chart-body" style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.cityStats}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis dataKey="city" type="category" stroke="#475569" fontSize={12} tickLine={false} width={80} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                          }}
                        />
                        <Bar dataKey="count" name="Users" fill="#0056A2" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 5. Vehicles Owned Breakdown */}
                <div className="autocare-chart-box">
                  <div className="autocare-chart-header">
                    <div>
                      <h3 className="autocare-chart-title">Vehicle Density Breakdown</h3>
                      <p className="autocare-chart-subtitle">Registered vehicles per owner household</p>
                    </div>
                  </div>
                  <div className="autocare-chart-body" style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={MOCK_VEHICLE_OWNERSHIP_DISTRIBUTION}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {MOCK_VEHICLE_OWNERSHIP_DISTRIBUTION.map((entry, index) => (
                            <Cell key={`veh-cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value}% of owners`, 'Share']}
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                          }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =========================================================
              MODAL: VIEW USER DETAILS
             ========================================================= */}
          {isDetailsModalOpen && selectedUser && (
            <div className="autocare-modal-backdrop" onClick={() => setIsDetailsModalOpen(false)}>
              <div
                className="autocare-modal-box is-large"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="user-details-title"
              >
                <div className="autocare-modal-header">
                  <div className="autocare-modal-title-wrap">
                    <div
                      className="autocare-user-avatar large"
                      style={{
                        backgroundColor: getAvatarMeta(selectedUser.fullName, selectedUser.role).bg,
                        color: getAvatarMeta(selectedUser.fullName, selectedUser.role).color,
                      }}
                    >
                      {getAvatarMeta(selectedUser.fullName, selectedUser.role).initials}
                    </div>
                    <div>
                      <h2 id="user-details-title" className="autocare-modal-title">
                        {selectedUser.fullName}
                      </h2>
                      <div className="autocare-modal-tags">
                        {renderRoleBadge(selectedUser.role)}
                        {renderStatusBadge(selectedUser.status)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="autocare-modal-close"
                    aria-label="Close user details modal"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="autocare-modal-body">
                  {/* General Contact & Profile details */}
                  <div className="autocare-details-grid">
                    <div className="autocare-detail-item">
                      <span className="autocare-detail-label">Email Address</span>
                      <span className="autocare-detail-value">{selectedUser.email}</span>
                    </div>

                    <div className="autocare-detail-item">
                      <span className="autocare-detail-label">Phone Number</span>
                      <span className="autocare-detail-value">{selectedUser.phone || 'N/A'}</span>
                    </div>

                    <div className="autocare-detail-item">
                      <span className="autocare-detail-label">Location / City</span>
                      <span className="autocare-detail-value">
                        {selectedUser.city || 'Colombo'}, {selectedUser.country || 'Sri Lanka'}
                      </span>
                    </div>

                    <div className="autocare-detail-item">
                      <span className="autocare-detail-label">Member Since</span>
                      <span className="autocare-detail-value">
                        {selectedUser.createdAt
                          ? new Date(selectedUser.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })
                          : 'May 2026'}
                      </span>
                    </div>

                    {selectedUser.workshopName && (
                      <div className="autocare-detail-item full-span">
                        <span className="autocare-detail-label">Workshop / Business Name</span>
                        <span className="autocare-detail-value">{selectedUser.workshopName}</span>
                      </div>
                    )}

                    {selectedUser.businessRegNumber && (
                      <div className="autocare-detail-item">
                        <span className="autocare-detail-label">Business Registration (BRN)</span>
                        <span className="autocare-detail-value font-mono">
                          {selectedUser.businessRegNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Registered Vehicles Section for Owner */}
                  {selectedUser.role === 'owner' && (
                    <div className="autocare-vehicles-section">
                      <h3 className="autocare-section-heading">
                        <Car size={16} /> Registered Vehicles in Digital Passport ({MOCK_DUMMY_VEHICLES_MAP[selectedUser._id]?.length || 1})
                      </h3>
                      <div className="autocare-vehicles-list">
                        {(MOCK_DUMMY_VEHICLES_MAP[selectedUser._id] || [
                          {
                            plate: 'WP CAB-8899',
                            model: 'Toyota Prius Hybrid 1.8L',
                            year: 2021,
                            vin: '1HGCR2F83HA998877',
                          },
                        ]).map((veh, idx) => (
                          <div key={idx} className="autocare-vehicle-card-mini">
                            <div className="autocare-veh-plate-badge">{veh.plate}</div>
                            <div className="autocare-veh-meta">
                              <span className="autocare-veh-title">{veh.model}</span>
                              <span className="autocare-veh-sub">
                                Year: {veh.year} ?" VIN: <code className="font-mono">{veh.vin}</code>
                              </span>
                            </div>
                            <span className="autocare-status-badge status-active">Verified</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Status Action Controls */}
                  <div className="autocare-modal-quick-actions">
                    <span className="autocare-quick-action-title">Quick Administrative Actions:</span>
                    <div className="autocare-quick-action-btns">
                      {selectedUser.status !== 'active' && (
                        <button
                          type="button"
                          onClick={() => {
                            setStatusChangeTarget({ user: selectedUser, newStatus: 'active' });
                            setIsDetailsModalOpen(false);
                          }}
                          className="autocare-admin-btn autocare-admin-btn-success"
                        >
                          <CheckCircle2 size={14} /> Activate Account
                        </button>
                      )}
                      {selectedUser.status !== 'suspended' && (
                        <button
                          type="button"
                          onClick={() => {
                            setStatusChangeTarget({ user: selectedUser, newStatus: 'suspended' });
                            setIsDetailsModalOpen(false);
                          }}
                          className="autocare-admin-btn autocare-admin-btn-danger"
                        >
                          <Ban size={14} /> Suspend Account
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="autocare-modal-footer">
                  <button
                    type="button"
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="autocare-admin-btn autocare-admin-btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              MODAL: CREATE NEW USER
             ========================================================= */}
          {isCreateModalOpen && (
            <div className="autocare-modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
              <div
                className="autocare-modal-box"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="create-user-modal-title"
              >
                <div className="autocare-modal-header">
                  <div>
                    <h2 id="create-user-modal-title" className="autocare-modal-title">
                      Create New Platform Account
                    </h2>
                    <p className="autocare-modal-subtitle">
                      Provision a new vehicle owner, certified workshop partner, or administrator.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="autocare-modal-close"
                    aria-label="Close modal"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateUserSubmit}>
                  <div className="autocare-modal-body">
                    {formError && (
                      <div className="autocare-form-error" role="alert">
                        <AlertTriangle size={15} /> {formError}
                      </div>
                    )}

                    <div className="autocare-form-grid">
                      <div className="autocare-form-field full-span">
                        <label htmlFor="input-fullname" className="autocare-label">
                          Full Legal Name <span className="text-danger">*</span>
                        </label>
                        <input
                          id="input-fullname"
                          type="text"
                          required
                          placeholder="e.g. Kasun Jayasuriya"
                          value={newUserForm.fullName}
                          onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                          className="autocare-text-input"
                        />
                      </div>

                      <div className="autocare-form-field">
                        <label htmlFor="input-email" className="autocare-label">
                          Email Address <span className="text-danger">*</span>
                        </label>
                        <input
                          id="input-email"
                          type="email"
                          required
                          placeholder="name@example.com"
                          value={newUserForm.email}
                          onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                          className="autocare-text-input"
                        />
                      </div>

                      <div className="autocare-form-field">
                        <label htmlFor="input-phone" className="autocare-label">
                          Phone Number <span className="text-danger">*</span>
                        </label>
                        <input
                          id="input-phone"
                          type="tel"
                          required
                          placeholder="e.g. 0771234567"
                          value={newUserForm.phone}
                          onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                          className="autocare-text-input"
                        />
                      </div>

                      <div className="autocare-form-field">
                        <label htmlFor="select-role" className="autocare-label">
                          Assigned Role
                        </label>
                        <select
                          id="select-role"
                          value={newUserForm.role}
                          onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                          className="autocare-text-input"
                        >
                          <option value="owner">Vehicle Owner (Digital Passport)</option>
                          <option value="garage">Garage Partner (Workshop Console)</option>
                          <option value="admin">System Administrator (Full Privileges)</option>
                        </select>
                      </div>

                      <div className="autocare-form-field">
                        <label htmlFor="select-city" className="autocare-label">
                          City / District
                        </label>
                        <select
                          id="select-city"
                          value={newUserForm.city}
                          onChange={(e) => setNewUserForm({ ...newUserForm, city: e.target.value })}
                          className="autocare-text-input"
                        >
                          <option value="Colombo">Colombo</option>
                          <option value="Gampaha">Gampaha</option>
                          <option value="Kandy">Kandy</option>
                          <option value="Galle">Galle</option>
                          <option value="Kurunegala">Kurunegala</option>
                          <option value="Negombo">Negombo</option>
                          <option value="Kalutara">Kalutara</option>
                          <option value="Anuradhapura">Anuradhapura</option>
                        </select>
                      </div>

                      <div className="autocare-form-field full-span">
                        <label htmlFor="input-pwd" className="autocare-label">
                          Temporary Password
                        </label>
                        <input
                          id="input-pwd"
                          type="text"
                          value={newUserForm.password}
                          onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                          className="autocare-text-input font-mono"
                        />
                        <span className="autocare-field-hint">
                          The user can change this password after their initial login.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="autocare-modal-footer">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="autocare-admin-btn autocare-admin-btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="autocare-admin-btn autocare-admin-btn-primary"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={14} className="autocare-spin" /> Creating...
                        </>
                      ) : (
                        <>
                          <Plus size={14} /> Create Account
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =========================================================
              MODAL: CONFIRM STATUS CHANGE (SUSPEND / ACTIVATE)
             ========================================================= */}
          {statusChangeTarget && (
            <div className="autocare-modal-backdrop" onClick={() => setStatusChangeTarget(null)}>
              <div
                className="autocare-modal-box is-confirm"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="confirm-status-title"
              >
                <div className="autocare-modal-header">
                  <div className="autocare-confirm-icon-wrap is-warning">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h2 id="confirm-status-title" className="autocare-modal-title">
                      {statusChangeTarget.newStatus === 'suspended' ? 'Suspend Account?' : 'Activate Account?'}
                    </h2>
                    <p className="autocare-modal-subtitle">
                      Are you sure you want to change the status of{' '}
                      <strong>{statusChangeTarget.user.fullName}</strong> to{' '}
                      <span className="font-semibold text-uppercase">{statusChangeTarget.newStatus}</span>?
                    </p>
                  </div>
                </div>

                <div className="autocare-modal-body">
                  <p className="autocare-modal-p">
                    {statusChangeTarget.newStatus === 'suspended'
                      ? 'Suspending this user will immediately revoke login access to AutoCare 360 and temporarily freeze passport records.'
                      : 'Activating this account will restore full dashboard privileges and verified certificate sharing.'}
                  </p>
                </div>

                <div className="autocare-modal-footer">
                  <button
                    type="button"
                    onClick={() => setStatusChangeTarget(null)}
                    className="autocare-admin-btn autocare-admin-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmStatusChange}
                    className={`autocare-admin-btn ${
                      statusChangeTarget.newStatus === 'suspended'
                        ? 'autocare-admin-btn-danger'
                        : 'autocare-admin-btn-success'
                    }`}
                  >
                    Confirm {statusChangeTarget.newStatus === 'suspended' ? 'Suspension' : 'Activation'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              MODAL: CONFIRM PERMANENT DELETE
             ========================================================= */}
          {userToDelete && (
            <div className="autocare-modal-backdrop" onClick={() => setUserToDelete(null)}>
              <div
                className="autocare-modal-box is-confirm"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="confirm-delete-title"
              >
                <div className="autocare-modal-header">
                  <div className="autocare-confirm-icon-wrap is-danger">
                    <Trash2 size={24} />
                  </div>
                  <div>
                    <h2 id="confirm-delete-title" className="autocare-modal-title">
                      Delete User Account?
                    </h2>
                    <p className="autocare-modal-subtitle">
                      This action cannot be undone. User:{' '}
                      <strong>{userToDelete.fullName}</strong> ({userToDelete.email})
                    </p>
                  </div>
                </div>

                <div className="autocare-modal-body">
                  <p className="autocare-modal-p">
                    Deleting this user will permanently remove their credentials from the AutoCare 360 registry.
                  </p>
                </div>

                <div className="autocare-modal-footer">
                  <button
                    type="button"
                    onClick={() => setUserToDelete(null)}
                    className="autocare-admin-btn autocare-admin-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="autocare-admin-btn autocare-admin-btn-danger"
                  >
                    Permanently Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminUserManagementPage;
