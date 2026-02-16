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

// Audit
import { AuditLog } from './components/audit';

// Constants
import { ROLES } from './utils/constants';

// Import Tailwind CSS
import './index.css';

/**
 * Main App Component
 */
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

                      {/* Approval Dashboard - Accounts and Admin */}
                      <Route
                        path="/approvals"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN]}>
                            <ApprovalDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Module Routes - Accounts and Admin */}
                      <Route
                        path="/transport-bills"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN]}>
                            <TransportList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/general-bills"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN]}>
                            <GeneralBillsList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/packing-materials"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN]}>
                            <PackingMaterialsList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/petty-cash"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN]}>
                            <PettyCashList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/happy-card"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN]}>
                            <HappyCardList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/refunds"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN]}>
                            <RefundsList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/drive-track"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN]}>
                            <DriveTrackList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/reviews"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN]}>
                            <ReviewsList />
                          </ProtectedRoute>
                        }
                      />

                      {/* Audit Log - Accounts and Admin */}
                      <Route
                        path="/audit"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ACCOUNTS, ROLES.ADMIN]}>
                            <AuditLog />
                          </ProtectedRoute>
                        }
                      />

                      {/* Admin Dashboard - Admin only */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
                            <AdminDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Catch all - redirect to dashboard */}
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
