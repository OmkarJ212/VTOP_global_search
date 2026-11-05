/**
 * Refined VTOP - Menu Crawler
 * Specifically calibrated for VTOP Vellore.
 * Indexes all routes across top-hmenu-bar (MG0001, MG0002, etc.) and quickLinks.
 */

(function () {
  window.RefinedVTOP = window.RefinedVTOP || {};

  // Standard target definitions for Quick Dock with exact VTOP Vellore data-urls and title patterns
  const QUICK_DOCK_DEFS = [
    {
      id: 'course-page',
      title: 'Course Page',
      icon: '📚',
      dataUrl: 'academics/common/CoursePageConsolidated',
      patterns: [/course\s*page(?:\s*consolidated)?/i]
    },
    {
      id: 'attendance',
      title: 'Attendance',
      icon: '📊',
      dataUrl: 'academics/common/StudentAttendance',
      patterns: [/class\s*attendance/i, /^attendance$/i]
    },
    {
      id: 'timetable',
      title: 'Timetable',
      icon: '📅',
      dataUrl: 'academics/common/StudentTimeTable',
      patterns: [/time\s*table/i, /class\s*time\s*table/i]
    },
    {
      id: 'digital-assignments',
      title: 'Digital Assignments',
      icon: '📝',
      dataUrl: 'examinations/StudentDA',
      patterns: [/digital\s*assignment\s*upload/i, /assignment\s*upload/i]
    },
    {
      id: 'marks-grades',
      title: 'Marks & Grades',
      icon: '🎯',
      dataUrl: 'examinations/StudentMarkView',
      fallbackDataUrl: 'examinations/examGradeView/StudentGradeHistory',
      patterns: [/marks/i, /grade\s*history/i, /exam\s*results/i]
    }
  ];

  // Synonym mappings tailored for common student searches
  const COMMON_SYNONYMS = {
    attendance: ['bunk', 'absent', 'present', 'percentage', 'classes', 'att'],
    timetable: ['tt', 'schedule', 'routine', 'slots', 'classes', 'routine'],
    'course page': ['cp', 'materials', 'slides', 'notes', 'syllabus', 'modules'],
    'digital assignment': ['da', 'assignment', 'upload', 'homework', 'submission'],
    mark: ['marks', 'grade', 'grades', 'gpa', 'cgpa', 'cat', 'fat', 'results', 'score'],
    curriculum: ['basket', 'credits', 'degree', 'syllabus'],
    faculty: ['teacher', 'prof', 'professor', 'cabin', 'cabin details'],
    proctor: ['mentor', 'advisor'],
    hostel: ['room', 'mess', 'leave', 'outing', 'warden'],
    biometric: ['punch', 'in out', 'timing'],
    exam: ['fat', 'cat', 'seating', 'hall ticket', 'schedule'],
    registration: ['ffcs', 'add drop', 'wishlist', 'course registration'],
    mooc: ['nptel', 'coursera', 'online courses'],
    pat: ['placement', 'cdc', 'internship', 'jobs', 'recruitment'],
    calendar: ['holidays', 'academic calendar', 'schedule']
  };

  /**
   * Computes acronym from title (e.g. "Course Page Consolidated" -> "cpc", "Digital Assignment" -> "da")
   */
  function extractAcronym(str) {
    return str
      .split(/[\s\-_/]+/)
      .filter(Boolean)
      .map((w) => w[0].toLowerCase())
      .join('');
  }

  /**
   * Finds matching synonyms for a title and data-url
   */
  function findSynonyms(titleLower, urlLower) {
    const matched = [];
    const combined = `${titleLower} ${urlLower}`;
    for (const [key, synonyms] of Object.entries(COMMON_SYNONYMS)) {
      if (combined.includes(key)) {
        matched.push(...synonyms);
      }
    }
    return matched;
  }

  class MenuCrawler {
    constructor() {
      this.indexedItems = [];
      this.quickDockMap = new Map();
      this.lastScanned = 0;
    }

    /**
     * Scan the DOM for all active navigation links in VTOP Vellore
     */
    scan() {
      // Find all menu links in horizontal menu bar, collapse drawers, or quicklinks
      const links = Array.from(
        document.querySelectorAll(
          'a[data-url], .systemB5BtnMenu, .systemBtnMenu, #top-hmenu-bar a, #quickLinks a, nav a'
        )
      );

      const items = [];
      const seenUrls = new Set();

      for (const link of links) {
        const rawText = (link.textContent || '').replace(/\s+/g, ' ').trim();
        const dataUrl = (link.getAttribute('data-url') || '').trim();
        const href = (link.getAttribute('href') || '').trim();

        if (!rawText || rawText.length < 2 || rawText.length > 60) continue;
        if (/logout|sign out|change password/i.test(rawText)) continue;
        if (!dataUrl && (!href || href === '#' || href === 'javascript:void(0);')) continue;

        // Determine parent category (e.g., Academics, Examinations, Hostels)
        let category = 'Academics';
        const collapseParent = link.closest('.hmenubox, .collapse, .card');
        if (collapseParent) {
          const header = collapseParent.querySelector('.fw-bold.h5, h4, .card-title');
          if (header && header.textContent) {
            category = header.textContent.trim();
          }
        }

        const dedupeKey = dataUrl ? dataUrl.toLowerCase() : rawText.toLowerCase();
        if (seenUrls.has(dedupeKey)) continue;
        seenUrls.add(dedupeKey);

        const lowerTitle = rawText.toLowerCase();
        const lowerCat = category.toLowerCase();
        const lowerUrl = dataUrl.toLowerCase();
        const acronym = extractAcronym(rawText);
        const words = lowerTitle.split(/[\s\-_/]+/).filter(Boolean);
        const synonyms = findSynonyms(lowerTitle, lowerUrl);

        items.push({
          title: rawText,
          category,
          dataUrl,
          element: link,
          href: href !== '#' ? href : null,
          lowerTitle,
          lowerCat,
          lowerUrl,
          acronym,
          words,
          synonyms,
          searchTokens: `${lowerTitle} ${lowerCat} ${acronym} ${synonyms.join(' ')} ${lowerUrl}`
        });
      }

      this.indexedItems = items;
      this.lastScanned = Date.now();
      this._resolveQuickDockTargets();
      return this.indexedItems;
    }

    /**
     * Map crawled links to the 5 core Quick Dock actions using exact VTOP Vellore data-urls
     */
    _resolveQuickDockTargets() {
      this.quickDockMap.clear();

      for (const def of QUICK_DOCK_DEFS) {
        let match = null;

        // 1. Prioritize exact data-url matching
        if (def.dataUrl) {
          match = this.indexedItems.find(
            (item) => item.dataUrl && item.dataUrl.toLowerCase() === def.dataUrl.toLowerCase()
          );
        }

        // Fallback data-url
        if (!match && def.fallbackDataUrl) {
          match = this.indexedItems.find(
            (item) => item.dataUrl && item.dataUrl.toLowerCase() === def.fallbackDataUrl.toLowerCase()
          );
        }

        // 2. Fallback to title pattern matching
        if (!match) {
          match = this.indexedItems.find((item) =>
            def.patterns.some((p) => p.test(item.title))
          );
        }

        // 3. Fallback to querying document directly by data-url
        if (!match && def.dataUrl) {
          const directEl = document.querySelector(`a[data-url="${def.dataUrl}"]`);
          if (directEl) {
            match = {
              title: directEl.textContent.trim(),
              category: 'Academics',
              dataUrl: def.dataUrl,
              element: directEl
            };
          }
        }

        this.quickDockMap.set(def.id, {
          ...def,
          targetItem: match,
          isFound: Boolean(match)
        });
      }
    }

    /**
     * Get items prepared for Quick Dock
     */
    getQuickDockItems() {
      if (this.indexedItems.length === 0) {
        this.scan();
      }
      return Array.from(this.quickDockMap.values());
    }

    /**
     * Get all items for Spotlight Search (instant memory lookup)
     */
    getAllItems() {
      if (this.indexedItems.length === 0) {
        this.scan();
      }
      return this.indexedItems;
    }

    /**
     * Safely triggers native navigation for an item
     */
    navigate(item) {
      if (!item || !item.element) return false;
      const DOM = window.RefinedVTOP.DOM;
      return DOM.simulateNativeClick(item.element);
    }
  }

  window.RefinedVTOP.Crawler = new MenuCrawler();
})();
