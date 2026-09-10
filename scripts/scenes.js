/* ================================================================
   scripts/scenes.js
   PHILOSOC Scene Transition Manager
   Five-Scene Orchestration:
     0: Landing Hero
     1: What is Philosophy? (Left Black, Right White)
     2: What is PhiloSoc?   (Boxes Switch: Left White, Right Black)
     3: Why Join Us?        (The Literary Salon & Masonry Broadsheet)
     4: Footer / Navigation (Full-screen editorial menu)
   ================================================================ */

(function () {
  'use strict';

  let currentScene = 0;
  let isTransitioning = false;
  let lastWheelTime = 0;

  const curtainLeft = document.getElementById('curtain-left');
  const curtainRight = document.getElementById('curtain-right');
  const sceneLanding = document.getElementById('scene-landing');
  const splitStage = document.getElementById('scene-split-stage');
  const scenePhilosophy = document.getElementById('scene-philosophy');
  const scenePhilosoc = document.getElementById('scene-philosoc');
  const sceneWhyJoin = document.getElementById('scene-why-join');
  const sceneFooter = document.getElementById('scene-footer');
  const progressContainer = document.getElementById('scene-progress');
  const dots = document.querySelectorAll('.pdot');

  // ── Scene 4 Footer Hover State (Module Scope) ──
  const footerImgDefault = document.getElementById('footer-img-default');
  let currentActiveImg = footerImgDefault;
  let hoverResetTimer = null;

  function activateFooterImage(target) {
    if (!target || target === currentActiveImg) return;

    if (hoverResetTimer) {
      clearTimeout(hoverResetTimer);
      hoverResetTimer = null;
    }

    document.querySelectorAll('.footer-img-wrap').forEach(function (wrap) {
      if (wrap === target) {
        wrap.style.zIndex = '3';
        wrap.classList.add('active');
      } else if (wrap === currentActiveImg) {
        wrap.style.zIndex = '2';
        wrap.classList.remove('active');
      } else {
        wrap.style.zIndex = '1';
        wrap.classList.remove('active');
      }
    });

    currentActiveImg = target;
  }

  function scheduleResetToDefault() {
    if (hoverResetTimer) clearTimeout(hoverResetTimer);
    hoverResetTimer = setTimeout(function () {
      const defaultImg = document.getElementById('footer-img-default');
      if (defaultImg && currentActiveImg !== defaultImg) {
        activateFooterImage(defaultImg);
      }
    }, 100);
  }

  function isMobile() {
    return window.innerWidth <= 768;
  }

  // Clear all inline styles and cancel running anime on an element and its children
  function cleanSceneElement(el) {
    if (!el) return;
    if (typeof anime !== 'undefined') {
      anime.remove(el);
      anime.remove(el.querySelectorAll('*'));
    }
    el.style.opacity = '';
    el.style.transform = '';
    el.querySelectorAll('*').forEach((child) => {
      child.style.opacity = '';
      child.style.transform = '';
    });
  }

  // Update Navigation Dots & Color Mode
  function updateProgressDots(index) {
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });

    // In Scene 2, the right half is pure black, so dots turn white
    // In Scenes 0, 1, 3, dots are dark ink
    if (progressContainer) {
      progressContainer.classList.toggle('light-dots', index === 2);
    }
  }

  // ── TRANSITION: 0 -> 1 ──────────────────────────────────────
  function from0To1() {
    isTransitioning = true;
    const mobile = isMobile();

    // Step 1: Move Hero elements out of frame
    if (typeof anime !== 'undefined') {
      anime({
        targets: ['.hero-inner', '.hero-corner', '.hero-scroll-cue'],
        opacity: [1, 0],
        translateY: [0, -35],
        duration: 220,
        easing: 'easeInQuad',
        complete: function () {
          if (sceneLanding) {
            sceneLanding.classList.add('behind-curtain');
            sceneLanding.style.opacity = '0';
            sceneLanding.style.visibility = 'hidden';
          }
          if (splitStage) splitStage.classList.add('active');

          cleanSceneElement(scenePhilosophy);
          cleanSceneElement(scenePhilosoc);
          cleanSceneElement(sceneWhyJoin);
          cleanSceneElement(sceneFooter);
          if (scenePhilosoc) scenePhilosoc.style.opacity = '0';
          if (sceneWhyJoin) sceneWhyJoin.style.opacity = '0';
          if (sceneFooter) { sceneFooter.style.opacity = '0'; sceneFooter.classList.remove('revealed'); }

          // Step 2: Curtains slide in
          const leftAnim = mobile ? { translateY: ['-100%', '0%'] } : { translateX: ['-100%', '0%'] };
          const rightAnim = mobile ? { translateY: ['100%', '0%'] } : { translateX: ['100%', '0%'] };

          anime({
            targets: curtainLeft,
            ...leftAnim,
            duration: 650,
            easing: 'cubicBezier(0.16, 1, 0.3, 1)'
          });

          anime({
            targets: curtainRight,
            ...rightAnim,
            duration: 650,
            easing: 'cubicBezier(0.16, 1, 0.3, 1)',
            complete: function () {
              // Step 3: Curtains settled -> Move Scene 1 elements into frame
              if (scenePhilosophy) {
                scenePhilosophy.style.opacity = '1';
                scenePhilosophy.classList.add('revealed');
              }

              anime({
                targets: '#scene-philosophy .split-left-inner > *',
                opacity: [0, 1],
                translateX: [-35, 0],
                delay: anime.stagger(60, { start: 40 }),
                duration: 500,
                easing: 'easeOutQuart'
              });

              anime({
                targets: '#scene-philosophy .split-right-inner > *',
                opacity: [0, 1],
                translateX: [35, 0],
                delay: anime.stagger(50, { start: 80 }),
                duration: 500,
                easing: 'easeOutQuart',
                complete: function () {
                  currentScene = 1;
                  updateProgressDots(1);
                  isTransitioning = false;
                }
              });
            }
          });
        }
      });
    } else {
      if (sceneLanding) sceneLanding.classList.add('behind-curtain');
      if (splitStage) splitStage.classList.add('active');
      curtainLeft.style.transform = 'translate3d(0, 0, 0)';
      curtainRight.style.transform = 'translate3d(0, 0, 0)';
      if (scenePhilosophy) {
        scenePhilosophy.style.opacity = '1';
        scenePhilosophy.classList.add('revealed');
      }
      currentScene = 1;
      updateProgressDots(1);
      isTransitioning = false;
    }
  }

  // ── TRANSITION: 1 -> 2 (BOXES SWITCH PLACES) ────────────────
  function from1To2() {
    isTransitioning = true;
    const mobile = isMobile();

    // Step 1: Move Scene 1 elements out of frame
    if (typeof anime !== 'undefined') {
      anime({
        targets: '#scene-philosophy .split-left-inner',
        opacity: [1, 0],
        translateX: [0, -60],
        duration: 220,
        easing: 'easeInQuad'
      });

      anime({
        targets: '#scene-philosophy .split-right-inner',
        opacity: [1, 0],
        translateX: [0, 60],
        duration: 220,
        easing: 'easeInQuad',
        complete: function () {
          cleanSceneElement(scenePhilosophy);
          if (scenePhilosophy) {
            scenePhilosophy.style.opacity = '0';
            scenePhilosophy.classList.remove('revealed');
          }

          // Step 2: Curtains switch places
          const leftAnim = mobile ? { translateY: ['0%', '100%'] } : { translateX: ['0%', '100%'] };
          const rightAnim = mobile ? { translateY: ['0%', '-100%'] } : { translateX: ['0%', '-100%'] };

          anime({
            targets: curtainLeft,
            ...leftAnim,
            duration: 680,
            easing: 'cubicBezier(0.22, 1, 0.36, 1)'
          });

          anime({
            targets: curtainRight,
            ...rightAnim,
            duration: 680,
            easing: 'cubicBezier(0.22, 1, 0.36, 1)',
            complete: function () {
              // Step 3: Curtains settled -> Move Scene 2 elements into frame
              cleanSceneElement(scenePhilosoc);
              if (scenePhilosoc) {
                scenePhilosoc.style.opacity = '1';
                scenePhilosoc.classList.add('revealed');
              }
              updateProgressDots(2);

              anime({
                targets: '#scene-philosoc .split-left-inner > *',
                opacity: [0, 1],
                translateX: [-35, 0],
                delay: anime.stagger(50, { start: 40 }),
                duration: 500,
                easing: 'easeOutQuart'
              });

              anime({
                targets: '#scene-philosoc .split-right-inner > *',
                opacity: [0, 1],
                translateX: [35, 0],
                delay: anime.stagger(60, { start: 70 }),
                duration: 500,
                easing: 'easeOutQuart',
                complete: function () {
                  currentScene = 2;
                  isTransitioning = false;
                }
              });
            }
          });
        }
      });
    } else {
      if (scenePhilosophy) {
        scenePhilosophy.style.opacity = '0';
        scenePhilosophy.classList.remove('revealed');
      }
      curtainLeft.style.transform = mobile ? 'translate3d(0, 100%, 0)' : 'translate3d(100%, 0, 0)';
      curtainRight.style.transform = mobile ? 'translate3d(0, -100%, 0)' : 'translate3d(-100%, 0, 0)';
      cleanSceneElement(scenePhilosoc);
      if (scenePhilosoc) {
        scenePhilosoc.style.opacity = '1';
        scenePhilosoc.classList.add('revealed');
      }
      currentScene = 2;
      updateProgressDots(2);
      isTransitioning = false;
    }
  }

  // ── TRANSITION: 2 -> 3 (REVEAL WHY JOIN US) ──────────────
  function from2To3() {
    isTransitioning = true;
    const mobile = isMobile();

    // Step 1: Move Scene 2 text elements out of frame smoothly
    if (typeof anime !== 'undefined') {
      anime({
        targets: ['#scene-philosoc .split-left-inner', '#scene-philosoc .split-right-inner'],
        opacity: [1, 0],
        translateY: [0, -18],
        duration: 180,
        easing: 'easeInQuad',
        complete: function () {
          cleanSceneElement(scenePhilosoc);
          if (scenePhilosoc) {
            scenePhilosoc.style.opacity = '0';
            scenePhilosoc.classList.remove('revealed');
          }

          // Step 2: Seamlessly reveal Scene 3 — NO void, NO flashing of Page 1!
          cleanSceneElement(sceneWhyJoin);
          if (sceneWhyJoin) {
            sceneWhyJoin.style.opacity = '1';
            sceneWhyJoin.classList.add('revealed');
          }
          updateProgressDots(3);

          // Black middle stage scales & fades into center smoothly
          anime({
            targets: '#why-center-stage',
            opacity: [0, 1],
            scale: [0.97, 1],
            duration: 420,
            easing: 'cubicBezier(0.16, 1, 0.3, 1)'
          });

          // Left literature flank slides in from the left
          anime({
            targets: '#why-flank-left',
            opacity: [0, 1],
            translateX: mobile ? [0, 0] : ['-100%', '0%'],
            duration: 460,
            easing: 'cubicBezier(0.16, 1, 0.3, 1)'
          });

          // Right literature flank slides in from the right
          anime({
            targets: '#why-flank-right',
            opacity: [0, 1],
            translateX: mobile ? [0, 0] : ['100%', '0%'],
            duration: 460,
            easing: 'cubicBezier(0.16, 1, 0.3, 1)'
          });

          // Center stage typography and inquiry cards stagger into view
          anime({
            targets: '#scene-why-join .why-center-inner > *',
            opacity: [0, 1],
            translateY: [20, 0],
            delay: anime.stagger(40, { start: 100 }),
            duration: 480,
            easing: 'easeOutQuart',
            complete: function () {
              currentScene = 3;
              isTransitioning = false;
            }
          });
        }
      });
    } else {
      if (scenePhilosoc) {
        scenePhilosoc.style.opacity = '0';
        scenePhilosoc.classList.remove('revealed');
      }
      cleanSceneElement(sceneWhyJoin);
      if (sceneWhyJoin) {
        sceneWhyJoin.style.opacity = '1';
        sceneWhyJoin.classList.add('revealed');
      }
      currentScene = 3;
      updateProgressDots(3);
      isTransitioning = false;
    }
  }

  // ── IRIS HELPERS ──────────────────────────────────────────────────

  // Runs an iris-close: a circle shrinks to center, leaving a growing black bg
  // Canvas fades in as it closes, callback fired when fully black
  function runIrisClose(onComplete) {
    const canvas = document.getElementById('iris-canvas');
    if (!canvas) { if (onComplete) onComplete(); return; }

    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    canvas.style.display = 'block';
    canvas.style.opacity = '1';

    const ctx = canvas.getContext('2d');
    if (!ctx) { if (onComplete) onComplete(); return; }

    const cx = W / 2;
    const cy = H / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy) + 20;

    const duration = 650;
    const startTime = performance.now();
    let isDone = false;

    function finish() {
      if (isDone) return;
      isDone = true;
      if (onComplete) onComplete();
    }

    // Hard fallback: guaranteed to fire even if requestAnimationFrame halts
    const safetyTimer = setTimeout(finish, duration + 100);

    function draw(now) {
      if (isDone) return;
      const t = Math.min((now - startTime) / duration, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const r = Math.max(maxR * (1 - eased), 0);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, W, H);

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      if (t < 1) {
        requestAnimationFrame(draw);
      } else {
        clearTimeout(safetyTimer);
        ctx.fillStyle = '#080808';
        ctx.fillRect(0, 0, W, H);
        finish();
      }
    }

    requestAnimationFrame(draw);
  }

  // Fades the iris canvas out (call after scene is set up)
  function fadeOutIrisCanvas(onComplete) {
    const canvas = document.getElementById('iris-canvas');
    if (!canvas) { if (onComplete) onComplete(); return; }

    const duration = 380;
    const startTime = performance.now();
    let isDone = false;

    function finish() {
      if (isDone) return;
      isDone = true;
      canvas.style.display = 'none';
      canvas.style.opacity = '';
      if (onComplete) onComplete();
    }

    // Safety timeout: guaranteed to hide canvas
    setTimeout(finish, duration + 60);

    function fade(now) {
      if (isDone) return;
      const t = Math.min((now - startTime) / duration, 1);
      canvas.style.opacity = String(Math.max(1 - t, 0));
      if (t < 1) {
        requestAnimationFrame(fade);
      } else {
        finish();
      }
    }

    requestAnimationFrame(fade);
  }

  // ── TRANSITION: 3 -> 4 (IRIS CLOSE → REVEAL FOOTER/NAV) ──────────
  function from3To4() {
    isTransitioning = true;

    // Start iris close IMMEDIATELY
    runIrisClose(function () {
      // 1. Hide Scene 3
      if (typeof anime !== 'undefined') anime.remove(sceneWhyJoin);
      if (sceneWhyJoin) {
        sceneWhyJoin.style.opacity = '0';
        sceneWhyJoin.classList.remove('revealed');
        sceneWhyJoin.querySelectorAll('*').forEach(function (c) {
          c.style.opacity = '';
          c.style.transform = '';
        });
      }

      // 2. Cancel any running animations on Scene 4 children
      if (typeof anime !== 'undefined') {
        anime.remove(sceneFooter);
        anime.remove(document.querySelectorAll('#scene-footer *'));
      }

      // 3. Move curtains off-screen
      if (curtainLeft) curtainLeft.style.transform = 'translate3d(-100%, 0, 0)';
      if (curtainRight) curtainRight.style.transform = 'translate3d(100%, 0, 0)';
      if (splitStage) splitStage.classList.remove('active');

      // 4. Reveal Scene 4 container
      if (sceneFooter) {
        sceneFooter.style.opacity = '1';
        sceneFooter.classList.add('revealed');
      }
      updateProgressDots(4);

      // 5. Reset footer image to default logo
      document.querySelectorAll('.footer-img-wrap').forEach(function (w) {
        w.classList.remove('active');
        w.style.zIndex = '1';
      });
      var imgDefault = document.getElementById('footer-img-default');
      if (imgDefault) {
        imgDefault.classList.add('active');
        imgDefault.style.zIndex = '3';
      }
      currentActiveImg = imgDefault;

      var imgPanel = document.getElementById('footer-img-panel');
      var navEls = document.querySelectorAll(
        '#footer-nav-panel .footer-top-bar, #footer-nav-panel .footer-nav-item, #footer-nav-panel .footer-nav-bottom'
      );

      // 6. Fade out iris canvas
      fadeOutIrisCanvas(function () {
        currentScene = 4;
        isTransitioning = false;
      });

      // 7. Start content entrance animations
      if (typeof anime !== 'undefined') {
        if (imgPanel) {
          anime({
            targets: imgPanel,
            opacity: [0, 1],
            translateX: ['-3%', '0%'],
            duration: 600,
            easing: 'cubicBezier(0.16, 1, 0.3, 1)'
          });
        }

        if (navEls.length > 0) {
          anime({
            targets: navEls,
            opacity: [0, 1],
            translateY: [16, 0],
            delay: anime.stagger(45, { start: 40 }),
            duration: 520,
            easing: 'easeOutQuart',
            complete: function () {
              currentScene = 4;
              isTransitioning = false;
            }
          });
        }
      } else {
        if (imgPanel) { imgPanel.style.opacity = '1'; imgPanel.style.transform = 'none'; }
        navEls.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
        currentScene = 4;
        isTransitioning = false;
      }

      // Hard safety timer: GUARANTEED to release transition lock and ensure visibility
      setTimeout(function () {
        isTransitioning = false;
        const canvas = document.getElementById('iris-canvas');
        if (canvas) { canvas.style.display = 'none'; canvas.style.opacity = ''; }
        if (imgPanel) imgPanel.style.opacity = '1';
        navEls.forEach(function (el) { el.style.opacity = '1'; });
      }, 700);
    });
  }

  // ── TRANSITION: 4 -> 3 (RETURN FROM FOOTER TO WHY JOIN US) ──────

  function from4To3() {
    isTransitioning = true;

    if (typeof anime !== 'undefined') {
      // Step 1: Dismiss Scene 4 — nav items exit down, img panel fades left
      anime({
        targets: '#footer-nav-panel .footer-top-bar, #footer-nav-panel .footer-nav-item, #footer-nav-panel .footer-nav-bottom',
        opacity: [1, 0],
        translateY: [0, 16],
        delay: anime.stagger(28, { from: 'last' }),
        duration: 200,
        easing: 'easeInQuad'
      });

      anime({
        targets: '#footer-img-panel',
        opacity: [1, 0],
        translateX: ['0%', '-6%'],
        duration: 240,
        easing: 'easeInQuad',
        complete: function () {
          cleanSceneElement(sceneFooter);
          if (sceneFooter) {
            sceneFooter.style.opacity = '0';
            sceneFooter.classList.remove('revealed');
          }

          // Restore split stage and curtains for Scene 3 (no curtains visible in scene 3)
          // Scene 3 doesn't use curtains directly, but future nav to scene 2 needs them positioned correctly
          // Curtains are in "scene 2 position" (left: 100%, right: -100%) when leaving scene 3
          if (splitStage) splitStage.classList.add('active');
          if (curtainLeft) curtainLeft.style.transform = 'translate3d(100%, 0, 0)';
          if (curtainRight) curtainRight.style.transform = 'translate3d(-100%, 0, 0)';

          // Step 2: Bring Scene 3 back
          cleanSceneElement(sceneWhyJoin);
          if (sceneWhyJoin) {
            sceneWhyJoin.style.opacity = '1';
            sceneWhyJoin.classList.add('revealed');
          }
          updateProgressDots(3);

          anime({
            targets: '#why-center-stage',
            opacity: [0, 1],
            scale: [0.96, 1],
            duration: 420,
            easing: 'cubicBezier(0.16, 1, 0.3, 1)'
          });
          anime({
            targets: '#why-flank-left',
            opacity: [0, 1],
            translateX: ['-80%', '0%'],
            duration: 460,
            easing: 'cubicBezier(0.16, 1, 0.3, 1)'
          });
          anime({
            targets: '#why-flank-right',
            opacity: [0, 1],
            translateX: ['80%', '0%'],
            duration: 460,
            easing: 'cubicBezier(0.16, 1, 0.3, 1)'
          });
          anime({
            targets: '#scene-why-join .why-center-inner > *',
            opacity: [0, 1],
            translateY: [20, 0],
            delay: anime.stagger(40, { start: 100 }),
            duration: 480,
            easing: 'easeOutQuart',
            complete: function () {
              currentScene = 3;
              isTransitioning = false;
            }
          });
        }
      });
    } else {
      if (sceneFooter) {
        sceneFooter.style.opacity = '0';
        sceneFooter.classList.remove('revealed');
      }
      cleanSceneElement(sceneWhyJoin);
      if (sceneWhyJoin) {
        sceneWhyJoin.style.opacity = '1';
        sceneWhyJoin.classList.add('revealed');
      }
      currentScene = 3;
      updateProgressDots(3);
      isTransitioning = false;
    }
  }

  // ── TRANSITION: 3 -> 2 (RETURN FROM WHY JOIN US TO PHILOSOC) ──────
  function from3To2() {
    isTransitioning = true;
    const mobile = isMobile();

    // Step 1: Move Scene 3 elements out of frame
    if (typeof anime !== 'undefined') {
      anime({
        targets: '#scene-why-join .why-center-inner > *',
        opacity: [1, 0],
        translateY: [0, -15],
        duration: 180,
        easing: 'easeInQuad'
      });

      anime({
        targets: '#why-flank-left',
        translateX: mobile ? [0, 0] : [0, '-100%'],
        opacity: [1, 0],
        duration: 220,
        easing: 'easeInQuad'
      });

      anime({
        targets: '#why-flank-right',
        translateX: mobile ? [0, 0] : [0, '100%'],
        opacity: [1, 0],
        duration: 220,
        easing: 'easeInQuad',
        complete: function () {
          cleanSceneElement(sceneWhyJoin);
          if (sceneWhyJoin) {
            sceneWhyJoin.style.opacity = '0';
            sceneWhyJoin.classList.remove('revealed');
          }

          // Step 2: Ensure curtains are properly positioned for Scene 2
          curtainLeft.style.transform = mobile ? 'translate3d(0, 100%, 0)' : 'translate3d(100%, 0, 0)';
          curtainRight.style.transform = mobile ? 'translate3d(0, -100%, 0)' : 'translate3d(-100%, 0, 0)';

          // Step 3: Move Scene 2 elements into frame
          cleanSceneElement(scenePhilosoc);
          if (scenePhilosoc) {
            scenePhilosoc.style.opacity = '1';
            scenePhilosoc.classList.add('revealed');
          }
          updateProgressDots(2);

          anime({
            targets: '#scene-philosoc .split-left-inner > *',
            opacity: [0, 1],
            translateX: [-35, 0],
            delay: anime.stagger(50, { start: 40 }),
            duration: 500,
            easing: 'easeOutQuart'
          });

          anime({
            targets: '#scene-philosoc .split-right-inner > *',
            opacity: [0, 1],
            translateX: [35, 0],
            delay: anime.stagger(50, { start: 70 }),
            duration: 500,
            easing: 'easeOutQuart',
            complete: function () {
              currentScene = 2;
              isTransitioning = false;
            }
          });
        }
      });
    } else {
      if (sceneWhyJoin) {
        sceneWhyJoin.style.opacity = '0';
        sceneWhyJoin.classList.remove('revealed');
      }
      curtainLeft.style.transform = mobile ? 'translate3d(0, 100%, 0)' : 'translate3d(100%, 0, 0)';
      curtainRight.style.transform = mobile ? 'translate3d(0, -100%, 0)' : 'translate3d(-100%, 0, 0)';
      cleanSceneElement(scenePhilosoc);
      if (scenePhilosoc) {
        scenePhilosoc.style.opacity = '1';
        scenePhilosoc.classList.add('revealed');
      }
      currentScene = 2;
      updateProgressDots(2);
      isTransitioning = false;
    }
  }

  // ── TRANSITION: 2 -> 1 (BOXES SWITCH BACK) ──────────────────
  function from2To1() {
    isTransitioning = true;
    const mobile = isMobile();

    // Step 1: Move Scene 2 elements out of frame
    if (typeof anime !== 'undefined') {
      anime({
        targets: '#scene-philosoc .split-left-inner',
        opacity: [1, 0],
        translateX: [0, -60],
        duration: 220,
        easing: 'easeInQuad'
      });

      anime({
        targets: '#scene-philosoc .split-right-inner',
        opacity: [1, 0],
        translateX: [0, 60],
        duration: 220,
        easing: 'easeInQuad',
        complete: function () {
          cleanSceneElement(scenePhilosoc);
          if (scenePhilosoc) {
            scenePhilosoc.style.opacity = '0';
            scenePhilosoc.classList.remove('revealed');
          }

          // Step 2: Curtains switch back (Left Black, Right White)
          const leftAnim = mobile ? { translateY: ['100%', '0%'] } : { translateX: ['100%', '0%'] };
          const rightAnim = mobile ? { translateY: ['-100%', '0%'] } : { translateX: ['-100%', '0%'] };

          anime({
            targets: curtainLeft,
            ...leftAnim,
            duration: 680,
            easing: 'cubicBezier(0.22, 1, 0.36, 1)'
          });

          anime({
            targets: curtainRight,
            ...rightAnim,
            duration: 680,
            easing: 'cubicBezier(0.22, 1, 0.36, 1)',
            complete: function () {
              // Step 3: Curtains settled -> Move Scene 1 elements into frame
              cleanSceneElement(scenePhilosophy);
              if (scenePhilosophy) {
                scenePhilosophy.style.opacity = '1';
                scenePhilosophy.classList.add('revealed');
              }
              updateProgressDots(1);

              anime({
                targets: '#scene-philosophy .split-left-inner > *',
                opacity: [0, 1],
                translateX: [-35, 0],
                delay: anime.stagger(50, { start: 40 }),
                duration: 500,
                easing: 'easeOutQuart'
              });

              anime({
                targets: '#scene-philosophy .split-right-inner > *',
                opacity: [0, 1],
                translateX: [35, 0],
                delay: anime.stagger(50, { start: 70 }),
                duration: 500,
                easing: 'easeOutQuart',
                complete: function () {
                  currentScene = 1;
                  isTransitioning = false;
                }
              });
            }
          });
        }
      });
    } else {
      if (scenePhilosoc) {
        scenePhilosoc.style.opacity = '0';
        scenePhilosoc.classList.remove('revealed');
      }
      curtainLeft.style.transform = 'translate3d(0, 0, 0)';
      curtainRight.style.transform = 'translate3d(0, 0, 0)';
      cleanSceneElement(scenePhilosophy);
      if (scenePhilosophy) {
        scenePhilosophy.style.opacity = '1';
        scenePhilosophy.classList.add('revealed');
      }
      currentScene = 1;
      updateProgressDots(1);
      isTransitioning = false;
    }
  }

  // ── TRANSITION: 1 -> 0 (RETURN TO HERO) ─────────────────────
  function from1To0() {
    isTransitioning = true;
    const mobile = isMobile();

    // Step 1: Move Scene 1 elements out of frame
    if (typeof anime !== 'undefined') {
      anime({
        targets: '#scene-philosophy .split-left-inner',
        opacity: [1, 0],
        translateX: [0, -60],
        duration: 220,
        easing: 'easeInQuad'
      });

      anime({
        targets: '#scene-philosophy .split-right-inner',
        opacity: [1, 0],
        translateX: [0, 60],
        duration: 220,
        easing: 'easeInQuad',
        complete: function () {
          cleanSceneElement(scenePhilosophy);
          if (scenePhilosophy) {
            scenePhilosophy.style.opacity = '0';
            scenePhilosophy.classList.remove('revealed');
          }

          // Step 2: Curtains slide off-screen
          const leftAnim = mobile ? { translateY: ['0%', '-100%'] } : { translateX: ['0%', '-100%'] };
          const rightAnim = mobile ? { translateY: ['0%', '100%'] } : { translateX: ['0%', '100%'] };

          anime({
            targets: curtainLeft,
            ...leftAnim,
            duration: 620,
            easing: 'cubicBezier(0.16, 1, 0.3, 1)'
          });

          anime({
            targets: curtainRight,
            ...rightAnim,
            duration: 620,
            easing: 'cubicBezier(0.16, 1, 0.3, 1)',
            complete: function () {
              if (splitStage) splitStage.classList.remove('active');
              if (sceneLanding) {
                sceneLanding.classList.remove('behind-curtain');
                sceneLanding.style.opacity = '1';
                sceneLanding.style.visibility = 'visible';
              }

              // Step 3: Move Hero elements into frame
              cleanSceneElement(sceneLanding);
              anime({
                targets: ['.hero-inner', '.hero-corner', '.hero-scroll-cue'],
                opacity: [0, 1],
                translateY: [-25, 0],
                duration: 400,
                easing: 'easeOutQuart',
                complete: function () {
                  currentScene = 0;
                  updateProgressDots(0);
                  isTransitioning = false;
                }
              });
            }
          });
        }
      });
    } else {
      cleanSceneElement(scenePhilosophy);
      if (scenePhilosophy) {
        scenePhilosophy.style.opacity = '0';
        scenePhilosophy.classList.remove('revealed');
      }
      curtainLeft.style.transform = mobile ? 'translate3d(0, -100%, 0)' : 'translate3d(-100%, 0, 0)';
      curtainRight.style.transform = mobile ? 'translate3d(0, 100%, 0)' : 'translate3d(100%, 0, 0)';
      if (sceneLanding) {
        sceneLanding.classList.remove('behind-curtain');
        sceneLanding.style.opacity = '1';
        sceneLanding.style.visibility = 'visible';
      }
      if (splitStage) splitStage.classList.remove('active');
      currentScene = 0;
      updateProgressDots(0);
      isTransitioning = false;
    }
  }

  // ── TRANSITION: 3 -> 0 (DIRECT RETURN TO HERO) ─────────────
  function from3To0() {
    isTransitioning = true;
    const mobile = isMobile();

    if (typeof anime !== 'undefined') {
      anime({
        targets: ['#scene-why-join .why-center-inner', '#why-flank-left', '#why-flank-right'],
        opacity: [1, 0],
        duration: 200,
        easing: 'easeInQuad',
        complete: function () {
          cleanSceneElement(sceneWhyJoin);
          if (sceneWhyJoin) {
            sceneWhyJoin.style.opacity = '0';
            sceneWhyJoin.classList.remove('revealed');
          }
          if (sceneLanding) {
            sceneLanding.classList.remove('behind-curtain');
            sceneLanding.style.opacity = '1';
            sceneLanding.style.visibility = 'visible';
          }
          if (splitStage) splitStage.classList.remove('active');

          curtainLeft.style.transform = mobile ? 'translate3d(0, -100%, 0)' : 'translate3d(-100%, 0, 0)';
          curtainRight.style.transform = mobile ? 'translate3d(0, 100%, 0)' : 'translate3d(100%, 0, 0)';

          cleanSceneElement(sceneLanding);
          anime({
            targets: ['.hero-inner', '.hero-corner', '.hero-scroll-cue'],
            opacity: [0, 1],
            translateY: [-25, 0],
            duration: 400,
            easing: 'easeOutQuart',
            complete: function () {
              currentScene = 0;
              updateProgressDots(0);
              isTransitioning = false;
            }
          });
        }
      });
    } else {
      cleanSceneElement(sceneWhyJoin);
      if (sceneWhyJoin) {
        sceneWhyJoin.style.opacity = '0';
        sceneWhyJoin.classList.remove('revealed');
      }
      if (sceneLanding) {
        sceneLanding.classList.remove('behind-curtain');
        sceneLanding.style.opacity = '1';
        sceneLanding.style.visibility = 'visible';
      }
      if (splitStage) splitStage.classList.remove('active');
      curtainLeft.style.transform = mobile ? 'translate3d(0, -100%, 0)' : 'translate3d(-100%, 0, 0)';
      curtainRight.style.transform = mobile ? 'translate3d(0, 100%, 0)' : 'translate3d(100%, 0, 0)';
      currentScene = 0;
      updateProgressDots(0);
      isTransitioning = false;
    }
  }

  function getSceneEl(index) {
    if (index === 0) return sceneLanding;
    if (index === 1) return scenePhilosophy;
    if (index === 2) return scenePhilosoc;
    if (index === 3) return sceneWhyJoin;
    if (index === 4) return sceneFooter;
    return null;
  }

  // ── Unified Navigation Dispatcher ──
  function goTo(target) {
    if (isTransitioning || target === currentScene) return;

    // Step-by-step adjacent cinematic transitions
    if (currentScene === 0 && target === 1) return from0To1();
    if (currentScene === 1 && target === 2) return from1To2();
    if (currentScene === 2 && target === 3) return from2To3();
    if (currentScene === 3 && target === 4) return from3To4();
    if (currentScene === 4 && target === 3) return from4To3();
    if (currentScene === 3 && target === 2) return from3To2();
    if (currentScene === 2 && target === 1) return from2To1();
    if (currentScene === 1 && target === 0) return from1To0();
    if (currentScene === 3 && target === 0) return from3To0();

    // Direct multi-step jump (e.g. clicking non-adjacent dots)
    isTransitioning = true;
    const currentSceneEl = getSceneEl(currentScene);
    const targetSceneEl = getSceneEl(target);
    const mobile = isMobile();

    if (typeof anime !== 'undefined') {
      anime({
        targets: currentSceneEl,
        opacity: [1, 0],
        duration: 250,
        easing: 'easeInQuad',
        complete: function () {
          [sceneLanding, scenePhilosophy, scenePhilosoc, sceneWhyJoin, sceneFooter].forEach(function (s) {
            if (s && s !== targetSceneEl) {
              s.style.opacity = '0';
              s.classList.remove('revealed');
              if (s === sceneLanding) {
                s.classList.add('behind-curtain');
                s.style.visibility = 'hidden';
              }
            }
          });

          if (target === 1) {
            if (splitStage) splitStage.classList.add('active');
            curtainLeft.style.transform = 'translate3d(0, 0, 0)';
            curtainRight.style.transform = 'translate3d(0, 0, 0)';
          } else if (target === 2) {
            if (splitStage) splitStage.classList.add('active');
            curtainLeft.style.transform = mobile ? 'translate3d(0, 100%, 0)' : 'translate3d(100%, 0, 0)';
            curtainRight.style.transform = mobile ? 'translate3d(0, -100%, 0)' : 'translate3d(-100%, 0, 0)';
          } else {
            if (splitStage) splitStage.classList.remove('active');
            curtainLeft.style.transform = mobile ? 'translate3d(0, -100%, 0)' : 'translate3d(-100%, 0, 0)';
            curtainRight.style.transform = mobile ? 'translate3d(0, 100%, 0)' : 'translate3d(100%, 0, 0)';
          }

          if (target === 4) {
            var canvas = document.getElementById('iris-canvas');
            if (canvas) { canvas.style.display = 'none'; canvas.style.opacity = ''; }

            var imgDefault = document.getElementById('footer-img-default');
            document.querySelectorAll('.footer-img-wrap').forEach(function (w) {
              w.classList.remove('active');
              w.style.zIndex = '1';
            });
            if (imgDefault) {
              imgDefault.classList.add('active');
              imgDefault.style.zIndex = '3';
            }
            currentActiveImg = imgDefault;
            var navEls = document.querySelectorAll(
              '#footer-nav-panel .footer-top-bar, #footer-nav-panel .footer-nav-item, #footer-nav-panel .footer-nav-bottom'
            );
            var imgPanel = document.getElementById('footer-img-panel');
            if (imgPanel) { imgPanel.style.opacity = '1'; imgPanel.style.transform = 'none'; }
            navEls.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
          }

          if (targetSceneEl) {
            targetSceneEl.style.opacity = '1';
            targetSceneEl.classList.add('revealed');
            if (targetSceneEl === sceneLanding) {
              targetSceneEl.classList.remove('behind-curtain');
              targetSceneEl.style.visibility = 'visible';
            }
          }

          currentScene = target;
          updateProgressDots(target);
          isTransitioning = false;
        }
      });
    } else {
      currentScene = target;
      updateProgressDots(target);
      isTransitioning = false;
    }
  }

  // ── Wheel Scroll Event Listener ──
  window.addEventListener('wheel', function (e) {
    const now = performance.now();
    if (now - lastWheelTime < 400 || isTransitioning) return;

    if (e.deltaY > 25) {
      if (currentScene === 0) {
        lastWheelTime = now;
        goTo(1);
      } else if (currentScene === 1) {
        lastWheelTime = now;
        goTo(2);
      } else if (currentScene === 2) {
        lastWheelTime = now;
        goTo(3);
      } else if (currentScene === 3) {
        lastWheelTime = now;
        goTo(4);
      }
    } else if (e.deltaY < -25) {
      if (currentScene === 4) {
        lastWheelTime = now;
        goTo(3);
      } else if (currentScene === 3) {
        lastWheelTime = now;
        goTo(2);
      } else if (currentScene === 2) {
        lastWheelTime = now;
        goTo(1);
      } else if (currentScene === 1) {
        lastWheelTime = now;
        goTo(0);
      }
    }
  }, { passive: true });

  // ── Touch Gesture Listener (Mobile / Tablets) ──
  let touchStartY = 0;
  window.addEventListener('touchstart', function (e) {
    if (e.touches && e.touches.length > 0) {
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', function (e) {
    if (isTransitioning) return;
    if (e.changedTouches && e.changedTouches.length > 0) {
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY - touchEndY;

      if (deltaY > 45) {
        if (currentScene === 0) goTo(1);
        else if (currentScene === 1) goTo(2);
        else if (currentScene === 2) goTo(3);
        else if (currentScene === 3) goTo(4);
      } else if (deltaY < -45) {
        if (currentScene === 4) goTo(3);
        else if (currentScene === 3) goTo(2);
        else if (currentScene === 2) goTo(1);
        else if (currentScene === 1) goTo(0);
      }
    }
  }, { passive: true });

  // ── DOM Click Bindings ──
  document.addEventListener('DOMContentLoaded', function () {
    // Scroll cue on Hero
    const scrollCue = document.getElementById('l-scroll-cue');
    if (scrollCue) {
      scrollCue.style.cursor = 'pointer';
      scrollCue.addEventListener('click', function () {
        goTo(1);
      });
    }

    // "What is PhiloSoc?" button in Scene 1
    const btnToPhiloSoc = document.getElementById('btn-to-philosoc');
    if (btnToPhiloSoc) {
      btnToPhiloSoc.addEventListener('click', function (e) {
        e.preventDefault();
        goTo(2);
      });
    }

    // Return to top button in Scene 1
    const btnTop = document.getElementById('philo-btn-top');
    if (btnTop) {
      btnTop.addEventListener('click', function (e) {
        e.preventDefault();
        goTo(0);
      });
    }

    // "What is Philosophy?" button in Scene 2
    const btnBackPhilo = document.getElementById('btn-back-philosophy');
    if (btnBackPhilo) {
      btnBackPhilo.addEventListener('click', function (e) {
        e.preventDefault();
        goTo(1);
      });
    }

    // "Why Join Us?" button in Scene 2
    const btnToWhyJoin = document.getElementById('btn-to-why-join');
    if (btnToWhyJoin) {
      btnToWhyJoin.addEventListener('click', function (e) {
        e.preventDefault();
        goTo(3);
      });
    }

    // "Back to PhiloSoc" button in Scene 3
    const btnBackPhiloSoc = document.getElementById('btn-back-philosoc');
    if (btnBackPhiloSoc) {
      btnBackPhiloSoc.addEventListener('click', function (e) {
        e.preventDefault();
        goTo(2);
      });
    }

    // "Top" button in Scene 3
    const btnWhyTop = document.getElementById('btn-why-top');
    if (btnWhyTop) {
      btnWhyTop.addEventListener('click', function (e) {
        e.preventDefault();
        goTo(0);
      });
    }

    // Footer "Back" button (Scene 4 -> Scene 3)
    const btnFooterBack = document.getElementById('btn-footer-back');
    if (btnFooterBack) {
      btnFooterBack.addEventListener('click', function (e) {
        e.preventDefault();
        goTo(3);
      });
    }

    // ── Scene 4 Image Hover Logic (Silky Cross-Fade, Zero Flash) ──
    const footerNavList = document.querySelector('.footer-nav-list');
    const footerNavPanel = document.getElementById('footer-nav-panel');
    const footerNavItems = document.querySelectorAll('.footer-nav-item[data-img-target]');

    footerNavItems.forEach(function (item) {
      const imgTargetId = item.getAttribute('data-img-target');
      const targetWrap = document.getElementById(imgTargetId);

      item.addEventListener('mouseenter', function () {
        if (hoverResetTimer) {
          clearTimeout(hoverResetTimer);
          hoverResetTimer = null;
        }
        activateFooterImage(targetWrap);
      });
    });

    // Reset back to default logo only when leaving the nav container
    const navHoverZone = footerNavList || footerNavPanel;
    if (navHoverZone) {
      navHoverZone.addEventListener('mouseleave', function () {
        scheduleResetToDefault();
      });
    }

    const sceneFooterEl = document.getElementById('scene-footer');
    if (sceneFooterEl) {
      sceneFooterEl.addEventListener('mouseleave', function () {
        scheduleResetToDefault();
      });
    }

    // Progress Dots (0, 1, 2, 3, 4)
    dots.forEach((dot) => {
      dot.addEventListener('click', function () {
        const target = parseInt(this.getAttribute('data-scene'), 10);
        goTo(target);
      });
    });
  });

  // Expose API globally
  window.Philosoc = {
    goTo: goTo,
    getCurrentScene: function () {
      return currentScene;
    }
  };

})();
