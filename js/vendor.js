/**
 * Third-Party-Runtime: Splide (+ Extensions), Rive (WebGL2 + WASM), accordion-js.
 * Im HTML per defer VOR tt-main.min.js einbinden (keine Splide-/Rive-/Accordion-CDNs mehr).
 */
import Splide from '@splidejs/splide';
import { Intersection } from '@splidejs/splide-extension-intersection';
import { AutoScroll } from '@splidejs/splide-extension-auto-scroll';

import Accordion from 'accordion-js';
import riveWasmUrl from '@rive-app/webgl2/rive.wasm';
import { Rive, RuntimeLoader } from '@rive-app/webgl2';

RuntimeLoader.setWasmUrl(riveWasmUrl);

window.Splide = Splide;
window.splide = {
  Extensions: {
    Intersection,
    AutoScroll,
  },
};

window.__TT_VENDOR__ = {
  Accordion,
  Rive,
};
