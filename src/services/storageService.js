import { STORAGE_KEYS, APP_VERSION, STORAGE_VERSION_KEY } from '../utils/constants';

/**
 * Storage Service - Handles all localStorage operations
 */
class StorageService {
  constructor() {
    this.checkVersion();
  }

  /**
   * Check app version and trigger migration if needed
   */
  checkVersion() {
    const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    if (storedVersion !== APP_VERSION) {
      console.log(`App version changed from ${storedVersion} to ${APP_VERSION}`);
      // Migration will be handled by migrationService
    }
  }

  /**
   * Generic get operation
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Stored value or default
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage [${key}]:`, error);
      return defaultValue;
    }
  }

  /**
   * Generic set operation
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage [${key}]:`, error);
      // Handle quota exceeded
      if (error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded();
      }
    }
  }

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage [${key}]:`, error);
    }
  }

  /**
   * Clear all app-related storage
   */
  clearAll() {
    Object.values(STORAGE_KEYS).forEach((key) => {
      this.remove(key);
    });
    this.remove(STORAGE_VERSION_KEY);
  }

  /**
   * Handle quota exceeded error
   */
  handleQuotaExceeded() {
    console.warn('localStorage quota exceeded. Consider clearing old data.');
    // Could implement cleanup of old audit logs, etc.
  }

  // ============ Module-specific operations ============

  /**
   * Get all items for a module
   * @param {string} moduleKey - Module storage key
   * @returns {Array} Array of items
   */
  getModuleData(moduleKey) {
    return this.get(moduleKey, []);
  }

  /**
   * Save all items for a module
   * @param {string} moduleKey - Module storage key
   * @param {Array} data - Array of items
   */
  setModuleData(moduleKey, data) {
    this.set(moduleKey, data);
  }

  /**
   * Add item to a module
   * @param {string} moduleKey - Module storage key
   * @param {object} item - Item to add
   * @returns {object} Added item with ID
   */
  addModuleItem(moduleKey, item) {
    const items = this.getModuleData(moduleKey);
    const newItem = {
      ...item,
      id: item.id || this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.push(newItem);
    this.setModuleData(moduleKey, items);
    return newItem;
  }

  /**
   * Update item in a module
   * @param {string} moduleKey - Module storage key
   * @param {string|number} id - Item ID
   * @param {object} updates - Updates to apply
   * @returns {object|null} Updated item or null
   */
  updateModuleItem(moduleKey, id, updates) {
    const items = this.getModuleData(moduleKey);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;

    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.setModuleData(moduleKey, items);
    return items[index];
  }

  /**
   * Delete item from a module
   * @param {string} moduleKey - Module storage key
   * @param {string|number} id - Item ID
   * @returns {boolean} Success status
   */
  deleteModuleItem(moduleKey, id) {
    const items = this.getModuleData(moduleKey);
    const filtered = items.filter((item) => item.id !== id);
    if (filtered.length === items.length) return false;

    this.setModuleData(moduleKey, filtered);
    return true;
  }

  /**
   * Get single item from a module
   * @param {string} moduleKey - Module storage key
   * @param {string|number} id - Item ID
   * @returns {object|null} Item or null
   */
  getModuleItem(moduleKey, id) {
    const items = this.getModuleData(moduleKey);
    return items.find((item) => item.id === id) || null;
  }

  // ============ User operations ============

  /**
   * Get current user
   * @returns {object|null} User object or null
   */
  getUser() {
    return this.get(STORAGE_KEYS.USER, null);
  }

  /**
   * Set current user
   * @param {object} user - User object
   */
  setUser(user) {
    this.set(STORAGE_KEYS.USER, user);
  }

  /**
   * Clear user session
   */
  clearUser() {
    this.remove(STORAGE_KEYS.USER);
  }

  // ============ Audit operations ============

  /**
   * Get audit logs
   * @param {object} options - Filter options
   * @returns {Array} Array of audit entries
   */
  getAuditLogs(options = {}) {
    const { limit = 100, module, action, userId } = options;
    let logs = this.get(STORAGE_KEYS.AUDIT, []);

    if (module) {
      logs = logs.filter((log) => log.module === module);
    }
    if (action) {
      logs = logs.filter((log) => log.action === action);
    }
    if (userId) {
      logs = logs.filter((log) => log.userId === userId);
    }

    // Sort by timestamp descending and limit
    return logs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Add audit log entry
   * @param {object} entry - Audit entry
   */
  addAuditLog(entry) {
    const logs = this.get(STORAGE_KEYS.AUDIT, []);
    const newEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newEntry);

    // Keep only last 1000 entries to prevent storage overflow
    const trimmedLogs = logs.slice(0, 1000);
    this.set(STORAGE_KEYS.AUDIT, trimmedLogs);
    return newEntry;
  }

  // ============ Filter operations ============

  /**
   * Get saved filters for a module
   * @param {string} module - Module name
   * @returns {object} Filter state
   */
  getModuleFilters(module) {
    const filters = this.get(STORAGE_KEYS.FILTERS, {});
    return filters[module] || {};
  }

  /**
   * Save filters for a module
   * @param {string} module - Module name
   * @param {object} filterState - Filter state to save
   */
  setModuleFilters(module, filterState) {
    const filters = this.get(STORAGE_KEYS.FILTERS, {});
    filters[module] = filterState;
    this.set(STORAGE_KEYS.FILTERS, filters);
  }

  // ============ Utility methods ============

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export all data for backup
   * @returns {object} All stored data
   */
  exportAll() {
    const data = {};
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      data[name] = this.get(key);
    });
    data.version = APP_VERSION;
    data.exportedAt = new Date().toISOString();
    return data;
  }

  /**
   * Import data from backup
   * @param {object} data - Backup data
   * @returns {boolean} Success status
   */
  importAll(data) {
    try {
      Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
        if (data[name] !== undefined) {
          this.set(key, data[name]);
        }
      });
      this.set(STORAGE_VERSION_KEY, APP_VERSION);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   * @returns {object} Storage stats
   */
  getStorageStats() {
    let totalSize = 0;
    const stats = {};

    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      const item = localStorage.getItem(key);
      const size = item ? new Blob([item]).size : 0;
      stats[name] = {
        size,
        sizeFormatted: this.formatBytes(size),
        itemCount: Array.isArray(this.get(key)) ? this.get(key).length : 1,
      };
      totalSize += size;
    });

    return {
      ...stats,
      total: {
        size: totalSize,
        sizeFormatted: this.formatBytes(totalSize),
      },
    };
  }

  /**
   * Format bytes to human readable
   * @param {number} bytes - Bytes
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;
