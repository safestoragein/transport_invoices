import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { RoleBadge } from '../common/Badge';
import Button from '../common/Button';

/**
 * Header component - Logo, user info, logout
 */
const Header = ({ className = '' }) => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header
      className={`
        bg-gradient-to-r from-primary-600 to-primary-500
        shadow-nav
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Accounts Management
              </h1>
              <p className="text-xs text-white/70 hidden sm:block">
                Transport Invoices & Bills
              </p>
            </div>
          </div>

          {/* User Info & Actions */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {user.displayName || user.username}
                  </p>
                  <div className="mt-0.5">
                    <RoleBadge role={user.role} size="sm" />
                  </div>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {(user.displayName || user.username).charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Mobile User Icon */}
              <div className="sm:hidden w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {(user.displayName || user.username).charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-white hover:bg-white/10"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                }
              >
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
