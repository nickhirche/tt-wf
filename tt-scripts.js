let originalElements = {};
let containers = {};
let windowWidth = window.innerWidth;

function setAnimationDurationsAndClone(originalElement, container) {
  // Berechne und setze die Animation-Dauer für das Original-Element
  const pps = originalElement.getAttribute('data-pps');
  if (pps && !isNaN(pps) && pps > 0) {
    const duration = originalElement.offsetWidth / pps;
    originalElement.style.animationDuration = `${duration}s`;
  } else {
    console.error('Invalid or missing data-pps attribute value for element:', originalElement);
  }

  let totalWidth = originalElement.offsetWidth;

  // Füge Klone hinzu, bis die Gesamtbreite das 1,2-fache der Fensterbreite erreicht oder überschreitet
  while (totalWidth <= windowWidth * 1.2) {
    const clone = originalElement.cloneNode(true);
    container.appendChild(clone);
    totalWidth += clone.offsetWidth;
  }

  // Füge einen oder zwei finale Klone hinzu, sobald die Gesamtbreite das 1,2-fache der Fensterbreite erreicht oder überschreitet
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

// Event Listener, der die Funktion aufruft, sobald das Dokument geladen ist
document.addEventListener('DOMContentLoaded', () => {
  classes.forEach(className => {
    let elements = document.querySelectorAll(className);
    elements.forEach((element, index) => {
      const key = `${className}${index}`;

      // Speichere das ursprüngliche Element und das Container-Element
      originalElements[key] = element.cloneNode(true);
      containers[key] = element.parentNode;

      // Füge Klone hinzu und berechne die Animation-Dauer
      setAnimationDurationsAndClone(element, containers[key]);
    });
  });
});

// Event Listener, der die Funktion aufruft, wenn das Fenster neu skaliert wird
window.addEventListener('resize', () => {
  // Überprüfe, ob sich die Fensterbreite tatsächlich geändert hat
  if (window.innerWidth !== windowWidth) {
    windowWidth = window.innerWidth;

    Object.keys(originalElements).forEach(key => {
      const container = containers[key];
      const originalElement = originalElements[key];

      // Entferne alle Klone
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      // Füge das ursprüngliche Element wieder ein und füge dann Klone hinzu
      const newElement = originalElement.cloneNode(true);
      container.appendChild(newElement);
      setAnimationDurationsAndClone(newElement, container);
    });
  }
});
