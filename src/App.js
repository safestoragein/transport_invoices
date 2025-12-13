import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TeamPortal from './components/TeamPortal';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState(null);

  // Shared state for invoices
  const [invoices, setInvoices] = useState([]);

  const addInvoice = (newInvoice) => {
    const invoice = {
      ...newInvoice,
      id: Date.now(),
      status: 'pending',
      submittedAt: new Date().toISOString()
    };
    setInvoices([...invoices, invoice]);
  };

  const updateInvoiceStatus = (id, status) => {
    setInvoices(invoices.map(inv =>
      inv.id === id ? { ...inv, status } : inv
    ));
  };

  const updateInvoice = (id, updatedData) => {
    setInvoices(invoices.map(inv =>
      inv.id === id ? { ...inv, ...updatedData } : inv
    ));
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Show login page if not authenticated
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <nav className="navbar">
        <h1>Transport Invoices</h1>
        <div className="nav-links">
          <span className="user-info">
            Welcome, {user.username} ({user.role})
          </span>
          <button className="btn btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="container">
        <Routes>
          {user.role === 'admin' ? (
            <>
              <Route
                path="/"
                element={<Navigate to="/admin" replace />}
              />
              <Route
                path="/admin"
                element={
                  <AdminDashboard
                    invoices={invoices}
                    updateInvoiceStatus={updateInvoiceStatus}
                    updateInvoice={updateInvoice}
                  />
                }
              />
            </>
          ) : (
            <>
              <Route
                path="/"
                element={
                  <TeamPortal
                    invoices={invoices}
                    addInvoice={addInvoice}
                    updateInvoice={updateInvoice}
                  />
                }
              />
              <Route
                path="/admin"
                element={<Navigate to="/" replace />}
              />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
