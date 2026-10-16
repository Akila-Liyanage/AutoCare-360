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
