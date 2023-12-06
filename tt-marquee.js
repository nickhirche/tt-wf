let originalElements = {};
let containers = {};

function setAnimationDurationsAndClone(originalElement, container) {
  const windowWidth = window.innerWidth;

  // Berechne und setze die Animation-Dauer für das Original-Element
  const pps = originalElement.getAttribute('data-pps'); // pixels per second
  if (pps && !isNaN(pps) && pps > 0) { // Überprüfe, ob data-pps eine gültige Zahl ist
    const duration = originalElement.offsetWidth / pps;  // Berechne die Dauer für die Animation
    originalElement.style.animationDuration = `${duration}s`;
  } else {
    console.error('Invalid or missing data-pps attribute value for element:', originalElement);
  }

  let totalWidth = originalElement.offsetWidth;

  // Füge Klone hinzu, bis die Gesamtbreite die Fensterbreite erreicht oder überschreitet
  while (totalWidth < windowWidth) {
    const clone = originalElement.cloneNode(true);
    container.appendChild(clone);
    totalWidth += clone.offsetWidth;
  }

  // Füge einen finalen Klon hinzu, sobald die Gesamtbreite die Fensterbreite erreicht oder überschreitet
  if (totalWidth >= windowWidth) {
    const finalClone = originalElement.cloneNode(true);
    container.appendChild(finalClone);
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
});
