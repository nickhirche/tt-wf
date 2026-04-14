(() => {
  /**
   * Marquee (konstante px/s, smooth loop, optional pause).
   *
   * Markup (empfohlen):
   * <div data-marquee ...>
   *   <div data-marquee-track>
   *     <div>Item</div>
   *     <div>Item</div>
   *   </div>
   * </div>
   *
   * Items sind die direkten Kinder von `[data-marquee-track]`.
   * Der Track wird automatisch geklont, bis keine Lücken entstehen (>= viewport*2 + größtes Item).
   *
   * Optionen am Root (`[data-marquee]`):
   * - data-speed="120"                // px pro Sekunde (Default: 80)
   * - data-duration="12"              // Sekunden pro kompletter Runde (überschreibt speed)
   * - data-direction="left|right"     // Default: left
   * - data-pause-on-hover="true|false"// Default: true
   * - data-pause-when-offscreen="true|false" // Default: true
   * - data-root-margin="100px 0px 100px 0px" // IntersectionObserver rootMargin (Default siehe Code)
   * - data-start-offset="random|300"  // Startversatz (px) oder random
   *
   * LoopWidth-Messung:
   * - Nutzt einen "Sentinel" am Ende des Original-Sets, damit `gap`/Margins automatisch korrekt
   *   in die Loop-Länge einfließen (keine extra data-gap-Option nötig).
   */
  const SELECTOR = '[data-marquee]';

  const clampNumber = (v, fallback) => {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return Number.isFinite(n) ? n : fallback;
  };

  const parseBool = (v, fallback = false) => {
    if (v == null) return fallback;
    if (v === '' || v === 'true' || v === true) return true;
    if (v === 'false' || v === false) return false;
    return fallback;
  };

  const parseDirection = (v) => {
    const d = (v || 'left').toLowerCase();
    return d === 'right' ? 'right' : 'left';
  };

  const parseStartOffset = (v) => {
    if (v == null) return { type: 'none', value: 0 };
    const s = String(v).trim().toLowerCase();
    if (s === '' || s === 'random') return { type: 'random', value: 0 };
    const n = parseFloat(s);
    if (Number.isFinite(n)) return { type: 'fixed', value: n };
    return { type: 'none', value: 0 };
  };

  function initMarquee(root) {
    const track =
      root.querySelector('[data-marquee-track]') ||
      root.querySelector('.tt-marquee-track') ||
      root.firstElementChild;

    if (!track) return;

    const direction = parseDirection(root.dataset.direction);
    const pauseOnHover = parseBool(root.dataset.pauseOnHover, true);
    const pauseWhenOffscreen = parseBool(root.dataset.pauseWhenOffscreen, true);
    const startOffsetOpt = parseStartOffset(root.dataset.startOffset);
    const rootMargin = (root.dataset.rootMargin || '').trim() || '100px 0px 100px 0px';

    // speed in px/s ODER duration in s (duration hat Vorrang, sobald Breite gemessen ist)
    const speedPxPerSecDefault = 80;
    let speedPxPerSec = clampNumber(root.dataset.speed, speedPxPerSecDefault);
    let durationSec = clampNumber(root.dataset.duration, NaN);

    let rafId = null;
    let lastTs = null;
    let offset = 0; // translateX in px (negativ = nach links)
    let loopWidth = 0;
    let didApplyInitialOffset = false;

    let hoverPaused = false;
    let offscreenPaused = false;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const getOriginalItems = () =>
      Array.from(track.children).filter((el) => el.dataset.marqueeClone !== 'true');

    const clearClones = () => {
      Array.from(track.children).forEach((el) => {
        if (el.dataset.marqueeClone === 'true') el.remove();
      });
    };

    const measureMaxItemWidth = (items) => {
      let max = 0;
      for (const el of items) {
        const w = el.getBoundingClientRect().width;
        if (w > max) max = w;
      }
      return max;
    };

    const normalizeOffset = (x) => {
      if (!loopWidth) return 0;
      let n = x % loopWidth;
      if (n > 0) n -= loopWidth;
      return n;
    };

    const applyTransform = () => {
      track.style.transform = `translate3d(${offset}px, 0, 0)`;
    };

    const applyInitialOffsetIfNeeded = () => {
      if (didApplyInitialOffset) return;
      if (!loopWidth) return;

      if (startOffsetOpt.type === 'fixed') {
        offset = normalizeOffset(-startOffsetOpt.value);
      } else if (startOffsetOpt.type === 'random') {
        // random verteilt über eine volle Loop-Länge
        offset = normalizeOffset(-Math.random() * loopWidth);
      }

      didApplyInitialOffset = true;
      applyTransform();
    };

    const computeLoopWidth = () => {
      clearClones();
      const originals = getOriginalItems();
      if (originals.length === 0) return 0;

      const prevTransform = track.style.transform;
      track.style.transform = 'translate3d(0, 0, 0)';

      const sentinel = document.createElement('span');
      sentinel.dataset.marqueeSentinel = 'true';
      sentinel.setAttribute('aria-hidden', 'true');
      sentinel.style.cssText = [
        'display:block',
        'flex:0 0 auto',
        'width:0',
        'height:0',
        'padding:0',
        'margin:0',
        'border:0',
        'pointer-events:none',
      ].join(';');

      track.appendChild(sentinel);

      const firstRect = originals[0].getBoundingClientRect();
      const sentinelRect = sentinel.getBoundingClientRect();
      const width = sentinelRect.left - firstRect.left;

      sentinel.remove();
      track.style.transform = prevTransform;

      return Number.isFinite(width) ? width : 0;
    };

    const ensureEnoughContent = () => {
      const originals = getOriginalItems();
      if (originals.length === 0) return;

      clearClones();

      loopWidth = computeLoopWidth();
      if (!Number.isFinite(loopWidth) || loopWidth <= 0) return;

      const viewportWidth = root.getBoundingClientRect().width;
      const maxItemWidth = measureMaxItemWidth(originals);
      // Wichtig: auch wenn der Originalsatz schon "lang genug" wirkt, brauchen wir i.d.R. mindestens
      // einen weiteren Satz, damit hinter dem letzten Item kein Weißraum entsteht.
      const targetWidth = Math.max(
        viewportWidth * 2 + maxItemWidth,
        loopWidth + viewportWidth + maxItemWidth,
      );

      let safety = 0;
      while (track.scrollWidth < targetWidth && safety < 200) {
        for (const el of originals) {
          const clone = el.cloneNode(true);
          clone.dataset.marqueeClone = 'true';
          clone.setAttribute('aria-hidden', 'true');
          track.appendChild(clone);
        }
        safety += 1;
      }

      if (Number.isFinite(durationSec) && durationSec > 0) {
        speedPxPerSec = loopWidth / durationSec;
      } else {
        speedPxPerSec = Math.max(1, clampNumber(root.dataset.speed, speedPxPerSecDefault));
      }

      offset = normalizeOffset(offset);
      applyInitialOffsetIfNeeded();
      applyTransform();
    };

    const shouldRun = () => !(hoverPaused || offscreenPaused);

    const start = () => {
      if (prefersReducedMotion) return;
      if (!shouldRun()) return;
      if (rafId != null) return;
      lastTs = null;
      rafId = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafId == null) return;
      cancelAnimationFrame(rafId);
      rafId = null;
      lastTs = null;
    };

    const updateRunningState = () => {
      if (shouldRun()) start();
      else stop();
    };

    const tick = (ts) => {
      rafId = null;
      if (!shouldRun()) return;

      if (lastTs == null) lastTs = ts;
      const dt = Math.min(50, ts - lastTs);
      lastTs = ts;

      if (loopWidth > 0) {
        const dir = direction === 'right' ? 1 : -1;
        offset += dir * speedPxPerSec * (dt / 1000);
        offset = normalizeOffset(offset);
        applyTransform();
      }

      rafId = requestAnimationFrame(tick);
    };

    // Setup
    track.style.willChange = 'transform';

    // Reduced motion: klonen für stabiles Layout, aber nicht animieren
    if (prefersReducedMotion) {
      ensureEnoughContent();
      return;
    }

    if (pauseOnHover) {
      root.addEventListener('mouseenter', () => {
        hoverPaused = true;
        updateRunningState();
      });
      root.addEventListener('mouseleave', () => {
        hoverPaused = false;
        updateRunningState();
      });
    }

    if (pauseWhenOffscreen && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          offscreenPaused = !entry || !entry.isIntersecting;
          updateRunningState();
        },
        // leichtes rootMargin, damit es schon kurz vor Viewport startet/erst kurz nachher stoppt
        { root: null, threshold: 0, rootMargin },
      );
      io.observe(root);
    } else {
      offscreenPaused = false;
    }

    document.addEventListener('visibilitychange', () => {
      // Tab hidden => immer stoppen; wenn sichtbar, wieder je nach Flags starten
      if (document.hidden) stop();
      else updateRunningState();
    });

    const ro = new ResizeObserver(() => {
      ensureEnoughContent();
      updateRunningState();
    });
    ro.observe(root);

    root.querySelectorAll('img').forEach((img) => {
      if (img.complete) return;
      img.addEventListener('load', () => ensureEnoughContent(), { passive: true });
      img.addEventListener('error', () => ensureEnoughContent(), { passive: true });
    });

    ensureEnoughContent();
    // Standard: läuft, solange nicht offscreen (IO wird initial feuern) oder hoverPaused
    updateRunningState();
  }

  function initAll() {
    document.querySelectorAll(SELECTOR).forEach((el) => {
      if (el.dataset.marqueeInit === 'true') return;
      el.dataset.marqueeInit = 'true';
      initMarquee(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll, { passive: true });
  } else {
    initAll();
  }
})();
