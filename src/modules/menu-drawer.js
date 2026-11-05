/**
 * Refined VTOP - Mega-Menu Drawer Controller
 * Handles click-outside, Escape key, backdrop overlay, and close buttons
 * for VTOP's mega-menu drawers (#MG0001, #MG0002, etc.).
 */

(function () {
  window.RefinedVTOP = window.RefinedVTOP || {};

  class MenuDrawerController {
    constructor() {
      this.isInitialized = false;
      this.backdrop = null;
    }

    init() {
      if (this.isInitialized) return;

      this.createBackdrop();
      this.setupGlobalListeners();
      this.injectCloseButtons();
      this.isInitialized = true;
    }

    /**
     * Create a subtle backdrop overlay behind active mega-menus
     */
    createBackdrop() {
      if (document.getElementById('rvtop-drawer-backdrop')) return;

      const DOM = window.RefinedVTOP.DOM;
      this.backdrop = DOM.createElement('div', {
        id: 'rvtop-drawer-backdrop',
        className: 'rvtop-drawer-backdrop',
        onClick: () => this.closeAllDrawers()
      });

      document.body.appendChild(this.backdrop);
    }

    /**
     * Setup click-outside and Escape key handlers
     */
    setupGlobalListeners() {
      // 1. Click outside handler
      document.addEventListener('click', (e) => {
        const openDrawer = document.querySelector('.hmenubox.collapse.show, .collapse.show.hmenuitem');
        if (!openDrawer) return;

        // If click was inside the drawer, or on a navbar menu toggle button, do nothing
        const clickedInsideDrawer = openDrawer.contains(e.target);
        const clickedToggleButton = Boolean(e.target.closest('#top-hmenu-bar .hmenuItem, a[data-bs-toggle="collapse"], a[href^="#MG"]'));

        if (!clickedInsideDrawer && !clickedToggleButton) {
          this.closeDrawer(openDrawer);
        }
      });

      // 2. Escape key handler
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const openDrawer = document.querySelector('.hmenubox.collapse.show, .collapse.show.hmenuitem');
          if (openDrawer) {
            e.preventDefault();
            this.closeDrawer(openDrawer);
          }
        }
      });

      // 3. Watch for drawer open/close to toggle backdrop
      const hmenuBar = document.getElementById('top-hmenu-bar') || document.body;
      const observer = new MutationObserver(() => {
        const hasOpenDrawer = Boolean(document.querySelector('.hmenubox.collapse.show, .collapse.show.hmenuitem'));
        if (this.backdrop) {
          this.backdrop.classList.toggle('rvtop-backdrop-visible', hasOpenDrawer);
        }
      });

      observer.observe(hmenuBar, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true
      });
    }

    /**
     * Injects a modern close (✕) button into each mega-menu drawer
     */
    injectCloseButtons() {
      const drawers = document.querySelectorAll('.hmenubox, div[id^="MG0"]');
      const DOM = window.RefinedVTOP.DOM;

      drawers.forEach((drawer) => {
        if (drawer.querySelector('.rvtop-drawer-close-btn')) return;

        const closeBtn = DOM.createElement(
          'button',
          {
            type: 'button',
            className: 'rvtop-drawer-close-btn',
            title: 'Close menu (Esc)',
            onClick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              this.closeDrawer(drawer);
            }
          },
          '✕'
        );

        drawer.prepend(closeBtn);
      });
    }

    /**
     * Safely closes a drawer using Bootstrap API or class removal
     */
    closeDrawer(drawerElement) {
      if (!drawerElement) return;

      // 1. Try Bootstrap 5 Collapse API
      try {
        if (window.bootstrap?.Collapse) {
          const instance = window.bootstrap.Collapse.getInstance(drawerElement) ||
            new window.bootstrap.Collapse(drawerElement, { toggle: false });
          instance.hide();
        }
      } catch (err) {}

      // 2. Fallback: class removal & aria updates
      drawerElement.classList.remove('show');
      const drawerId = drawerElement.id;
      if (drawerId) {
        const toggleButtons = document.querySelectorAll(`[href="#${drawerId}"], [data-bs-target="#${drawerId}"]`);
        toggleButtons.forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
      }

      if (this.backdrop) {
        this.backdrop.classList.remove('rvtop-backdrop-visible');
      }
    }

    /**
     * Closes all open drawers
     */
    closeAllDrawers() {
      const openDrawers = document.querySelectorAll('.hmenubox.collapse.show, .collapse.show.hmenuitem');
      openDrawers.forEach((d) => this.closeDrawer(d));
    }
  }

  window.RefinedVTOP.MenuDrawer = new MenuDrawerController();
})();
