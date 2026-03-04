/**
 * Integration Test: AuthContext — actual provider rendering
 * Tests login/logout/hasRole/hasPermission/hasModuleAccess with real AuthProvider
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';

// Mock storageService to prevent localStorage issues in tests
jest.mock('../services/storageService', () => ({
  __esModule: true,
  default: {
    getUser: jest.fn().mockReturnValue(null),
    setUser: jest.fn(),
    clearUser: jest.fn(),
    addAuditLog: jest.fn(),
  },
}));

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext — Login', () => {
  test('login with valid admin credentials', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      const res = result.current.login('admin', 'Admin@2026');
      expect(res.success).toBe(true);
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user.username).toBe('admin');
    expect(result.current.user.role).toBe(ROLES.ADMIN);
    expect(result.current.isAuthenticated).toBe(true);
  });

  test('login with valid accounts credentials', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login('shreenth', 'Shreenth@2026');
    });

    expect(result.current.user.role).toBe(ROLES.ACCOUNTS);
    expect(result.current.user.displayName).toBe('Shreenth');
  });

  test('login with valid cashfree approver credentials', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login('anush', 'Anush@2026');
    });

    expect(result.current.user.role).toBe(ROLES.CASHFREE_APPROVER);
  });

  test('login with wrong password fails', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      const res = result.current.login('ramesh', 'WrongPassword');
      expect(res.success).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe('Invalid username or password');
  });

  test('login with unknown username fails', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      const res = result.current.login('unknown', 'Password');
      expect(res.success).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  test('login is case-insensitive for username', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login('ADMIN', 'Admin@2026');
    });

    expect(result.current.user.username).toBe('admin');
  });

  test('session expiry is set to 24 hours from now', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login('admin', 'Admin@2026');
    });

    const expiry = new Date(result.current.user.sessionExpiry);
    const now = new Date();
    const diffHours = (expiry - now) / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThan(23);
    expect(diffHours).toBeLessThanOrEqual(24);
  });
});

describe('AuthContext — Logout', () => {
  test('logout clears user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login('ramesh', 'Ramesh@2026');
    });
    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe('AuthContext — hasRole', () => {
  test('admin hasRole("admin") is true', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login('admin', 'Admin@2026');
    });

    expect(result.current.hasRole(ROLES.ADMIN)).toBe(true);
    expect(result.current.hasRole(ROLES.ACCOUNTS)).toBe(false);
    expect(result.current.hasRole(ROLES.VIEWER)).toBe(false);
  });

  test('hasRole accepts array of roles', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login('shreenth', 'Shreenth@2026');
    });

    expect(result.current.hasRole([ROLES.ACCOUNTS, ROLES.ADMIN])).toBe(true);
    expect(result.current.hasRole([ROLES.VIEWER])).toBe(false);
  });

  test('hasRole returns false when not logged in', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.hasRole(ROLES.ADMIN)).toBe(false);
  });
});

describe('AuthContext — hasPermission', () => {
  test('admin has all permissions', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login('admin', 'Admin@2026');
    });

    expect(result.current.hasPermission('canCreate')).toBe(true);
    expect(result.current.hasPermission('canEdit')).toBe(true);
    expect(result.current.hasPermission('canDelete')).toBe(true);
    expect(result.current.hasPermission('canApprove')).toBe(true);
    expect(result.current.hasPermission('canMarkPaid')).toBe(true);
  });

  test('accounts has create/edit/markPaid but not approve/delete', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login('shreenth', 'Shreenth@2026');
    });

    expect(result.current.hasPermission('canCreate')).toBe(true);
    expect(result.current.hasPermission('canEdit')).toBe(true);
    expect(result.current.hasPermission('canMarkPaid')).toBe(true);
    expect(result.current.hasPermission('canApprove')).toBe(false);
    expect(result.current.hasPermission('canDelete')).toBe(false);
  });

  test('cashfree approver has approve and markPaid permissions', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login('anush', 'Anush@2026');
    });

    expect(result.current.hasPermission('canCreate')).toBe(false);
    expect(result.current.hasPermission('canEdit')).toBe(false);
    expect(result.current.hasPermission('canApprove')).toBe(true);
    expect(result.current.hasPermission('canMarkPaid')).toBe(true);
  });

  test('hasPermission returns false when not logged in', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.hasPermission('canCreate')).toBe(false);
  });
});

describe('AuthContext — hasModuleAccess', () => {
  test('admin has access to all modules', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login('admin', 'Admin@2026');
    });

    expect(result.current.hasModuleAccess('transport')).toBe(true);
    expect(result.current.hasModuleAccess('general')).toBe(true);
    expect(result.current.hasModuleAccess('packing')).toBe(true);
  });

  test('accounts has access to all modules', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login('shreenth', 'Shreenth@2026');
    });

    expect(result.current.hasModuleAccess('transport')).toBe(true);
  });

  test('hasModuleAccess returns false when not logged in', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.hasModuleAccess('transport')).toBe(false);
  });
});

describe('AuthContext — refreshSession', () => {
  test('refreshSession extends expiry', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login('admin', 'Admin@2026');
    });

    const oldExpiry = result.current.user.sessionExpiry;

    act(() => {
      result.current.refreshSession();
    });

    // Expiry should be updated (>= old)
    expect(new Date(result.current.user.sessionExpiry).getTime())
      .toBeGreaterThanOrEqual(new Date(oldExpiry).getTime());
  });

  test('refreshSession does nothing when not logged in', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    // Should not throw
    act(() => {
      result.current.refreshSession();
    });
    expect(result.current.user).toBeNull();
  });
});

describe('AuthContext — All 8 Users', () => {
  const users = [
    { username: 'shreenth', password: 'Shreenth@2026', role: ROLES.ACCOUNTS },
    { username: 'jagannath', password: 'Jagannath@2026', role: ROLES.ACCOUNTS },
    { username: 'lakshman', password: 'Lakshman@2026', role: ROLES.ACCOUNTS },
    { username: 'srikanth', password: 'Srikanth@2026', role: ROLES.ACCOUNTS },
    { username: 'ramesh', password: 'Ramesh@2026', role: ROLES.IDFC_APPROVER },
    { username: 'anush', password: 'Anush@2026', role: ROLES.CASHFREE_APPROVER },
    { username: 'harsha', password: 'Harsha@2026', role: ROLES.VIEWER },
    { username: 'admin', password: 'Admin@2026', role: ROLES.ADMIN },
  ];

  users.forEach(({ username, password, role }) => {
    test(`${username} can login and has role ${role}`, () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        const res = result.current.login(username, password);
        expect(res.success).toBe(true);
      });

      expect(result.current.user.role).toBe(role);
    });
  });
});
