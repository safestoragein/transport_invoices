import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from '../../../hooks';
import { FormField, Select, TextArea, FormRow, Button } from '../../common';
import InvoiceUpload from '../../common/InvoiceUpload';
import { calculateProfitLoss } from '../../../utils/calculations';
import { formatCurrency } from '../../../utils/formatters';
import { uploadInvoiceFile, getInvoiceFileUrl } from '../../../services/fileUploadService';

/**
 * TransportForm - Form for creating/editing transport invoices
 */
const TransportForm = ({ initialData, onSubmit, onCancel, loading }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const validate = (values) => {
    const errors = {};
    if (!values.invoiceNumber?.trim()) errors.invoiceNumber = 'Invoice number is required';
    if (!values.vendorName?.trim()) errors.vendorName = 'Vendor name is required';
    if (!values.invoiceDate) errors.invoiceDate = 'Invoice date is required';
    if (!values.invoiceAmount && values.invoiceAmount !== 0) errors.invoiceAmount = 'Invoice amount is required';
    if (values.invoiceAmount && isNaN(Number(values.invoiceAmount))) errors.invoiceAmount = 'Must be a valid number';
    return errors;
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setMultipleValues,
    getFieldError,
  } = useForm(
    initialData || {
      invoiceNumber: '',
      vendorName: '',
      city: '',
      invoiceDate: '',
      packingMaterial: '',
      receivedAmount: '',
      invoiceAmount: '',
      profitLoss: '',
      remarks: '',
      attachmentUrl: '',
    },
    {
      validate,
      onSubmit: async (data) => {
        let attachmentUrl = data.attachmentUrl || '';

        // Upload file if one is selected
        if (selectedFile) {
          try {
            setUploading(true);
            const path = await uploadInvoiceFile(selectedFile, data.invoiceNumber || 'draft');
            attachmentUrl = getInvoiceFileUrl(path) || path;
          } catch (err) {
            console.error('File upload failed:', err);
            // Continue with submission even if upload fails
          } finally {
            setUploading(false);
          }
        }

        onSubmit({
          ...data,
          packingMaterial: parseFloat(data.packingMaterial) || 0,
          receivedAmount: parseFloat(data.receivedAmount) || 0,
          invoiceAmount: parseFloat(data.invoiceAmount) || 0,
          profitLoss: parseFloat(data.profitLoss) || 0,
          attachmentUrl,
        });
      },
    }
  );

  // Auto-calculate P/L when amounts change
  useEffect(() => {
    const packing = parseFloat(values.packingMaterial) || 0;
    const received = parseFloat(values.receivedAmount) || 0;
    const invoice = parseFloat(values.invoiceAmount) || 0;
    const pl = calculateProfitLoss(received, packing, invoice);
    setFieldValue('profitLoss', pl.toFixed(2));
  }, [values.packingMaterial, values.receivedAmount, values.invoiceAmount, setFieldValue]);

  const profitLossValue = parseFloat(values.profitLoss) || 0;

  // Handle OCR extracted data
  const handleOcrExtracted = useCallback((data) => {
    const updates = {};
    if (data.invoiceNumber) updates.invoiceNumber = data.invoiceNumber;
    if (data.vendorName) updates.vendorName = data.vendorName;
    if (data.invoiceDate) updates.invoiceDate = data.invoiceDate;
    if (data.invoiceAmount) updates.invoiceAmount = data.invoiceAmount;
    if (data.receivedAmount) updates.receivedAmount = data.receivedAmount;
    if (data.packingMaterial) updates.packingMaterial = data.packingMaterial;

    if (Object.keys(updates).length > 0) {
      setMultipleValues(updates);
    }
  }, [setMultipleValues]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Invoice Upload & OCR Section */}
      <InvoiceUpload
        onExtracted={handleOcrExtracted}
        onFileSelected={setSelectedFile}
        existingAttachment={initialData?.attachmentUrl}
      />

      <FormRow columns={2}>
        <FormField
          label="Invoice Number"
          name="invoiceNumber"
          value={values.invoiceNumber}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getFieldError('invoiceNumber')}
          placeholder="Enter invoice number"
          required
        />
        <FormField
          label="Vendor Name"
          name="vendorName"
          value={values.vendorName}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getFieldError('vendorName')}
          placeholder="Enter vendor name"
          required
        />
      </FormRow>

      <FormRow columns={2}>
        <FormField
          label="City"
          name="city"
          value={values.city}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getFieldError('city')}
          placeholder="Enter city"
        />
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
      </FormRow>

      <FormRow columns={2}>
        <FormField
          label="Packing Material (₹)"
          name="packingMaterial"
          type="number"
          value={values.packingMaterial}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getFieldError('packingMaterial')}
          placeholder="0.00"
          step="0.01"
          min="0"
        />
        <FormField
          label="Received from Customer (₹)"
          name="receivedAmount"
          type="number"
          value={values.receivedAmount}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getFieldError('receivedAmount')}
          placeholder="0.00"
          step="0.01"
          min="0"
        />
      </FormRow>

      <FormRow columns={2}>
        <FormField
          label="Invoice Amount (₹)"
          name="invoiceAmount"
          type="number"
          value={values.invoiceAmount}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getFieldError('invoiceAmount')}
          placeholder="0.00"
          step="0.01"
          min="0"
          required
        />
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            P/L (₹) <span className="text-xs text-gray-500">(Auto-calculated)</span>
          </label>
          <div
            className={`
              w-full px-4 py-3 border rounded-lg font-semibold
              ${profitLossValue >= 0
                ? 'bg-success-50 border-success-200 text-success-700'
                : 'bg-danger-50 border-danger-200 text-danger-700'
              }
            `}
          >
            {profitLossValue >= 0 ? '+' : ''}{formatCurrency(profitLossValue, false)}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            P/L = Received - Packing Material - Invoice Amount
          </p>
        </div>
      </FormRow>

      <TextArea
        label="Remarks"
        name="remarks"
        value={values.remarks}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Enter any remarks..."
        rows={3}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="success" loading={loading || uploading}>
          {uploading ? 'Uploading...' : initialData ? 'Update Invoice' : 'Submit Invoice'}
        </Button>
      </div>
    </form>
  );
};

export default TransportForm;
