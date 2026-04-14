document.querySelectorAll('.tt-btn').forEach((btn) => {
  const reveal = btn.querySelector('.tt-btn-reveal');
  const bg = btn.querySelector('.tt-btn-bg');

  // Only enable reveal behavior if reveal element exists
  if (!reveal || !bg) return;

  // Optional: set a flag for CSS debugging / targeting
  btn.dataset.hasReveal = 'true';

  // Keep state in data attribute (as before)
  if (!btn.dataset.revealState) btn.dataset.revealState = 'idle';

  let currentState = btn.dataset.revealState;
  let fadeoutTimeoutId = null;

  function setRevealState(next) {
    currentState = next;
    btn.dataset.revealState = next;
  }

  function getBgGrowPx() {
    const v = getComputedStyle(btn).getPropertyValue('--tt-btn-bg-grow').trim();
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }

  function computeRadius(rect, x, y, growPx) {
    const d1 = Math.hypot(x, y);
    const d2 = Math.hypot(rect.width - x, y);
    const d3 = Math.hypot(x, rect.height - y);
    const d4 = Math.hypot(rect.width - x, rect.height - y);
    return Math.max(d1, d2, d3, d4) + growPx + 2;
  }

  function setOrigin(e) {
    const rect = bg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    btn.style.setProperty('--tt-reveal-x', `${x}px`);
    btn.style.setProperty('--tt-reveal-y', `${y}px`);
    return { x, y };
  }

  function setRadiusFromCurrentBgRect(x, y) {
    const rect = bg.getBoundingClientRect();
    const growPx = getBgGrowPx();
    const r = computeRadius(rect, x, y, growPx);
    btn.style.setProperty('--tt-reveal-r', `${r}px`);
  }

  // Prewarm: einmalig Layout/Repaint-Pfad anstoßen, um erste Hover-Ruckler zu reduzieren
  (function prewarmReveal() {
    // Optionaler Opt-in über Data-Attribut; wenn du ALLE Buttons vorwärmen willst,
    // entferne einfach diese if-Bedingung.
    if (btn.dataset.prewarmReveal !== 'true') return;

    try {
      const rect = bg.getBoundingClientRect();
      const x = rect.width / 2;
      const y = rect.height / 2;
      const growPx = getBgGrowPx();
      const r = computeRadius(rect, x, y, growPx);

      btn.style.setProperty('--tt-reveal-x', `${x}px`);
      btn.style.setProperty('--tt-reveal-y', `${y}px`);
      btn.style.setProperty('--tt-reveal-r', `${r}px`);

      // einmal kurz Layout/Styles "anticken"
      void reveal.offsetWidth;
    } catch (e) {
      // stiller Fail, falls etwas schief geht
    }
  })();

  btn.addEventListener('mouseenter', (e) => {
    // laufendes Fadeout abbrechen, wenn der Pointer wieder reinkommt
    if (fadeoutTimeoutId !== null) {
      window.clearTimeout(fadeoutTimeoutId);
      fadeoutTimeoutId = null;
    }

    setRevealState('resetting');

    const { x, y } = setOrigin(e);
    setRadiusFromCurrentBgRect(x, y);

    void reveal.offsetWidth;

    // kleine, robuste Sequenz: resetting -> armed -> revealing
    requestAnimationFrame(() => {
      // Wenn der Pointer inzwischen schon wieder draußen ist, abbrechen
      if (!btn.matches(':hover')) {
        setRevealState('idle');
        return;
      }

      setRevealState('armed');

      requestAnimationFrame(() => {
        if (!btn.matches(':hover')) {
          setRevealState('idle');
          return;
        }

        setRadiusFromCurrentBgRect(x, y);
        setRevealState('revealing');
      });
    });
  });

  btn.addEventListener('mouseleave', () => {
    // aus "neutralen" Zuständen einfach auf idle zurück
    if (currentState === 'idle' || currentState === 'resetting') {
      setRevealState('idle');
      return;
    }

    setRevealState('fadeout');

    if (fadeoutTimeoutId !== null) {
      window.clearTimeout(fadeoutTimeoutId);
    }

    // etwas längeres, stabiles Fadeout-Fenster
    fadeoutTimeoutId = window.setTimeout(() => {
      fadeoutTimeoutId = null;
      if (!btn.matches(':hover')) {
        setRevealState('idle');
      }
    }, 220);
  });
});

/* =========================
   Touch handling (smooth hover/active for mobile)
   ========================= */

document.querySelectorAll('.tt-btn-root').forEach((root) => {
  root.addEventListener('touchstart', () => {
    root.classList.add('is-touch-hover');

    requestAnimationFrame(() => {
      root.classList.add('is-touch-active');
    });
  }, { passive: true });

  function cleanUpTouch() {
    root.classList.remove('is-touch-active');

    setTimeout(() => {
      root.classList.remove('is-touch-hover');
    }, 180);
  }

  root.addEventListener('touchend', cleanUpTouch, { passive: true });
  root.addEventListener('touchcancel', cleanUpTouch, { passive: true });
});

