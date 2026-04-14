import {
  buildPaginationConfig,
  createIntervalAutoplayController,
  parseBool,
  parseNumber,
} from './slider-core.js';

(() => {
  /**
   * Accordion Slider (Nav + Media, Swiper v12+)
   *
   * Markup (Root `[data-accordion-slider]`):
   *   <section data-accordion-slider>
   *     <div data-accordion-slider-nav><div class="swiper-wrapper">…swiper-slide…</div></div>
   *     <div data-accordion-slider-pagination></div> <!-- optional, mobil -->
   *     <div data-accordion-slider-media><div class="swiper-wrapper">…</div></div>
   *   </section>
   *
   * Desktop: Nav klick-/keyboard; Media fadet.
   * Mobile: Nav horizontal (chips), Media fadet oben, Pagination sichtbar.
   * Sync: Media ist Master (realIndexChange → Nav); Nav-Swipe → Media per touchEnd.
   *
   * Data-Attribute am Root (`[data-accordion-slider]`):
   * - data-mobile-breakpoint="767"           Viewport ≤ Wert = Mobile-Modus
   * - data-slide-speed="450"                 Media-Fade-Dauer (ms)
   * - data-nav-sync-speed="260"              Nav slideTo bei Sync vom Media (ms), Rewind nutzt 0
   * - data-media-loop="fake"                 Touch-Rand-Wechsel ohne Swiper-Loop
   * - data-media-loop="true"|"loop"          klassischer Swiper-Loop auf Media
   *   (ohne fake/true: kein Loop, Rewind aktiv)
   * - data-media-rewind="true"|"false"       nach letztem Slide zu 0 springen (Default: true)
   * - data-nav-loop-min-slides="4"           Nav-Loop erst ab so vielen Slides
   * - data-nav-rewind="true"|"false"         ohne Nav-Loop: Rand-Swipe → erster/letzter Slide
   * - data-nav-edge-swipe-threshold="24"     Mindest-Swipe (px) fuer Nav-Rewind
   * - data-autoplay-delay="5000"             ms zwischen Slides; "0" = aus (eigener Timer, kein Swiper-Autoplay)
   * - data-pause-on-hover="true"|"false"
   * - data-pause-when-offscreen="true"|"false"
   * - data-root-margin="100px 0px 100px 0px" IntersectionObserver (nur Offscreen-Pause)
   * - data-debug-slider="true"               Konsolen-Logs
   * - data-debug-id="hero-accordion"        Praefix in Logs (Fallback: id oder Zufall)
   *
   * API: window.initAccordionSliders(), window.destroyAccordionSliders()
   */

  const ROOT_SELECTOR = '[data-accordion-slider]';
  const NAV_SELECTOR = '[data-accordion-slider-nav]';
  const MEDIA_SELECTOR = '[data-accordion-slider-media]';
  const PAGINATION_SELECTOR = '[data-accordion-slider-pagination]';

  const instances = new Map();

  const getOriginalSlides = (containerEl) =>
    Array.from(containerEl.querySelectorAll('.swiper-wrapper > .swiper-slide')).filter(
      (slide) => slide.getAttribute('data-swiper-slide-duplicate') !== 'true',
    );

  const getRealIndex = (swiper) => {
    if (!swiper) return 0;
    if (Number.isFinite(swiper.realIndex)) return swiper.realIndex;
    if (Number.isFinite(swiper.activeIndex)) return swiper.activeIndex;
    return 0;
  };

  function debugLog(state, event, extra = {}) {
    if (!state?.debugEnabled) return;
    console.log(`[accordion-slider:${state.debugId}] ${event}`, {
      mediaReal: state.mediaSwiper ? state.mediaSwiper.realIndex : null,
      navReal: state.navSwiper ? state.navSwiper.realIndex : null,
      isUserInteractingNav: state.isUserInteractingNav,
      ...extra,
    });
  }

  function setActiveNavState(state, realIndex) {
    state.navOriginalSlides.forEach((slide, idx) => {
      const isActive = idx === realIndex;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-selected', isActive ? 'true' : 'false');
      slide.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  }

  function slideNavTo(state, realIndex, speed = state.navSyncSpeed) {
    if (!state.navSwiper || state.navSwiper.destroyed) return;
    if (state.navSwiper.realIndex === realIndex) return;

    if (state.useNavLoop && typeof state.navSwiper.slideToLoop === 'function') {
      state.navSwiper.slideToLoop(realIndex, speed);
    } else {
      state.navSwiper.slideTo(realIndex, speed);
    }
  }

  function syncNavFromMedia(state) {
    if (state.isUserInteractingNav) return;
    const realIndex = getRealIndex(state.mediaSwiper);
    setActiveNavState(state, realIndex);
    slideNavTo(state, realIndex);
    debugLog(state, 'syncNavFromMedia', { targetRealIndex: realIndex });
  }

  function goToMediaByRealIndex(state, realIndex, speed = state.slideSpeed) {
    if (!state.mediaSwiper || !Number.isFinite(realIndex)) return;
    const current = getRealIndex(state.mediaSwiper);
    debugLog(state, 'goToMediaByRealIndex', { from: current, to: realIndex, speed });
    if (current === realIndex) return;

    if (state.useMediaFakeLoop) {
      state.mediaSwiper.slideTo(realIndex, speed);
      return;
    }
    if (state.mediaSwiper.params.loop && typeof state.mediaSwiper.slideToLoop === 'function') {
      state.mediaSwiper.slideToLoop(realIndex, speed);
      return;
    }
    state.mediaSwiper.slideTo(realIndex, speed);
  }

  function setupNavAccessibility(state) {
    state.navEl.setAttribute('role', 'tablist');
    state.navOriginalSlides.forEach((slide) => {
      slide.setAttribute('role', 'tab');
      if (!slide.hasAttribute('tabindex')) slide.setAttribute('tabindex', '-1');
    });
  }

  function bindDesktopNavHandlers(state) {
    const onClick = (event) => {
      if (state.navSwiper) return;
      const clicked = event.target.closest('.swiper-slide');
      if (!clicked || !state.navEl.contains(clicked)) return;
      const realIndex = state.navOriginalSlides.indexOf(clicked);
      if (realIndex < 0) return;
      setActiveNavState(state, realIndex);
      goToMediaByRealIndex(state, realIndex);
    };

    const onKeydown = (event) => {
      if (state.navSwiper) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target.closest('.swiper-slide');
      if (!target || !state.navEl.contains(target)) return;
      event.preventDefault();
      const realIndex = state.navOriginalSlides.indexOf(target);
      if (realIndex < 0) return;
      setActiveNavState(state, realIndex);
      goToMediaByRealIndex(state, realIndex);
    };

    state.navEl.addEventListener('click', onClick);
    state.navEl.addEventListener('keydown', onKeydown);
    state.unsubscribers.push(() => {
      state.navEl.removeEventListener('click', onClick);
      state.navEl.removeEventListener('keydown', onKeydown);
    });
  }

  function bindMediaFakeLoop(state) {
    if (!state.useMediaFakeLoop || !state.mediaSwiper) return;
    let touchStartIndex = 0;
    const lastIndex = Math.max(0, state.mediaSlidesCount - 1);

    const onTouchStart = () => { touchStartIndex = state.mediaSwiper.activeIndex; };
    const onTouchEnd = () => {
      const current = state.mediaSwiper.activeIndex;
      if (touchStartIndex === lastIndex && current === lastIndex) {
        state.mediaSwiper.slideTo(0, 0);
      } else if (touchStartIndex === 0 && current === 0) {
        state.mediaSwiper.slideTo(lastIndex, 0);
      }
    };

    state.mediaSwiper.on('touchStart', onTouchStart);
    state.mediaSwiper.on('touchEnd', onTouchEnd);
    state.unsubscribers.push(() => {
      if (!state.mediaSwiper) return;
      state.mediaSwiper.off('touchStart', onTouchStart);
      state.mediaSwiper.off('touchEnd', onTouchEnd);
    });
  }

  function createNavSwiper(state) {
    if (typeof window.Swiper !== 'function') return null;

    return new window.Swiper(state.navEl, {
      slidesPerView: 'auto',
      centeredSlides: true,
      loop: state.useNavLoop,
      loopedSlides: state.useNavLoop ? state.navOriginalSlides.length : undefined,
      loopAdditionalSlides: state.useNavLoop ? state.navOriginalSlides.length : undefined,
      watchOverflow: false,
      slideToClickedSlide: false,
      watchSlidesProgress: true,
      allowTouchMove: true,
      on: {
        touchStart() {
          state.isUserInteractingNav = true;
          state.didNavDrag = false;
          state.navTouchStartRealIndex = state.navSwiper ? state.navSwiper.realIndex : 0;
          debugLog(state, 'nav.touchStart');
        },
        sliderFirstMove() {
          state.didNavDrag = true;
        },
        touchEnd(swiper) {
          const endRealIndex = swiper.realIndex;
          debugLog(state, 'nav.touchEnd', {
            endRealIndex,
            startRealIndex: state.navTouchStartRealIndex,
            didNavDrag: state.didNavDrag,
            touchesDiff: swiper.touches?.diff,
          });

          if (state.didNavDrag) {
            if (!state.useNavLoop && state.navRewind) {
              const threshold = Math.max(1, state.navEdgeSwipeThreshold);
              const diff = Number(swiper.touches?.diff || 0);
              const startIdx = Number.isFinite(state.navTouchStartRealIndex)
                ? state.navTouchStartRealIndex
                : endRealIndex;
              const lastSlide = state.navOriginalSlides.length - 1;

              if (startIdx >= lastSlide && diff < -threshold) {
                state.isUserInteractingNav = false;
                slideNavTo(state, 0, 0);
                setActiveNavState(state, 0);
                goToMediaByRealIndex(state, 0);
                debugLog(state, 'nav.touchEnd:rewind-to-first');
                return;
              }
              if (startIdx <= 0 && diff > threshold) {
                state.isUserInteractingNav = false;
                slideNavTo(state, lastSlide, 0);
                setActiveNavState(state, lastSlide);
                goToMediaByRealIndex(state, lastSlide);
                debugLog(state, 'nav.touchEnd:rewind-to-last');
                return;
              }
            }

            requestAnimationFrame(() => {
              if (!state.navSwiper) return;
              const navReal = state.navSwiper.realIndex;
              state.isUserInteractingNav = false;
              setActiveNavState(state, navReal);
              goToMediaByRealIndex(state, navReal);
              debugLog(state, 'nav.touchEnd:sync-media', { navReal });
            });
            return;
          }

          state.isUserInteractingNav = false;
        },
      },
    });
  }

  function destroyNavSwiper(state) {
    if (!state.navSwiper) return;
    state.navSwiper.destroy(true, true);
    state.navSwiper = null;
    state.isUserInteractingNav = false;
    state.didNavDrag = false;
    state.navTouchStartRealIndex = null;
  }

  function buildMediaSwiperConfig(state) {
    let loop = false;
    let rewind = false;
    if (state.useMediaFakeLoop) {
      loop = false;
      rewind = false;
    } else if (state.useMediaLoopSwiper) {
      loop = true;
      rewind = false;
    } else {
      loop = false;
      rewind = state.mediaRewind;
    }

    const config = {
      effect: 'fade',
      fadeEffect: { crossFade: true },
      allowTouchMove: true,
      speed: state.slideSpeed,
      loop,
      rewind,
      on: {
        init() {
          debugLog(state, 'media.init');
          setActiveNavState(state, 0);
        },
        slideChangeTransitionStart() {
          const realIndex = getRealIndex(state.mediaSwiper);
          debugLog(state, 'media.transitionStart', { realIndex });
          setActiveNavState(state, realIndex);
        },
        realIndexChange() {
          const now = performance.now();
          const gap = state._lastSlideChangeAt ? Math.round(now - state._lastSlideChangeAt) : null;
          state._lastSlideChangeAt = now;
          state._slideChangeCount = (state._slideChangeCount || 0) + 1;

          debugLog(state, 'media.realIndexChange', {
            count: state._slideChangeCount,
            ms: gap,
            intervalAutoplay: state.autoplayDelay > 0,
          });

          syncNavFromMedia(state);
        },
        transitionEnd() {
          debugLog(state, 'media.transitionEnd');
        },
      },
    };

    const paginationConfig = buildPaginationConfig({ el: state.paginationEl });
    if (paginationConfig) config.pagination = paginationConfig;

    return config;
  }

  function syncPaginationByViewport(state) {
    if (!state.paginationEl || !state.mediaSwiper?.pagination) return;

    if (state.isMobile()) {
      state.paginationEl.style.display = '';
      state.mediaSwiper.pagination.enable?.();
      state.mediaSwiper.pagination.render?.();
      state.mediaSwiper.pagination.update?.();
      return;
    }

    state.mediaSwiper.pagination.disable?.();
    state.paginationEl.style.display = 'none';
  }

  function setupAutoplay(state) {
    state.autoplayController?.destroy();
    state.autoplayController = null;

    if (state.mediaSwiper?.autoplay) {
      state.mediaSwiper.autoplay.stop?.();
    }

    if (state.autoplayDelay <= 0) return;

    state.autoplayController = createIntervalAutoplayController({
      rootEl: state.rootEl,
      intervalMs: state.autoplayDelay,
      onTick: () => {
        if (!state.mediaSwiper || state.mediaSwiper.destroyed) return;
        if (state.isUserInteractingNav) return;
        const swiper = state.mediaSwiper;
        const last = Math.max(0, state.mediaSlidesCount - 1);
        const cur = getRealIndex(swiper);

        if (state.useMediaFakeLoop || state.useMediaLoopSwiper) {
          swiper.slideNext();
          return;
        }
        if (state.mediaRewind && cur >= last) {
          goToMediaByRealIndex(state, 0);
          return;
        }
        if (!state.mediaRewind && cur >= last) return;
        swiper.slideNext();
      },
      pauseOnHover: state.pauseOnHover,
      pauseWhenOffscreen: state.pauseWhenOffscreen,
      rootMargin: state.rootMargin,
    });
    state.autoplayController.update();
  }

  function initMedia(state) {
    state.autoplayController?.destroy();
    state.autoplayController = null;

    if (state.mediaSwiper) {
      state.mediaSwiper.destroy(true, true);
      state.mediaSwiper = null;
    }

    const config = buildMediaSwiperConfig(state);
    debugLog(state, 'media.config', {
      intervalAutoplay: state.autoplayDelay > 0,
      loop: config.loop,
      rewind: config.rewind,
    });

    state.mediaSwiper = new window.Swiper(state.mediaEl, config);
    if (state.mediaSwiper.autoplay) {
      state.mediaSwiper.autoplay.stop?.();
    }
    bindMediaFakeLoop(state);
    setupAutoplay(state);
  }

  function initMobileMode(state) {
    if (state.navSwiper) return;

    state.navSwiper = createNavSwiper(state);
    if (!state.navSwiper) return;
    debugLog(state, 'nav.mobileInit', { slides: state.navOriginalSlides.length });

    initMedia(state);
    syncNavFromMedia(state);
  }

  function exitMobileMode(state) {
    destroyNavSwiper(state);
    initMedia(state);
    setActiveNavState(state, getRealIndex(state.mediaSwiper));
  }

  function initSingleInstance(rootEl) {
    if (instances.has(rootEl)) return;
    if (typeof window.Swiper !== 'function') return;

    const navEl = rootEl.querySelector(NAV_SELECTOR);
    const mediaEl = rootEl.querySelector(MEDIA_SELECTOR);
    if (!navEl || !mediaEl) return;

    const navOriginalSlides = getOriginalSlides(navEl);
    const mediaOriginalSlides = getOriginalSlides(mediaEl);
    if (navOriginalSlides.length === 0 || mediaOriginalSlides.length === 0) return;

    const state = {
      rootEl,
      navEl,
      mediaEl,
      paginationEl: rootEl.querySelector(PAGINATION_SELECTOR),
      navOriginalSlides,
      mediaSlidesCount: mediaOriginalSlides.length,
      mobileBreakpoint: parseNumber(rootEl.dataset.mobileBreakpoint, 767),
      pauseOnHover: parseBool(rootEl.dataset.pauseOnHover, false),
      pauseWhenOffscreen: parseBool(rootEl.dataset.pauseWhenOffscreen, true),
      rootMargin: (rootEl.dataset.rootMargin || '').trim() || '100px 0px 100px 0px',
      useMediaFakeLoop: String(rootEl.dataset.mediaLoop || '').toLowerCase() === 'fake',
      useMediaLoopSwiper: (() => {
        const v = String(rootEl.dataset.mediaLoop || '').toLowerCase();
        return v === 'true' || v === 'loop';
      })(),
      mediaRewind: parseBool(rootEl.dataset.mediaRewind, true),
      slideSpeed: parseNumber(rootEl.dataset.slideSpeed, 450),
      navSyncSpeed: parseNumber(rootEl.dataset.navSyncSpeed, 260),
      navLoopMinSlides: parseNumber(rootEl.dataset.navLoopMinSlides, 4),
      navRewind: parseBool(rootEl.dataset.navRewind, true),
      navEdgeSwipeThreshold: parseNumber(rootEl.dataset.navEdgeSwipeThreshold, 24),
      autoplayDelay: parseNumber(rootEl.dataset.autoplayDelay, 5000),
      debugEnabled: parseBool(rootEl.dataset.debugSlider, false),
      debugId:
        rootEl.dataset.debugId ||
        rootEl.id ||
        Math.random().toString(36).slice(2, 8),
      mediaSwiper: null,
      navSwiper: null,
      autoplayController: null,
      useNavLoop: false,
      isUserInteractingNav: false,
      didNavDrag: false,
      navTouchStartRealIndex: null,
      _lastSlideChangeAt: null,
      _slideChangeCount: 0,
      unsubscribers: [],
      isMobile() {
        return window.innerWidth <= this.mobileBreakpoint;
      },
    };

    state.useNavLoop = state.navOriginalSlides.length >= state.navLoopMinSlides;

    setupNavAccessibility(state);
    bindDesktopNavHandlers(state);

    if (state.isMobile()) {
      initMobileMode(state);
    } else {
      initMedia(state);
      setActiveNavState(state, 0);
    }

    const onResize = () => {
      const wasMobile = !!state.navSwiper;
      const isMobile = state.isMobile();

      if (isMobile && !wasMobile) initMobileMode(state);
      else if (!isMobile && wasMobile) exitMobileMode(state);

      syncPaginationByViewport(state);
    };

    window.addEventListener('resize', onResize);
    state.unsubscribers.push(() => window.removeEventListener('resize', onResize));

    syncPaginationByViewport(state);
    instances.set(rootEl, state);
  }

  function destroySingleInstance(rootEl) {
    const state = instances.get(rootEl);
    if (!state) return;

    state.unsubscribers.forEach((unsub) => unsub());
    state.unsubscribers = [];
    destroyNavSwiper(state);
    state.autoplayController?.destroy();
    state.autoplayController = null;

    if (state.mediaSwiper) {
      state.mediaSwiper.destroy(true, true);
      state.mediaSwiper = null;
    }

    instances.delete(rootEl);
  }

  function initAccordionSliders() {
    document.querySelectorAll(ROOT_SELECTOR).forEach((rootEl) => initSingleInstance(rootEl));
  }

  function destroyAccordionSliders() {
    Array.from(instances.keys()).forEach((rootEl) => destroySingleInstance(rootEl));
  }

  window.initAccordionSliders = initAccordionSliders;
  window.destroyAccordionSliders = destroyAccordionSliders;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccordionSliders, { passive: true });
  } else {
    initAccordionSliders();
  }
})();
