/**
 * accordion-js kommt aus vendor.min.js (`window.__TT_VENDOR__.Accordion`).
 */
function getAccordionCtor() {
  return window.__TT_VENDOR__ && window.__TT_VENDOR__.Accordion;
}

function initAccordionBlocks() {
  const Accordion = getAccordionCtor();
  if (typeof Accordion === 'undefined') {
    console.warn(
      '[tt-accordion] Accordion fehlt — vendor.min.js per defer vor tt-main.min.js laden.'
    );
    return;
  }

  const accordions = Array.from(
    document.querySelectorAll('.tt-faq-container, .tt-pricing-category')
  );
  if (!accordions.length) return;

  new Accordion(accordions, {
    showMultiple: true,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccordionBlocks);
} else {
  initAccordionBlocks();
}
