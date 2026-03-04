import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { useFilters, useExcel, useForm } from '../../hooks';
import { DataTable, Button, StatusBadge, FormModal, FilterBar, FormField, Select, TextArea, FormRow } from '../common';
import { ApprovalBadge } from '../common/Badge';
import InvoiceUpload from '../common/InvoiceUpload';
import { StatCard, StatCardGrid } from '../common/StatCard';
import { HistoryModal } from '../audit/HistoryPanel';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { calculateModuleStats, calculateTDS } from '../../utils/calculations';
import { PAYMENT_STATUS, MODULE_CONFIG, PAYMENT_MODES } from '../../utils/constants';
import { uploadInvoiceFile, getInvoiceFileUrl } from '../../services/fileUploadService';

/**
 * Generic Module List Component
 * Reusable for all modules with configuration
 */
const ModuleList = ({ moduleKey, title, subtitle, formFields, tableColumns, amountField = 'amount' }) => {
  const dataContext = useData();
  const { success, error } = useToast();
  const { exportToExcel, exporting } = useExcel(moduleKey);

  // Get module data based on key
  const getModuleData = () => {
    const dataMap = {
      packing: dataContext.packingMaterials,
      petty: dataContext.pettyCash,
      happy: dataContext.happyCard,
      refunds: dataContext.refunds,
      drive: dataContext.driveTrackPorter,
      reviews: dataContext.reviews,
    };
    return dataMap[moduleKey] || [];
  };

  const moduleData = getModuleData();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [historyRecord, setHistoryRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  const { filters, filteredData, updateFilter, clearFilters, hasActiveFilters, getUniqueValues } = useFilters(
    moduleData,
    { moduleName: moduleKey, searchFields: ['vendorName', 'particulars', 'customerName', 'driverName'], amountField }
  );

  const stats = useMemo(() => calculateModuleStats(filteredData, amountField), [filteredData, amountField]);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      if (editingItem) {
        await dataContext.updateEntry(moduleKey, editingItem.id, data);
        success(`${title} updated successfully`);
      } else {
        await dataContext.createEntry(moduleKey, data);
        success(`${title} submitted successfully`);
      }
      setShowForm(false);
      setEditingItem(null);
    } catch (err) {
      error(`Failed to save ${title.toLowerCase()}`);
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
      <button onClick={async () => { if (window.confirm('Delete this entry?')) { const result = await dataContext.deleteEntry(moduleKey, row.id); result ? success('Deleted') : error('Delete failed. Please try again.'); }}} className="p-1.5 text-gray-500 hover:text-danger-600 rounded" title="Delete">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="secondary" onClick={() => exportToExcel(filteredData)} loading={exporting}>Export</Button>
          <Button variant="primary" onClick={() => setShowForm(true)}>+ New Entry</Button>
        </div>
      </div>

      <StatCardGrid columns={4}>
        <StatCard title="Total Entries" value={stats.count} color="primary" />
        <StatCard title="Total Amount" value={stats.totalAmount} isCurrency color="neutral" />
        <StatCard title="Pending" value={stats.pendingCount} color="warning" />
        <StatCard title="Completed" value={stats.approvedCount} color="success" />
      </StatCardGrid>

      <FilterBar
        filters={[
          { name: 'search', type: 'text', label: 'Search' },
          { name: 'dateRange', type: 'dateRange', label: 'Date' },
          { name: 'paymentStatus', type: 'select', label: 'Payment Status', options: [
            { value: 'Pending', label: 'Pending' },
            { value: 'Payment done', label: 'Paid' },
            { value: 'Hold', label: 'Hold' },
            { value: 'partially pending', label: 'Partially Pending' },
          ]},
          { name: 'managerApproval', type: 'select', label: 'Approval', options: [
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ]},
        ]}
        values={filters}
        onChange={(f) => Object.entries(f).forEach(([k, v]) => updateFilter(k, v))}
        onClear={clearFilters}
        collapsible
      />

      <DataTable data={filteredData} columns={tableColumns} rowActions={rowActions} paginate sortable />

      <FormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditingItem(null); }} title={editingItem ? `Edit ${title}` : `New ${title}`} size="lg">
        <GenericForm fields={formFields} initialData={editingItem} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingItem(null); }} loading={loading} />
      </FormModal>

      <HistoryModal isOpen={!!historyRecord} module={moduleKey} recordId={historyRecord?.id} onClose={() => setHistoryRecord(null)} />
    </div>
  );
};

