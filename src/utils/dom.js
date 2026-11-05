/**
 * Refined VTOP - DOM Utilities
 * Robust helpers for dynamic element observation, safe queries, and non-destructive events.
 */

(function () {
  window.RefinedVTOP = window.RefinedVTOP || {};

  const DOM = {
    /**
     * Creates an element with attributes, classes, and children
     */
    createElement(tag, attrs = {}, children = []) {
      const el = document.createElement(tag);

      for (const [key, val] of Object.entries(attrs)) {
        if (key === 'className') {
          el.className = val;
        } else if (key === 'style' && typeof val === 'object') {
          Object.assign(el.style, val);
        } else if (key.startsWith('on') && typeof val === 'function') {
          el.addEventListener(key.slice(2).toLowerCase(), val);
        } else if (key.startsWith('data-')) {
          el.setAttribute(key, val);
        } else {
          el.setAttribute(key, val);
        }
      }

      if (typeof children === 'string') {
        el.textContent = children;
      } else if (Array.isArray(children)) {
        for (const child of children) {
          if (!child) continue;
          if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
          } else if (child instanceof Node) {
            el.appendChild(child);
          }
        }
      } else if (children instanceof Node) {
        el.appendChild(children);
      }

      return el;
    },

    /**
     * Wait for an element to appear in the DOM
     */
    waitForElement(selector, root = document, timeoutMs = 8000) {
      return new Promise((resolve) => {
        const found = root.querySelector(selector);
        if (found) {
          resolve(found);
          return;
        }

        const observer = new MutationObserver(() => {
          const el = root.querySelector(selector);
          if (el) {
            observer.disconnect();
            resolve(el);
          }
        });

        observer.observe(root === document ? document.body || document.documentElement : root, {
          childList: true,
          subtree: true
        });

        setTimeout(() => {
          observer.disconnect();
          resolve(root.querySelector(selector));
        }, timeoutMs);
      });
    },

    /**
     * Safely triggers native click on an element, preserving CSRF and event handlers
     */
    simulateNativeClick(element) {
      if (!element) return false;

      // Scroll into view gently if off-screen
      try {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (e) {}

      // Dispatch full pointer and mouse event lifecycle
      ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach((type) => {
        const evt = new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          view: window
        });
        element.dispatchEvent(evt);
      });

      // Direct fallback if standard click didn't trigger native onclick
      if (typeof element.click === 'function') {
        try {
          element.click();
        } catch (e) {
          console.warn('[Refined VTOP] Direct click fallback caught:', e);
        }
      }

      return true;
    },

    /**
     * Finds elements matching selector whose text contains given keyword(s)
     */
    findElementsByText(selector, textKeywords, root = document) {
      const candidates = Array.from(root.querySelectorAll(selector));
      const keywords = Array.isArray(textKeywords) ? textKeywords : [textKeywords];

      return candidates.filter((el) => {
        const content = (el.textContent || '').trim().toLowerCase();
        return keywords.some((kw) => content.includes(kw.toLowerCase()));
      });
    },

    /**
     * Simple debounce utility
     */
    debounce(fn, waitMs = 250) {
      let timeout;
      return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), waitMs);
      };
    }
  };

  window.RefinedVTOP.DOM = DOM;
})();
