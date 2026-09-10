/* ================================================================
   scripts/main.js
   Keyboard navigation + shared utilities
   ================================================================ */

(function () {
  'use strict';

  // Arrow keys / Space / Page navigation
  document.addEventListener('keydown', (e) => {
    if (!window.Philosoc) return;
    const cur = window.Philosoc.getCurrentScene();

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      window.Philosoc.goTo(Math.min(cur + 1, 4));
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      window.Philosoc.goTo(Math.max(cur - 1, 0));
    }
    if (e.key === 'Home') {
      e.preventDefault();
      window.Philosoc.goTo(0);
    }
    if (e.key === 'End') {
      e.preventDefault();
      window.Philosoc.goTo(4);
    }
  });

})();

