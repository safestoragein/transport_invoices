/**
 * Test Suite: StatusBadge & RoleBadge
 * Verifies correct rendering for new statuses and roles
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import Badge, { StatusBadge, RoleBadge, ApprovalBadge } from '../components/common/Badge';

describe('StatusBadge — Raw DB Status Values', () => {
  test('pending_approval renders with warning style', () => {
    const { container } = render(<StatusBadge status="pending_approval" />);
    const badge = container.firstChild;
    expect(badge.textContent).toBe('Pending Approval');
    expect(badge.className).toContain('warning');
  });

  test('approved renders with primary style', () => {
    const { container } = render(<StatusBadge status="approved" />);
    const badge = container.firstChild;
    expect(badge.textContent).toBe('Approved');
    expect(badge.className).toContain('primary');
  });

  test('rejected renders with danger style', () => {
    const { container } = render(<StatusBadge status="rejected" />);
    const badge = container.firstChild;
    expect(badge.textContent).toBe('Rejected');
    expect(badge.className).toContain('danger');
  });

  test('closed renders with success style as Payment Done', () => {
    const { container } = render(<StatusBadge status="closed" />);
    const badge = container.firstChild;
    expect(badge.textContent).toBe('Payment Done');
    expect(badge.className).toContain('success');
  });

  test('payment_done renders with success style', () => {
    const { container } = render(<StatusBadge status="payment_done" />);
    const badge = container.firstChild;
    expect(badge.textContent).toBe('Payment Done');
    expect(badge.className).toContain('success');
  });

  test('uploaded_for_payment renders with info style', () => {
    const { container } = render(<StatusBadge status="uploaded_for_payment" />);
    const badge = container.firstChild;
    expect(badge.textContent).toBe('Uploaded for Payment');
    expect(badge.className).toContain('primary');
  });

  test('on_hold renders with warning style', () => {
    const { container } = render(<StatusBadge status="on_hold" />);
    const badge = container.firstChild;
    expect(badge.textContent).toBe('On Hold');
    expect(badge.className).toContain('warning');
  });
});

describe('StatusBadge — Label Strings (from getStatusLabel)', () => {
  test('"Pending Approval" label shows warning', () => {
    const { container } = render(<StatusBadge status="Pending Approval" />);
    const badge = container.firstChild;
    expect(badge.textContent).toBe('Pending Approval');
    expect(badge.className).toContain('warning');
  });

  test('"Approved - Awaiting Payment" label shows primary', () => {
    const { container } = render(<StatusBadge status="Approved - Awaiting Payment" />);
    const badge = container.firstChild;
    expect(badge.textContent).toBe('Approved - Awaiting Payment');
    expect(badge.className).toContain('primary');
  });

  test('"Rejected" label shows danger', () => {
    const { container } = render(<StatusBadge status="Rejected" />);
    const badge = container.firstChild;
    expect(badge.textContent).toBe('Rejected');
    expect(badge.className).toContain('danger');
  });

  test('"Payment Processed (Bank)" label shows success', () => {
    const { container } = render(<StatusBadge status="Payment Processed (Bank)" />);
    const badge = container.firstChild;
    expect(badge.textContent).toBe('Payment Processed (Bank)');
    expect(badge.className).toContain('success');
  });

  test('"Payment Processed (Cashfree)" label shows success', () => {
    const { container } = render(<StatusBadge status="Payment Processed (Cashfree)" />);
    const badge = container.firstChild;
    expect(badge.textContent).toBe('Payment Processed (Cashfree)');
    expect(badge.className).toContain('success');
  });
});

describe('StatusBadge — Payment Status Values', () => {
  test('"Payment done" renders as Paid/success', () => {
    const { container } = render(<StatusBadge status="Payment done" />);
    expect(container.firstChild.textContent).toBe('Paid');
    expect(container.firstChild.className).toContain('success');
  });

  test('"Hold" renders as Hold/warning', () => {
    const { container } = render(<StatusBadge status="Hold" />);
    expect(container.firstChild.textContent).toBe('Hold');
    expect(container.firstChild.className).toContain('warning');
  });

  test('"Pending" (payment) renders as Pending/warning', () => {
    const { container } = render(<StatusBadge status="Pending" />);
    expect(container.firstChild.textContent).toBe('Pending');
    expect(container.firstChild.className).toContain('warning');
  });
});

describe('StatusBadge — Edge Cases', () => {
  test('null/undefined status renders fallback', () => {
    const { container } = render(<StatusBadge status={null} />);
    expect(container.firstChild.textContent).toBe('Unknown');
  });

  test('unknown status renders as-is with secondary style', () => {
    const { container } = render(<StatusBadge status="some_unknown_status" />);
    expect(container.firstChild.textContent).toBe('some_unknown_status');
    expect(container.firstChild.className).toContain('gray');
  });
});

describe('RoleBadge', () => {
  test('viewer renders with secondary style', () => {
    const { container } = render(<RoleBadge role="viewer" />);
    expect(container.firstChild.textContent).toBe('Viewer');
    expect(container.firstChild.className).toContain('gray');
  });

  test('accounts renders with success style', () => {
    const { container } = render(<RoleBadge role="accounts" />);
    expect(container.firstChild.textContent).toBe('Accounts');
    expect(container.firstChild.className).toContain('success');
  });

  test('admin renders with danger style', () => {
    const { container } = render(<RoleBadge role="admin" />);
    expect(container.firstChild.textContent).toBe('Admin');
    expect(container.firstChild.className).toContain('danger');
  });

  test('unknown role falls back to Viewer', () => {
    const { container } = render(<RoleBadge role="manager" />);
    expect(container.firstChild.textContent).toBe('Viewer');
  });
});

describe('ApprovalBadge', () => {
  test('pending shows warning', () => {
    const { container } = render(<ApprovalBadge status="pending" />);
    expect(container.firstChild.textContent).toBe('Pending');
    expect(container.firstChild.className).toContain('warning');
  });

  test('approved shows success', () => {
    const { container } = render(<ApprovalBadge status="approved" />);
    expect(container.firstChild.textContent).toBe('Approved');
    expect(container.firstChild.className).toContain('success');
  });

  test('rejected shows danger', () => {
    const { container } = render(<ApprovalBadge status="rejected" />);
    expect(container.firstChild.textContent).toBe('Rejected');
    expect(container.firstChild.className).toContain('danger');
  });
});
