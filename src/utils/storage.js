/**
 * Refined VTOP - Storage Utility
 * Manages user preferences for Quick Dock, Spotlight Search, and Drawer Dismiss.
 */

(function () {
  window.RefinedVTOP = window.RefinedVTOP || {};

  const DEFAULT_SETTINGS = {
    enableQuickDock: true,
    enableCommandPalette: true,
    enableMenuDismiss: true,
    theme: 'auto' // 'light', 'dark', 'auto'
  };

  const Storage = {
    DEFAULT_SETTINGS,

    /**
     * Retrieve all current settings with fallbacks
     */
    async getSettings() {
      return new Promise((resolve) => {
        if (!chrome.storage || !chrome.storage.sync) {
          resolve(DEFAULT_SETTINGS);
          return;
        }
        chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
          if (chrome.runtime.lastError) {
            console.warn('[Refined VTOP] Error reading storage:', chrome.runtime.lastError);
            resolve(DEFAULT_SETTINGS);
          } else {
            resolve({ ...DEFAULT_SETTINGS, ...items });
          }
        });
      });
    },

    /**
     * Save updated settings
     */
    async saveSettings(newSettings) {
      return new Promise((resolve, reject) => {
        if (!chrome.storage || !chrome.storage.sync) {
          resolve();
          return;
        }
        chrome.storage.sync.set(newSettings, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    },

    /**
     * Listen for settings change events
     */
    onChanged(callback) {
      if (!chrome.storage || !chrome.storage.onChanged) return;
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync') {
          const updated = {};
          for (const key of Object.keys(changes)) {
            updated[key] = changes[key].newValue;
          }
          callback(updated);
        }
      });
    }
  };

  window.RefinedVTOP.Storage = Storage;
})();
