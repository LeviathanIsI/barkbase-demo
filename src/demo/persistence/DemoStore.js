/**
 * Demo Store - Persistence Layer
 *
 * Manages seed data with localStorage persistence.
 * - New browser session = fresh seed data with recalculated dates
 * - Same session (refresh/new tab) = continues from localStorage
 */

const STORAGE_KEY = 'barkbase-demo-data';
const SESSION_KEY = 'barkbase-demo-session';
const VERSION_KEY = 'barkbase-demo-version';
const CURRENT_VERSION = '21'; // Increment when seed data structure changes

class DemoStore {
  constructor() {
    this.data = null;
    this.sessionId = null;
    this.initialized = false;
  }

  /**
   * Initialize the store with seed data
   * Checks if this is a new session or continuing
   */
  initialize(seedData) {
    // Check for existing session and version
    const storedSession = sessionStorage.getItem(SESSION_KEY);
    const storedVersion = localStorage.getItem(VERSION_KEY);
    const isNewSession = !storedSession;
    const isVersionMismatch = storedVersion !== CURRENT_VERSION;

    // Reset if version changed (seed data structure updated)
    if (isVersionMismatch) {
      console.log('[DemoStore] Version mismatch, resetting to fresh seed data');
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    }

    if (isNewSession || isVersionMismatch) {
      // New browser session - use fresh seed data
      this.sessionId = Date.now().toString();
      sessionStorage.setItem(SESSION_KEY, this.sessionId);
      this.data = this._deepClone(seedData);
      this._persist();
      console.log('[DemoStore] New session initialized with fresh seed data');
    } else {
      // Continuing session - try to load from localStorage
      this.sessionId = storedSession;
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        try {
          this.data = JSON.parse(stored);
          console.log('[DemoStore] Restored data from localStorage');
        } catch (e) {
          console.warn('[DemoStore] Failed to parse stored data, using seed data');
          this.data = this._deepClone(seedData);
          this._persist();
        }
      } else {
        this.data = this._deepClone(seedData);
        this._persist();
      }
    }

    this.initialized = true;
    return this;
  }

  /**
   * Deep clone an object
   */
  _deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Persist current data to localStorage
   */
  _persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('[DemoStore] Failed to persist data:', e);
    }
  }

  /**
   * Get a collection by name
   */
  getCollection(name) {
    return this.data?.[name] || [];
  }

  /**
   * Get the tenant configuration
   */
  getTenant() {
    return this.data?.tenant || null;
  }

  /**
   * Find an item by ID in a collection
   * Checks both 'id' and 'recordId' fields
   */
  getById(collection, id) {
    const items = this.getCollection(collection);
    return items.find(item =>
      item.id === id ||
      item.recordId === id ||
      String(item.id) === String(id) ||
      String(item.recordId) === String(id)
    ) || null;
  }

  /**
   * Find items matching a predicate
   */
  findWhere(collection, predicate) {
    const items = this.getCollection(collection);
    return items.filter(predicate);
  }

  /**
   * Insert a new item into a collection
   */
  insert(collection, item) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }

    const now = new Date().toISOString();
    const newItem = {
      ...item,
      id: item.id || this._generateId(),
      recordId: item.recordId || item.id || this._generateId(),
      tenantId: 'demo-tenant',
      createdAt: item.createdAt || now,
      updatedAt: now,
    };

    this.data[collection].push(newItem);
    this._persist();
    return newItem;
  }

  /**
   * Update an existing item
   */
  update(collection, id, updates) {
    const items = this.getCollection(collection);
    const index = items.findIndex(item =>
      item.id === id ||
      item.recordId === id ||
      String(item.id) === String(id) ||
      String(item.recordId) === String(id)
    );

    if (index === -1) {
      console.warn(`[DemoStore] Item not found: ${collection}/${id}`);
      return null;
    }

    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this._persist();
    return items[index];
  }

  /**
   * Delete an item from a collection
   */
  delete(collection, id) {
    const items = this.getCollection(collection);
    const index = items.findIndex(item =>
      item.id === id ||
      item.recordId === id ||
      String(item.id) === String(id) ||
      String(item.recordId) === String(id)
    );

    if (index === -1) {
      return false;
    }

    items.splice(index, 1);
    this._persist();
    return true;
  }

  /**
   * Reset to fresh seed data
   */
  reset(seedData) {
    this.data = this._deepClone(seedData);
    this._persist();
    console.log('[DemoStore] Reset to seed data');
  }

  /**
   * Generate a unique ID
   */
  _generateId() {
    return `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get next sequence number for a collection (for invoice numbers, etc.)
   */
  getNextSequence(prefix, collection) {
    const items = this.getCollection(collection);
    const existing = items
      .map(item => {
        const match = item.invoiceNumber?.match(new RegExp(`${prefix}(\\d+)`));
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));

    const max = existing.length > 0 ? Math.max(...existing) : 0;
    return `${prefix}${String(max + 1).padStart(5, '0')}`;
  }
}

// Singleton instance
let instance = null;

export const getDemoStore = () => {
  if (!instance) {
    throw new Error('DemoStore not initialized. Call initializeDemoStore first.');
  }
  return instance;
};

export const initializeDemoStore = (seedData) => {
  if (!instance) {
    instance = new DemoStore();
  }
  return instance.initialize(seedData);
};

export const resetDemoStore = (seedData) => {
  if (instance) {
    instance.reset(seedData);
  }
};

export default DemoStore;