// Generic Form Component
const GenericForm = ({ fields, initialData, onSubmit, onCancel, loading }) => {
  const { error: showError } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const getInitialValues = () => {
    const values = {};
    fields.forEach(field => {
      values[field.name] = initialData?.[field.name] ?? field.defaultValue ?? '';
    });
    values.attachmentUrl = initialData?.attachmentUrl ?? '';
    return values;
  };

  const { values, handleChange, handleBlur, handleSubmit, getFieldError, setMultipleValues } = useForm(
    getInitialValues(),
    {
      validate: (vals) => {
        const errors = {};
        fields.forEach(field => {
          if (field.required && !vals[field.name]) {
            errors[field.name] = `${field.label} is required`;
          }
        });
        return errors;
      },
      onSubmit: async (data) => {
        let attachmentUrl = data.attachmentUrl || '';
        if (selectedFile) {
          try {
            setUploading(true);
            const refId = data.invoiceNo || data.customerId || data.driverName || 'draft';
            const path = await uploadInvoiceFile(selectedFile, refId);
            attachmentUrl = getInvoiceFileUrl(path) || path;
          } catch (err) {
            console.error('File upload failed:', err);
            showError('File upload failed. Please try again.');
            setUploading(false);
            return;
          } finally {
            setUploading(false);
          }
        }
        const processed = { ...data, attachmentUrl };
        fields.forEach(field => {
          if (field.type === 'number') {
            processed[field.name] = parseFloat(data[field.name]) || 0;
          }
        });
        onSubmit(processed);
      },
    }
  );

  // Auto-calculate TDS when tdsPercentage or the amount field changes
  const amountFieldName = useMemo(
    () => fields.find(f => f.type === 'number' && /amount/i.test(f.name))?.name,
    [fields]
  );
  const hasTdsField = useMemo(() => fields.some(f => f.name === 'tdsPercentage'), [fields]);
  const amountValue = amountFieldName ? values[amountFieldName] : undefined;

  useEffect(() => {
    if (!amountFieldName || !hasTdsField) return;
    const amount = parseFloat(amountValue) || 0;
    const tdsPct = parseFloat(values.tdsPercentage) || 0;
    const { tdsAmount, netPayable } = calculateTDS(amount, tdsPct);
    setMultipleValues({ tdsAmount: tdsAmount.toFixed(2), netPayable: netPayable.toFixed(2) });
  }, [amountFieldName, hasTdsField, amountValue, values.tdsPercentage, setMultipleValues]);

  const handleOcrExtracted = (data) => {
    const updates = {};
    if (data.vendorName) updates.vendorName = data.vendorName;
    if (data.invoiceNumber) {
      // Map to whichever invoice field exists in this form
      const hasInvoiceNo = fields.some(f => f.name === 'invoiceNo');
      if (hasInvoiceNo) updates.invoiceNo = data.invoiceNumber;
    }
    if (data.invoiceDate) {
      const hasDate = fields.some(f => f.name === 'date');
      if (hasDate) updates.date = data.invoiceDate;
      const hasInvoiceDate = fields.some(f => f.name === 'invoiceDate');
      if (hasInvoiceDate) updates.invoiceDate = data.invoiceDate;
    }
    if (data.invoiceAmount) {
      const amountField = fields.find(f => f.type === 'number' && /amount/i.test(f.name));
      if (amountField) updates[amountField.name] = data.invoiceAmount;
    }
    if (Object.keys(updates).length > 0) setMultipleValues(updates);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InvoiceUpload
        onExtracted={handleOcrExtracted}
        onFileSelected={setSelectedFile}
        existingAttachment={initialData?.attachmentUrl}
      />
      {fields.map((field, index) => {
        if (field.type === 'select') {
          return (
            <Select
              key={field.name}
              label={field.label}
              name={field.name}
              value={values[field.name]}
              onChange={handleChange}
              options={field.options}
              required={field.required}
            />
          );
        }
        if (field.type === 'textarea') {
          return (
            <TextArea
              key={field.name}
              label={field.label}
              name={field.name}
              value={values[field.name]}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={3}
            />
          );
        }
        return (
          <FormField
            key={field.name}
            label={field.label}
            name={field.name}
            type={field.type || 'text'}
            value={values[field.name]}
            onChange={handleChange}
            onBlur={handleBlur}
            error={getFieldError(field.name)}
            required={field.required}
            placeholder={field.placeholder}
            disabled={field.readOnly}
            readOnly={field.readOnly}
          />
        );
      })}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="success" loading={loading || uploading}>
          {uploading ? 'Uploading...' : initialData ? 'Update' : 'Submit'}
        </Button>
      </div>
    </form>
  );
};

