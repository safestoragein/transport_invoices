import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Alert } from '../common';
import { ROLES } from '../../utils/constants';

/**
 * LoginForm component - Secure login with hashed credentials
 */
const LoginForm = () => {
  const { login, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);

    const result = login(username, password);

    if (!result.success) {
      setLocalError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-8 py-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-xl mx-auto flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Accounts Management</h1>
            <p className="text-white/70 text-sm mt-1">Sign in to your account</p>
          </div>

          {/* Form */}
          <div className="p-8">
            {(localError || error) && (
              <Alert variant="danger" className="mb-6">
                {localError || error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                className="py-3"
              >
                Sign In
              </Button>
            </form>

            {/* Credentials section removed */}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/70 text-sm mt-6">
          Transport Invoices & Bills Management System
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
