import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from '../../../hooks';
import { FormField, Select, TextArea, FormRow, Button } from '../../common';
import InvoiceUpload from '../../common/InvoiceUpload';
import { calculateTransportFields } from '../../../utils/calculations';
import { formatCurrency } from '../../../utils/formatters';
import { uploadInvoiceFile, getInvoiceFileUrl } from '../../../services/fileUploadService';
import { PAYMENT_MODES } from '../../../utils/constants';

const EMPTY_INVOICE_ROW = { invoiceNumber: '', invoiceDate: '', invoiceAmount: '' };

const TransportForm = ({ initialData, onSubmit, onCancel, loading }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [invoiceRowErrors, setInvoiceRowErrors] = useState([]);

  const buildInitialRows = () => {
    if (initialData?.invoices && Array.isArray(initialData.invoices) && initialData.invoices.length > 0) {
      return initialData.invoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber || '',
        invoiceDate: inv.invoiceDate || '',
        invoiceAmount: inv.invoiceAmount != null ? String(inv.invoiceAmount) : '',
      }));
    }
    if (initialData) {
      return [{
        invoiceNumber: initialData.invoiceNumber || '',
        invoiceDate: initialData.invoiceDate || '',
        invoiceAmount: initialData.invoiceAmount != null ? String(initialData.invoiceAmount) : '',
      }];
    }
    return [{ ...EMPTY_INVOICE_ROW }];
  };

  const [invoiceRows, setInvoiceRows] = useState(buildInitialRows);

  const invoiceSum = invoiceRows.reduce(
    (sum, row) => sum + (parseFloat(row.invoiceAmount) || 0), 0
  );

  const validate = (values) => {
    const errors = {};
    if (!values.vendorName?.trim()) errors.vendorName = 'Vendor name is required';
    if (!values.paymentMode) errors.paymentMode = 'Payment mode is required';
    return errors;
  };

  const validateInvoiceRows = () => {
    const rowErrors = invoiceRows.map((row) => {
      const err = {};
      if (!row.invoiceNumber?.trim()) err.invoiceNumber = 'Required';
      if (!row.invoiceAmount && row.invoiceAmount !== 0 && row.invoiceAmount !== '0') err.invoiceAmount = 'Required';
      if (row.invoiceAmount && isNaN(Number(row.invoiceAmount))) err.invoiceAmount = 'Invalid';
      return err;
    });
    setInvoiceRowErrors(rowErrors);
    return rowErrors.every((e) => Object.keys(e).length === 0);
  };

  const {
    values, errors, touched, handleChange, handleBlur,
    handleSubmit: formHandleSubmit, setFieldValue, setMultipleValues, getFieldError,
  } = useForm(
    initialData
      ? {
          ...initialData,
          invoiceNumber: initialData.invoiceNumber || '',
          invoiceAmount: initialData.invoiceAmount != null ? String(initialData.invoiceAmount) : '',
          invoiceDate: initialData.invoiceDate || '',
          tdsApplicable: initialData.tdsApplicable || false,
          penaltyAmount: initialData.penaltyAmount != null ? String(initialData.penaltyAmount) : '0',
          vendorNote: initialData.vendorNote || '',
        }
      : {
          invoiceNumber: '', vendorName: '', vendorNote: '', city: '',
          invoiceDate: '', paymentMode: '', dueDate: '',
          packingMaterial: '', receivedAmount: '', invoiceAmount: '',
          profitLoss: '', tdsApplicable: false, tdsPercentage: '',
          tdsAmount: '', netPayable: '', penaltyAmount: '0',
          finalPayable: '', remarks: '', attachmentUrl: '',
        },
    {
      validate,
      onSubmit: async (data) => {
        if (!validateInvoiceRows()) return;

        let attachmentUrl = data.attachmentUrl || '';
        setUploadError(null);

        if (selectedFile) {
          try {
            setUploading(true);
            const invoiceNum = invoiceRows[0]?.invoiceNumber || data.invoiceNumber || 'draft';
            const path = await uploadInvoiceFile(selectedFile, invoiceNum);
            attachmentUrl = getInvoiceFileUrl(path) || path;
          } catch (err) {
            setUploadError(`File upload failed: ${err.message || 'Please try again'}`);
            setUploading(false);
            return;
          } finally {
            setUploading(false);
          }
        }

        const invoices = invoiceRows.map((row) => ({
          invoiceNumber: row.invoiceNumber,
          invoiceDate: row.invoiceDate,
          invoiceAmount: parseFloat(row.invoiceAmount) || 0,
        }));

        const totalInvoiceAmount = invoices.reduce((s, r) => s + r.invoiceAmount, 0);

        onSubmit({
          ...data,
          invoiceNumber: invoices[0]?.invoiceNumber || '',
          invoiceDate: invoices[0]?.invoiceDate || '',
          invoiceAmount: totalInvoiceAmount,
          invoices,
          packingMaterial: parseFloat(data.packingMaterial) || 0,
          receivedAmount: parseFloat(data.receivedAmount) || 0,
          tdsApplicable: Boolean(data.tdsApplicable),
          tdsPercentage: parseFloat(data.tdsPercentage) || 0,
          tdsAmount: parseFloat(data.tdsAmount) || 0,
          penaltyAmount: parseFloat(data.penaltyAmount) || 0,
          finalPayable: parseFloat(data.finalPayable) || 0,
          profitLoss: parseFloat(data.profitLoss) || 0,
          netPayable: parseFloat(data.finalPayable) || 0,
          attachmentUrl,
        });
      },
    }
  );

  // Sync invoiceAmount
  useEffect(() => {
    setFieldValue('invoiceAmount', invoiceSum.toFixed(2));
  }, [invoiceSum, setFieldValue]);

  // Sync invoiceNumber from first row
  useEffect(() => {
    if (invoiceRows[0]) {
      setFieldValue('invoiceNumber', invoiceRows[0].invoiceNumber);
      setFieldValue('invoiceDate', invoiceRows[0].invoiceDate);
    }
  }, [invoiceRows, setFieldValue]);

  // Auto-calculate all transport fields when inputs change
  useEffect(() => {
    const calc = calculateTransportFields({
      invoiceAmount: parseFloat(values.invoiceAmount) || 0,
      tdsApplicable: values.tdsApplicable,
      tdsPercentage: parseFloat(values.tdsPercentage) || 0,
      penaltyAmount: parseFloat(values.penaltyAmount) || 0,
      receivedAmount: parseFloat(values.receivedAmount) || 0,
      packingMaterial: parseFloat(values.packingMaterial) || 0,
    });

    setMultipleValues({
      tdsAmount: calc.tdsAmount.toFixed(2),
      finalPayable: calc.finalPayable.toFixed(2),
      netPayable: calc.finalPayable.toFixed(2),
      profitLoss: calc.profitLoss.toFixed(2),
    });
  }, [values.invoiceAmount, values.tdsPercentage, values.tdsApplicable,
      values.penaltyAmount, values.receivedAmount, values.packingMaterial, setMultipleValues]);

  const profitLossValue = parseFloat(values.profitLoss) || 0;
  const finalPayableValue = parseFloat(values.finalPayable) || 0;

  const updateInvoiceRow = (index, field, value) => {
    setInvoiceRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setInvoiceRowErrors((prev) => {
      if (!prev[index]) return prev;
      const next = [...prev];
      next[index] = { ...next[index] };
      delete next[index][field];
      return next;
    });
  };

  const addInvoiceRow = () => setInvoiceRows((prev) => [...prev, { ...EMPTY_INVOICE_ROW }]);
  const removeInvoiceRow = (index) => {
    setInvoiceRows((prev) => prev.filter((_, i) => i !== index));
    setInvoiceRowErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOcrExtracted = useCallback((data) => {
    const fieldUpdates = {};
    if (data.vendorName) fieldUpdates.vendorName = data.vendorName;
    if (data.receivedAmount) fieldUpdates.receivedAmount = data.receivedAmount;
    if (data.packingMaterial) fieldUpdates.packingMaterial = data.packingMaterial;
    if (Object.keys(fieldUpdates).length > 0) setMultipleValues(fieldUpdates);

    if (data.invoiceNumber || data.invoiceDate || data.invoiceAmount) {
      setInvoiceRows((prev) => {
        const emptyIdx = prev.findIndex((r) => !r.invoiceNumber && !r.invoiceAmount);
        if (emptyIdx >= 0) {
          const next = [...prev];
          next[emptyIdx] = {
            invoiceNumber: data.invoiceNumber || next[emptyIdx].invoiceNumber,
            invoiceDate: data.invoiceDate || next[emptyIdx].invoiceDate,
            invoiceAmount: data.invoiceAmount != null ? String(data.invoiceAmount) : next[emptyIdx].invoiceAmount,
          };
          return next;
        }
        return [...prev, {
          invoiceNumber: data.invoiceNumber || '',
          invoiceDate: data.invoiceDate || '',
          invoiceAmount: data.invoiceAmount != null ? String(data.invoiceAmount) : '',
        }];
      });
    }
  }, [setMultipleValues]);

  return (
    <form onSubmit={formHandleSubmit} className="space-y-4">
      <InvoiceUpload
        onExtracted={handleOcrExtracted}
        onFileSelected={setSelectedFile}
        existingAttachment={initialData?.attachmentUrl}
      />

      <FormRow columns={2}>
        <FormField
          label="Vendor Name" name="vendorName" value={values.vendorName}
          onChange={handleChange} onBlur={handleBlur} error={getFieldError('vendorName')}
          placeholder="Enter vendor name" required
        />
        <FormField
          label="City" name="city" value={values.city}
          onChange={handleChange} onBlur={handleBlur} placeholder="Enter city"
        />
      </FormRow>

      <FormField
        label="Vendor Note (Route / Comments)" name="vendorNote" value={values.vendorNote}
        onChange={handleChange} onBlur={handleBlur} placeholder="Route, advance, comments..."
      />

      <FormRow columns={2}>
        <Select
          label="Payment Mode" name="paymentMode" value={values.paymentMode}
          onChange={handleChange} error={getFieldError('paymentMode')} required
          options={[
            { value: '', label: 'Select Payment Mode' },
            { value: PAYMENT_MODES.IDFC_BANK, label: 'IDFC Bank' },
            { value: PAYMENT_MODES.CASHFREE, label: 'Cashfree' },
          ]}
        />
        <FormField
          label="Due Date" name="dueDate" type="date" value={values.dueDate}
          onChange={handleChange} onBlur={handleBlur}
        />
      </FormRow>

      <FormRow columns={2}>
        <FormField
          label="Packing Material" name="packingMaterial" type="number" value={values.packingMaterial}
          onChange={handleChange} onBlur={handleBlur} placeholder="0.00" step="0.01" min="0"
        />
        <FormField
          label="Received from Customer" name="receivedAmount" type="number" value={values.receivedAmount}
          onChange={handleChange} onBlur={handleBlur} placeholder="0.00" step="0.01" min="0"
        />
      </FormRow>

      {/* Invoice Line Items */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Invoices</h3>
          <Button type="button" size="sm" variant="secondary" onClick={addInvoiceRow}>+ Add Invoice</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-200">
                <th className="pb-2 pr-2 font-medium">Invoice #</th>
                <th className="pb-2 pr-2 font-medium">Date</th>
                <th className="pb-2 pr-2 font-medium text-right">Amount</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {invoiceRows.map((row, idx) => {
                const rowErr = invoiceRowErrors[idx] || {};
                return (
                  <tr key={idx} className="border-b border-gray-100 last:border-b-0">
                    <td className="py-2 pr-2">
                      <input type="text" value={row.invoiceNumber}
                        onChange={(e) => updateInvoiceRow(idx, 'invoiceNumber', e.target.value)}
                        placeholder="INV-001"
                        className={`w-full px-2 py-1.5 text-sm border rounded ${rowErr.invoiceNumber ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="date" value={row.invoiceDate}
                        onChange={(e) => updateInvoiceRow(idx, 'invoiceDate', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" value={row.invoiceAmount}
                        onChange={(e) => updateInvoiceRow(idx, 'invoiceAmount', e.target.value)}
                        placeholder="0.00" step="0.01" min="0"
                        className={`w-full px-2 py-1.5 text-sm border rounded text-right ${rowErr.invoiceAmount ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                      />
                    </td>
                    <td className="py-2 text-center">
                      <button type="button" onClick={() => removeInvoiceRow(idx)}
                        disabled={invoiceRows.length <= 1}
                        className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
          <span className="text-sm font-medium text-gray-600">Total ({invoiceRows.length} invoice{invoiceRows.length !== 1 ? 's' : ''})</span>
          <span className="text-sm font-bold text-gray-900">{formatCurrency(invoiceSum, false)}</span>
        </div>
      </div>

      {/* TDS Section */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">TDS & Deductions</h3>
        <div className="flex items-center gap-3 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={values.tdsApplicable}
              onChange={(e) => setFieldValue('tdsApplicable', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">TDS Applicable</span>
          </label>
        </div>

        {values.tdsApplicable && (
          <FormRow columns={3}>
            <FormField
              label="TDS %" name="tdsPercentage" type="number" value={values.tdsPercentage}
              onChange={handleChange} onBlur={handleBlur} placeholder="0" step="0.01" min="0" max="100"
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">TDS Amount</label>
              <div className="w-full px-4 py-3 border rounded-lg bg-white border-gray-200 text-red-600 font-semibold">
                {formatCurrency(parseFloat(values.tdsAmount) || 0, false)}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount After TDS</label>
              <div className="w-full px-4 py-3 border rounded-lg bg-white border-gray-200 text-gray-700 font-semibold">
                {formatCurrency(invoiceSum - (parseFloat(values.tdsAmount) || 0), false)}
              </div>
            </div>
          </FormRow>
        )}

        <FormRow columns={2}>
          <FormField
            label="Penalty Amount" name="penaltyAmount" type="number" value={values.penaltyAmount}
            onChange={handleChange} onBlur={handleBlur} placeholder="0.00" step="0.01" min="0"
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Final Payable</label>
            <div className="w-full px-4 py-3 border rounded-lg bg-blue-50 border-blue-200 text-blue-700 font-bold text-lg">
              {formatCurrency(finalPayableValue, false)}
            </div>
            <p className="mt-1 text-xs text-gray-500">= Invoice - TDS - Penalty (floor 0)</p>
          </div>
        </FormRow>
      </div>

      {/* Profit/Loss Display */}
      <div className={`p-4 rounded-lg border-2 ${profitLossValue >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-600">Profit / Loss</p>
            <p className="text-xs text-gray-500 mt-1">= Received - Packing - Final Payable</p>
          </div>
          <p className={`text-2xl font-bold ${profitLossValue >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {profitLossValue >= 0 ? '+' : ''}{formatCurrency(profitLossValue, false)}
          </p>
        </div>
      </div>

      <TextArea
        label="Remarks" name="remarks" value={values.remarks}
        onChange={handleChange} onBlur={handleBlur} placeholder="Enter any remarks..." rows={3}
      />

      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{uploadError}</div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="success" loading={loading || uploading}>
          {uploading ? 'Uploading...' : initialData ? 'Update Invoice' : 'Submit Invoice'}
        </Button>
      </div>
    </form>
  );
};

export default TransportForm;