// =============== Specific Module Components ===============

export const PackingMaterialsList = () => (
  <ModuleList
    moduleKey="packing"
    title="Packing Materials"
    subtitle="Manage packing material purchases"
    amountField="payableAmount"
    formFields={[
      { name: 'paymentMode', label: 'Payment Mode', type: 'select', required: true, options: [
        { value: '', label: 'Select Payment Mode' },
        { value: PAYMENT_MODES.IDFC_BANK, label: 'IDFC Bank' },
        { value: PAYMENT_MODES.CASHFREE, label: 'Cashfree' },
      ]},
      { name: 'dueDate', label: 'Due Date', type: 'date' },
      { name: 'vendorName', label: 'Vendor Name', required: true },
      { name: 'invoiceNo', label: 'Invoice Number', required: true },
      { name: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true },
      { name: 'payableAmount', label: 'Amount (₹)', type: 'number', required: true },
      { name: 'tdsPercentage', label: 'TDS %', type: 'number', placeholder: '0' },
      { name: 'tdsAmount', label: 'TDS Amount (₹)', type: 'number', readOnly: true },
      { name: 'netPayable', label: 'Net Payable (₹)', type: 'number', readOnly: true },
      { name: 'city', label: 'City' },
      { name: 'materials', label: 'Materials' },
      { name: 'bankStatus', label: 'Bank Status' },
      { name: 'paymentStatus', label: 'Payment Status', type: 'select', options: Object.values(PAYMENT_STATUS).map(s => ({ value: s, label: s })) },
    ]}
    tableColumns={[
      { key: 'vendorName', header: 'Vendor', render: (v) => <span className="font-medium">{v || '-'}</span> },
      { key: 'invoiceNo', header: 'Invoice #' },
      { key: 'invoiceDate', header: 'Date', render: (v) => formatDate(v) },
      { key: 'payableAmount', header: 'Amount', render: (v) => formatCurrency(v) },
      { key: 'netPayable', header: 'Net Payable', render: (v) => v > 0 ? formatCurrency(v) : '-' },
      { key: 'paymentMode', header: 'Payment Mode' },
      { key: 'city', header: 'City' },
      { key: 'materials', header: 'Materials' },
      { key: 'managerApproval', header: 'Approval', render: (v) => <ApprovalBadge status={v} /> },
      { key: 'paymentStatus', header: 'Payment', render: (v) => <StatusBadge status={v} /> },
    ]}
  />
);

export const PettyCashList = () => (
  <ModuleList
    moduleKey="petty"
    title="Petty Cash"
    subtitle="Manage petty cash expenses"
    amountField="amount"
    formFields={[
      { name: 'paymentMode', label: 'Payment Mode', type: 'select', required: true, options: [
        { value: '', label: 'Select Payment Mode' },
        { value: PAYMENT_MODES.IDFC_BANK, label: 'IDFC Bank' },
        { value: PAYMENT_MODES.CASHFREE, label: 'Cashfree' },
      ]},
      { name: 'dueDate', label: 'Due Date', type: 'date' },
      { name: 'category', label: 'Category', required: true },
      { name: 'particulars', label: 'Particulars', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'amount', label: 'Amount (₹)', type: 'number', required: true },
      { name: 'tdsPercentage', label: 'TDS %', type: 'number', placeholder: '0' },
      { name: 'tdsAmount', label: 'TDS Amount (₹)', type: 'number', readOnly: true },
      { name: 'netPayable', label: 'Net Payable (₹)', type: 'number', readOnly: true },
      { name: 'remarks', label: 'Remarks', type: 'textarea' },
    ]}
    tableColumns={[
      { key: 'category', header: 'Category', render: (v) => <span className="font-medium">{v || '-'}</span> },
      { key: 'particulars', header: 'Particulars' },
      { key: 'date', header: 'Date', render: (v) => formatDate(v) },
      { key: 'amount', header: 'Amount', render: (v) => formatCurrency(v) },
      { key: 'netPayable', header: 'Net Payable', render: (v) => v > 0 ? formatCurrency(v) : '-' },
      { key: 'paymentMode', header: 'Payment Mode' },
      { key: 'uploadedDate', header: 'Uploaded Date' },
      { key: 'approvedBy', header: 'Approved By' },
      { key: 'managerApproval', header: 'Approval', render: (v) => <ApprovalBadge status={v} /> },
      { key: 'paymentStatus', header: 'Payment', render: (v) => <StatusBadge status={v} /> },
    ]}
  />
);

