/* ════════════════════════════════════════════
   FUNKY FAREWELL 2026 — JAVASCRIPT
════════════════════════════════════════════ */
(() => {
  'use strict';

  /* ── INTRO OVERLAY ── */
  const introOverlay = document.getElementById('introOverlay');
  const introSkip = document.getElementById('introSkip');

  // Lock scroll during intro
  document.body.classList.add('intro-active');

  function dismissIntro() {
    introOverlay.style.animation = 'introOverlayFade 0.5s ease forwards';
    setTimeout(() => {
      introOverlay.classList.add('gone');
      document.body.classList.remove('intro-active');
    }, 500);
  }

  // Auto-dismiss after animation (1.4s zoom + 0.4s text + 4.5s overlay fade)
  setTimeout(dismissIntro, 5200);

  // Skip button — dismiss intro AND jump-start auto-scroll sooner
  introSkip.addEventListener('click', () => {
    dismissIntro();
    clearTimeout(window._autoScrollTimer);
    window._autoScrollTimer = setTimeout(startAutoScroll, 700);
  });

  /* ══════════════════════════════════════════
     CINEMATIC AUTO-SCROLLER
     Smooth camera-pull-down through the page.
     Pauses when user interacts, restarts after 4 s.
  ══════════════════════════════════════════ */

  // Inject a cinematic lens-vignette overlay
  const vignette = document.createElement('div');
  vignette.id = 'cineVignette';
  vignette.style.cssText = `
    position:fixed; inset:0; pointer-events:none; z-index:9997;
    background: radial-gradient(ellipse at center,
      transparent 55%,
      rgba(0,0,0,0.55) 100%);
    opacity:0; transition:opacity 0.6s ease;
  `;
  document.body.appendChild(vignette);

  // Lens-flash element (white burst on section entry)
  const lensFlash = document.createElement('div');
  lensFlash.id = 'lensFlash';
  lensFlash.style.cssText = `
    position:fixed; inset:0; pointer-events:none; z-index:9996;
    background: rgba(255,255,255,0); transition:background 0.05s ease;
  `;
  document.body.appendChild(lensFlash);

  let autoScrollActive = false;
  let autoScrollPaused = false;
  let lastUserInteract = 0;
  let autoScrollRAF = null;
  let lastTimestamp = null;
  let currentSpeed = 0;        // px/s — will ramp up
  const BASE_SPEED = 130;      // cruising px/s
  const SLOW_SPEED = 55;       // near section headers
  const RAMP_RATE = 80;       // px/s² acceleration
  let lastScrollY = 0;
  let sectionBounds = [];

  // Collect section tops for speed variation
  function refreshSectionBounds() {
    sectionBounds = Array.from(document.querySelectorAll('section[id]'))
      .map(s => ({ top: s.offsetTop, bottom: s.offsetTop + s.offsetHeight }));
  }

  // Determine target speed based on scroll position
  function targetSpeed(y) {
    for (const s of sectionBounds) {
      const nearTop = Math.abs(y - s.top);
      if (nearTop < 120) return SLOW_SPEED; // slow near section header
    }
    return BASE_SPEED;
  }

  // Section flash / vignette pulse on crossing a section boundary
  let lastSection = -1;
  function detectSectionCross(y) {
    for (let i = 0; i < sectionBounds.length; i++) {
      const s = sectionBounds[i];
      if (y >= s.top && y < s.top + 80 && lastSection !== i) {
        lastSection = i;
        // Lens flash
        lensFlash.style.background = 'rgba(255,255,255,0.18)';
        setTimeout(() => { lensFlash.style.background = 'rgba(255,255,255,0)'; }, 120);
        // Vignette pulse
        vignette.style.opacity = '1';
        setTimeout(() => { vignette.style.opacity = '0.3'; }, 400);
      }
    }
  }

  function autoScrollStep(ts) {
    if (!autoScrollActive || autoScrollPaused) {
      lastTimestamp = null;
      return;
    }

    if (!lastTimestamp) { lastTimestamp = ts; autoScrollRAF = requestAnimationFrame(autoScrollStep); return; }

    const dt = Math.min((ts - lastTimestamp) / 1000, 0.05); // cap at 50ms
    lastTimestamp = ts;

    const target = targetSpeed(window.scrollY);
    // Ease currentSpeed toward target
    if (currentSpeed < target) currentSpeed = Math.min(currentSpeed + RAMP_RATE * dt, target);
    else currentSpeed = Math.max(currentSpeed - RAMP_RATE * dt, target);

    const pixels = currentSpeed * dt;
    const newY = window.scrollY + pixels;
    const maxY = document.documentElement.scrollHeight - window.innerHeight;

    if (newY >= maxY) {
      // Reached bottom — gently pause
      window.scrollTo({ top: maxY, behavior: 'instant' });
      stopAutoScroll();
      return;
    }

    window.scrollTo({ top: newY, behavior: 'instant' });
    detectSectionCross(newY);
    autoScrollRAF = requestAnimationFrame(autoScrollStep);
  }

  function startAutoScroll() {
    refreshSectionBounds();
    autoScrollActive = true;
    autoScrollPaused = false;
    currentSpeed = 0;
    lastTimestamp = null;
    vignette.style.opacity = '0.35';
    autoScrollRAF = requestAnimationFrame(autoScrollStep);
  }

  function stopAutoScroll() {
    autoScrollActive = false;
    vignette.style.opacity = '0';
    if (autoScrollRAF) cancelAnimationFrame(autoScrollRAF);
  }

  function pauseAutoScroll() {
    if (!autoScrollActive) return;
    autoScrollPaused = true;
    lastUserInteract = Date.now();
    vignette.style.opacity = '0';
  }

  function resumeAutoScroll() {
    if (!autoScrollActive) return;
    autoScrollPaused = false;
    lastTimestamp = null;
    vignette.style.opacity = '0.35';
    autoScrollRAF = requestAnimationFrame(autoScrollStep);
  }

  // Detect user interaction — pause and schedule resume
  let resumeTimer = null;
  function onUserInteract() {
    pauseAutoScroll();
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      if (window.scrollY < document.documentElement.scrollHeight - window.innerHeight - 10) {
        resumeAutoScroll();
      }
    }, 4000);
  }

  ['wheel', 'touchstart', 'touchmove', 'mousedown', 'keydown'].forEach(ev => {
    window.addEventListener(ev, onUserInteract, { passive: true });
  });

  // Start auto-scroll after intro finishes
  window._autoScrollTimer = setTimeout(startAutoScroll, 5700);

  /* ── CURSOR GLOW ── */
  const glow = document.getElementById('cursorGlow');
  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });

  /* ── NAVBAR ── */
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const navOverlay = document.getElementById('navOverlay');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  function openMenu() {
    navLinks.classList.add('open');
    navOverlay.classList.add('open');
    navToggle.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    navLinks.classList.remove('open');
    navOverlay.classList.remove('open');
    navToggle.classList.remove('open');
    document.body.style.overflow = '';
  }
  navToggle.addEventListener('click', () => navLinks.classList.contains('open') ? closeMenu() : openMenu());
  navOverlay.addEventListener('click', closeMenu);
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  /* ── HERO FLOATING EMOJIS ── */
  const emojis = ['🎓', '✨', '🌟', '💫', '🎉', '🥂', '📚', '💛', '🎶', '🌸', '🪄', '🎊'];
  const floaters = document.getElementById('heroFloaters');

  function spawnFloater() {
    const el = document.createElement('div');
    el.className = 'floater';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const size = Math.random() * 1.2 + 0.8;
    const dur = Math.random() * 8 + 9;
    const left = Math.random() * 100;
    el.style.cssText = `
      left: ${left}%;
      font-size: ${size * 1.6}rem;
      animation-duration: ${dur}s;
      animation-delay: -${Math.random() * dur}s;
    `;
    floaters.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000 + 2000);
  }
  for (let i = 0; i < 14; i++) spawnFloater();
  setInterval(spawnFloater, 1800);

  /* ── SCROLL REVEAL ── */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay || i * 100, 10);
        setTimeout(() => entry.target.classList.add('revealed'), delay);
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('[data-reveal]').forEach((el, i) => {
    el.dataset.delay = i * 100;
    revealObs.observe(el);
  });

  /* ── NAV ACTIVE HIGHLIGHT ── */
  const sections = document.querySelectorAll('section[id]');
  const navAs = document.querySelectorAll('.nav-links a');
  const secObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navAs.forEach(a => {
          a.classList.remove('active');
          if (a.getAttribute('href') === `#${e.target.id}`) a.classList.add('active');
        });
      }
    });
  }, { threshold: 0.45 });
  sections.forEach(s => secObs.observe(s));

  /* ── COUNTDOWN — 1:00 AM April 1 2026 ── */
  const eventTime = new Date('2026-04-01T01:00:00').getTime();
  const $d = document.getElementById('days');
  const $h = document.getElementById('hours');
  const $m = document.getElementById('minutes');
  const $s = document.getElementById('seconds');
  const $grid = document.getElementById('cdGrid');
  const $endMsg = document.getElementById('eventEndedMsg');

  function pad(n) { return String(n).padStart(2, '0'); }
  function tick(el, val) {
    const v = pad(val);
    if (el.textContent !== v) {
      el.textContent = v;
      el.classList.remove('tick');
      void el.offsetWidth;
      el.classList.add('tick');
    }
  }
  function updateCD() {
    const diff = eventTime - Date.now();
    if (diff <= 0) {
      $grid.classList.add('hidden');
      $endMsg.classList.remove('hidden');
      return;
    }
    tick($d, Math.floor(diff / 86400000));
    tick($h, Math.floor((diff % 86400000) / 3600000));
    tick($m, Math.floor((diff % 3600000) / 60000));
    tick($s, Math.floor((diff % 60000) / 1000));
  }
  updateCD();
  setInterval(updateCD, 1000);

  /* ── INFO CARD TILT ── */
  document.querySelectorAll('.info-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-5px) scale(1.02) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ── MEMORY CARD HOVER GLOW ── */
  document.querySelectorAll('.mem-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
      const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
      card.style.setProperty('--mx', `${x}%`);
      card.style.setProperty('--my', `${y}%`);
    });
  });

  /* ── PROGRAMME ITEM STAGGER ── */
  const progItems = document.querySelectorAll('.prog-item');
  const progObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      progItems.forEach((item, i) => {
        setTimeout(() => {
          item.style.opacity = '1';
          item.style.transform = 'translateX(0)';
        }, i * 100);
      });
      progObs.disconnect();
    }
  }, { threshold: 0.1 });

  progItems.forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateX(-20px)';
    item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  });
  if (progItems.length) progObs.observe(progItems[0].closest('.prog-list'));

  /* ── PHOTO GALLERY LIGHTBOX ── */
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbCaption = document.getElementById('lbCaption');
  const lbClose = document.getElementById('lbClose');
  const lbPrev = document.getElementById('lbPrev');
  const lbNext = document.getElementById('lbNext');
  const lbBackdrop = document.getElementById('lbBackdrop');

  // Collect all real (non-placeholder) gallery images
  let galleryImgs = [];
  let lbIndex = 0;

  function buildGalleryList() {
    galleryImgs = [];
    document.querySelectorAll('.g-item .g-inner').forEach(inner => {
      const img = inner.querySelector('img');
      if (img && !inner.classList.contains('g-placeholder')) {
        galleryImgs.push({ src: img.src, alt: img.alt });
      }
    });
  }

  function openLightbox(index) {
    buildGalleryList();
    if (!galleryImgs.length) return;
    lbIndex = index;
    showLb();
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.add('hidden');
    document.body.style.overflow = '';
  }
  function showLb() {
    const item = galleryImgs[lbIndex];
    if (!item) return;
    lbImg.src = item.src;
    lbImg.alt = item.alt;
    lbCaption.textContent = item.alt;
    // Trigger re-animation
    lbImg.style.animation = 'none';
    void lbImg.offsetWidth;
    lbImg.style.animation = '';
    lbPrev.style.visibility = lbIndex > 0 ? 'visible' : 'hidden';
    lbNext.style.visibility = lbIndex < galleryImgs.length - 1 ? 'visible' : 'hidden';
  }

  // Click gallery items to open lightbox
  document.querySelectorAll('.g-item').forEach((item, i) => {
    item.addEventListener('click', () => {
      buildGalleryList();
      // Map click index to real image index (skip placeholders)
      let realIdx = 0;
      let clicked = false;
      document.querySelectorAll('.g-item .g-inner').forEach((inner, j) => {
        if (!inner.classList.contains('g-placeholder')) {
          if (j === i) { lbIndex = realIdx; clicked = true; }
          realIdx++;
        } else if (j === i) { clicked = true; }
      });
      if (clicked && galleryImgs.length) openLightbox(lbIndex);
    });
  });

  lbClose.addEventListener('click', closeLightbox);
  lbBackdrop.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', () => { if (lbIndex > 0) { lbIndex--; showLb(); } });
  lbNext.addEventListener('click', () => { if (lbIndex < galleryImgs.length - 1) { lbIndex++; showLb(); } });

  document.addEventListener('keydown', e => {
    if (lightbox.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') { if (lbIndex > 0) { lbIndex--; showLb(); } }
    if (e.key === 'ArrowRight') { if (lbIndex < galleryImgs.length - 1) { lbIndex++; showLb(); } }
  });

})();
