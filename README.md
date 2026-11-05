# Refined VTOP (VTOP Quick Navigation & Spotlight)

> A lightweight, zero-side-effects Manifest V3 browser extension for VIT's VTOP student portal (Vellore, Chennai, Bhopal, AP) that injects a stealth 1-click Quick Dock directly into the top navbar, adds a Raycast-style `Ctrl + K` / `Cmd + K` Spotlight Search, and includes a smart navigation queue to prevent VTOP from dropping requests or freezing.

---

## 🌟 Core Features

1. **Pinned Quick Dock in Top Navbar**:
   - Injects a row of 1-click pills directly into the top bar:
     - `📚 Course Page`
     - `📊 Attendance`
     - `📅 Timetable`
     - `📝 Digital Assignments`
     - `🎯 Marks & Grades`
     - `⚡ Spotlight (⌘K)`
   - Never suffer through the cursed 5-column hover mega-menu again.
   - Encapsulated inside a **Closed Shadow DOM** (`mode: 'closed'`) so it is 100% invisible to page scripts.

2. **`Ctrl + K` / `Cmd + K` Spotlight Command Palette**:
   - Press `Ctrl + K` (Windows/Linux) or `Cmd + K` (Mac) anywhere on VTOP.
   - Fuzzy search through all 35+ VTOP routes and sub-pages instantly.
   - Full keyboard navigation (`↑` / `↓` to navigate, `Enter` to open, `Esc` to dismiss).

3. **Smart Navigation Queue & Anti-Freeze Lock**:
   - Monitors VTOP's native `div.blockUI` and `.blockOverlay`.
   - If you click another link while a page is still loading, it queues the action smoothly instead of crashing VTOP's Spring Security CSRF session.
   - Auto-unblock watchdog: If VTOP's server hangs for >3.8s, automatically clears stuck overlays so you never need to refresh (`F5`).

4. **Mega-Menu Dismiss (`Esc` & Click-Outside)**:
   - Dismiss open mega-menu drawers by clicking anywhere outside or pressing `Escape`.
   - Includes an explicit `✕` close button on each drawer.

5. **Zero Side-Effects on Page Content**:
   - Does not alter VTOP's native tables, forms, or dashboard HTML.
   - Stays completely dormant on pre-login and login pages.

---

## 📁 File Structure

```
vtop-ui-redesign/
├── manifest.json              # Manifest V3 specification
├── README.md                  # Documentation and install guide
├── icons/                     # Extension branding icons
│   ├── icon.svg
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── src/
    ├── background/
    │   └── service-worker.js  # Global shortcut handler (Ctrl+K/Cmd+K)
    ├── content/
    │   ├── content.js         # Content script bootstrap and SPA observers
    │   └── content.css        # Scoped Quick Dock & Spotlight styling
    ├── modules/
    │   ├── stealth-host.js    # Closed Shadow DOM isolation boundary
    │   ├── crawler.js         # Dynamic DOM mega-menu indexer & click delegator
    │   ├── menu-drawer.js     # Mega-menu click-outside & Escape dismiss
    │   ├── quick-dock.js      # Pinned top navbar pills injector & smart queue
    │   └── command-palette.js # Raycast-style Ctrl+K search modal
    ├── utils/
    │   ├── dom.js             # Resilient DOM query & event simulation
    │   └── storage.js         # Chrome storage sync helper
    └── popup/
        ├── popup.html         # Extension popup control panel
        ├── popup.css          # Minimalist settings panel styling
        └── popup.js           # Live toggle switches and quick triggers
```

---

## 🚀 Installation & Usage

1. Open your Chromium-based browser (`chrome://extensions/` or `brave://extensions/`).
2. Toggle **Developer mode** ON (top-right).
3. Click **"Load unpacked"** (top-left).
4. Select the project folder:
   ```text
   C:\Users\Omkar Joshi\Desktop\VTOP_Extention\vtop-ui-redesign
   ```
5. Log into VTOP Vellore (`vtop.vit.ac.in`). The floating Quick Dock will activate seamlessly in the top header.
