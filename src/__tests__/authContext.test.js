/**
 * Test Suite: AuthContext
 * Verifies user-role assignments, login/logout, and permission checks
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';

// Helper component to test auth context
const AuthConsumer = () => {
  const { user, isAuthenticated, login, logout, hasRole, hasPermission } = useAuth();

  return (
    <div>
      <p data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</p>
      <p data-testid="username">{user?.username || 'none'}</p>
      <p data-testid="role">{user?.role || 'none'}</p>
      <p data-testid="displayName">{user?.displayName || 'none'}</p>
      <p data-testid="canCreate">{hasPermission('canCreate') ? 'yes' : 'no'}</p>
      <p data-testid="canApprove">{hasPermission('canApprove') ? 'yes' : 'no'}</p>
      <p data-testid="canMarkPaid">{hasPermission('canMarkPaid') ? 'yes' : 'no'}</p>
      <p data-testid="canDelete">{hasPermission('canDelete') ? 'yes' : 'no'}</p>
      <p data-testid="canViewAdmin">{hasPermission('canViewAdmin') ? 'yes' : 'no'}</p>
      <p data-testid="isAdmin">{hasRole(ROLES.ADMIN) ? 'yes' : 'no'}</p>
      <p data-testid="isAccounts">{hasRole(ROLES.ACCOUNTS) ? 'yes' : 'no'}</p>
      <p data-testid="isViewer">{hasRole(ROLES.VIEWER) ? 'yes' : 'no'}</p>
      <p data-testid="isIdfcApprover">{hasRole(ROLES.IDFC_APPROVER) ? 'yes' : 'no'}</p>
      <p data-testid="isCashfreeApprover">{hasRole(ROLES.CASHFREE_APPROVER) ? 'yes' : 'no'}</p>
      <button onClick={() => login('admin', 'Admin@2026')} data-testid="login-admin">Login Admin</button>
      <button onClick={() => login('ramesh', 'Ramesh@2026')} data-testid="login-idfc-approver">Login IDFC Approver</button>
      <button onClick={() => login('shreenth', 'Shreenth@2026')} data-testid="login-accounts">Login Accounts</button>
      <button onClick={() => login('anush', 'Anush@2026')} data-testid="login-cashfree-approver">Login Cashfree Approver</button>
      <button onClick={() => login('fake', 'wrong')} data-testid="login-bad">Login Bad</button>
      <button onClick={logout} data-testid="logout">Logout</button>
    </div>
  );
};

// Mock storageService to avoid localStorage side effects
jest.mock('../services/storageService', () => ({
  __esModule: true,
  default: {
    getUser: jest.fn(() => null),
    setUser: jest.fn(),
    clearUser: jest.fn(),
    addAuditLog: jest.fn(),
  },
}));

const renderAuth = () => render(
  <AuthProvider>
    <AuthConsumer />
  </AuthProvider>
);

describe('User Role Assignments', () => {
  test('Admin should be ADMIN', async () => {
    renderAuth();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-admin'));
    expect(screen.getByTestId('role').textContent).toBe('admin');
    expect(screen.getByTestId('isAdmin').textContent).toBe('yes');
  });

  test('Ramesh should be IDFC_APPROVER', async () => {
    renderAuth();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-idfc-approver'));
    expect(screen.getByTestId('role').textContent).toBe('idfc_approver');
    expect(screen.getByTestId('isIdfcApprover').textContent).toBe('yes');
  });

  test('Shreenth should be ACCOUNTS (not ADMIN)', async () => {
    renderAuth();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-accounts'));
    expect(screen.getByTestId('role').textContent).toBe('accounts');
    expect(screen.getByTestId('isAccounts').textContent).toBe('yes');
    expect(screen.getByTestId('isAdmin').textContent).toBe('no');
  });

  test('Anush should be CASHFREE_APPROVER', async () => {
    renderAuth();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-cashfree-approver'));
    expect(screen.getByTestId('role').textContent).toBe('cashfree_approver');
    expect(screen.getByTestId('isCashfreeApprover').textContent).toBe('yes');
  });
});

describe('ADMIN Permissions', () => {
  test('Admin can create, approve, markPaid, delete, viewAdmin', async () => {
    renderAuth();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-admin'));
    expect(screen.getByTestId('canCreate').textContent).toBe('yes');
    expect(screen.getByTestId('canApprove').textContent).toBe('yes');
    expect(screen.getByTestId('canMarkPaid').textContent).toBe('yes');
    expect(screen.getByTestId('canDelete').textContent).toBe('yes');
    expect(screen.getByTestId('canViewAdmin').textContent).toBe('yes');
  });
});

describe('ACCOUNTS Permissions', () => {
  test('Accounts can create, edit, markPaid; CANNOT approve, delete, viewAdmin', async () => {
    renderAuth();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-accounts'));
    expect(screen.getByTestId('canCreate').textContent).toBe('yes');
    expect(screen.getByTestId('canMarkPaid').textContent).toBe('yes');
    expect(screen.getByTestId('canApprove').textContent).toBe('no');
    expect(screen.getByTestId('canDelete').textContent).toBe('no');
    expect(screen.getByTestId('canViewAdmin').textContent).toBe('no');
  });
});

describe('CASHFREE_APPROVER Permissions', () => {
  test('Cashfree approver can approve and markPaid; cannot create, delete', async () => {
    renderAuth();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-cashfree-approver'));
    expect(screen.getByTestId('canApprove').textContent).toBe('yes');
    expect(screen.getByTestId('canMarkPaid').textContent).toBe('yes');
    expect(screen.getByTestId('canCreate').textContent).toBe('no');
    expect(screen.getByTestId('canDelete').textContent).toBe('no');
    expect(screen.getByTestId('canViewAdmin').textContent).toBe('no');
  });
});

describe('IDFC_APPROVER Permissions', () => {
  test('IDFC approver can approve, viewAdmin; cannot create, delete, markPaid', async () => {
    renderAuth();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-idfc-approver'));
    expect(screen.getByTestId('canApprove').textContent).toBe('yes');
    expect(screen.getByTestId('canViewAdmin').textContent).toBe('yes');
    expect(screen.getByTestId('canCreate').textContent).toBe('no');
    expect(screen.getByTestId('canDelete').textContent).toBe('no');
    expect(screen.getByTestId('canMarkPaid').textContent).toBe('no');
  });
});

describe('Login & Logout', () => {
  test('starts unauthenticated', () => {
    renderAuth();
    expect(screen.getByTestId('authenticated').textContent).toBe('no');
  });

  test('successful login sets authenticated', async () => {
    renderAuth();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-admin'));
    expect(screen.getByTestId('authenticated').textContent).toBe('yes');
    expect(screen.getByTestId('username').textContent).toBe('admin');
  });

  test('bad credentials do not authenticate', async () => {
    renderAuth();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-bad'));
    expect(screen.getByTestId('authenticated').textContent).toBe('no');
  });

  test('logout clears authentication', async () => {
    renderAuth();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-admin'));
    expect(screen.getByTestId('authenticated').textContent).toBe('yes');
    await user.click(screen.getByTestId('logout'));
    expect(screen.getByTestId('authenticated').textContent).toBe('no');
  });
});

describe('All Account Team Users', () => {
  const accountsUsers = [
    { username: 'shreenth', password: 'Shreenth@2026', display: 'Shreenth' },
    { username: 'jagannath', password: 'Jagannath@2026', display: 'Jagannath' },
    { username: 'lakshman', password: 'Lakshman@2026', display: 'Lakshman' },
    { username: 'srikanth', password: 'Srikanth@2026', display: 'Srikanth' },
  ];

  test.each(accountsUsers)(
    '$display should have ACCOUNTS role',
    ({ username, password, display }) => {
      const TestComponent = () => {
        const { user, login } = useAuth();
        React.useEffect(() => { login(username, password); }, []);
        return <p data-testid="role">{user?.role || 'none'}</p>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('role').textContent).toBe('accounts');
    }
  );
});
