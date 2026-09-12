/* ================================================================
   scripts/philosophies.js — PhiloSoc Directional & Cinematic Controller
   Taxonomy of Thought:
     0 -> 1: Slide UP from bottom (Stoicism)       [Black bg]
     1 -> 2: Slide IN from right (Existentialism)  [White bg]
     2 -> 3: Slide DOWN from top (Absurdism)       [Black bg]
     3 -> 4: Slide IN from left (Skepticism)       [White bg]
   Cinematic Coin Transitions:
     4 -> 5: Black coin flip & camera rush -> Nihilism [Black bg]
     5 -> 6: Black coin retreat & white coin camera rush -> Optimism [White bg]
     6 -> 7: Dual coin collision & merge into PhiloSoc Logo -> The Duality
   ================================================================ */

(function () {
  'use strict';

  let currentScene = 0;
  let isTransitioning = false;
  let lastWheelTime = 0;

  const SCENE_COUNT = 8; // 0 to 7

  // DOM Elements
  const navEl = document.getElementById('p-nav');
  const progressEl = document.getElementById('p-progress');
  const dots = document.querySelectorAll('.p-pdot');

  // Cinematic Elements
  const cinematicStage = document.getElementById('p-cinematic-stage');
  const curtainEl = document.getElementById('p-transition-curtain');
  const darkCoinEl = document.getElementById('p-actor-dark-coin');
  const whiteCoinEl = document.getElementById('p-actor-white-coin');
  const mergedLogoEl = document.getElementById('p-actor-merged-logo');
  const shockwaveEl = mergedLogoEl ? mergedLogoEl.querySelector('.p-shockwave-ring') : null;
  const mergedDiscEl = mergedLogoEl ? mergedLogoEl.querySelector('.p-merged-disc') : null;

  const scenes = [
    document.getElementById('scene-0-hero'),
    document.getElementById('scene-1-stoicism'),
    document.getElementById('scene-2-existentialism'),
    document.getElementById('scene-3-absurdism'),
    document.getElementById('scene-4-skepticism'),
    document.getElementById('scene-5-nihilism'),
    document.getElementById('scene-6-optimism'),
    document.getElementById('scene-7-duality')
  ];

  // Scene Tone Map: 0:light, 1:dark, 2:light, 3:dark, 4:light, 5:dark, 6:light, 7:hybrid
  const SCENE_TONES = ['light', 'dark', 'light', 'dark', 'light', 'dark', 'light', 'hybrid'];

  // Update persistent nav and side indicator tone based on active scene
  function updateTone(sceneIndex) {
    const tone = SCENE_TONES[sceneIndex] || 'light';
    const isInv = (sceneIndex === 7 && scenes[7] && scenes[7].classList.contains('is-inverted'));
    if (navEl) {
      navEl.classList.remove('tone-light', 'tone-dark', 'tone-hybrid');
      navEl.classList.add('tone-' + tone);
      navEl.classList.toggle('is-inverted', isInv);
    }
    if (progressEl) {
      progressEl.classList.remove('tone-light', 'tone-dark', 'tone-hybrid');
      progressEl.classList.add('tone-' + tone);
      progressEl.classList.toggle('is-inverted', isInv);
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

  // Helper to reset all coin actors immediately (used during direct jump or cleanup)
  function resetCoinActors() {
    if (typeof anime !== 'undefined') {
      if (darkCoinEl) anime.remove(darkCoinEl);
      if (whiteCoinEl) anime.remove(whiteCoinEl);
      if (mergedLogoEl) anime.remove(mergedLogoEl);
      if (shockwaveEl) anime.remove(shockwaveEl);
      if (curtainEl) anime.remove(curtainEl);
    }

    if (currentScene !== 7) {
      if (scenes[7]) scenes[7].classList.remove('is-inverted');
      if (mergedLogoEl) mergedLogoEl.classList.remove('is-inverted');
      if (navEl) navEl.classList.remove('is-inverted');
      if (progressEl) progressEl.classList.remove('is-inverted');
    }

    if (darkCoinEl) {
      darkCoinEl.style.transform = '';
      if (typeof anime !== 'undefined') {
        anime.set(darkCoinEl, { opacity: 0, translateY: '120vh', translateX: '0px', scale: 1, rotateX: 0, rotateY: 0, rotateZ: 0 });
      } else {
        darkCoinEl.style.opacity = '0';
      }
    }
    if (whiteCoinEl) {
      whiteCoinEl.style.transform = '';
      if (typeof anime !== 'undefined') {
        anime.set(whiteCoinEl, { opacity: 0, translateY: '-120vh', translateX: '0px', scale: 1, rotateX: 0, rotateY: 0, rotateZ: 0 });
      } else {
        whiteCoinEl.style.opacity = '0';
      }
    }
    if (mergedLogoEl) {
      mergedLogoEl.classList.remove('interactive');
      mergedLogoEl.style.transform = '';
      if (currentScene === 7) {
        if (typeof anime !== 'undefined') {
          anime.set(mergedLogoEl, { opacity: 1, translateX: '0px', translateY: '0px', scale: 1, rotateY: 0 });
        } else {
          mergedLogoEl.style.opacity = '1';
        }
        mergedLogoEl.classList.add('interactive');
      } else {
        if (typeof anime !== 'undefined') {
          anime.set(mergedLogoEl, { opacity: 0, translateX: '0px', translateY: '0px', scale: 0.3, rotateY: 0 });
        } else {
          mergedLogoEl.style.opacity = '0';
        }
      }
    }
    if (shockwaveEl) {
      shockwaveEl.style.transform = '';
      if (typeof anime !== 'undefined') {
        anime.set(shockwaveEl, { opacity: 0, scale: 0.2 });
      } else {
        shockwaveEl.style.opacity = '0';
      }
    }
    if (curtainEl) {
      curtainEl.style.opacity = '0';
    }
  }

  // Helper to get scene content wrapper (.p-stage-wrap or .p-duality-stage or hero inner)
  function getSceneContentWrapper(sceneIndex) {
    const sceneEl = scenes[sceneIndex];
    if (!sceneEl) return null;
    return sceneEl.querySelector('.p-stage-wrap, .p-duality-stage, .p-hero-inner');
  }

  // Helper to ensure content wrapper visibility without double-loading jitter
  function ensureSceneContentVisible(sceneIndex) {
    const wrapper = getSceneContentWrapper(sceneIndex);
    if (wrapper) {
      wrapper.classList.remove('content-dissolved');
      wrapper.style.opacity = '1';
    }
  }

  // Helper to trigger crisp content entrance animations with CSS class choreography
  function triggerSceneEntrance(sceneIndex, delayMs) {
    const sceneEl = scenes[sceneIndex];
    if (!sceneEl) return;

    if (delayMs && delayMs > 0) {
      setTimeout(function () {
        if (currentScene === sceneIndex) {
          sceneEl.classList.remove('scene-content-enter');
          void sceneEl.offsetWidth; // Force reflow to guarantee CSS keyframe execution
          sceneEl.classList.add('scene-content-enter');
        }
      }, delayMs);
    } else {
      sceneEl.classList.remove('scene-content-enter');
      void sceneEl.offsetWidth;
      sceneEl.classList.add('scene-content-enter');
    }
  }

  // ════════════════════════════════════════════════════════════════
  // CHOREOGRAPHED SEQUENTIAL TRANSITIONS
  // ════════════════════════════════════════════════════════════════

  // ── Transition 4 -> 5 (Skepticism to Nihilism) ──
  // A black coin comes flipping in the air into the screen, stops in the middle,
  // and rushes towards the camera to cover the screen. Then Nihilism appears on black bg.
  function runTransition4to5() {
    isTransitioning = true;
    const skeptWrapper = getSceneContentWrapper(4);

    const tl = anime.timeline({
      easing: 'cubicBezier(0.16, 1, 0.3, 1)',
      complete: function () {
        currentScene = 5;
        scenes[4].classList.remove('active-scene');
        scenes[4].classList.remove('scene-content-enter');
        scenes[5].classList.add('active-scene');

        if (curtainEl) curtainEl.style.opacity = '0';
        if (darkCoinEl) darkCoinEl.style.opacity = '0';

        updateTone(5);
        updateDots(5);
        ensureSceneContentVisible(5);
        triggerSceneEntrance(5, 60);

        setTimeout(function () {
          isTransitioning = false;
        }, 150);
      }
    });

    // 1. Current scene content dissolves
    if (skeptWrapper) {
      tl.add({
        targets: skeptWrapper,
        opacity: [1, 0],
        translateY: [0, -18],
        duration: 350,
        easing: 'easeInQuad'
      });
    }

    // 2. Black coin flips in from bottom into center
    if (darkCoinEl) {
      darkCoinEl.style.transform = '';
      anime.set(darkCoinEl, {
        opacity: 1,
        translateY: '100vh',
        translateX: '0px',
        scale: 0.75,
        rotateX: 180,
        rotateY: 45,
        rotateZ: -20
      });

      tl.add({
        targets: darkCoinEl,
        translateY: ['100vh', '0vh'],
        scale: [0.75, 1.2],
        rotateX: [180, 0],
        rotateY: [45, 0],
        rotateZ: [-20, 0],
        duration: 850,
        easing: 'cubicBezier(0.18, 0.89, 0.32, 1)'
      }, '-=100');

      // 3. Dramatic floating pause in the middle
      tl.add({
        targets: darkCoinEl,
        translateY: ['0vh', '-2vh', '0vh'],
        scale: [1.2, 1.24, 1.2],
        duration: 320,
        easing: 'easeInOutSine'
      });

      // 4. Coin rushes towards the camera covering the screen
      tl.add({
        targets: darkCoinEl,
        scale: [1.2, 36],
        duration: 550,
        easing: 'cubicBezier(0.55, 0, 1, 0.45)'
      });
    }

    // 5. Curtain blacks out viewport during the rush
    if (curtainEl) {
      curtainEl.style.backgroundColor = '#080808';
      tl.add({
        targets: curtainEl,
        opacity: [0, 1],
        duration: 350,
        easing: 'easeInQuad',
        begin: function () {
          updateTone(5);
          updateDots(5);
        }
      }, '-=380');
    }
  }

  // ── Transition 5 -> 6 (Nihilism to Optimism) ──
  // Black coin moves away from camera and drops to ground.
  // White coin falls from top to middle, rushes towards camera covering screen.
  // Optimism appears on radiant white bg.
  function runTransition5to6() {
    isTransitioning = true;
    const nihilWrapper = getSceneContentWrapper(5);

    const tl = anime.timeline({
      easing: 'cubicBezier(0.16, 1, 0.3, 1)',
      complete: function () {
        currentScene = 6;
        scenes[5].classList.remove('active-scene');
        scenes[5].classList.remove('scene-content-enter');
        scenes[6].classList.add('active-scene');

        if (curtainEl) curtainEl.style.opacity = '0';
        if (whiteCoinEl) whiteCoinEl.style.opacity = '0';

        updateTone(6);
        updateDots(6);
        ensureSceneContentVisible(6);
        triggerSceneEntrance(6, 60);

        setTimeout(function () {
          isTransitioning = false;
        }, 150);
      }
    });

    // 1. Current Nihilism content dissolves
    if (nihilWrapper) {
      tl.add({
        targets: nihilWrapper,
        opacity: [1, 0],
        translateY: [0, -18],
        duration: 350,
        easing: 'easeInQuad'
      });
    }

    // 2. Black coin moves away from screen and drops back to ground
    if (darkCoinEl) {
      darkCoinEl.style.transform = '';
      anime.set(darkCoinEl, {
        opacity: 1,
        translateY: '0vh',
        translateX: '0px',
        scale: 28,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0
      });

      // Pull back from camera to center
      tl.add({
        targets: darkCoinEl,
        scale: [28, 1.15],
        duration: 480,
        easing: 'cubicBezier(0.25, 1, 0.5, 1)'
      });

      // Drops back to the ground
      tl.add({
        targets: darkCoinEl,
        translateY: ['0vh', '125vh'],
        rotateX: [0, 180],
        rotateZ: [0, 35],
        duration: 600,
        easing: 'cubicBezier(0.55, 0.085, 0.68, 0.53)'
      });
    }

    // 3. White coin falls from top of screen to center
    if (whiteCoinEl) {
      whiteCoinEl.style.transform = '';
      anime.set(whiteCoinEl, {
        opacity: 1,
        translateY: '-125vh',
        translateX: '0px',
        scale: 0.75,
        rotateX: -180,
        rotateY: 45,
        rotateZ: 20
      });

      tl.add({
        targets: whiteCoinEl,
        translateY: ['-125vh', '0vh'],
        scale: [0.75, 1.2],
        rotateX: [-180, 0],
        rotateY: [45, 0],
        rotateZ: [20, 0],
        duration: 850,
        easing: 'cubicBezier(0.18, 0.89, 0.32, 1)'
      }, '-=200');

      // 4. Brief center pause
      tl.add({
        targets: whiteCoinEl,
        translateY: ['0vh', '-2vh', '0vh'],
        scale: [1.2, 1.24, 1.2],
        duration: 320,
        easing: 'easeInOutSine'
      });

      // 5. White coin rushes towards camera covering screen
      tl.add({
        targets: whiteCoinEl,
        scale: [1.2, 36],
        duration: 550,
        easing: 'cubicBezier(0.55, 0, 1, 0.45)'
      });
    }

    // 6. Curtain transitions to paper white
    if (curtainEl) {
      curtainEl.style.backgroundColor = '#f5f3ef';
      tl.add({
        targets: curtainEl,
        opacity: [0, 1],
        duration: 350,
        easing: 'easeInQuad',
        begin: function () {
          updateTone(6);
          updateDots(6);
        }
      }, '-=380');
    }
  }

  // ── Transition 6 -> 7 (Optimism to The Duality Climax) ──
  // Screen fades. Black coin comes from left, white coin from right,
  // they merge in the middle to form the PhiloSoc logo.
  function runTransition6to7() {
    isTransitioning = true;
    const optimWrapper = getSceneContentWrapper(6);

    const tl = anime.timeline({
      easing: 'cubicBezier(0.16, 1, 0.3, 1)',
      complete: function () {
        currentScene = 7;
        scenes[6].classList.remove('active-scene');
        scenes[6].classList.remove('scene-content-enter');
        scenes[7].classList.add('active-scene');

        if (darkCoinEl) darkCoinEl.style.opacity = '0';
        if (whiteCoinEl) whiteCoinEl.style.opacity = '0';
        if (curtainEl) curtainEl.style.opacity = '0';

        if (mergedLogoEl) {
          mergedLogoEl.style.opacity = '1';
          mergedLogoEl.classList.add('interactive');
        }

        updateTone(7);
        updateDots(7);
        ensureSceneContentVisible(7);
        triggerSceneEntrance(7, 80);

        setTimeout(function () {
          isTransitioning = false;
        }, 150);
      }
    });

    // 1. Current Optimism content dissolves
    if (optimWrapper) {
      tl.add({
        targets: optimWrapper,
        opacity: [1, 0],
        translateY: [0, -18],
        duration: 350,
        easing: 'easeInQuad'
      });
    }

    // 2. The screen fades smoothly to reveal duality backdrop
    tl.add({
      targets: scenes[7],
      opacity: [0, 1],
      duration: 450,
      easing: 'easeInOutQuad',
      begin: function () {
        updateTone(7);
        updateDots(7);
      }
    }, '-=100');

    // 3. Black coin from left and White coin from right rush to middle
    if (darkCoinEl && whiteCoinEl) {
      darkCoinEl.style.transform = '';
      whiteCoinEl.style.transform = '';
      anime.set(darkCoinEl, {
        opacity: 1,
        translateX: '-125vw',
        translateY: '0vh',
        scale: 1,
        rotateY: -180,
        rotateZ: -20
      });
      anime.set(whiteCoinEl, {
        opacity: 1,
        translateX: '125vw',
        translateY: '0vh',
        scale: 1,
        rotateY: 180,
        rotateZ: 20
      });

      tl.add({
        targets: darkCoinEl,
        translateX: ['-125vw', '0vw'],
        rotateY: [-180, 0],
        rotateZ: [-20, 0],
        duration: 750,
        easing: 'cubicBezier(0.22, 1, 0.36, 1)'
      }, '-=200');

      tl.add({
        targets: whiteCoinEl,
        translateX: ['125vw', '0vw'],
        rotateY: [180, 0],
        rotateZ: [20, 0],
        duration: 750,
        easing: 'cubicBezier(0.22, 1, 0.36, 1)'
      }, '-=750');

      // 4. Collision / Merge moment: individual coins disappear
      tl.add({
        targets: [darkCoinEl, whiteCoinEl],
        opacity: [1, 0],
        scale: [1, 0.85],
        duration: 150,
        easing: 'easeOutQuad'
      });
    }

    // 5. Shockwave expands upon collision
    if (shockwaveEl) {
      shockwaveEl.style.transform = '';
      anime.set(shockwaveEl, { opacity: 1, scale: 0.2 });

      tl.add({
        targets: shockwaveEl,
        opacity: [1, 0],
        scale: [0.2, 2.8],
        duration: 650,
        easing: 'easeOutExpo'
      }, '-=100');
    }

    // 6. Merged PhiloSoc Logo bursts into view
    if (mergedLogoEl) {
      mergedLogoEl.style.transform = '';
      anime.set(mergedLogoEl, {
        opacity: 0,
        scale: 0.2,
        translateX: '0px',
        translateY: '0px'
      });

      tl.add({
        targets: mergedLogoEl,
        scale: [0.2, 1.15, 1],
        opacity: [0, 1],
        duration: 700,
        easing: 'cubicBezier(0.175, 0.885, 0.32, 1.275)'
      }, '-=500');
    }
  }

  // ── Reverse Transitions (Scrolling Backward) ──
  function runReverseTransition(target) {
    isTransitioning = true;
    const currentWrapper = getSceneContentWrapper(currentScene);

    // Fade out current scene content
    if (currentWrapper && typeof anime !== 'undefined') {
      anime({
        targets: currentWrapper,
        opacity: [1, 0],
        duration: 250,
        easing: 'easeOutQuad',
        complete: function () {
          performReverseArrival(target);
        }
      });
    } else {
      performReverseArrival(target);
    }
  }

  function performReverseArrival(target) {
    resetCoinActors();

    // Scene activation
    for (let i = 1; i < SCENE_COUNT; i++) {
      const sceneEl = scenes[i];
      if (!sceneEl) continue;
      if (i <= target) {
        sceneEl.classList.add('active-scene');
      } else {
        sceneEl.classList.remove('active-scene');
        sceneEl.classList.remove('scene-content-enter');
      }
    }

    currentScene = target;
    updateDots(target);
    updateTone(target);

    // If returning to scene 7, keep merged logo
    if (target === 7 && mergedLogoEl) {
      mergedLogoEl.style.opacity = '1';
      mergedLogoEl.style.transform = '';
      if (typeof anime !== 'undefined') {
        anime.set(mergedLogoEl, { opacity: 1, translateX: '0px', translateY: '0px', scale: 1 });
      }
      mergedLogoEl.classList.add('interactive');
    }

    ensureSceneContentVisible(target);
    triggerSceneEntrance(target, 110);
    setTimeout(function () {
      isTransitioning = false;
    }, 150);
  }

  // ── Standard Directional Slide Transition (Scenes 0 <-> 4) ──
  function runStandardDirectionalSlide(target) {
    isTransitioning = true;
    const prevScene = currentScene;
    const isForward = target > prevScene;
    currentScene = target;

    updateDots(target);
    updateTone(target);
    resetCoinActors();

    if (scenes[prevScene]) {
      scenes[prevScene].classList.remove('scene-content-enter');
    }

    // Apply active-scene states:
    // Layers <= target are translated to 0,0,0
    // Layers > target retreat along their entry vectors
    for (let i = 1; i < SCENE_COUNT; i++) {
      const sceneEl = scenes[i];
      if (!sceneEl) continue;

      if (i <= target) {
        sceneEl.classList.add('active-scene');
      } else {
        sceneEl.classList.remove('active-scene');
        sceneEl.classList.remove('scene-content-enter');
      }
    }

    ensureSceneContentVisible(target);

    // Smooth entrance timing: forward triggers at 190ms (mid-slide), reverse triggers at 110ms
    const entranceDelay = isForward ? 190 : 110;
    triggerSceneEntrance(target, entranceDelay);

    // Lockout matches the 0.52s CSS transform transition
    setTimeout(function () {
      isTransitioning = false;
    }, 520);
  }

  // ── Core Navigation Coordinator ──
  function goTo(target) {
    if (target < 0 || target >= SCENE_COUNT || target === currentScene || isTransitioning) {
      return;
    }

    // Step-by-step forward coin choreography
    if (currentScene === 4 && target === 5) {
      runTransition4to5();
      return;
    }
    if (currentScene === 5 && target === 6) {
      runTransition5to6();
      return;
    }
    if (currentScene === 6 && target === 7) {
      runTransition6to7();
      return;
    }

    // Step-by-step backward transitions from coin scenes
    if (currentScene >= 5 && target < currentScene) {
      runReverseTransition(target);
      return;
    }

    // Direct forward jump into coin scenes from earlier scenes (e.g. 1 -> 5 or 2 -> 6)
    if (target >= 5 && currentScene < 4) {
      resetCoinActors();
      runReverseTransition(target);
      return;
    }

    // Standard directional slide for 0 <-> 1 <-> 2 <-> 3 <-> 4
    runStandardDirectionalSlide(target);
  }

  // ── Wheel Scroll Handler ──
  window.addEventListener('wheel', function (e) {
    const now = performance.now();
    if (now - lastWheelTime < 320 || isTransitioning) return;

    if (e.deltaY > 18) {
      // Scroll DOWN: Advance scene
      if (currentScene < SCENE_COUNT - 1) {
        lastWheelTime = now;
        goTo(currentScene + 1);
      }
    } else if (e.deltaY < -18) {
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
    resetCoinActors();
    ensureSceneContentVisible(0);
    triggerSceneEntrance(0, 80);

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

    // Interactive Merged Emblem Inversion on Climax Scene
    function toggleDualityInversion() {
      if (currentScene !== 7) return;
      const scene7El = scenes[7];
      if (!scene7El) return;
      const isInverted = scene7El.classList.toggle('is-inverted');

      if (mergedLogoEl) {
        mergedLogoEl.classList.toggle('is-inverted', isInverted);
      }
      if (navEl) {
        navEl.classList.toggle('is-inverted', isInverted);
      }
      if (progressEl) {
        progressEl.classList.toggle('is-inverted', isInverted);
      }
    }

    if (mergedDiscEl) {
      mergedDiscEl.addEventListener('click', toggleDualityInversion);
      mergedDiscEl.addEventListener('keydown', function (e) {
        if (currentScene === 7 && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          toggleDualityInversion();
        }
      });
    }
  });

  // Expose global API for automated testing & external hooks
  window.PhilosophiesApp = {
    goTo: goTo,
    getCurrentScene: function () {
      return currentScene;
    },
    isTransitioning: function () {
      return isTransitioning;
    }
  };

})();
