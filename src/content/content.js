/**
 * Refined VTOP - Main Content Script
 * Orchestrates Stealth Quick Dock, Spotlight Search, and Mega-Menu Dismiss.
 * Zero-side-effects architecture: Does not alter native VTOP page styles or data.
 */

(function () {
  const {
    Storage,
    DOM,
    StealthHost,
    Crawler,
    QuickDock,
    CommandPalette,
    MenuDrawer
  } = window.RefinedVTOP;

  let currentSettings = { ...Storage.DEFAULT_SETTINGS };
  let isInitialized = false;
  let authObserver = null;

  /**
   * Check if user is actively authenticated in VTOP
   */
  function isUserAuthenticated() {
    if (QuickDock && typeof QuickDock.isAuthenticated === 'function') {
      return QuickDock.isAuthenticated();
    }
    if (window.location.href.includes('/open/login')) return false;
    const hasLoginForm = Boolean(
      document.querySelector(
        '#loginForm, #vtopLogin, #authLoginBtn, input[name="username"], input[type="password"]'
      )
    );
    if (hasLoginForm) return false;

    const authIdx = document.getElementById('authorizedIDX')?.value?.trim();
    const authId = document.getElementById('authorizedID')?.value?.trim();
    const userDropdown = document.getElementById('navbarDropdown');
    const hmenuBar = document.getElementById('top-hmenu-bar');
    return Boolean(
      ((authIdx && authIdx.length > 2) || (authId && authId.length > 2) || userDropdown) && hmenuBar
    );
  }

  /**
   * Apply user settings to modules
   */
  function applyFeatures() {
    if (!isUserAuthenticated()) {
      QuickDock.destroy();
      return;
    }

    // 1. Theme application for extension components
    applyTheme(currentSettings.theme);

    // 2. Quick Dock
    if (currentSettings.enableQuickDock !== false) {
      QuickDock.mount();
    } else {
      QuickDock.destroy();
    }

    // 3. Mega-Menu Drawer Controller
    if (MenuDrawer && currentSettings.enableMenuDismiss !== false) {
      MenuDrawer.init();
      MenuDrawer.injectCloseButtons();
    }
  }

  /**
   * Theme for extension components
   */
  function applyTheme(theme) {
    const root = document.documentElement;
    root.classList.remove('rvtop-theme-dark', 'rvtop-theme-light');

    if (theme === 'dark') {
      root.classList.add('rvtop-theme-dark');
    } else if (theme === 'light') {
      root.classList.add('rvtop-theme-light');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('rvtop-theme-dark');
      }
    }
  }

  /**
   * Observe SPA page changes to ensure Quick Dock & Menu Drawer stay active
   */
  function setupPageObserver() {
    const debouncedRefresh = DOM.debounce(() => {
      Crawler.scan();
      if (currentSettings.enableQuickDock !== false) QuickDock.mount();
      if (MenuDrawer && currentSettings.enableMenuDismiss !== false) {
        MenuDrawer.injectCloseButtons();
      }
    }, 250);

    const observer = new MutationObserver((mutations) => {
      const hasMeaningfulMutation = mutations.some((m) => {
        const targetId = m.target?.id || '';
        const targetClass = String(m.target?.className || '');
        return (
          !targetId.startsWith('rvtop-') &&
          !targetId.startsWith('vtop-ext-') &&
          !targetClass.includes('rvtop-')
        );
      });

      if (hasMeaningfulMutation) {
        debouncedRefresh();
      }
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Listen for messages from background service worker or popup
   */
  function setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'TOGGLE_COMMAND_PALETTE') {
        if (CommandPalette) CommandPalette.toggle();
        sendResponse({ success: true });
      } else if (message.action === 'NAVIGATE_TO') {
        const items = Crawler.getQuickDockItems();
        let found = items.find((i) => i.id === message.targetId);
        if (!found || !found.targetItem) {
          Crawler.scan();
          found = Crawler.getQuickDockItems().find((i) => i.id === message.targetId);
        }
        if (found) {
          if (QuickDock && typeof QuickDock.requestNavigation === 'function') {
            QuickDock.requestNavigation(found, null);
          } else if (found.targetItem) {
            Crawler.navigate(found.targetItem);
          }
        }
        sendResponse({ success: true });
      } else if (message.action === 'SETTINGS_UPDATED') {
        currentSettings = { ...currentSettings, ...message.settings };
        applyFeatures();
        sendResponse({ success: true });
      }
    });
  }

  /**
   * Watches for authentication state transitions (e.g., student logging in or out)
   */
  function setupAuthWatcher() {
    if (authObserver) return;

    authObserver = new MutationObserver(() => {
      const authenticated = isUserAuthenticated();
      if (authenticated && !isInitialized) {
        console.log('[Refined VTOP] Student session detected. Initializing navigation features...');
        init();
      } else if (!authenticated && isInitialized) {
        console.log('[Refined VTOP] Session ended or login screen. Deactivating...');
        QuickDock.destroy();
        if (CommandPalette && typeof CommandPalette.close === 'function') {
          CommandPalette.close();
        }
        isInitialized = false;
      }
    });

    authObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Main initialization
   */
  async function init() {
    // Start auth watcher regardless of current state
    setupAuthWatcher();

    // Guard: Only initialize when user is logged in
    if (!isUserAuthenticated()) {
      console.log('[Refined VTOP] Public landing or login screen detected, staying dormant.');
      return;
    }

    if (isInitialized) {
      applyFeatures();
      return;
    }

    try {
      currentSettings = await Storage.getSettings();

      // Initialize Closed Shadow DOM Stealth Boundary
      if (StealthHost) StealthHost.init();

      // Pre-warm Command Palette DOM for 0ms cold-start activation
      if (CommandPalette && typeof CommandPalette.init === 'function') {
        CommandPalette.init();
      }

      // Initial crawler scan
      Crawler.scan();

      // Mount active features
      applyFeatures();

      // Listen for runtime changes
      Storage.onChanged((updated) => {
        currentSettings = { ...currentSettings, ...updated };
        applyFeatures();
      });

      setupMessageListeners();
      setupPageObserver();

      isInitialized = true;
      console.log('[Refined VTOP] Quick Navigation active. Press Ctrl+K / Cmd+K for Spotlight.');
    } catch (err) {
      console.error('[Refined VTOP] Initialization error:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
