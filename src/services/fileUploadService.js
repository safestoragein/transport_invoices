/**
 * File Upload Service - Supabase Storage for invoice attachments
 */
import { supabase } from './supabaseClient';

const BUCKET = 'invoice-attachments';

/**
 * Upload an invoice file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} billId - Bill ID to associate with
 * @returns {Promise<string>} The storage path of the uploaded file
 */
export async function uploadInvoiceFile(file, billId) {
  const ext = file.name.split('.').pop();
  const path = `${billId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;
  return path;
}

/**
 * Get a public URL for an uploaded invoice file
 * @param {string} path - Storage path
 * @returns {string} Public URL
 */
export function getInvoiceFileUrl(path) {
  if (!path) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
}

/**
 * Delete an invoice file from Supabase Storage
 * @param {string} path - Storage path
 */
export async function deleteInvoiceFile(path) {
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
