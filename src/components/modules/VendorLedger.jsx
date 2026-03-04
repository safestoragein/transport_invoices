import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { calculateVendorLedger } from '../../utils/calculations';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { PageHeader } from '../layout/MainLayout';

const VendorLedger = () => {
  const { getAllEntries, billPayments } = useData();
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const allEntries = useMemo(() => getAllEntries(), [getAllEntries]);

  const vendorLedger = useMemo(() => {
    return calculateVendorLedger(allEntries, billPayments);
  }, [allEntries, billPayments]);

  const filteredVendors = useMemo(() => {
    if (!searchTerm) return vendorLedger;
    return vendorLedger.filter(v =>
      v.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vendorLedger, searchTerm]);

  // Summary totals
  const totals = useMemo(() => {
    return vendorLedger.reduce((acc, v) => ({
      debit: acc.debit + v.debit,
      credit: acc.credit + v.credit,
      balance: acc.balance + v.balance,
    }), { debit: 0, credit: 0, balance: 0 });
  }, [vendorLedger]);

  const selectedVendorData = useMemo(() => {
    if (!selectedVendor) return null;
    return vendorLedger.find(v => v.vendor === selectedVendor);
  }, [selectedVendor, vendorLedger]);

  return (
    <div>
      <PageHeader
        title="Vendor Ledger"
        subtitle="Debit (payable) vs Credit (payments) per vendor"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Debit (Payable)</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totals.debit)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Credit (Paid)</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totals.credit)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Outstanding Balance</p>
          <p className={`text-2xl font-bold mt-1 ${totals.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(Math.abs(totals.balance))}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendor List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search vendors..."
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filteredVendors.map(vendor => (
              <button
                key={vendor.vendor}
                onClick={() => setSelectedVendor(vendor.vendor)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                  selectedVendor === vendor.vendor ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <p className="font-medium text-gray-900 text-sm truncate">{vendor.vendor}</p>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">{vendor.bills.length} bills</span>
                  <span className={`text-xs font-medium ${vendor.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {vendor.balance > 0 ? 'Due: ' : 'Settled: '}{formatCurrency(Math.abs(vendor.balance))}
                  </span>
                </div>
                {/* Mini bar showing debit vs credit */}
                <div className="mt-2 flex h-1.5 rounded-full overflow-hidden bg-gray-100">
                  {vendor.debit > 0 && (
                    <div className="bg-red-400" style={{ width: `${(vendor.debit / Math.max(vendor.debit, vendor.credit || 1)) * 100}%` }} />
                  )}
                  {vendor.credit > 0 && (
                    <div className="bg-green-400" style={{ width: `${(vendor.credit / Math.max(vendor.debit || 1, vendor.credit)) * 100}%` }} />
                  )}
                </div>
              </button>
            ))}
            {filteredVendors.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">No vendors found</div>
            )}
          </div>
        </div>

        {/* Vendor Detail */}
        <div className="lg:col-span-2">
          {selectedVendorData ? (
            <div className="bg-white rounded-xl shadow-sm border">
              {/* Vendor Header */}
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">{selectedVendorData.vendor}</h3>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-500">Debit (Payable)</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(selectedVendorData.debit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Credit (Paid)</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(selectedVendorData.credit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Balance</p>
                    <p className={`text-lg font-bold ${selectedVendorData.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(Math.abs(selectedVendorData.balance))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transactions */}
              <div className="p-4 border-b bg-gray-50">
                <h4 className="font-medium text-gray-700 text-sm">Transactions</h4>
              </div>
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {/* Bills (Debits) */}
                {selectedVendorData.bills.map(bill => (
                  <div key={bill.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {bill.invoiceNumber || bill.invoiceNo || bill.id}
                        <span className="ml-2 text-xs text-gray-400 capitalize">{bill.module}</span>
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(bill.invoiceDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">
                        Dr: {formatCurrency(Number(bill.finalPayable) || Number(bill.payableAmount) || Number(bill.amount) || 0)}
                      </p>
                      <p className="text-xs text-gray-400">{bill.paymentMode}</p>
                    </div>
                  </div>
                ))}
                {/* Payments (Credits) */}
                {selectedVendorData.payments.map(payment => (
                  <div key={payment.paymentId} className="p-4 flex items-center justify-between bg-green-50/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Payment - {payment.invoiceNumber || payment.billId}
                      </p>
                      <p className="text-xs text-gray-500">{formatDateTime(payment.paymentDate)} by {payment.createdBy}</p>
                      {payment.paymentReference && <p className="text-xs text-gray-400">Ref: {payment.paymentReference}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">Cr: {formatCurrency(payment.paymentAmount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-500">
              Select a vendor to view their ledger
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorLedger;
