/**
 * Slider Core Helpers
 *
 * Enthält wiederverwendbare Utilities fuer Slider-Komponenten:
 * - parseBool / parseNumber fuer data-Attribute
 * - createAutoplayController fuer Swiper-Autoplay Pause-Logik
 * - createIntervalAutoplayController fuer eigenen Takt (onTick + Pause-Logik)
 *
 * createAutoplayController Optionen:
 * - rootEl: Element, auf dem Hover/Observer laufen
 * - getSwipers: Funktion, die aktuelle Swiper-Instanzen liefert (z.B. [media, nav])
 * - pauseOnHover: pausiert Autoplay bei mouseenter
 * - pauseWhenOffscreen: pausiert Autoplay ausserhalb des Viewports
 * - rootMargin: IntersectionObserver rootMargin fuer frueheres/spaeteres Triggern
 *
 * Verhalten:
 * - Beruecksichtigt kombiniert Hover + Offscreen + document.hidden
 * - Pausiert nur Autoplay, blockiert keine User-Interaktion
 * - Gibt { update, destroy } zur Lifecycle-Steuerung zurueck
 */
export const parseBool = (value, fallback = false) => {
  if (value == null) return fallback;
  if (value === '' || value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return fallback;
};

export const parseNumber = (value, fallback) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export function buildPaginationConfig({
  el,
  clickable = true,
  bulletClass = 'tt-slider-pagination-item',
  bulletActiveClass = 'is-active',
  chipClass = 'tt-slider-pagination-chip',
  renderBullet,
} = {}) {
  if (!el) return undefined;

  const resolvedRenderBullet =
    renderBullet ||
    ((index, className) => {
      // Swiper liefert `className` i.d.R. als String mit `bulletClass` + ggf. `bulletActiveClass`.
      // Wir rendern darin den klickbaren Item-Container und das Chip-Element als Kind.
      const slideNum = index + 1;
      return `<button type="button" class="${className}" aria-label="Slide ${slideNum}">
        <span class="${chipClass}"></span>
      </button>`;
    });

  return {
    el,
    clickable,
    bulletClass,
    bulletActiveClass,
    renderBullet: resolvedRenderBullet,
  };
}

function setSwiperAutoplay(swiper, shouldRun) {
  const autoplayApi = swiper?.autoplay;
  if (!autoplayApi) return;
  if (shouldRun) {
    if (!swiper.originalParams?.autoplay) return;
    autoplayApi.start?.();
  } else {
    autoplayApi.stop?.();
  }
}

export function createAutoplayController({
  rootEl,
  getSwipers,
  pauseOnHover = false,
  pauseWhenOffscreen = true,
  rootMargin = '100px 0px 100px 0px',
}) {
  const state = {
    hoverPaused: false,
    offscreenPaused: false,
  };

  const unsubscribers = [];

  const update = () => {
    const shouldRun = !state.hoverPaused && !state.offscreenPaused && !document.hidden;
    getSwipers().forEach((swiper) => setSwiperAutoplay(swiper, shouldRun));
  };

  if (pauseOnHover) {
    const onMouseEnter = () => {
      state.hoverPaused = true;
      update();
    };
    const onMouseLeave = () => {
      state.hoverPaused = false;
      update();
    };
    rootEl.addEventListener('mouseenter', onMouseEnter);
    rootEl.addEventListener('mouseleave', onMouseLeave);
    unsubscribers.push(() => {
      rootEl.removeEventListener('mouseenter', onMouseEnter);
      rootEl.removeEventListener('mouseleave', onMouseLeave);
    });
  }

  if (pauseWhenOffscreen && typeof window.IntersectionObserver === 'function') {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        state.offscreenPaused = !entry || !entry.isIntersecting;
        update();
      },
      { root: null, threshold: 0, rootMargin },
    );

    observer.observe(rootEl);
    unsubscribers.push(() => observer.disconnect());
  }

  const onVisibilityChange = () => update();
  document.addEventListener('visibilitychange', onVisibilityChange);
  unsubscribers.push(() => document.removeEventListener('visibilitychange', onVisibilityChange));

  return {
    update,
    destroy() {
      unsubscribers.forEach((unsub) => unsub());
    },
  };
}

/**
 * Eigener Autoplay-Takt (setTimeout-Kette): ruft onTick in festem Abstand auf,
 * solange nicht pausiert (Hover / Offscreen / document.hidden).
 * Kein Swiper-Autoplay-Modul — gleiches Verhalten wie manuelles slideNext().
 */
export function createIntervalAutoplayController({
  rootEl,
  intervalMs,
  onTick,
  pauseOnHover = false,
  pauseWhenOffscreen = true,
  rootMargin = '100px 0px 100px 0px',
}) {
  const state = {
    hoverPaused: false,
    offscreenPaused: false,
  };

  let timeoutId = null;
  const unsubscribers = [];

  const clearTimer = () => {
    if (timeoutId != null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const shouldRun = () =>
    !state.hoverPaused && !state.offscreenPaused && !document.hidden;

  const arm = () => {
    clearTimer();
    if (!shouldRun() || !Number.isFinite(intervalMs) || intervalMs <= 0) return;
    timeoutId = window.setTimeout(() => {
      timeoutId = null;
      if (!shouldRun()) return;
      try {
        onTick();
      } catch (e) {
        console.error('[slider-core] interval autoplay onTick', e);
      }
      arm();
    }, intervalMs);
  };

  const update = () => {
    if (shouldRun()) arm();
    else clearTimer();
  };

  if (pauseOnHover) {
    const onMouseEnter = () => {
      state.hoverPaused = true;
      update();
    };
    const onMouseLeave = () => {
      state.hoverPaused = false;
      update();
    };
    rootEl.addEventListener('mouseenter', onMouseEnter);
    rootEl.addEventListener('mouseleave', onMouseLeave);
    unsubscribers.push(() => {
      rootEl.removeEventListener('mouseenter', onMouseEnter);
      rootEl.removeEventListener('mouseleave', onMouseLeave);
    });
  }

  if (pauseWhenOffscreen && typeof window.IntersectionObserver === 'function') {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        state.offscreenPaused = !entry || !entry.isIntersecting;
        update();
      },
      { root: null, threshold: 0, rootMargin },
    );
    observer.observe(rootEl);
    unsubscribers.push(() => observer.disconnect());
  }

  const onVisibilityChange = () => update();
  document.addEventListener('visibilitychange', onVisibilityChange);
  unsubscribers.push(() => document.removeEventListener('visibilitychange', onVisibilityChange));

  return {
    update,
    destroy() {
      clearTimer();
      unsubscribers.forEach((unsub) => unsub());
    },
  };
}
