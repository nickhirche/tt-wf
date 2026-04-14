/**
 * Legacy: `.tt-marquee` und `.tt-logowall-wrapper` mit `data-pps` (px/s) + Klone für Loop.
 * Ersetzung langfristig: `marquee.js` (`[data-marquee]`).
 */
function initLegacyMarquee() {
  let windowWidth = window.innerWidth;

  const originalElements = {};
  const containers = {};

  function setAnimationDurationsAndClone(originalElement, container) {
    const pps = originalElement.getAttribute('data-pps');
    if (pps && !isNaN(pps) && pps > 0) {
      const duration = originalElement.offsetWidth / pps;
      originalElement.style.animationDuration = `${duration}s`;
    } else {
      console.error('Invalid or missing data-pps attribute value for element:', originalElement);
    }

    let totalWidth = originalElement.offsetWidth;

    while (totalWidth <= windowWidth * 1.2) {
      const clone = originalElement.cloneNode(true);
      container.appendChild(clone);
      totalWidth += clone.offsetWidth;
    }

    if (totalWidth > windowWidth * 1.2) {
      const finalClone1 = originalElement.cloneNode(true);
      container.appendChild(finalClone1);

      if (originalElement.classList.contains('scroll-reverse')) {
        const finalClone2 = originalElement.cloneNode(true);
        container.appendChild(finalClone2);
      }
    }
  }

  const classes = ['.tt-marquee', '.tt-logowall-wrapper'];

  classes.forEach((className) => {
    const elements = document.querySelectorAll(className);
    elements.forEach((element, index) => {
      const key = `${className}${index}`;

      originalElements[key] = element.cloneNode(true);
      containers[key] = element.parentNode;

      setAnimationDurationsAndClone(element, containers[key]);
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth !== windowWidth) {
      windowWidth = window.innerWidth;

      Object.keys(originalElements).forEach((key) => {
        const container = containers[key];
        const originalElement = originalElements[key];

        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }

        const newElement = originalElement.cloneNode(true);
        container.appendChild(newElement);
        setAnimationDurationsAndClone(newElement, container);
      });
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLegacyMarquee);
} else {
  initLegacyMarquee();
}
