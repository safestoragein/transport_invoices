/**
 * Test: fileUploadService.js
 * Tests upload, getUrl, and delete with mocked Supabase storage
 */

jest.mock('../services/supabaseClient', () => ({
  supabase: {
    storage: {
      from: jest.fn(),
    },
  },
}));

import { uploadInvoiceFile, getInvoiceFileUrl, deleteInvoiceFile } from '../services/fileUploadService';
import { supabase } from '../services/supabaseClient';

describe('uploadInvoiceFile', () => {
  beforeEach(() => jest.clearAllMocks());

  test('uploads file and returns path', async () => {
    supabase.storage.from.mockReturnValue({
      upload: jest.fn().mockResolvedValue({ error: null }),
    });

    const file = { name: 'invoice.pdf' };
    const path = await uploadInvoiceFile(file, 'BILL-1');

    expect(path).toMatch(/^BILL-1\/\d+\.pdf$/);
    expect(supabase.storage.from).toHaveBeenCalledWith('invoice-attachments');
  });

  test('uses correct file extension', async () => {
    supabase.storage.from.mockReturnValue({
      upload: jest.fn().mockResolvedValue({ error: null }),
    });

    const path = await uploadInvoiceFile({ name: 'photo.jpg' }, 'BILL-2');
    expect(path).toMatch(/\.jpg$/);
  });

  test('throws on upload error', async () => {
    supabase.storage.from.mockReturnValue({
      upload: jest.fn().mockResolvedValue({ error: { message: 'Upload failed' } }),
    });

    await expect(uploadInvoiceFile({ name: 'test.pdf' }, 'BILL-3'))
      .rejects.toEqual({ message: 'Upload failed' });
  });
});

describe('getInvoiceFileUrl', () => {
  test('returns public URL for valid path', () => {
    supabase.storage.from.mockReturnValue({
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/invoice.pdf' },
      }),
    });

    const url = getInvoiceFileUrl('BILL-1/123.pdf');
    expect(url).toBe('https://storage.example.com/invoice.pdf');
  });

  test('returns null for empty path', () => {
    expect(getInvoiceFileUrl(null)).toBeNull();
    expect(getInvoiceFileUrl('')).toBeNull();
    expect(getInvoiceFileUrl(undefined)).toBeNull();
  });

  test('returns null when publicUrl is missing', () => {
    supabase.storage.from.mockReturnValue({
      getPublicUrl: jest.fn().mockReturnValue({ data: {} }),
    });

    expect(getInvoiceFileUrl('path')).toBeNull();
  });
});

describe('deleteInvoiceFile', () => {
  beforeEach(() => jest.clearAllMocks());

  test('deletes file successfully', async () => {
    const removeFn = jest.fn().mockResolvedValue({ error: null });
    supabase.storage.from.mockReturnValue({ remove: removeFn });

    await deleteInvoiceFile('BILL-1/123.pdf');
    expect(removeFn).toHaveBeenCalledWith(['BILL-1/123.pdf']);
  });

  test('skips delete for empty path', async () => {
    await deleteInvoiceFile(null);
    await deleteInvoiceFile('');
    expect(supabase.storage.from).not.toHaveBeenCalled();
  });

  test('throws on delete error', async () => {
    supabase.storage.from.mockReturnValue({
      remove: jest.fn().mockResolvedValue({ error: { message: 'Not found' } }),
    });

    await expect(deleteInvoiceFile('bad/path'))
      .rejects.toEqual({ message: 'Not found' });
  });
});
