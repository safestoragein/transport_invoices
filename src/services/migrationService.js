import { STORAGE_KEYS, APP_VERSION, STORAGE_VERSION_KEY, STATUS_VALUES } from '../utils/constants';
import storageService from './storageService';

/**
 * Migration Service - Handles data migration between versions
 */
class MigrationService {
  constructor() {
    this.migrations = {
      '1.0.0_to_2.0.0': this.migrateV1ToV2.bind(this),
    };
  }

  /**
   * Check if migration is needed
   * @returns {boolean}
   */
  needsMigration() {
    const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    return storedVersion !== APP_VERSION;
  }

  /**
   * Run all necessary migrations
   * @returns {object} Migration result
   */
  runMigrations() {
    const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    const results = {
      fromVersion: storedVersion,
      toVersion: APP_VERSION,
      migrationsRun: [],
      errors: [],
      success: true,
    };

    try {
      // If no version stored, this is a fresh install or pre-versioning data
      if (!storedVersion) {
        // Check if there's existing data that needs migration
        const hasExistingData = this.checkForExistingData();
        if (hasExistingData) {
          const legacyResult = this.migrateLegacyData();
          results.migrationsRun.push('legacy_to_2.0.0');
          if (!legacyResult.success) {
            results.errors.push(...legacyResult.errors);
          }
        }
      } else if (storedVersion === '1.0.0') {
        const v1Result = this.migrateV1ToV2();
        results.migrationsRun.push('1.0.0_to_2.0.0');
        if (!v1Result.success) {
          results.errors.push(...v1Result.errors);
        }
      }

      // Set new version
      localStorage.setItem(STORAGE_VERSION_KEY, APP_VERSION);
      results.success = results.errors.length === 0;

    } catch (error) {
      results.success = false;
      results.errors.push(error.message);
    }

    return results;
  }

  /**
   * Check for existing data without version
   * @returns {boolean}
   */
  checkForExistingData() {
    // Check for any existing module data
    return Object.values(STORAGE_KEYS).some(key => {
      const data = localStorage.getItem(key);
      return data !== null;
    });
  }

  /**
   * Migrate legacy data (pre-versioning)
   * @returns {object} Migration result
   */
  migrateLegacyData() {
    const result = { success: true, errors: [], migratedRecords: 0 };

    try {
      // Migrate each module's data
      Object.values(STORAGE_KEYS).forEach(key => {
        if (key === STORAGE_KEYS.USER || key === STORAGE_KEYS.AUDIT || key === STORAGE_KEYS.FILTERS) {
          return; // Skip non-module keys
        }

        const data = storageService.get(key, []);
        if (!Array.isArray(data)) return;

        const migratedData = data.map(item => this.migrateItem(item));
        storageService.set(key, migratedData);
        result.migratedRecords += migratedData.length;
      });

    } catch (error) {
      result.success = false;
      result.errors.push(`Legacy migration error: ${error.message}`);
    }

    return result;
  }

  /**
   * Migrate from v1 to v2
   * @returns {object} Migration result
   */
  migrateV1ToV2() {
    const result = { success: true, errors: [], migratedRecords: 0 };

    try {
      // Add approval fields to all module items
      Object.values(STORAGE_KEYS).forEach(key => {
        if (key === STORAGE_KEYS.USER || key === STORAGE_KEYS.AUDIT || key === STORAGE_KEYS.FILTERS) {
          return;
        }

        const data = storageService.get(key, []);
        if (!Array.isArray(data)) return;

        const migratedData = data.map(item => this.migrateItem(item));
        storageService.set(key, migratedData);
        result.migratedRecords += migratedData.length;
      });

    } catch (error) {
      result.success = false;
      result.errors.push(`V1 to V2 migration error: ${error.message}`);
    }

    return result;
  }

  /**
   * Migrate a single item to the new schema
   * @param {object} item - Item to migrate
   * @returns {object} Migrated item
   */
  migrateItem(item) {
    // Ensure all required fields exist
    const migratedItem = {
      ...item,
      // Ensure ID exists
      id: item.id || storageService.generateId(),
      // Add timestamps if missing
      createdAt: item.createdAt || item.uploadedDate || item.submittedAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      // Add approval fields if missing
      status: item.status || STATUS_VALUES.PENDING_APPROVAL,
      // Submission tracking
      submittedBy: item.submittedBy || 'system',
      submittedAt: item.submittedAt || item.createdAt || new Date().toISOString(),
    };

    // Clean up old/duplicate fields
    delete migratedItem.uploaded;
    delete migratedItem.uploadedDate;

    return migratedItem;
  }

  /**
   * Validate migrated data
   * @returns {object} Validation result
   */
  validateMigration() {
    const result = { valid: true, issues: [] };

    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      if (key === STORAGE_KEYS.USER || key === STORAGE_KEYS.AUDIT || key === STORAGE_KEYS.FILTERS) {
        return;
      }

      const data = storageService.get(key, []);
      if (!Array.isArray(data)) {
        result.issues.push(`${name}: Expected array, got ${typeof data}`);
        result.valid = false;
        return;
      }

      data.forEach((item, index) => {
        if (!item.id) {
          result.issues.push(`${name}[${index}]: Missing ID`);
          result.valid = false;
        }
        if (!item.status) {
          result.issues.push(`${name}[${index}]: Missing status`);
        }
        // (managerApproval check removed — single-level workflow)
      });
    });

    return result;
  }

  /**
   * Rollback migration (restore backup)
   * @param {object} backup - Backup data
   * @returns {boolean} Success status
   */
  rollback(backup) {
    try {
      if (!backup) {
        console.error('No backup provided for rollback');
        return false;
      }

      Object.entries(backup).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });

      return true;
    } catch (error) {
      console.error('Rollback failed:', error);
      return false;
    }
  }

  /**
   * Create backup before migration
   * @returns {object} Backup data
   */
  createBackup() {
    const backup = {};

    Object.values(STORAGE_KEYS).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        backup[key] = JSON.parse(item);
      }
    });

    backup._version = localStorage.getItem(STORAGE_VERSION_KEY);
    backup._createdAt = new Date().toISOString();

    return backup;
  }
}

// Export singleton instance
export const migrationService = new MigrationService();
export default migrationService;
