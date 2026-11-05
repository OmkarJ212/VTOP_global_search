/**
 * Refined VTOP - Popup Controller
 * Connects UI toggles with chrome.storage and broadcasts live updates to active tab.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const { Storage } = window.RefinedVTOP;

  // DOM Elements
  const quickDockToggle = document.getElementById('toggle-quick-dock');
  const paletteToggle = document.getElementById('toggle-command-palette');
  const dismissToggle = document.getElementById('toggle-menu-dismiss');
  const themeSelect = document.getElementById('select-theme');

  // Load current settings
  const settings = await Storage.getSettings();

  if (quickDockToggle) quickDockToggle.checked = settings.enableQuickDock !== false;
  if (paletteToggle) paletteToggle.checked = settings.enableCommandPalette !== false;
  if (dismissToggle) dismissToggle.checked = settings.enableMenuDismiss !== false;
  if (themeSelect) themeSelect.value = settings.theme || 'auto';

  /**
   * Save setting and broadcast to active tab
   */
  async function updateSetting(key, val) {
    const patch = { [key]: val };
    await Storage.saveSettings(patch);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'SETTINGS_UPDATED',
        settings: patch
      }).catch(() => {});
    }
  }

  // Bind change handlers
  quickDockToggle?.addEventListener('change', (e) => {
    updateSetting('enableQuickDock', e.target.checked);
  });

  paletteToggle?.addEventListener('change', (e) => {
    updateSetting('enableCommandPalette', e.target.checked);
  });

  dismissToggle?.addEventListener('change', (e) => {
    updateSetting('enableMenuDismiss', e.target.checked);
  });

  themeSelect?.addEventListener('change', (e) => {
    updateSetting('theme', e.target.value);
  });

  /**
   * Send navigation or trigger action to active tab
   */
  async function triggerAction(actionName) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    if (actionName === 'SPOTLIGHT') {
      chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_COMMAND_PALETTE' }).catch(() => {});
    } else {
      chrome.tabs.sendMessage(tab.id, { action: 'NAVIGATE_TO', targetId: actionName }).catch(() => {});
    }

    window.close();
  }

  // Quick Action Buttons
  document.getElementById('btn-course-page')?.addEventListener('click', () => triggerAction('course-page'));
  document.getElementById('btn-attendance')?.addEventListener('click', () => triggerAction('attendance'));
  document.getElementById('btn-timetable')?.addEventListener('click', () => triggerAction('timetable'));
  document.getElementById('btn-digital-assignment')?.addEventListener('click', () => triggerAction('digital-assignments'));
  document.getElementById('btn-marks')?.addEventListener('click', () => triggerAction('marks-grades'));
  document.getElementById('btn-spotlight')?.addEventListener('click', () => triggerAction('SPOTLIGHT'));
});