export const HappyCardList = () => (
  <ModuleList
    moduleKey="happy"
    title="Happy Card"
    subtitle="Manage Happay card transactions"
    amountField="payableAmount"
    formFields={[
      { name: 'paymentMode', label: 'Payment Mode', type: 'select', required: true, options: [
        { value: '', label: 'Select Payment Mode' },
        { value: PAYMENT_MODES.IDFC_BANK, label: 'IDFC Bank' },
        { value: PAYMENT_MODES.CASHFREE, label: 'Cashfree' },
      ]},
      { name: 'dueDate', label: 'Due Date', type: 'date' },
      { name: 'vendorName', label: 'Vendor', defaultValue: 'Happay Card' },
      { name: 'month', label: 'Month', required: true },
      { name: 'payableAmount', label: 'Amount (₹)', type: 'number', required: true },
      { name: 'tdsPercentage', label: 'TDS %', type: 'number', placeholder: '0' },
      { name: 'tdsAmount', label: 'TDS Amount (₹)', type: 'number', readOnly: true },
      { name: 'netPayable', label: 'Net Payable (₹)', type: 'number', readOnly: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'remarks', label: 'Remarks', type: 'textarea' },
    ]}
    tableColumns={[
      { key: 'vendorName', header: 'Vendor', render: (v) => <span className="font-medium">{v || 'Happay Card'}</span> },
      { key: 'month', header: 'Month' },
      { key: 'date', header: 'Date', render: (v) => formatDate(v) },
      { key: 'payableAmount', header: 'Amount', render: (v) => formatCurrency(v) },
      { key: 'netPayable', header: 'Net Payable', render: (v) => v > 0 ? formatCurrency(v) : '-' },
      { key: 'paymentMode', header: 'Payment Mode' },
      { key: 'uploadedDate', header: 'Uploaded Date' },
      { key: 'approvedBy', header: 'Approved By' },
      { key: 'approvedDate', header: 'Approved Date' },
      { key: 'managerApproval', header: 'Approval', render: (v) => <ApprovalBadge status={v} /> },
      { key: 'paymentStatus', header: 'Payment', render: (v) => <StatusBadge status={v} /> },
    ]}
  />
);

export const RefundsList = () => (
  <ModuleList
    moduleKey="refunds"
    title="Refunds"
    subtitle="Manage customer refunds"
    amountField="refundAmount"
    formFields={[
      { name: 'paymentMode', label: 'Payment Mode', type: 'select', required: true, options: [
        { value: '', label: 'Select Payment Mode' },
        { value: PAYMENT_MODES.IDFC_BANK, label: 'IDFC Bank' },
        { value: PAYMENT_MODES.CASHFREE, label: 'Cashfree' },
      ]},
      { name: 'dueDate', label: 'Due Date', type: 'date' },
      { name: 'customerId', label: 'Customer ID', required: true },
      { name: 'customerName', label: 'Customer Name', required: true },
      { name: 'refundAmount', label: 'Refund Amount (₹)', type: 'number', required: true },
      { name: 'tdsPercentage', label: 'TDS %', type: 'number', placeholder: '0' },
      { name: 'tdsAmount', label: 'TDS Amount (₹)', type: 'number', readOnly: true },
      { name: 'netPayable', label: 'Net Payable (₹)', type: 'number', readOnly: true },
      { name: 'reason', label: 'Reason', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'remarks', label: 'Remarks', type: 'textarea' },
    ]}
    tableColumns={[
      { key: 'customerId', header: 'Customer ID', render: (v) => <span className="font-medium">{v || '-'}</span> },
      { key: 'customerName', header: 'Customer Name' },
      { key: 'refundAmount', header: 'Amount', render: (v) => <span className="text-danger-600 font-medium">{formatCurrency(v)}</span> },
      { key: 'netPayable', header: 'Net Payable', render: (v) => v > 0 ? formatCurrency(v) : '-' },
      { key: 'paymentMode', header: 'Payment Mode' },
      { key: 'reason', header: 'Reason' },
      { key: 'date', header: 'Date', render: (v) => formatDate(v) },
      { key: 'uploadedDate', header: 'Uploaded Date' },
      { key: 'managerApproval', header: 'Approval', render: (v) => <ApprovalBadge status={v} /> },
      { key: 'refundStatus', header: 'Refund Status', render: (v) => <StatusBadge status={v} /> },
    ]}
  />
);

