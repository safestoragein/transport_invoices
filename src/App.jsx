import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { FilterProvider } from './contexts/FilterContext';
import { AuditProvider } from './contexts/AuditContext';
import { DataProvider } from './contexts/DataContext';

// Layout
import { MainLayout } from './components/layout';

// Auth
import { ProtectedRoute } from './components/auth';

// Dashboards
import { WeeklySummary, ApprovalDashboard, AdminDashboard, CalendarView } from './components/dashboard';

// Modules
import { TransportList } from './components/modules/transport';
import { GeneralBillsList } from './components/modules/general';
import {
  PackingMaterialsList,
  PettyCashList,
  HappyCardList,
  RefundsList,
  DriveTrackList,
  ReviewsList,
} from './components/modules/ModuleList';

// New Pages
import InvoiceDetail from './components/modules/InvoiceDetail';
import VendorLedger from './components/modules/VendorLedger';
import Reports from './components/modules/Reports';

// Audit
import { AuditLog } from './components/audit';

// Constants
import { ROLES } from './utils/constants';

// Import Tailwind CSS
import './index.css';

function App() {
  return (
    <Router basename="/">
      <AuthProvider>
        <ToastProvider>
          <AuditProvider>
            <FilterProvider>
              <DataProvider>
                <ProtectedRoute>
                  <MainLayout>
                    <Routes>
                      {/* Default redirect */}
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />

                      {/* Dashboard - Available to all */}
                      <Route path="/dashboard" element={<WeeklySummary />} />
                      <Route path="/calendar" element={<CalendarView />} />

                      {/* Approval Dashboard */}
                      <Route
                        path="/approvals"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER]}>
                            <ApprovalDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Module Routes */}
                      <Route
                        path="/transport-bills"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER]}>
                            <TransportList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/general-bills"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER]}>
                            <GeneralBillsList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/packing-materials"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER]}>
                            <PackingMaterialsList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/petty-cash"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER]}>
                            <PettyCashList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/happy-card"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER]}>
                            <HappyCardList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/refunds"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER]}>
                            <RefundsList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/drive-track"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER]}>
                            <DriveTrackList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/reviews"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER]}>
                            <ReviewsList />
                          </ProtectedRoute>
                        }
                      />

                      {/* Invoice Detail Page */}
                      <Route
                        path="/invoice/:id"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER, ROLES.VIEWER]}>
                            <InvoiceDetail />
                          </ProtectedRoute>
                        }
                      />

                      {/* Vendor Ledger */}
                      <Route
                        path="/vendor-ledger"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER]}>
                            <VendorLedger />
                          </ProtectedRoute>
                        }
                      />

                      {/* Reports */}
                      <Route
                        path="/reports"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER]}>
                            <Reports />
                          </ProtectedRoute>
                        }
                      />

                      {/* Audit Log */}
                      <Route
                        path="/audit"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER]}>
                            <AuditLog />
                          </ProtectedRoute>
                        }
                      />

                      {/* Admin Dashboard */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.IDFC_APPROVER]}>
                            <AdminDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Catch all */}
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </MainLayout>
                </ProtectedRoute>
              </DataProvider>
            </FilterProvider>
          </AuditProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
