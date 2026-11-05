/**
 * Refined VTOP - Stealth Host Module
 * Creates a Closed Shadow DOM boundary for all extension UI elements.
 * Prevents any page script from discovering, inspecting, or traversing extension components.
 */

(function () {
  window.RefinedVTOP = window.RefinedVTOP || {};

  class StealthHost {
    constructor() {
      this.hostElement = null;
      this.shadowRoot = null;
      this.isInitialized = false;
    }

    /**
     * Initializes the closed shadow root on the page
     */
    init() {
      if (this.isInitialized && this.shadowRoot) return this.shadowRoot;

      // Create a stealth host container
      const host = document.createElement('div');
      host.id = 'vtop-ext-anchor';
      host.style.position = 'fixed';
      host.style.top = '0';
      host.style.left = '0';
      host.style.width = '100%';
      host.style.height = '0';
      host.style.overflow = 'visible';
      host.style.zIndex = '999999';
      host.style.pointerEvents = 'none';

      // Create CLOSED shadow DOM: outside scripts calling host.shadowRoot get null!
      this.shadowRoot = host.attachShadow({ mode: 'closed' });
      this.hostElement = host;

      // Link content.css inside shadow DOM
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = chrome.runtime.getURL('src/content/content.css');
      this.shadowRoot.appendChild(link);

      // Inject the host at the top of document body
      (document.body || document.documentElement).appendChild(host);
      this.isInitialized = true;

      return this.shadowRoot;
    }

    /**
     * Mounts an element securely inside the closed shadow root
     */
    mount(element) {
      if (!this.shadowRoot) this.init();
      this.shadowRoot.appendChild(element);
    }

    /**
     * Gets the closed shadow root
     */
    getRoot() {
      if (!this.shadowRoot) this.init();
      return this.shadowRoot;
    }
  }

  window.RefinedVTOP.StealthHost = new StealthHost();
})();
