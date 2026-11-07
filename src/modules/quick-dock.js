/**
 * Refined VTOP - Quick Dock Module
 * Specifically calibrated for VTOP Vellore.
 * Mounted inside Stealth Closed Shadow DOM with True In-Flight Queue & Auto-Unblock Recovery.
 * Eliminates concurrent AJAX requests that crash VTOP's Java Spring MVC sessions.
 */

(function () {
  window.RefinedVTOP = window.RefinedVTOP || {};

  class QuickDock {
    constructor() {
      this.container = null;
      this.isMounted = false;
      this.isInFlight = false;
      this.hasSeenBlockUI = false;
      this.pendingTarget = null;
      this.activePill = null;
      this.stuckWatchdogTimer = null;
      this.fallbackSettleTimer = null;
      this.progressBar = null;

      this.initBlockUIObserver();
    }

    /**
     * Strict verification: returns true ONLY when inside the authenticated student portal
     */
    isAuthenticated() {
      // 1. Definite login/landing page disqualifiers
      if (window.location.href.includes('/open/login')) return false;

      const hasLoginForm = Boolean(
        document.querySelector(
          '#loginForm, #vtopLogin, #authLoginBtn, input[name="username"], input[type="password"]'
        )
      );
      if (hasLoginForm) return false;

      // 2. Positive proof of active student portal session
      const authIdx = document.getElementById('authorizedIDX')?.value?.trim();
      const authId = document.getElementById('authorizedID')?.value?.trim();
      const userDropdown =
        document.getElementById('navbarDropdown') ||
        document.querySelector('.dropdown-toggle[href*="logout"], a[href*="logout"]');
      const hmenuBar = document.getElementById('top-hmenu-bar');

      const hasAuthUser = Boolean(
        (authIdx && authIdx.length > 2) || (authId && authId.length > 2) || userDropdown
      );

      return Boolean(hasAuthUser && hmenuBar);
    }

    /**
     * Watches VTOP's native BlockUI overlay only during extension-initiated in-flight requests
     */
    initBlockUIObserver() {
      const observer = new MutationObserver((mutations) => {
        // Only observe completion if WE triggered a navigation
        if (!this.isInFlight) return;

        const isBlocked = Boolean(document.querySelector('.blockUI, .blockOverlay'));

        if (isBlocked) {
          this.hasSeenBlockUI = true;
        } else if (!isBlocked && this.hasSeenBlockUI) {
          // BlockUI appeared and now finished
          this.hasSeenBlockUI = false;
          this.onNavigationComplete();
        } else if (!isBlocked && !this.hasSeenBlockUI) {
          // Fast settle: if main content container mutated with new view without blockUI
          const mainContent =
            document.getElementById('page_outline') || document.querySelector('main, .page-content');
          if (mainContent && mutations.some((m) => mainContent.contains(m.target))) {
            this.onNavigationComplete();
          }
        }
      });

      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }

    /**
     * Start/Stop in-flight status and update UI indicators
     */
    setInFlight(inFlight) {
      this.isInFlight = inFlight;

      if (this.progressBar) {
        if (inFlight) {
          this.progressBar.classList.add('rvtop-progress-active');
        } else {
          this.progressBar.classList.remove('rvtop-progress-active');
        }
      }

      if (inFlight) {
        clearTimeout(this.stuckWatchdogTimer);
        clearTimeout(this.fallbackSettleTimer);

        // Fallback: if VTOP loaded instantly without showing BlockUI, settle after 450ms
        this.fallbackSettleTimer = setTimeout(() => {
          if (this.isInFlight && !this.hasSeenBlockUI) {
            console.log('[Refined VTOP] Navigation settled via fallback (450ms).');
            this.onNavigationComplete();
          }
        }, 450);

        // Hard watchdog: if BlockUI is stuck for > 3.8s, force unblock recovery
        this.stuckWatchdogTimer = setTimeout(() => {
          if (this.isInFlight) {
            console.warn('[Refined VTOP] VTOP loader stalled (>3.8s). Executing auto-unblock recovery.');
            this.recoverFromStall();
          }
        }, 3800);
      } else {
        clearTimeout(this.stuckWatchdogTimer);
        clearTimeout(this.fallbackSettleTimer);
        this.hasSeenBlockUI = false;
      }
    }

    /**
     * Called when VTOP finishes loading a view
     */
    onNavigationComplete() {
      this.setInFlight(false);

      if (this.activePill) {
        this.activePill.classList.remove('rvtop-pill-loading');
        this.activePill = null;
      }

      if (this.pendingTarget) {
        const next = this.pendingTarget;
        this.pendingTarget = null;

        const root = window.RefinedVTOP.StealthHost.getRoot();
        if (root) {
          const allPills = root.querySelectorAll('.rvtop-pill-btn');
          allPills.forEach((p) => p.classList.remove('rvtop-pill-queued'));
        }

        console.log(`[Refined VTOP] Executing queued navigation: ${next.dockItem.title}`);
        // Crisp 35ms breather to allow Spring MVC CSRF token in memory to sync
        setTimeout(() => {
          this.executeNavigation(next.dockItem, next.pillElement);
        }, 35);
      }
    }

    /**
     * Safe recovery if VTOP backend drops connection or stalls
     */
    recoverFromStall() {
      document.querySelectorAll('.blockUI, .blockOverlay').forEach((el) => el.remove());

      try {
        if (typeof window.unblockGUI === 'function') window.unblockGUI();
        if (typeof window.$?.unblockUI === 'function') window.$.unblockUI();
      } catch (e) {}

      this.onNavigationComplete();
    }

    /**
     * Unified entry point for all navigation requests (pills, spotlight, popup)
     */
    requestNavigation(dockItem, pillElement = null) {
      if (this.isInFlight) {
        console.log(`[Refined VTOP] In-flight request active. Queued: ${dockItem.title}`);

        const root = window.RefinedVTOP.StealthHost.getRoot();
        if (root) {
          const allPills = root.querySelectorAll('.rvtop-pill-btn');
          allPills.forEach((p) => p.classList.remove('rvtop-pill-queued'));
        }

        if (pillElement) {
          pillElement.classList.add('rvtop-pill-queued');
        }

        this.pendingTarget = { dockItem, pillElement };
        return false;
      }

      this.executeNavigation(dockItem, pillElement);
      return true;
    }

    /**
     * Dispatches navigation cleanly through crawler
     */
    executeNavigation(dockItem, pill) {
      const crawler = window.RefinedVTOP.Crawler;
      this.setInFlight(true);
      this.activePill = pill;
      if (pill) pill.classList.add('rvtop-pill-loading');

      if (dockItem.targetItem) {
        crawler.navigate(dockItem.targetItem);
      } else {
        crawler.scan();
        const fresh = crawler.getQuickDockItems().find((i) => i.id === dockItem.id);
        if (fresh && fresh.targetItem) {
          crawler.navigate(fresh.targetItem);
        } else {
          this.onNavigationComplete();
        }
      }
    }

    /**
     * Render and mount Quick Dock & Progress Bar inside Stealth Closed Shadow DOM
     */
    mount() {
      // Guard: Do not mount on public pre-login or login screens
      if (!this.isAuthenticated()) {
        this.destroy();
        return;
      }

      if (this.isMounted && this.container) return;

      const DOM = window.RefinedVTOP.DOM;
      const crawler = window.RefinedVTOP.Crawler;
      const stealth = window.RefinedVTOP.StealthHost;
      const dockItems = crawler.getQuickDockItems();

      // Top linear progress indicator inside shadow DOM
      if (!this.progressBar) {
        this.progressBar = DOM.createElement('div', {
          id: 'rvtop-top-loader',
          className: 'rvtop-top-progress'
        });
        stealth.mount(this.progressBar);
      }

      // Create main dock container (centered floating pill bar)
      const dock = DOM.createElement('div', {
        id: 'rvtop-quick-dock',
        className: 'rvtop-dock-wrapper rvtop-dock-floating'
      });

      const pillsList = DOM.createElement('div', { className: 'rvtop-dock-pills' });

      // Render 5 core action pills
      dockItems.forEach((dockItem) => {
        const pill = DOM.createElement(
          'button',
          {
            className: `rvtop-pill-btn ${!dockItem.isFound ? 'rvtop-pill-unmapped' : ''}`,
            title: dockItem.isFound ? `Open ${dockItem.title}` : `Searching for "${dockItem.title}"`,
            type: 'button',
            onClick: (e) => {
              e.preventDefault();
              this.requestNavigation(dockItem, pill);
            }
          },
          [
            DOM.createElement('span', { className: 'rvtop-pill-icon' }, dockItem.icon),
            DOM.createElement('span', { className: 'rvtop-pill-text' }, dockItem.title),
            DOM.createElement('span', { className: 'rvtop-pill-spinner' })
          ]
        );

        pillsList.appendChild(pill);
      });

      // Quick Spotlight Trigger pill
      const spotlightPill = DOM.createElement(
        'button',
        {
          className: 'rvtop-pill-btn rvtop-pill-spotlight',
          title: 'Open Command Palette (Ctrl+K / Cmd+K)',
          type: 'button',
          onClick: (e) => {
            e.preventDefault();
            if (window.RefinedVTOP.CommandPalette) {
              window.RefinedVTOP.CommandPalette.open();
            }
          }
        },
        [
          DOM.createElement('span', { className: 'rvtop-pill-icon' }, '⚡'),
          DOM.createElement('span', { className: 'rvtop-pill-text' }, 'Search'),
          DOM.createElement('kbd', { className: 'rvtop-kbd-shortcut' }, '⌘K')
        ]
      );

      pillsList.appendChild(spotlightPill);
      dock.appendChild(pillsList);

      // Mount securely inside Closed Shadow DOM
      stealth.mount(dock);

      this.container = dock;
      this.isMounted = true;
    }

    /**
     * Remove dock and progress bar
     */
    destroy() {
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      if (this.progressBar && this.progressBar.parentNode) {
        this.progressBar.parentNode.removeChild(this.progressBar);
      }
      this.container = null;
      this.progressBar = null;
      this.isMounted = false;
    }
  }

  window.RefinedVTOP.QuickDock = new QuickDock();
})();
