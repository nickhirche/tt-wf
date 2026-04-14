/* =========================
   TT Splide sliders
   ========================= */

import { parseBool, parseNumber } from './slider-core.js';

/**
 * Splide: zentrale Konfiguration, Mount, Sync-Paare, Feature-Accordion Parent-Hover-Autoplay.
 *
 * Voraussetzung: global `Splide`, `window.splide.Extensions` (kommt aus `vendor.min.js`).
 *
 * Konfiguration: `SLIDER_CONFIG_BLOCKS` — pro Block `options` + optional `sync` (alles an einer Stelle).
 * Markup: Features / Usecases / Feature-Accordion / Accordion-Slider (Sync), Card-/Carousel-Slider (data-gesteuert), Marquee.
 *
 * API: `window.initSplideSliders()`, `window.destroySplideSliders()`
 * (destroy ruft Splide.destroy auf und entfernt Parent-Hover-Listener; erneutes init ist idempotent.)
 *
 * ## Data-gesteuerte Card-Slider (Standalone)
 * Roots: `.tt-card-slider` (linear), `.tt-card-carousel` (Loop + Focus center); Legacy: `.tt-product-slider`, `.tt-blog-card-slider`, `.tt-usecase-card-slider`.
 * Splide-Markup: `.splide` / `.splide__track` / `.splide__list` / `.splide__slide`.
 * - `data-tt-slider-arrows` — `"true"` | `"false"` (Default: `false`). Kann entfallen, wenn Pfeile über **beide** Root-Selektoren oder **beide** Button-Marker (`prev`/`next`) verdrahtet werden.
 * - `data-tt-slider-arrow-prev` / `data-tt-slider-arrow-next` am **Root** — optionale CSS-Selektoren relativ zum Root (z. B. `#prev`). Wenn **beide** nicht leer sind, haben sie Vorrang vor den Button-Markern.
 * - **Buttons (Webflow-Hint):** `data-tt-slider-arrow-type="prev"` bzw. `"next"` — nur mit gesetztem Wert zählt das Element als Pfeil für diesen Slider (erstes Trefferpaar im Root). Keine Splide-Klassen im Designer nötig; `splide__arrow` / `--prev` / `--next` werden vor dem Mount per JS gesetzt. `splide__arrows`-Wrapper empfehlenswert; sonst Eltern-Box oder Notfall-Wrapper vor `.splide__track`.
 *
 *   Beispiel (Splide-Klassen auf Buttons nicht nötig):
 *
 *     <div class="splide tt-card-slider" data-tt-slider-arrows="true">
 *       <div class="splide__arrows">
 *         <button type="button" data-tt-slider-arrow-type="prev">…</button>
 *         <button type="button" data-tt-slider-arrow-type="next">…</button>
 *       </div>
 *       <div class="splide__track">…</div>
 *     </div>
 *
 * - Ohne Data-/Selektor-Verdrahtung: bei `data-tt-slider-arrows="true"` Platzhalter `.splide__arrow--prev` + `.splide__arrow--next` im Root.
 * - `data-tt-card-pagination` — `"true"` | `"false"` (Default: `false`)
 * - `data-tt-card-only-below` — z. B. `768`: Splide nur bei `innerWidth <=` Wert, sonst kein Mount
 * - `data-tt-card-autoplay` — nur **Carousel**: `"true"` (Default) = `autoplay: 'pause'` + Intersection; `"false"` = kein Autoplay
 * Ohne horizontalen Überlauf: kein Mount, Modifier `tt-card-slider--static` (nur **lineare** Card-Slider). **Carousel**-Roots (`.tt-card-carousel`, `.tt-usecase-card-slider`) mounten trotzdem — Loop/Clones. `tt-card-slider--breakpoint-skip` unverändert.
 * Slides: mindestens ein `is-visible` → nur diese zählen; sonst alle nicht-versteckten Slides.
 */
