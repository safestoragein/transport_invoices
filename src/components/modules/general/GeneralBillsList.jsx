import React, { useState, useMemo } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';
import { useFilters, useExcel, useForm } from '../../../hooks';
import { DataTable, Button, StatusBadge, FormModal, FilterBar, FormField, Select, FormRow } from '../../common';
import InvoiceUpload from '../../common/InvoiceUpload';
import { StatCard, StatCardGrid } from '../../common/StatCard';
import { HistoryModal } from '../../audit/HistoryPanel';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { calculateModuleStats } from '../../../utils/calculations';
import { PAYMENT_STATUS } from '../../../utils/constants';
import { uploadInvoiceFile, getInvoiceFileUrl } from '../../../services/fileUploadService';

const GeneralBillForm = ({ initialData, onSubmit, onCancel, loading }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const validate = (values) => {
    const errors = {};
    if (!values.vendorName?.trim()) errors.vendorName = 'Vendor name is required';
    if (!values.invoiceNo?.trim()) errors.invoiceNo = 'Invoice number is required';
    if (!values.invoiceDate) errors.invoiceDate = 'Invoice date is required';
    if (!values.payableAmount && values.payableAmount !== 0) errors.payableAmount = 'Amount is required';
    return errors;
  };

  const { values, handleChange, handleBlur, handleSubmit, getFieldError, setMultipleValues } = useForm(
    initialData || {
      vendorName: '',
      invoiceNo: '',
      invoiceDate: '',
      month: '',
      payableAmount: '',
      paymentStatus: PAYMENT_STATUS.PENDING,
      uploadedDate: '',
      approvedBy: '',
      attachmentUrl: '',
    },
    {
      validate,
      onSubmit: async (data) => {
        let attachmentUrl = data.attachmentUrl || '';
        if (selectedFile) {
          try {
            setUploading(true);
            const path = await uploadInvoiceFile(selectedFile, data.invoiceNo || 'draft');
            attachmentUrl = getInvoiceFileUrl(path) || path;
          } catch (err) {
            console.error('File upload failed:', err);
          } finally {
            setUploading(false);
          }
        }
        onSubmit({
          ...data,
          payableAmount: parseFloat(data.payableAmount) || 0,
          attachmentUrl,
        });
      },
    }
  );

  const handleOcrExtracted = (data) => {
    const updates = {};
    if (data.vendorName) updates.vendorName = data.vendorName;
    if (data.invoiceNumber) updates.invoiceNo = data.invoiceNumber;
    if (data.invoiceDate) updates.invoiceDate = data.invoiceDate;
    if (data.invoiceAmount) updates.payableAmount = data.invoiceAmount;
    if (Object.keys(updates).length > 0) setMultipleValues(updates);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InvoiceUpload
        onExtracted={handleOcrExtracted}
        onFileSelected={setSelectedFile}
        existingAttachment={initialData?.attachmentUrl}
      />
      <FormRow columns={2}>
        <FormField
          label="Vendor Name"
          name="vendorName"
          value={values.vendorName}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getFieldError('vendorName')}
          required
        />
        <FormField
          label="Invoice Number"
          name="invoiceNo"
          value={values.invoiceNo}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getFieldError('invoiceNo')}
          required
        />
      </FormRow>
      <FormRow columns={2}>
        <FormField
          label="Invoice Date"
          name="invoiceDate"
          type="date"
          value={values.invoiceDate}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getFieldError('invoiceDate')}
          required
        />
        <FormField
          label="Month"
          name="month"
          value={values.month}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </FormRow>
      <FormRow columns={2}>
        <FormField
          label="Payable Amount (₹)"
          name="payableAmount"
          type="number"
          value={values.payableAmount}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getFieldError('payableAmount')}
          required
        />
        <Select
          label="Payment Status"
          name="paymentStatus"
          value={values.paymentStatus}
          onChange={handleChange}
          options={Object.values(PAYMENT_STATUS).map(s => ({ value: s, label: s }))}
        />
      </FormRow>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="success" loading={loading || uploading}>
          {uploading ? 'Uploading...' : initialData ? 'Update Bill' : 'Submit Bill'}
        </Button>
      </div>
    </form>
  );
};

