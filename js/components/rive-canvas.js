/**
 * Rive aus vendor.min.js (`window.__TT_VENDOR__.Rive`); WASM wird dort gesetzt.
 */
function getRiveCtor() {
  return window.__TT_VENDOR__ && window.__TT_VENDOR__.Rive;
}

const BASE_URL = 'https://assets.tiptap.dev/media/';

function initRiveCanvases() {
  const Rive = getRiveCtor();
  if (typeof Rive === 'undefined') {
    console.warn('[rive] Rive fehlt — vendor.min.js per defer vor tt-main.min.js laden.');
    return;
  }

  const canvases = document.querySelectorAll('canvas[data-src][data-artboard][data-animation]');

  canvases.forEach((canvas) => {
    const src = canvas.getAttribute('data-src');
    const artboard = canvas.getAttribute('data-artboard');
    const animation = canvas.getAttribute('data-animation');

    if (!src || !artboard || !animation) {
      console.warn('[rive] Fehlendes data-src, data-artboard oder data-animation am Canvas.');
      return;
    }

    const fullSrc = BASE_URL + src;

    const riveAnimation = new Rive({
      src: fullSrc,
      canvas,
      autoplay: false,
      artboard,
      animations: animation,
      onLoad: () => {
        riveAnimation.resizeDrawingSurfaceToCanvas();
        riveAnimation.play(animation, true);
      },
      onError: (error) => {
        console.error('[rive] Laden fehlgeschlagen:', error);
      },
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            riveAnimation.play(animation);
          } else {
            riveAnimation.pause(animation);
          }
        });
      },
      { threshold: 0.01 }
    );

    observer.observe(canvas);

    window.addEventListener('resize', () => {
      riveAnimation.resizeDrawingSurfaceToCanvas();
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRiveCanvases);
} else {
  initRiveCanvases();
}