export const DriveTrackList = () => (
  <ModuleList
    moduleKey="drive"
    title="Drive Track / Porter"
    subtitle="Manage driver payments and porter expenses"
    amountField="amount"
    formFields={[
      { name: 'paymentMode', label: 'Payment Mode', type: 'select', required: true, options: [
        { value: '', label: 'Select Payment Mode' },
        { value: PAYMENT_MODES.IDFC_BANK, label: 'IDFC Bank' },
        { value: PAYMENT_MODES.CASHFREE, label: 'Cashfree' },
      ]},
      { name: 'dueDate', label: 'Due Date', type: 'date' },
      { name: 'driverName', label: 'Driver Name', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'distance', label: 'Distance (km)' },
      { name: 'amount', label: 'Amount (₹)', type: 'number', required: true },
      { name: 'tdsPercentage', label: 'TDS %', type: 'number', placeholder: '0' },
      { name: 'tdsAmount', label: 'TDS Amount (₹)', type: 'number', readOnly: true },
      { name: 'netPayable', label: 'Net Payable (₹)', type: 'number', readOnly: true },
      { name: 'driverPaymentMode', label: 'Driver Payment Mode', type: 'select', options: [
        { value: 'Cash', label: 'Cash' },
        { value: 'UPI', label: 'UPI' },
        { value: 'Bank Transfer', label: 'Bank Transfer' },
      ]},
      { name: 'remarks', label: 'Remarks', type: 'textarea' },
    ]}
    tableColumns={[
      { key: 'driverName', header: 'Driver', render: (v) => <span className="font-medium">{v || '-'}</span> },
      { key: 'date', header: 'Date', render: (v) => formatDate(v) },
      { key: 'distance', header: 'Distance' },
      { key: 'amount', header: 'Amount', render: (v) => formatCurrency(v) },
      { key: 'netPayable', header: 'Net Payable', render: (v) => v > 0 ? formatCurrency(v) : '-' },
      { key: 'paymentMode', header: 'Payment Mode' },
      { key: 'driverPaymentMode', header: 'Driver Payment' },
      { key: 'managerApproval', header: 'Approval', render: (v) => <ApprovalBadge status={v} /> },
      { key: 'paymentStatus', header: 'Payment', render: (v) => <StatusBadge status={v} /> },
    ]}
  />
);

export const ReviewsList = () => (
  <ModuleList
    moduleKey="reviews"
    title="Reviews"
    subtitle="Track review payments and ratings"
    amountField="amount"
    formFields={[
      { name: 'paymentMode', label: 'Payment Mode', type: 'select', required: true, options: [
        { value: '', label: 'Select Payment Mode' },
        { value: PAYMENT_MODES.IDFC_BANK, label: 'IDFC Bank' },
        { value: PAYMENT_MODES.CASHFREE, label: 'Cashfree' },
      ]},
      { name: 'dueDate', label: 'Due Date', type: 'date' },
      { name: 'city', label: 'City', required: true },
      { name: 'rating', label: 'Rating (1-5)', type: 'number', required: true },
      { name: 'amount', label: 'Amount (₹)', type: 'number', required: true },
      { name: 'tdsPercentage', label: 'TDS %', type: 'number', placeholder: '0' },
      { name: 'tdsAmount', label: 'TDS Amount (₹)', type: 'number', readOnly: true },
      { name: 'netPayable', label: 'Net Payable (₹)', type: 'number', readOnly: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'remarks', label: 'Remarks', type: 'textarea' },
    ]}
    tableColumns={[
      { key: 'city', header: 'City', render: (v) => <span className="font-medium">{v || '-'}</span> },
      { key: 'rating', header: 'Rating', render: (v) => (
        <span className="flex items-center gap-1">
          {[1,2,3,4,5].map(i => (
            <span key={i} className={i <= v ? 'text-yellow-400' : 'text-gray-300'}>★</span>
          ))}
        </span>
      )},
      { key: 'date', header: 'Date', render: (v) => formatDate(v) },
      { key: 'amount', header: 'Amount', render: (v) => formatCurrency(v) },
      { key: 'netPayable', header: 'Net Payable', render: (v) => v > 0 ? formatCurrency(v) : '-' },
      { key: 'paymentMode', header: 'Payment Mode' },
      { key: 'managerApproval', header: 'Approval', render: (v) => <ApprovalBadge status={v} /> },
      { key: 'paymentStatus', header: 'Payment', render: (v) => <StatusBadge status={v} /> },
    ]}
  />
);

export default ModuleList;
