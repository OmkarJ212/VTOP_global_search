# VTOP Global Search & Quick Navigation (Refined VTOP)

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
   - Never suffer through the multi-column hover mega-menu again.
   - Encapsulated inside a **Closed Shadow DOM** (`mode: 'closed'`) so it is 100% invisible to page scripts.

2. **`Ctrl + K` / `Cmd + K` Spotlight Command Palette**:
   - Press `Ctrl + K` (Windows/Linux) or `Cmd + K` (Mac) anywhere on VTOP.
   - Fuzzy search through all 35+ VTOP routes and sub-pages instantly in `<0.02ms`.
   - Full keyboard navigation (`↑` / `↓` to navigate, `Enter` to open, `Esc` to dismiss).
   - Acronym search (`da` → Digital Assignments, `tt` → Timetable, `cp` → Course Page) and student keyword synonyms (`bunk`, `attendance`, `marks`, `cgpa`, `slides`, `syllabus`).

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
VTOP_global_search/
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

## 🚀 Installation & Setup

### 1. Download or Clone the Repository
```bash
git clone https://github.com/OmkarJ212/VTOP_global_search.git
```
*Or click **Code** → **Download ZIP** on GitHub and extract the folder to your preferred location.*

### 2. Load into Your Browser
1. Open any Chromium-based browser (Google Chrome, Brave, Microsoft Edge, Arc, Opera):
   - Chrome / Brave: `chrome://extensions/`
   - Edge: `edge://extensions/`
2. Enable **Developer mode** (toggle located in the top-right corner).
3. Click **"Load unpacked"** (top-left).
4. Select the `VTOP_global_search` folder.

### 3. Usage
- Navigate to your campus VTOP portal (e.g. [vtop.vit.ac.in](https://vtop.vit.ac.in)).
- Log in to your student account.
- The floating **Quick Dock** will appear centered in the top header.
- Press <kbd>Ctrl</kbd> + <kbd>K</kbd> (or <kbd>Cmd</kbd> + <kbd>K</kbd> on macOS) anywhere to trigger the **Spotlight Search**.

---

## 🛡️ Privacy & Security
- **100% Client-Side:** Runs completely inside your browser. No external tracking, analytics, or network requests.
- **Stealth Boundary:** Injected elements are encapsulated in a Closed Shadow DOM (`mode: 'closed'`), undetectable by standard page scripts.
- **Session Safe:** Prevents Spring Security token desyncs by serializing rapid navigation requests.