(() => {
  /* =========================
     Shared / tokens
     ========================= */
  const SHARED = {
    flickDrag: {
      flickPower: '150',
      wheelSleep: '0',
    },
  };

  /* =========================
     Helpers (intersection, marquee, synced blocks)
     ========================= */

  /** Wie slider-core / accordion / marquee: Viewport + vertikaler Vorlauf */
  function splideIntersection(inView, outView) {
    return {
      rootMargin: '100px 0px 100px 0px',
      inView,
      outView,
    };
  }

  function buildMarqueeSlider(speed) {
    return {
      type: 'loop',
      focus: 'center',
      drag: false,
      autoWidth: true,
      rewind: false,
      pagination: false,
      arrows: false,
      autoScroll: {
        autoStart: false,
        speed,
        pauseOnHover: false,
        pauseOnFocus: false,
      },
      intersection: splideIntersection({ autoScroll: true }, { autoScroll: false }),
    };
  }

  /** Linear + Carousel + Legacy; gleiche data-Attribute (Carousel: optional Autoplay) */
  const DATA_DRIVEN_CARD_SELECTOR =
    '.tt-card-slider, .tt-card-carousel, .tt-product-slider, .tt-blog-card-slider, .tt-usecase-card-slider';

  function isCarouselCardRoot(root) {
    return (
      root.classList.contains('tt-card-carousel') ||
      root.classList.contains('tt-usecase-card-slider')
    );
  }

  function isSlideHiddenForCard(el) {
    if (!el || el.nodeType !== 1) return true;
    if (el.classList.contains('w-condition-invisible')) return true;
    if (el.getAttribute('aria-hidden') === 'true') return true;
    const st = getComputedStyle(el);
    return st.display === 'none' || st.visibility === 'hidden';
  }

  /**
   * Slides mit `is-visible` (wenn irgendwo gesetzt), sonst alle nicht-versteckten.
   */
  function getCardSlidesForMeasurement(slides) {
    const list = Array.from(slides);
    if (!list.length) return [];
    const anyMarkedVisible = list.some(function (s) {
      return s.classList.contains('is-visible');
    });
    if (anyMarkedVisible) {
      return list.filter(function (s) {
        return s.classList.contains('is-visible');
      });
    }
    return list.filter(function (s) {
      return !isSlideHiddenForCard(s);
    });
  }

  function listNeedsHorizontalScroll(listEl) {
    if (!listEl) return false;
    return listEl.scrollWidth > listEl.clientWidth + 2;
  }

  /** Erstes Element im Root mit `data-tt-slider-arrow-type` passend zu `prev` | `next` (trim, case-insensitive). */
  function queryCardSliderArrowByType(root, type) {
    const want = (type || '').toLowerCase();
    if (want !== 'prev' && want !== 'next') return null;
    const nodes = root.querySelectorAll('[data-tt-slider-arrow-type]');
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      const v = (el.getAttribute('data-tt-slider-arrow-type') || '').trim().toLowerCase();
      if (v === want) return el;
    }
    return null;
  }

  /** Pfeile nur mit vorbereitetem Markup (Splide-Platzhalter im Root, vor mount). */
  function hasCardSliderArrowMarkup(root) {
    return !!(
      root.querySelector('.splide__arrow--prev') &&
      root.querySelector('.splide__arrow--next')
    );
  }

  function getCommonAncestor(a, b) {
    if (!a || !b) return null;
    const chain = new Set();
    let n = a;
    while (n) {
      chain.add(n);
      n = n.parentElement;
    }
    n = b;
    while (n) {
      if (chain.has(n)) return n;
      n = n.parentElement;
    }
    return null;
  }

  function queryCardArrowEl(root, sel) {
    if (!sel) return null;
    try {
      const el = root.querySelector(sel);
      return el && el.nodeType === 1 ? el : null;
    } catch (_e) {
      return null;
    }
  }

  /**
   * Splide findet Pfeile nur unter dem Root und braucht ein `.splide__arrows`-Element (Sonst bricht Arrows#init).
   */
  function wireCardSliderArrowElements(root, prev, next) {
    if (!prev || !next || prev.nodeType !== 1 || next.nodeType !== 1 || prev === next) {
      return false;
    }

    const track = root.querySelector('.splide__track');
    if (!track) return false;

    prev.classList.add('splide__arrow', 'splide__arrow--prev');
    next.classList.add('splide__arrow', 'splide__arrow--next');

    const existingArrows = root.querySelector('.splide__arrows');
    if (existingArrows && existingArrows.contains(prev) && existingArrows.contains(next)) {
      return true;
    }

    function isUnderTrack(el) {
      return track === el || track.contains(el);
    }

    const anc = getCommonAncestor(prev, next);
    if (anc && anc !== root && root.contains(anc) && !isUnderTrack(anc)) {
      anc.classList.add('splide__arrows');
      return true;
    }

    const wrap = document.createElement('div');
    wrap.className = 'splide__arrows';
    if (track.parentNode === root) {
      root.insertBefore(wrap, track);
    } else {
      root.insertBefore(wrap, root.firstChild);
    }
    wrap.appendChild(prev);
    wrap.appendChild(next);
    return true;
  }

  function wireCardSliderArrowsFromData(root, prevSel, nextSel) {
    const prev = queryCardArrowEl(root, prevSel);
    const next = queryCardArrowEl(root, nextSel);
    if (!prev || !next) return false;
    return wireCardSliderArrowElements(root, prev, next);
  }

  function destroyCardSliderEntries() {
    mounted.forEach(function (entry) {
      if (!entry.isCardSlider) return;
      if (typeof entry.unbindResize === 'function') {
        entry.unbindResize();
      }
      if (entry.splide) {
        entry.splide.destroy(true);
      }
    });
    mounted = mounted.filter(function (e) {
      return !e.isCardSlider;
    });
    document.querySelectorAll(DATA_DRIVEN_CARD_SELECTOR).forEach(function (root) {
      root.classList.remove('tt-card-slider--static', 'tt-card-slider--breakpoint-skip');
    });
  }

  function mountCardSliders() {
    document.querySelectorAll(DATA_DRIVEN_CARD_SELECTOR).forEach(function (root) {
      const onlyBelow = parseNumber(root.dataset.ttCardOnlyBelow, NaN);
      if (Number.isFinite(onlyBelow) && window.innerWidth > onlyBelow) {
        root.classList.add('tt-card-slider--breakpoint-skip');
        root.classList.remove('tt-card-slider--static');
        return;
      }
      root.classList.remove('tt-card-slider--breakpoint-skip');

      const list = root.querySelector('.splide__list');
      if (!list) return;

      const slides = list.querySelectorAll('.splide__slide');
      const measuredSlides = getCardSlidesForMeasurement(slides);
      if (!measuredSlides.length) return;

      const carousel = isCarouselCardRoot(root);
      if (!carousel && !listNeedsHorizontalScroll(list)) {
        root.classList.add('tt-card-slider--static');
        return;
      }

      root.classList.remove('tt-card-slider--static');

      const arrowsRequested = parseBool(root.dataset.ttSliderArrows, false);
      const prevArrowSel = (root.dataset.ttSliderArrowPrev || '').trim();
      const nextArrowSel = (root.dataset.ttSliderArrowNext || '').trim();
      const hasArrowSelectors = !!(prevArrowSel && nextArrowSel);
      const prevByMarker = queryCardSliderArrowByType(root, 'prev');
      const nextByMarker = queryCardSliderArrowByType(root, 'next');
      const hasArrowButtonMarkers = !!(prevByMarker && nextByMarker && prevByMarker !== nextByMarker);
      let dataArrowsOk = false;
      if (hasArrowSelectors) {
        dataArrowsOk = wireCardSliderArrowsFromData(root, prevArrowSel, nextArrowSel);
      } else if (hasArrowButtonMarkers) {
        dataArrowsOk = wireCardSliderArrowElements(root, prevByMarker, nextByMarker);
      }
      const legacyArrows = hasCardSliderArrowMarkup(root);
      const wantArrows =
        (arrowsRequested || hasArrowSelectors || hasArrowButtonMarkers) &&
        (legacyArrows || dataArrowsOk);
      const wantPagination = parseBool(root.dataset.ttCardPagination, false);
      const useAutoplay = carousel && parseBool(root.dataset.ttCardAutoplay, true);

      const splideOptions = Object.assign(
        {
          autoWidth: true,
          drag: true,
          rewind: false,
          autoScroll: false,
          arrows: wantArrows,
          pagination: wantPagination,
          ...SHARED.flickDrag,
        },
        carousel
          ? Object.assign(
              {
                type: 'loop',
                focus: 'center',
              },
              useAutoplay
                ? {
                    autoplay: 'pause',
                    intersection: splideIntersection(
                      { autoplay: true },
                      { autoplay: false },
                    ),
                  }
                : { autoplay: false },
            )
          : {
              type: 'slide',
              autoplay: false,
            },
      );

      const splide = new Splide(root, splideOptions).mount(window.splide.Extensions);

      mounted.push({ splide, isCardSlider: true, root: root });
    });
  }

  let cardResizeListenerBound = false;
  let cardResizeTimer = null;
  /** Letzte Breite nach Card-Layout-Refresh — iOS feuert `resize` oft nur wegen Browser-Chrome (`innerHeight`), nicht wegen Layout. */
  let lastCardLayoutInnerWidth = typeof window !== 'undefined' ? window.innerWidth : 0;

  function refreshCardSlidersAfterLayoutChange() {
    const cardIndexByRoot = new Map();
    mounted.forEach(function (entry) {
      if (!entry.isCardSlider || !entry.splide || !entry.root) return;
      const idx = entry.splide.index;
      if (typeof idx === 'number' && idx >= 0) {
        cardIndexByRoot.set(entry.root, idx);
      }
    });
    destroyCardSliderEntries();
    mountCardSliders();
    cardIndexByRoot.forEach(function (index, root) {
      if (!root.isConnected || typeof index !== 'number') return;
      const entry = mounted.find(function (m) {
        return m.isCardSlider && m.root === root;
      });
      if (!entry || !entry.splide) return;
      const splide = entry.splide;
      const len = typeof splide.length === 'number' ? splide.length : 0;
      if (!len) return;
      const target = Math.min(index, len - 1);
      if (target !== splide.index) {
        splide.go(target);
      }
    });
  }

  function scheduleCardSlidersRefresh() {
    if (cardResizeTimer) clearTimeout(cardResizeTimer);
    cardResizeTimer = setTimeout(function () {
      cardResizeTimer = null;
      const w = window.innerWidth;
      if (w === lastCardLayoutInnerWidth) return;
      lastCardLayoutInnerWidth = w;
      refreshCardSlidersAfterLayoutChange();
    }, 150);
  }

  function ensureCardSliderResizeListener() {
    if (cardResizeListenerBound) return;
    cardResizeListenerBound = true;
    lastCardLayoutInnerWidth = window.innerWidth;
    window.addEventListener('resize', scheduleCardSlidersRefresh, { passive: true });
  }

  /**
   * Sync-Block: `primary` / `secondary` einmal definieren — gleiche Strings für sync() und options-Keys.
   */
  function makeSyncedSliderBlock({
    id,
    parent,
    primary,
    secondary,
    pauseAutoplayOnParentHover,
    primaryOptions,
    secondaryOptions,
  }) {
    return {
      id,
      sync: Object.assign(
        { parent, primary, secondary },
        pauseAutoplayOnParentHover ? { pauseAutoplayOnParentHover: true } : {},
      ),
      options: {
        [primary]: primaryOptions,
        [secondary]: secondaryOptions,
      },
    };
  }

  /* =========================
     Config blocks (options + optional sync)
     ========================= */

  /**
   * Pro Block: `options` = Splide-Optionen pro Selektor; optional `sync` = Parent + Primary + Secondary
   * (plus optional pauseAutoplayOnParentHover). Blöcke ohne `sync` = nur Mount, kein sync().
   */
  const SLIDER_CONFIG_BLOCKS = [
    makeSyncedSliderBlock({
      id: 'features',
      parent: '.tt-features-slider',
      primary: '.tt-feature-nav-slider',
      secondary: '.tt-feauture-content-slider',
      primaryOptions: {
        drag: false,
        updateOnMove: true,
        isNavigation: true,
        cloneStatus: false,
        autoScroll: false,
        autoplay: false,
        rewind: false,
        pagination: false,
        autoWidth: true,
        arrows: false,
        ...SHARED.flickDrag,
        breakpoints: {
          667: {
            type: 'loop',
            focus: 'center',
            drag: true,
          },
        },
      },
      secondaryOptions: {
        type: 'fade',
        pagination: false,
        arrows: false,
        rewind: true,
        drag: false,
        updateOnMove: true,
      },
    }),

    makeSyncedSliderBlock({
      id: 'usecases',
      parent: '.tt-usecases-slider',
      primary: '.tt-usecase-slider',
      secondary: '.tt-category-slider',
      primaryOptions: {
        type: 'fade',
        pagination: false,
        arrows: false,
        rewind: true,
        drag: true,
        updateOnMove: true,
      },
      secondaryOptions: {
        type: 'loop',
        focus: 'center',
        updateOnMove: true,
        autoWidth: true,
        isNavigation: true,
        drag: true,
        cloneStatus: false,
        autoScroll: false,
        autoplay: 'pause',
        intersection: splideIntersection({ autoplay: true }, { autoplay: false }),
        rewind: false,
        pagination: false,
        arrows: false,
        ...SHARED.flickDrag,
      },
    }),

    makeSyncedSliderBlock({
      id: 'feature-accordion',
      parent: '.tt-feature-accordion',
      primary: '.tt-accordion-media-slider',
      secondary: '.tt-accordion-content-slider',
      pauseAutoplayOnParentHover: true,
      primaryOptions: {
        type: 'fade',
        pagination: false,
        arrows: false,
        rewind: true,
        drag: true,
        updateOnMove: true,
        autoScroll: false,
        autoplay: 'pause',
        pauseOnHover: false,
        pauseOnFocus: false,
        intersection: splideIntersection({ autoplay: true }, { autoplay: false }),
      },
      secondaryOptions: {
        autoWidth: false,
        isNavigation: true,
        updateOnMove: true,
        drag: false,
        rewind: true,
        pagination: false,
        arrows: false,
        autoScroll: false,
        pauseOnHover: true,
        pauseOnFocus: true,
        interval: 5000,
        breakpoints: {
          991: {
            type: 'loop',
            focus: 'center',
            updateOnMove: true,
            autoWidth: true,
            isNavigation: true,
            drag: true,
            cloneStatus: false,
            autoplay: 'pause',
            intersection: splideIntersection(
              { autoplay: true, pauseOnHover: true, pauseOnFocus: true },
              { autoplay: false },
            ),
            rewind: false,
            pagination: true,
            arrows: false,
            ...SHARED.flickDrag,
          },
        },
      },
    }),

    makeSyncedSliderBlock({
      id: 'accordion-slider',
      parent: '.tt-accordion-slider',
      primary: '.tt-accordion-slider-media',
      secondary: '.tt-accordion-slider-nav',
      pauseAutoplayOnParentHover: true,
      primaryOptions: {
        type: 'fade',
        pagination: false,
        arrows: false,
        rewind: true,
        drag: true,
        updateOnMove: true,
        autoScroll: false,
        autoplay: 'pause',
        pauseOnHover: false,
        pauseOnFocus: false,
        intersection: splideIntersection({ autoplay: true }, { autoplay: false }),
      },
      secondaryOptions: {
        autoWidth: false,
        isNavigation: true,
        updateOnMove: true,
        drag: false,
        rewind: true,
        pagination: false,
        arrows: false,
        autoScroll: false,
        pauseOnHover: true,
        pauseOnFocus: true,
        interval: 5000,
        breakpoints: {
          991: {
            type: 'loop',
            focus: 'center',
            updateOnMove: true,
            autoWidth: true,
            isNavigation: true,
            drag: true,
            cloneStatus: false,
            autoplay: 'pause',
            intersection: splideIntersection(
              { autoplay: true, pauseOnHover: true, pauseOnFocus: true },
              { autoplay: false },
            ),
            rewind: false,
            pagination: true,
            arrows: false,
            ...SHARED.flickDrag,
          },
        },
      },
    }),

    {
      id: 'marquee',
      options: {
        '.tt-marquee-slider.marquee-left-speed-1': buildMarqueeSlider(1),
        '.tt-marquee-slider.marquee-left-speed-2': buildMarqueeSlider(1.5),
        '.tt-marquee-slider.marquee-left-speed-slow': buildMarqueeSlider(0.5),
        '.tt-marquee-slider.marquee-right-speed-1': buildMarqueeSlider(-1),
        '.tt-marquee-slider.marquee-right-speed-2': buildMarqueeSlider(-1.5),
      },
    },
  ];

  /* =========================
     Derived maps (flat options + sync pairs)
     ========================= */

  const SLIDER_OPTIONS = SLIDER_CONFIG_BLOCKS.reduce(function (acc, block) {
    return Object.assign(acc, block.options);
  }, {});

  const SYNC_PAIRS = SLIDER_CONFIG_BLOCKS.filter(function (block) {
    return block.sync;
  }).map(function (block) {
    return Object.assign({ id: block.id }, block.sync);
  });

  /* =========================
     Runtime state
     ========================= */

  /** @type {{ splide: object, unbindParentHover?: () => void }[]} */
  let mounted = [];

  /* =========================
     Availability & parent-hover (accordion)
     ========================= */

  function isSplideAvailable() {
    return (
      typeof Splide !== 'undefined' &&
      window.splide &&
      window.splide.Extensions
    );
  }

  /**
   * @param {HTMLElement} host
   * @param {object} primarySlider Splide-Instanz (Primary)
   * @returns {(() => void) | null}
   */
  function bindParentHoverAutoplay(host, primarySlider) {
    const autoplay = primarySlider.Components && primarySlider.Components.Autoplay;
    if (!host || !autoplay) return null;

    const onEnter = function () {
      autoplay.pause();
    };
    const onLeave = function () {
      autoplay.play();
    };
    const onFocusIn = function () {
      autoplay.pause();
    };
    const onFocusOut = function (e) {
      if (!host.contains(e.relatedTarget)) {
        autoplay.play();
      }
    };

    host.addEventListener('mouseenter', onEnter);
    host.addEventListener('mouseleave', onLeave);
    host.addEventListener('focusin', onFocusIn);
    host.addEventListener('focusout', onFocusOut);

    return function unbindParentHoverAutoplay() {
      host.removeEventListener('mouseenter', onEnter);
      host.removeEventListener('mouseleave', onLeave);
      host.removeEventListener('focusin', onFocusIn);
      host.removeEventListener('focusout', onFocusOut);
    };
  }

  /* =========================
     Mount & sync wiring
     ========================= */

  function mountAllSliders(slidersByClass) {
    Object.keys(SLIDER_OPTIONS).forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (rootEl) {
        const splide = new Splide(rootEl, SLIDER_OPTIONS[selector]).mount(
          window.splide.Extensions,
        );
        slidersByClass[selector] = slidersByClass[selector] || [];
        slidersByClass[selector].push(splide);
        mounted.push({ splide });
      });
    });
  }

  function wireSyncPairs(slidersByClass) {
    SYNC_PAIRS.forEach(function (pair) {
      const parentEl = document.querySelector(pair.parent);
      if (!parentEl) return;

      const primaryList = slidersByClass[pair.primary] || [];
      const secondaryList = slidersByClass[pair.secondary] || [];

      if (!primaryList.length || !secondaryList.length) return;

      primaryList.forEach(function (primarySlider, i) {
        const secondarySlider = secondaryList[i];
        if (!secondarySlider) return;

        primarySlider.sync(secondarySlider);

        if (!pair.pauseAutoplayOnParentHover) return;

        const host =
          (primarySlider.root && primarySlider.root.closest(pair.parent)) ||
          parentEl;
        const unbind = bindParentHoverAutoplay(host, primarySlider);
        if (unbind) {
          const entry = mounted.find(function (m) {
            return m.splide === primarySlider;
          });
          if (entry) entry.unbindParentHover = unbind;
        }
      });
    });
  }

  /* =========================
     Destroy & init
     ========================= */

  function destroySplideSliders() {
    mounted.forEach(function (entry) {
      if (typeof entry.unbindParentHover === 'function') {
        entry.unbindParentHover();
      }
      if (typeof entry.unbindResize === 'function') {
        entry.unbindResize();
      }
      if (entry.splide) {
        entry.splide.destroy(true);
      }
    });
    mounted = [];
    document.querySelectorAll(DATA_DRIVEN_CARD_SELECTOR).forEach(function (root) {
      root.classList.remove('tt-card-slider--static', 'tt-card-slider--breakpoint-skip');
    });
  }

  function initSplideSliders() {
    if (!isSplideAvailable()) return;

    destroySplideSliders();

    const slidersByClass = {};
    mountAllSliders(slidersByClass);
    wireSyncPairs(slidersByClass);
    mountCardSliders();
    ensureCardSliderResizeListener();
  }

  /* =========================
     Public API & boot
     ========================= */

  window.initSplideSliders = initSplideSliders;
  window.destroySplideSliders = destroySplideSliders;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSplideSliders, {
      passive: true,
    });
  } else {
    initSplideSliders();
  }
})();