const GeneralBillsList = () => {
  const { generalBills, createEntry, updateEntry, deleteEntry } = useData();
  const { success, error } = useToast();
  const { exportToExcel, exporting } = useExcel('general');

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [historyRecord, setHistoryRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  const { filters, filteredData, updateFilter, clearFilters, hasActiveFilters, getUniqueValues } = useFilters(
    generalBills,
    { moduleName: 'general', searchFields: ['vendorName', 'invoiceNo'], dateField: 'invoiceDate', amountField: 'payableAmount' }
  );

  const stats = useMemo(() => calculateModuleStats(filteredData, 'payableAmount'), [filteredData]);

  const columns = [
    { key: 'vendorName', header: 'Vendor', render: (v) => <span className="font-medium">{v || '-'}</span> },
    { key: 'invoiceNo', header: 'Invoice #' },
    { key: 'invoiceDate', header: 'Date', render: (v) => formatDate(v) },
    { key: 'payableAmount', header: 'Amount', render: (v) => formatCurrency(v) },
    { key: 'paymentStatus', header: 'Payment', render: (v) => <StatusBadge status={v} /> },
    { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v} /> },
  ];

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      if (editingItem) {
        updateEntry('general', editingItem.id, data);
        success('Bill updated successfully');
      } else {
        createEntry('general', data);
        success('Bill submitted successfully');
      }
      setShowForm(false);
      setEditingItem(null);
    } catch (err) {
      error('Failed to save bill');
    } finally {
      setLoading(false);
    }
  };

  const rowActions = (row) => (
    <>
      <button onClick={() => setHistoryRecord(row)} className="p-1.5 text-gray-500 hover:text-primary-600 rounded" title="History">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </button>
      <button onClick={() => { setEditingItem(row); setShowForm(true); }} className="p-1.5 text-gray-500 hover:text-primary-600 rounded" title="Edit">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
      </button>
      <button onClick={() => { if (window.confirm('Delete this bill?')) { deleteEntry('general', row.id); success('Deleted'); }}} className="p-1.5 text-gray-500 hover:text-danger-600 rounded" title="Delete">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">General Bills</h1>
          <p className="text-sm text-gray-500 mt-1">Manage general bills and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => exportToExcel(filteredData)} loading={exporting}>Export</Button>
          <Button variant="primary" onClick={() => setShowForm(true)}>+ New Bill</Button>
        </div>
      </div>

      <StatCardGrid columns={4}>
        <StatCard title="Total Bills" value={stats.count} color="primary" />
        <StatCard title="Total Amount" value={stats.totalAmount} isCurrency color="neutral" />
        <StatCard title="Pending" value={stats.pendingCount} color="warning" />
        <StatCard title="Completed" value={stats.approvedCount} color="success" />
      </StatCardGrid>

      <FilterBar
        filters={[
          { name: 'search', type: 'text', label: 'Search' },
          { name: 'dateRange', type: 'dateRange', label: 'Date' },
          { name: 'vendor', type: 'select', label: 'Vendor', options: getUniqueValues('vendorName').map(v => ({ value: v, label: v })) },
        ]}
        values={filters}
        onChange={(f) => Object.entries(f).forEach(([k, v]) => updateFilter(k, v))}
        onClear={clearFilters}
        collapsible
      />

      <DataTable data={filteredData} columns={columns} rowActions={rowActions} paginate sortable />

      <FormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditingItem(null); }} title={editingItem ? 'Edit Bill' : 'New Bill'} size="lg">
        <GeneralBillForm initialData={editingItem} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingItem(null); }} loading={loading} />
      </FormModal>

      <HistoryModal isOpen={!!historyRecord} module="general" recordId={historyRecord?.id} onClose={() => setHistoryRecord(null)} />
    </div>
  );
};

export default GeneralBillsList;
