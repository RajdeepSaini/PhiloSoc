/* ================================================================
   scripts/intro.js — Three.js newspaper intro
   Aged 3D newspaper with realistic vertex-based page curl + camera zoom
   ================================================================ */

(function () {
  'use strict';

  const overlay = document.getElementById('intro-overlay');

  function skipIntro() {
    if (overlay) overlay.style.display = 'none';
    if (window.onIntroComplete) window.onIntroComplete();
  }

  // ── Wait for Three.js to be available ──────────────────────────
  if (typeof THREE === 'undefined') {
    console.warn('Philosoc: Three.js not loaded — skipping intro.');
    skipIntro();
    return;
  }

  // ── Renderer ───────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x0e0c08, 1);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.inset = '0';
  overlay.appendChild(renderer.domElement);

  // ── Scene & Camera ─────────────────────────────────────────────
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 4.5);

  // ── Lights ─────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xfff8e8, 0.65));

  const keyLight = new THREE.DirectionalLight(0xfff4e0, 1.0);
  keyLight.position.set(1.5, 3, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xc4b890, 0.28);
  fillLight.position.set(-2, -1, 2);
  scene.add(fillLight);

  // Subtle back-rim for depth
  const rimLight = new THREE.DirectionalLight(0x8a7a60, 0.15);
  rimLight.position.set(0, 0, -3);
  scene.add(rimLight);

  // ── Newspaper dimensions (3D units) ────────────────────────────
  // At camera z=4.5, FOV 42°: visible height ≈ 3.5 units. NW/NH chosen to fill ~85% of screen.
  const NW = 2.2;    // width
  const NH = 3.2;    // height (portrait newspaper)
  const SEG = 40;    // width segments for smooth curl

  // ── Canvas texture helpers ──────────────────────────────────────

  function grain(ctx, w, h, n) {
    for (let i = 0; i < n; i++) {
      const a = (Math.random() * 0.17).toFixed(3);
      ctx.fillStyle = `rgba(26,16,8,${a})`;
      ctx.fillRect(
        Math.random() * w, Math.random() * h,
        Math.random() * 1.8 + 0.2, Math.random() * 1.8 + 0.2
      );
    }
  }

  function paperBg(ctx, w, h) {
    // Aged paper radial gradient
    const g = ctx.createRadialGradient(w * 0.48, h * 0.42, 0, w * 0.5, h * 0.5, w * 0.76);
    g.addColorStop(0,   '#f2ebd4');
    g.addColorStop(0.5, '#ece0c4');
    g.addColorStop(1,   '#e2d4ae');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Horizontal newsprint lines
    for (let y = 0; y < h; y += 27) {
      ctx.strokeStyle = `rgba(26,16,8,${(0.028 + Math.random() * 0.016).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + Math.random() * 0.4);
      ctx.lineTo(w, y + Math.random() * 0.4);
      ctx.stroke();
    }

    // Left-edge darkening (paper shadow)
    const ls = ctx.createLinearGradient(0, 0, 28, 0);
    ls.addColorStop(0, 'rgba(26,16,8,0.22)');
    ls.addColorStop(1, 'rgba(26,16,8,0)');
    ctx.fillStyle = ls;
    ctx.fillRect(0, 0, 28, h);

    // Bottom-edge darkening
    const bs = ctx.createLinearGradient(0, h - 24, 0, h);
    bs.addColorStop(0, 'rgba(26,16,8,0)');
    bs.addColorStop(1, 'rgba(26,16,8,0.14)');
    ctx.fillStyle = bs;
    ctx.fillRect(0, h - 24, w, 24);
  }

  // Slightly imperfect filled rectangle (letterpress feel)
  function rb(ctx, x, y, w, h) {
    ctx.fillStyle = '#0d0905'; // very dark — high contrast on aged paper
    ctx.fillRect(
      x + (Math.random() - 0.5) * 2,
      y + (Math.random() - 0.5) * 1.5,
      w + (Math.random() - 0.5) * 3,
      h + (Math.random() - 0.5) * 1.5
    );
    // Halftone dots on larger blocks (printer artifact)
    if (h > 38 && w > 90) {
      ctx.fillStyle = 'rgba(240,232,208,0.055)';
      for (let dx = 8; dx < w; dx += 12) {
        for (let dy = 8; dy < h; dy += 12) {
          ctx.beginPath();
          ctx.arc(x + dx, y + dy, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // Slightly wobbly text lines
  function rl(ctx, x, y, mw, n) {
    const ws = [1, .93, .83, .91, .73, .87, .79, .96, .69, .88, .76, .94];
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = '#0d0905'; // high contrast
      ctx.fillRect(
        x + (Math.random() - 0.5) * 1.8,
        y + i * 22,
        mw * ws[i % ws.length] + (Math.random() - 0.5) * 4,
        9 + (Math.random() - 0.5) * 2
      );
    }
  }

  // ── Front cover texture (redacted newspaper) ────────────────────
  function makeFrontTex() {
    const W = 1024, H = 1440;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');

    paperBg(ctx, W, H);
    grain(ctx, W, H, 58000);

    // Crinkle fold marks (newspaper has been folded)
    ctx.strokeStyle = 'rgba(150,130,88,0.24)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, H / 2 - 8 + Math.random() * 6);
    ctx.bezierCurveTo(W * 0.25, H / 2 - 3, W * 0.72, H / 2 + 7, W, H / 2 + 3);
    ctx.stroke();

    // Another crease
    ctx.strokeStyle = 'rgba(150,130,88,0.14)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(W * 0.5, 0);
    ctx.bezierCurveTo(W * 0.5 - 4, H * 0.35, W * 0.5 + 5, H * 0.65, W * 0.5 + 2, H);
    ctx.stroke();

    // Masthead
    ctx.fillStyle = '#1a1008';
    ctx.font = 'bold 70px "Georgia", "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE EXAMINED TIMES', W / 2, 94);

    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = '#3d3020';
    ctx.textAlign = 'left';  ctx.fillText('VOL. CXXXIV   NO. 1', 48, 120);
    ctx.textAlign = 'right'; ctx.fillText('ONE PAISE', W - 48, 120);
    ctx.textAlign = 'center';
    ctx.fillText('IIIT DELHI  ·  PHILOSOPHY SOCIETY  ·  EST. 2024', W / 2, 120);

    // Double rule
    ctx.strokeStyle = '#1a1008';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(42, 130); ctx.lineTo(982, 130); ctx.stroke();
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(42, 136); ctx.lineTo(982, 136); ctx.stroke();

    // Column rules
    ctx.strokeStyle = 'rgba(26,16,8,0.22)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(338, 144); ctx.lineTo(338, H - 64); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(692, 144); ctx.lineTo(692, H - 64); ctx.stroke();

    // Col 1 (left)
    rb(ctx, 52, 152, 266, 30);
    rl(ctx, 52, 195, 266, 5);
    rb(ctx, 52, 310, 266, 92);
    rl(ctx, 52, 415, 266, 4);
    rb(ctx, 52, 504, 266, 22);
    rl(ctx, 52, 538, 266, 3);

    // Col 2 (center — main story, wider)
    rb(ctx, 352, 152, 318, 46);
    rb(ctx, 352, 206, 238, 18);
    rl(ctx, 352, 238, 318, 9);
    rb(ctx, 352, 444, 318, 146);
    rl(ctx, 352, 604, 318, 5);
    rb(ctx, 352, 714, 318, 22);
    rl(ctx, 352, 748, 318, 3);

    // Col 3 (right)
    rb(ctx, 706, 152, 268, 130);
    rb(ctx, 706, 290, 268, 24);
    rl(ctx, 706, 328, 268, 5);
    rb(ctx, 706, 444, 268, 22);
    rl(ctx, 706, 478, 268, 4);

    // Footer rule + line
    ctx.strokeStyle = 'rgba(26,16,8,0.3)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(42, H - 62); ctx.lineTo(982, H - 62); ctx.stroke();
    rl(ctx, 130, H - 56, 740, 1);

    grain(ctx, W, H, 20000); // second grain pass

    return new THREE.CanvasTexture(cv);
  }

  // ── Inner pages texture (skeleton of landing page) ──────────────
  function makeInnerTex() {
    const W = 1024, H = 1440;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');

    paperBg(ctx, W, H);
    grain(ctx, W, H, 44000);

    // Spine crease
    ctx.strokeStyle = 'rgba(140,118,78,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 + 3, 0);
    ctx.bezierCurveTo(W / 2 - 2, H * 0.3, W / 2 + 5, H * 0.65, W / 2, H);
    ctx.stroke();

    // ── Landing page skeleton ──────────────────────────────────────
    // Ghost outlines of where the real landing page elements will be.
    // Layout: left = text column, right = photo collage.

    ctx.strokeStyle = 'rgba(26,16,8,0.2)';
    ctx.lineWidth = 1.3;

    // Nav bar
    ctx.strokeRect(38, 52, 948, 54);
    ctx.fillStyle = 'rgba(26,16,8,0.14)';
    ctx.fillRect(58, 70, 116, 18);       // logo block
    for (let i = 0; i < 5; i++) ctx.fillRect(668 + i * 56, 72, 44, 10); // nav links

    // Big title block (left side — PHILOSOC)
    ctx.fillStyle = 'rgba(26,16,8,0.22)';
    ctx.fillRect(56, 158, 382, 96);

    // Tagline
    ctx.fillStyle = 'rgba(26,16,8,0.11)';
    ctx.fillRect(56, 268, 274, 13);

    // Description lines
    ctx.fillRect(56, 296, 364, 9);
    ctx.fillRect(56, 311, 342, 9);
    ctx.fillRect(56, 326, 350, 9);
    ctx.fillRect(56, 341, 284, 9);

    // CTA ghost
    ctx.fillRect(56, 372, 182, 9);

    // Photo collage frames (right side)
    ctx.strokeStyle = 'rgba(26,16,8,0.16)';
    ctx.lineWidth = 1.3;
    const ox = 544, oy = 148, cs = 190, cm = 206;

    ctx.strokeRect(ox,        oy,        cs, cs); // TL
    ctx.strokeRect(ox + cs + 10, oy,     cs, cs); // TR
    ctx.strokeRect(ox,        oy + cs + 10, cs, cs); // BL
    ctx.strokeRect(ox + cs + 10, oy + cs + 10, cs, cs); // BR

    // Center photo (overlapping all four)
    ctx.strokeStyle = 'rgba(26,16,8,0.24)';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(ox + cs / 2 - cm / 2 + 5, oy + cs / 2 - cm / 2 + 5, cm, cm);

    grain(ctx, W, H, 14000);

    return new THREE.CanvasTexture(cv);
  }

  // ── Build meshes ───────────────────────────────────────────────

  // Dark backdrop
  scene.add(new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x080706, roughness: 1 })
  ));

  // Inner pages (static — behind the cover)
  const innerMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(NW, NH, 1, 1),
    new THREE.MeshStandardMaterial({ map: makeInnerTex(), roughness: 0.88 })
  );
  innerMesh.position.z = -0.006;

  // Cover (will curl/flip)
  const coverGeo = new THREE.PlaneGeometry(NW, NH, SEG, 4);
  const origPos  = Float32Array.from(coverGeo.attributes.position.array);

  const coverMat = new THREE.MeshStandardMaterial({
    map: makeFrontTex(),
    roughness: 0.84,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1
  });
  const coverMesh = new THREE.Mesh(coverGeo, coverMat);

  // Group so tilts apply to both meshes together
  const npGroup = new THREE.Group();
  scene.add(npGroup);
  npGroup.add(innerMesh);
  npGroup.add(coverMesh);

  // Soft shadow card beneath newspaper
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 });
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(NW + 0.3, NH + 0.3), shadowMat);
  shadowMesh.position.z = -0.12;
  shadowMesh.position.y = -0.08;
  scene.add(shadowMesh);

  // ── Page curl (vertex deformation) ────────────────────────────
  // Physics: rolling-cylinder model.
  // The fold sweeps from x = +hw (free edge, right) to x = -hw (spine, left).
  // Vertices that the fold has swept past curl around a cylinder of radius R.

  const HW      = NW / 2;
  const CURL_R  = 0.12;  // tight curl radius — real newspaper is thin

  function applyCurl(p) {
    if (p <= 0.001) return;

    const pos    = coverGeo.attributes.position;
    const foldX  = HW - p * NW;  // fold world-x: moves HW → -HW as p: 0→1

    for (let i = 0; i < pos.count; i++) {
      const ox = origPos[i * 3];      // original x: -HW to +HW
      const oy = origPos[i * 3 + 1]; // original y: unchanged

      // Normalized spine-to-free-edge position: 0 = spine (left), 1 = free edge (right)
      const t = (ox + HW) / NW;

      // Fold sweeps from right (t=1 at p=0) to left (t=0 at p=1).
      // Fold has passed vertex t when: p >= 1 - t, i.e. t >= 1 - p.
      if (t < 1.0 - p) {
        // Not yet reached — stays flat
        pos.setXYZ(i, ox, oy, 0);
      } else {
        // Curling — compute local progress and map to cylinder arc.
        // localP: 0 when fold just reached vertex, 1 when it's the leading edge.
        const localP = Math.min(1, (p + t - 1) / Math.max(t, 0.0001));
        const theta  = localP * Math.PI;

        // Cylinder arc: x moves left of fold, z lifts up then comes back down.
        const nx = foldX - CURL_R * Math.sin(theta);
        const nz = CURL_R * (1.0 - Math.cos(theta));

        pos.setXYZ(i, nx, oy, nz);
      }
    }

    pos.needsUpdate = true;
    coverGeo.computeVertexNormals();

    // Fade cover out as it nears fully flipped (avoid seeing the "back side land")
    if (p > 0.7) {
      coverMat.opacity = Math.max(0, 1 - (p - 0.7) / 0.3);
    }
  }

  // ── Animation state (driven by Anime.js) ──────────────────────
  const A = {
    npY:  -5,     // newspaper enters from below
    rotX:  0.18,  // initial table tilt
    rotZ: -0.04,
    curl:  0,     // page curl progress 0→1
    camZ:  4.5,   // camera depth
    alpha: 1      // renderer opacity (fades to 0 at end)
  };

  // ── Anime.js timeline ─────────────────────────────────────────
  let started = false;

  function boot() {
    if (started) return;
    started = true;

    if (typeof anime === 'undefined') { skipIntro(); return; }

    // 1. Newspaper flies in from below
    anime({ targets: A, npY: 0, duration: 920, easing: 'easeOutCubic' });

    // 2. Settle wobble (feels weighted)
    anime({ targets: A, rotZ: [-0.044, -0.058, -0.034, -0.044],
            duration: 520, delay: 920, easing: 'easeInOutSine' });

    // 3. Straighten to face viewer
    anime({ targets: A, rotX: 0, rotZ: 0,
            duration: 820, delay: 1440, easing: 'easeInOutQuart' });

    // 4. Page curl (rolling cylinder)
    anime({
      targets: A, curl: 1,
      duration: 1550, delay: 2350,
      easing: 'easeInOutCubic',
      update: () => applyCurl(A.curl)
    });

    // 5. Camera zooms into inner pages (skeleton aligns with landing)
    anime({ targets: A, camZ: 1.8, duration: 1400, delay: 4050, easing: 'easeInCubic' });

    // 6. Fade out → reveal landing page
    anime({
      targets: A, alpha: 0,
      duration: 480, delay: 5200,
      easing: 'easeOutQuad',
      complete: () => {
        overlay.style.display = 'none';
        if (window.onIntroComplete) window.onIntroComplete();
      }
    });
  }

  document.fonts.ready.then(boot);
  setTimeout(boot, 2000); // guaranteed start after 2s

  // ── Render loop ───────────────────────────────────────────────
  function render() {
    requestAnimationFrame(render);

    npGroup.position.y = A.npY;
    npGroup.rotation.x = A.rotX;
    npGroup.rotation.z = A.rotZ;

    // Shadow follows newspaper
    shadowMesh.position.y = A.npY - 0.08;

    camera.position.z = A.camZ;
    renderer.domElement.style.opacity = A.alpha;

    renderer.render(scene, camera);
  }
  render();

  // ── Resize handler ────────────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

})();
