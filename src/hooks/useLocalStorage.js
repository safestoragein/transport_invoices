import { useState, useEffect, useCallback } from 'react';
import { APP_VERSION, STORAGE_VERSION_KEY } from '../utils/constants';

/**
 * Custom hook for localStorage with versioning and migration support
 * @param {string} key - Storage key
 * @param {*} initialValue - Initial value if no stored value exists
 * @param {object} options - Optional configuration
 * @returns {Array} [storedValue, setValue, removeValue]
 */
export const useLocalStorage = (key, initialValue, options = {}) => {
  const { serialize = JSON.stringify, deserialize = JSON.parse } = options;

  // Get stored value or initial value
  const readValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue, deserialize]);

  const [storedValue, setStoredValue] = useState(readValue);

  // Set value to localStorage
  const setValue = useCallback(
    (value) => {
      try {
        // Allow value to be a function like useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, serialize(valueToStore));

          // Dispatch storage event for cross-tab synchronization
          window.dispatchEvent(
            new StorageEvent('storage', {
              key,
              newValue: serialize(valueToStore),
            })
          );
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serialize, storedValue]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        setStoredValue(initialValue);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes in other tabs
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === key && event.newValue !== null) {
        setStoredValue(deserialize(event.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserialize]);

  return [storedValue, setValue, removeValue];
};

/**
 * Hook to manage app version and trigger migrations
 * @returns {object} { currentVersion, needsMigration, setMigrationComplete }
 */
export const useAppVersion = () => {
  const [storedVersion, setStoredVersion] = useLocalStorage(STORAGE_VERSION_KEY, null);

  const needsMigration = storedVersion !== APP_VERSION;

  const setMigrationComplete = useCallback(() => {
    setStoredVersion(APP_VERSION);
  }, [setStoredVersion]);

  return {
    currentVersion: APP_VERSION,
    storedVersion,
    needsMigration,
    setMigrationComplete,
  };
};

/**
 * Hook for managing array data in localStorage with CRUD operations
 * @param {string} key - Storage key
 * @param {Array} initialValue - Initial array value
 * @returns {object} CRUD operations and data
 */
export const useLocalStorageArray = (key, initialValue = []) => {
  const [items, setItems, removeAll] = useLocalStorage(key, initialValue);

  const addItem = useCallback(
    (item) => {
      const newItem = {
        ...item,
        id: item.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setItems((prev) => [...prev, newItem]);
      return newItem;
    },
    [setItems]
  );

  const updateItem = useCallback(
    (id, updates) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, ...updates, updatedAt: new Date().toISOString() }
            : item
        )
      );
    },
    [setItems]
  );

  const deleteItem = useCallback(
    (id) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    },
    [setItems]
  );

  const getItem = useCallback(
    (id) => {
      return items.find((item) => item.id === id);
    },
    [items]
  );

  const bulkUpdate = useCallback(
    (ids, updates) => {
      setItems((prev) =>
        prev.map((item) =>
          ids.includes(item.id)
            ? { ...item, ...updates, updatedAt: new Date().toISOString() }
            : item
        )
      );
    },
    [setItems]
  );

  const replaceAll = useCallback(
    (newItems) => {
      setItems(newItems);
    },
    [setItems]
  );

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    getItem,
    bulkUpdate,
    replaceAll,
    removeAll,
    count: items.length,
  };
};

export default useLocalStorage;
