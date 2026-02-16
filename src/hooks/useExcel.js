import { useState, useCallback } from 'react';
import { excelService } from '../services/excelService';
import { useToast } from '../contexts/ToastContext';
import { useData } from '../contexts/DataContext';

/**
 * Custom hook for Excel import/export operations
 */
const useExcel = (module) => {
  const { success, error: showError } = useToast();
  const { createEntry } = useData();

  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importErrors, setImportErrors] = useState([]);

  /**
   * Export data to Excel
   */
  const exportToExcel = useCallback(
    (data, options = {}) => {
      setExporting(true);

      try {
        const columns = excelService.getModuleExportColumns(module);
        const filename = options.filename || `${module}_export`;

        excelService.exportToExcel(data, {
          filename,
          sheetName: module.charAt(0).toUpperCase() + module.slice(1),
          columns,
          ...options,
        });

        success(`Exported ${data.length} records to Excel`);
      } catch (err) {
        console.error('Export error:', err);
        showError('Failed to export data');
      } finally {
        setExporting(false);
      }
    },
    [module, success, showError]
  );

  /**
   * Read and preview Excel file
   */
  const previewImport = useCallback(
    async (file) => {
      setImporting(true);
      setImportErrors([]);

      try {
        const result = await excelService.readExcelFile(file);
        setImportPreview({
          ...result,
          file,
        });
        return result;
      } catch (err) {
        console.error('Import preview error:', err);
        showError('Failed to read Excel file');
        setImportPreview(null);
        return null;
      } finally {
        setImporting(false);
      }
    },
    [showError]
  );

  /**
   * Import data with column mapping
   */
  const importData = useCallback(
    async (mapping, options = {}) => {
      if (!importPreview) {
        showError('No file selected for import');
        return null;
      }

      setImporting(true);
      setImportErrors([]);

      try {
        // Map data
        const mappedData = excelService.mapImportedData(
          importPreview.rows,
          mapping,
          options
        );

        // Validate
        const schema = excelService.getModuleImportSchema(module);
        const validation = excelService.validateImportedData(mappedData, schema);

        if (!validation.isValid) {
          setImportErrors(validation.errors);
          showError(`Import validation failed: ${validation.invalidCount} invalid rows`);
          return {
            success: false,
            errors: validation.errors,
            imported: 0,
            skipped: validation.invalidCount,
          };
        }

        // Import valid rows
        let imported = 0;
        for (const row of validation.validRows) {
          try {
            await createEntry(module, row);
            imported++;
          } catch (err) {
            console.error('Error importing row:', err);
          }
        }

        success(`Successfully imported ${imported} records`);
        setImportPreview(null);

        return {
          success: true,
          imported,
          skipped: importPreview.totalRows - imported,
        };
      } catch (err) {
        console.error('Import error:', err);
        showError('Failed to import data');
        return null;
      } finally {
        setImporting(false);
      }
    },
    [module, importPreview, createEntry, success, showError]
  );

  /**
   * Clear import state
   */
  const clearImport = useCallback(() => {
    setImportPreview(null);
    setImportErrors([]);
  }, []);

  /**
   * Get suggested column mapping
   */
  const getSuggestedMapping = useCallback(() => {
    if (!importPreview) return {};

    const targetColumns = excelService.getModuleExportColumns(module);
    const sourceHeaders = importPreview.headers;
    const mapping = {};

    sourceHeaders.forEach((header) => {
      const headerLower = header.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Find matching target column
      const match = targetColumns.find((col) => {
        const targetLower = col.header.toLowerCase().replace(/[^a-z0-9]/g, '');
        const keyLower = col.key.toLowerCase().replace(/[^a-z0-9]/g, '');
        return headerLower === targetLower || headerLower === keyLower;
      });

      if (match) {
        mapping[header] = match.key;
      }
    });

    return mapping;
  }, [module, importPreview]);

  return {
    // State
    importing,
    exporting,
    importPreview,
    importErrors,
    // Actions
    exportToExcel,
    previewImport,
    importData,
    clearImport,
    // Utilities
    getSuggestedMapping,
    getExportColumns: () => excelService.getModuleExportColumns(module),
    getImportSchema: () => excelService.getModuleImportSchema(module),
  };
};

export default useExcel;
