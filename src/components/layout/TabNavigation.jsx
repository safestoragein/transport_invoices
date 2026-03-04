import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MODULE_CONFIG, ROLES } from '../../utils/constants';

/**
 * TabNavigation component - Module navigation tabs
 */
const TabNavigation = ({ className = '' }) => {
  const { hasRole } = useAuth();
  const location = useLocation();

  // Define navigation items based on role
  const getNavItems = () => {
    const items = [];

    // Dashboard - Available to all
    items.push({
      path: '/dashboard',
      label: 'Dashboard',
      icon: '📊',
      roles: [ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.VIEWER, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER],
    });

    // Calendar - Available to all
    items.push({
      path: '/calendar',
      label: 'Calendar',
      icon: '📅',
      roles: [ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.VIEWER, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER],
    });

    // Approvals - Accounts, Admin, and Approvers
    items.push({
      path: '/approvals',
      label: hasRole(ROLES.ADMIN) ? 'Approvals' :
             hasRole([ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER]) ? 'Approvals' :
             'Process Payments',
      icon: '🔍',
      roles: [ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER],
      highlight: true,
    });

    // Module entry forms - Accounts, Admin, and Approvers (view-only for approvers)
    if (hasRole([ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER])) {
      Object.values(MODULE_CONFIG).forEach(module => {
        items.push({
          path: module.path,
          label: module.label,
          icon: module.icon,
          roles: [ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER],
        });
      });
    }

    // Admin Panel - Admin and IDFC Approver (Ramesh)
    items.push({
      path: '/admin',
      label: 'System Admin',
      icon: '⚙️',
      roles: [ROLES.ADMIN, ROLES.IDFC_APPROVER],
      highlight: true,
    });

    // Audit Log - Accounts, Admin, and Approvers
    items.push({
      path: '/audit',
      label: 'Audit Log',
      icon: '📋',
      roles: [ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER],
    });

    return items.filter(item => item.roles.some(role => hasRole(role)));
  };

  const navItems = getNavItems();

  return (
    <nav className={`bg-gray-50 border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto scrollbar-hide -mb-px">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
                           (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive: linkActive }) => `
                  flex items-center gap-2 px-4 py-3 min-w-max
                  text-sm font-medium whitespace-nowrap
                  border-b-2 transition-colors
                  ${isActive || linkActive
                    ? 'border-primary-600 text-primary-600 bg-white'
                    : 'border-transparent text-gray-600 hover:text-primary-600 hover:border-gray-300'
                  }
                  ${item.highlight ? 'bg-yellow-50/50' : ''}
                `}
              >
                <span>{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

/**
 * MobileTabBar - Bottom navigation for mobile
 */
export const MobileTabBar = ({ className = '' }) => {
  const { hasRole } = useAuth();
  const location = useLocation();

  const mobileItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: [ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.VIEWER, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER] },
    { path: '/approvals', label: 'Approvals', icon: '🔍', roles: [ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER] },
    { path: '/transport-bills', label: 'Transport', icon: '🚚', roles: [ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER] },
    { path: '/general-bills', label: 'General', icon: '📄', roles: [ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER] },
    { path: '/admin', label: 'Admin', icon: '⚙️', roles: [ROLES.ADMIN, ROLES.IDFC_APPROVER] },
  ].filter(item => item.roles.some(role => hasRole(role)));

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 sm:hidden ${className}`}>
      <div className="flex justify-around py-2">
        {mobileItems.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.path ||
                         (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center px-3 py-1
                ${isActive ? 'text-primary-600' : 'text-gray-500'}
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-0.5">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default TabNavigation;
