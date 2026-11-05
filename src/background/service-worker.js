/**
 * Refined VTOP - Background Service Worker
 * Manages global keyboard shortcuts and configuration defaults.
 */

const DEFAULT_SETTINGS = {
  enableQuickDock: true,
  enableCommandPalette: true,
  enableMenuDismiss: true,
  theme: 'auto'
};

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Refined VTOP] Installed event:', details.reason);
  try {
    const existing = await chrome.storage.sync.get(null);
    const updated = { ...DEFAULT_SETTINGS, ...existing };
    await chrome.storage.sync.set(updated);
    console.log('[Refined VTOP] Settings initialized:', updated);
  } catch (err) {
    console.error('[Refined VTOP] Error initializing settings:', err);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'open_palette') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_COMMAND_PALETTE' }).catch(() => {});
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_SETTINGS') {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
      sendResponse(settings);
    });
    return true;
  }
});
