/* ================================================================
   scripts/philosophies.js — PhiloSoc Directional Scene Controller
   The Four Philosophies:
     0 -> 1: Slide UP from bottom (Stoicism)       [Black bg]
     1 -> 2: Slide IN from right (Existentialism)  [White bg]
     2 -> 3: Slide DOWN from top (Absurdism)       [Black bg]
     3 -> 4: Slide IN from left (Skepticism)       [White bg]
   Reverse:
     Slides retreat along their arrival vectors, revealing previous.
   ================================================================ */

(function () {
  'use strict';

  let currentScene = 0;
  let isTransitioning = false;
  let lastWheelTime = 0;

  const SCENE_COUNT = 5; // 0, 1, 2, 3, 4

  // DOM Elements
  const navEl = document.getElementById('p-nav');
  const progressEl = document.getElementById('p-progress');
  const dots = document.querySelectorAll('.p-pdot');

  const scenes = [
    document.getElementById('scene-0-hero'),
    document.getElementById('scene-1-stoicism'),
    document.getElementById('scene-2-existentialism'),
    document.getElementById('scene-3-absurdism'),
    document.getElementById('scene-4-skepticism')
  ];

  // Scene Tone Map: 0:light, 1:dark, 2:light, 3:dark, 4:light
  const SCENE_TONES = ['light', 'dark', 'light', 'dark', 'light'];

  // Update persistent nav and side indicator tone based on active scene
  function updateTone(sceneIndex) {
    const tone = SCENE_TONES[sceneIndex] || 'light';
    if (navEl) {
      navEl.classList.remove('tone-light', 'tone-dark');
      navEl.classList.add('tone-' + tone);
    }
    if (progressEl) {
      progressEl.classList.remove('tone-light', 'tone-dark');
      progressEl.classList.add('tone-' + tone);
    }
  }

  // Update side progress dots
  function updateDots(sceneIndex) {
    dots.forEach(function (dot) {
      const idx = parseInt(dot.getAttribute('data-scene'), 10);
      if (idx === sceneIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  // Stagger animate child elements inside a newly revealed scene
  function animateSceneEntrance(sceneIndex) {
    if (typeof anime === 'undefined') return;
    const sceneEl = scenes[sceneIndex];
    if (!sceneEl) return;

    if (sceneIndex === 0) {
      anime({
        targets: sceneEl.querySelectorAll('.p-hero-eyebrow, .p-hero-title, .p-hero-rule-wrap, .p-hero-subtitle, .p-hero-directions-grid'),
        opacity: [0, 1],
        translateY: [18, 0],
        delay: anime.stagger(60, { start: 100 }),
        duration: 650,
        easing: 'cubicBezier(0.16, 1, 0.3, 1)'
      });
      return;
    }

    const leftElements = sceneEl.querySelectorAll('.p-col-left > *, .p-absurd-hero-left > *');
    const centerArtwork = sceneEl.querySelector('.p-artwork-container');
    const rightElements = sceneEl.querySelectorAll('.p-col-right > *, .p-absurd-feature-wrap > *, .p-absurd-bottom-row > *');

    // Left Column entrance
    if (leftElements.length > 0) {
      anime({
        targets: leftElements,
        opacity: [0, 1],
        translateY: [16, 0],
        delay: anime.stagger(45, { start: 140 }),
        duration: 580,
        easing: 'cubicBezier(0.16, 1, 0.3, 1)'
      });
    }

    // Center Artwork / Existentialism figure smooth entrance
    if (centerArtwork) {
      anime({
        targets: centerArtwork,
        opacity: [0, 1],
        translateY: [20, 0],
        delay: 180,
        duration: 700,
        easing: 'cubicBezier(0.16, 1, 0.3, 1)'
      });
    }

    // Absurdism Mountain entrance from bottom-right
    const mountainWrap = sceneEl.querySelector('.p-absurd-mountain-wrap');
    if (mountainWrap) {
      anime({
        targets: mountainWrap,
        opacity: [0, 1],
        translateX: [25, 0],
        translateY: [25, 0],
        delay: 160,
        duration: 750,
        easing: 'cubicBezier(0.16, 1, 0.3, 1)'
      });
    }

    // Right Column / Feature entrance
    if (rightElements.length > 0) {
      anime({
        targets: rightElements,
        opacity: [0, 1],
        translateY: [18, 0],
        delay: anime.stagger(55, { start: 220 }),
        duration: 620,
        easing: 'cubicBezier(0.16, 1, 0.3, 1)'
      });
    }
  }

  // Core navigation function
  function goTo(target) {
    if (target < 0 || target >= SCENE_COUNT || target === currentScene || isTransitioning) {
      return;
    }

    isTransitioning = true;
    currentScene = target;

    updateDots(target);
    updateTone(target);

    // Apply active-scene states:
    // Any scene layer <= target (from 1 upwards) should be translated to (0,0,0)
    // Any scene layer > target should have active-scene removed (retreating to off-screen)
    for (let i = 1; i < SCENE_COUNT; i++) {
      const sceneEl = scenes[i];
      if (!sceneEl) continue;

      if (i <= target) {
        sceneEl.classList.add('active-scene');
      } else {
        sceneEl.classList.remove('active-scene');
      }
    }

    // Trigger subtle entrance animations on the arrival scene
    setTimeout(function () {
      animateSceneEntrance(target);
    }, 150);

    // Lockout duration matches the 0.85s CSS transform transition
    setTimeout(function () {
      isTransitioning = false;
    }, 750);
  }

  // ── Wheel Scroll Handler ──
  window.addEventListener('wheel', function (e) {
    const now = performance.now();
    if (now - lastWheelTime < 450 || isTransitioning) return;

    if (e.deltaY > 25) {
      // Scroll DOWN: Advance scene
      if (currentScene < SCENE_COUNT - 1) {
        lastWheelTime = now;
        goTo(currentScene + 1);
      }
    } else if (e.deltaY < -25) {
      // Scroll UP: Previous scene
      if (currentScene > 0) {
        lastWheelTime = now;
        goTo(currentScene - 1);
      }
    }
  }, { passive: true });

  // ── Touch Gesture Handler (Mobile / Tablets) ──
  let touchStartX = 0;
  let touchStartY = 0;

  window.addEventListener('touchstart', function (e) {
    if (e.touches && e.touches.length > 0) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', function (e) {
    if (isTransitioning) return;
    if (!e.changedTouches || e.changedTouches.length === 0) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchStartX - touchEndX;
    const deltaY = touchStartY - touchEndY;

    // Detect dominant swipe axis
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      // Vertical swipe
      if (deltaY > 45) {
        // Swipe UP -> Next scene
        if (currentScene < SCENE_COUNT - 1) goTo(currentScene + 1);
      } else if (deltaY < -45) {
        // Swipe DOWN -> Previous scene
        if (currentScene > 0) goTo(currentScene - 1);
      }
    } else {
      // Horizontal swipe
      if (deltaX > 45) {
        // Swipe LEFT -> Next scene
        if (currentScene < SCENE_COUNT - 1) goTo(currentScene + 1);
      } else if (deltaX < -45) {
        // Swipe RIGHT -> Previous scene
        if (currentScene > 0) goTo(currentScene - 1);
      }
    }
  }, { passive: true });

  // ── Keyboard Navigation ──
  document.addEventListener('keydown', function (e) {
    if (isTransitioning) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      if (currentScene < SCENE_COUNT - 1) goTo(currentScene + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      if (currentScene > 0) goTo(currentScene - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      goTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goTo(SCENE_COUNT - 1);
    }
  });

  // ── DOM Bindings ──
  document.addEventListener('DOMContentLoaded', function () {
    // Initial tone & dots setup
    updateTone(0);
    updateDots(0);

    // Initial entrance animation for Scene 0
    setTimeout(function () {
      animateSceneEntrance(0);
    }, 100);

    // Scroll Cue in Hero -> Go to Scene 1 (Stoicism)
    const scrollCue = document.getElementById('p-scroll-cue');
    if (scrollCue) {
      scrollCue.addEventListener('click', function () {
        goTo(1);
      });
    }

    // Progress dots click
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        const target = parseInt(this.getAttribute('data-scene'), 10);
        goTo(target);
      });
    });

    // In-scene navigation buttons
    document.querySelectorAll('[data-goto]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const target = parseInt(this.getAttribute('data-goto'), 10);
        goTo(target);
      });
    });
  });

  // Expose global API
  window.PhilosophiesApp = {
    goTo: goTo,
    getCurrentScene: function () {
      return currentScene;
    }
  };

})();
