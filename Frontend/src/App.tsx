import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import HomePage from './pages/home/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import VerifyCodePage from './pages/auth/VerifyCodePage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import MyVehiclesPage from './pages/vehicles/MyVehiclesPage';
import AddVehiclePage from './pages/vehicles/AddVehiclePage';
import ViewVehiclePage from './pages/vehicles/ViewVehiclePage';
import TransferVehiclePage from './pages/vehicles/TransferVehiclePage';
import VehicleDocumentsPage from './pages/vehicles/VehicleDocumentsPage';
import ProfilePage from './pages/profile/ProfilePage';
import EditProfilePage from './pages/profile/EditProfilePage';
import ServiceHistoryPage from './pages/services/ServiceHistoryPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import CreateNotificationPage from './pages/notifications/CreateNotificationPage';
import ExpenseTrackingPage from './pages/expenses/ExpenseTrackingPage';
import SecureLinkSharingPage from './pages/sharing/SecureLinkSharingPage';
import QRCodeSharingPage from './pages/sharing/QRCodeSharingPage';
import AccessPermissionManagementPage from './pages/sharing/AccessPermissionManagementPage';
import ConfigureAccessPermissionsPage from './pages/sharing/ConfigureAccessPermissionsPage';
import BuyerSharedRecordViewPage from './pages/sharing/BuyerSharedRecordViewPage';

// Verified Garage Service Management — BR-03
import GarageProtectedRoute from './components/auth/GarageProtectedRoute';
import GarageVerificationPendingPage from './pages/garage/GarageVerificationPendingPage';
import GarageDashboardPage from './pages/garage/GarageDashboardPage';
import GarageVehiclesPage from './pages/garage/GarageVehiclesPage';
import GarageVehicleDetailsPage from './pages/garage/GarageVehicleDetailsPage';
import GarageServiceRecordsPage from './pages/garage/GarageServiceRecordsPage';
import GarageDocumentsPage from './pages/garage/GarageDocumentsPage';
import GarageSharingPage from './pages/garage/GarageSharingPage';
import GarageAuditTrailPage from './pages/garage/GarageAuditTrailPage';
import AddMaintenanceRecordPage from './pages/garage/AddMaintenanceRecordPage';
import GarageQuotationsListPage from './pages/garage/GarageQuotationsListPage';
import GarageQuotationPage from './pages/garage/GarageQuotationPage';
import GarageInvoicesListPage from './pages/garage/GarageInvoicesListPage';
import GarageInvoicePage from './pages/garage/GarageInvoicePage';
import GarageNotificationsPage from './pages/garage/GarageNotificationsPage';
import GarageProfilePage from './pages/garage/GarageProfilePage';

