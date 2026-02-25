(function registerQuizIcons(root) {
  const modules = (root.QuizAppModules = root.QuizAppModules || {});

  function getModeIconSvg(iconKey) {
    const icons = {
      oceania:
        '<svg viewBox="0 0 24 24" fill="none"><path d="M3 15c2.1 0 2.1-2 4.2-2s2.1 2 4.2 2 2.1-2 4.2-2 2.1 2 4.2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6 10a3 3 0 1 1 6 0" stroke="currentColor" stroke-width="2"/></svg>',
      northAmerica:
        '<svg viewBox="0 0 24 24" fill="none"><path d="M6 5l4 2 3-1 3 2-1 4 2 3-2 4-5-1-3 1-2-3 1-4-2-3 2-4z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
      southAmerica:
        '<svg viewBox="0 0 24 24" fill="none"><path d="M10 4l4 3-1 3 2 3-1 4-3 3-3-2 1-3-2-3 1-4 2-1z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
      europe:
        '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4l2 3 4 1-2 3 1 4-3 2-2-2-2 2-3-2 1-4-2-3 4-1 2-3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
      islands:
        '<svg viewBox="0 0 24 24" fill="none"><path d="M3 16c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6 15c1-2 2-3 4-3 2 0 3 1 4 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/></svg>',
      mix:
        '<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h5l2 3 2-4 2 7 2-3h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 17h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      all:
        '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"/><path d="M4 12h16M12 4c2 2.2 3 5 3 8s-1 5.8-3 8c-2-2.2-3-5-3-8s1-5.8 3-8z" stroke="currentColor" stroke-width="2"/></svg>',
      random15:
        '<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h5l2 3 2-6 2 10 2-4h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 17h3v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      savedErrors:
        '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4v6c0 4.2-2.5 7.6-8 9-5.5-1.4-8-4.8-8-9V7l8-4z" stroke="currentColor" stroke-width="2"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    };

    return icons[iconKey] || icons.all;
  }

  modules.icons = {
    getModeIconSvg,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