// Admin Garage Verification — FR-04
import AdminProtectedRoute from './components/auth/AdminProtectedRoute';
import AdminGarageVerificationPage from './pages/admin/AdminGarageVerificationPage';
import AdminGarageDetailsPage from './pages/admin/AdminGarageDetailsPage';
import './App.css';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Core Landing & Overview */}
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          {/* Authentication & Password Recovery Flow */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-code" element={<VerifyCodePage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Vehicle Digital Passport — Phase 2E View Flow */}
          <Route path="/vehicles" element={<MyVehiclesPage />} />
          <Route path="/vehicles/:id" element={<ViewVehiclePage />} />
          <Route path="/vehicles/:id/transfer" element={<TransferVehiclePage />} />
          <Route path="/vehicles/:id/documents" element={<VehicleDocumentsPage />} />
          <Route path="/vehicles/add" element={<AddVehiclePage />} />

          {/* Maintenance & Service Records History */}
          <Route path="/service-history" element={<ServiceHistoryPage />} />
          <Route path="/services" element={<ServiceHistoryPage />} />

          {/* Notifications */}
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/notifications/create" element={<CreateNotificationPage />} />

          {/* Expense Tracking */}
          <Route path="/expenses" element={<ExpenseTrackingPage />} />

          {/* Secure Link Sharing — BR-05 */}
          <Route path="/sharing/secure-link" element={<SecureLinkSharingPage />} />

          {/* QR Code Sharing — BR-06 */}
          <Route path="/sharing/qr" element={<QRCodeSharingPage />} />

          {/* Access Permission Management — BR-06 */}
          <Route path="/sharing/permissions" element={<AccessPermissionManagementPage />} />

          {/* Data Protection / Configure Access Permissions */}
          <Route path="/sharing/protection" element={<ConfigureAccessPermissionsPage />} />

          {/* Buyer / Public Shared Record View — Protected Passports & Verification */}
          <Route path="/buyer-qr" element={<BuyerSharedRecordViewPage />} />
          <Route path="/shared/vehicle/:token" element={<BuyerSharedRecordViewPage />} />

          {/* Garage Partner Verification Pending (Publicly accessible post-register) */}
          <Route path="/garage/verification-pending" element={<GarageVerificationPendingPage />} />

          {/* Verified Garage Service Management — BR-03 (Protected Routes) */}
          <Route
            path="/garage/dashboard"
            element={
              <GarageProtectedRoute>
                <GarageDashboardPage />
              </GarageProtectedRoute>
            }
          />
          <Route
            path="/garage/vehicles"
            element={
              <GarageProtectedRoute>
                <GarageVehiclesPage />
              </GarageProtectedRoute>
            }
          />
          <Route
            path="/garage/vehicles/:id"
            element={
              <GarageProtectedRoute>
                <GarageVehicleDetailsPage />
              </GarageProtectedRoute>
            }
          />
          <Route
            path="/garage/service-records"
            element={
              <GarageProtectedRoute>
                <GarageServiceRecordsPage />
              </GarageProtectedRoute>
            }
          />
          <Route
            path="/garage/maintenance/new"
            element={
              <GarageProtectedRoute>
                <AddMaintenanceRecordPage />
              </GarageProtectedRoute>
            }
          />
          <Route
            path="/garage/services/new"
            element={<Navigate to="/garage/maintenance/new" replace />}
          />
          <Route
            path="/garage/quotations"
            element={
              <GarageProtectedRoute>
                <GarageQuotationsListPage />
              </GarageProtectedRoute>
            }
          />
          <Route
            path="/garage/quotation/new"
            element={
              <GarageProtectedRoute>
                <GarageQuotationPage />
              </GarageProtectedRoute>
            }
          />
          <Route
            path="/garage/invoices"
            element={
              <GarageProtectedRoute>
                <GarageInvoicesListPage />
              </GarageProtectedRoute>
            }
          />
          <Route
            path="/garage/invoice/new"
            element={
              <GarageProtectedRoute>
                <GarageInvoicePage />
              </GarageProtectedRoute>
            }
          />
          <Route
            path="/garage/notifications"
            element={
              <GarageProtectedRoute>
                <GarageNotificationsPage />
              </GarageProtectedRoute>
            }
          />
          <Route
            path="/garage/documents"
            element={
              <GarageProtectedRoute>
                <GarageDocumentsPage />
              </GarageProtectedRoute>
            }
          />
          <Route
            path="/garage/sharing"
            element={
              <GarageProtectedRoute>
                <GarageSharingPage />
              </GarageProtectedRoute>
            }
          />
          <Route
            path="/garage/audit"
            element={
              <GarageProtectedRoute>
                <GarageAuditTrailPage />
              </GarageProtectedRoute>
            }
          />
          <Route
            path="/garage/profile"
            element={
              <GarageProtectedRoute>
                <GarageProfilePage />
              </GarageProtectedRoute>
            }
          />
          <Route path="/garage" element={<Navigate to="/garage/dashboard" replace />} />

          {/* Admin Minimal Module — Garage Verification Only */}
          <Route
            path="/admin/garages"
            element={
              <AdminProtectedRoute>
                <AdminGarageVerificationPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/garages/:id"
            element={
              <AdminProtectedRoute>
                <AdminGarageDetailsPage />
              </AdminProtectedRoute>
            }
          />
          <Route path="/admin" element={<Navigate to="/admin/garages" replace />} />

          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
