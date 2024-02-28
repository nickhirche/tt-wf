document.addEventListener('DOMContentLoaded', function() {
  // Stelle sicher, dass windowWidth nicht bereits deklariert wurde
  var windowWidth = window.innerWidth;

  let originalElements = {};
  let containers = {};

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

  function updateStickyElementPosition() {
    // Suche nach allen Elementen mit der Klasse .tt-col-content.sticky
    const stickyElements = document.querySelectorAll('.tt-col-content.sticky, .tt-client-quote-wrap');

    stickyElements.forEach(el => {
      // Ermittle die Höhe des Elements
      const elementHeight = el.offsetHeight;

      // Berechne den neuen top-Wert
      const topValue = `calc(50vh - ${elementHeight / 2}px)`;

      // Weise das Element mit dem neuen top-Wert zu
      el.style.top = topValue;

      // Aktualisiere die gespeicherte Fensterbreite
      windowWidth = window.innerWidth;
    });
  }

  // Throttle Funktion
  function throttle(func, delay) {
    let lastCall = 0;
    return function(...args) {
      const now = new Date().getTime();
      if (now - lastCall < delay) {
        return;
      }
      lastCall = now;
      return func(...args);
    }
  }

  // Führe die Funktion beim ersten Laden aus
  updateStickyElementPosition();

  // Füge einen Event Listener hinzu, der bei einem Fenster-Resize die Funktion ausführt
  window.addEventListener('resize', throttle(updateStickyElementPosition, 200));
});

/* ACCORDION */

const accordions = Array.from(document.querySelectorAll('.tt-faq-container, .tt-pricing-category'));
new Accordion(accordions, {
  showMultiple: true,
});

/* COPYRIGHT YEAR */

Webflow.push(function() {
  $('.copyright-year').text(new Date().getFullYear());
});


/* SPLIDE SLIDER */

// Warten Sie, bis das gesamte Dokument geladen ist, bevor Sie Skripte ausführen
document.addEventListener('DOMContentLoaded', function() {
  
    // Objekt, das die Konfigurationen für die verschiedenen Slider enthält
    var sliderOptions = {
        '.tt-usecase-slider': {
              type     : 'fade',
              pagination: false,
              arrows    : false,
              rewind: true,
              drag: true,
              updateOnMove: true,
          },
          '.tt-accordion-media-slider': {
              type     : 'fade',
              pagination: false,
              arrows    : false,
              rewind: true,
              drag: true,
              updateOnMove: true,
          },
          '.tt-category-slider': {
              type     : 'loop',
              focus    : 'center',
              updateOnMove: true,
              autoWidth: true,
              isNavigation: true,
              drag   : true,
              cloneStatus: false,
              autoplay: true,
              rewind: false,
              pagination: false,
              arrows: false,
              flickPower: '150',
              wheelSleep: '0',
          },
          '.tt-product-slider': {
            autoWidth: true,
            drag   : true,
            rewind: false,
            pagination: false,
            arrows: false,
            flickPower: '150',
            wheelSleep: '0',
          },
          '.tt-caccordion-content-slider': {
            autoWidth: true,
            isNavigation: true,
            drag   : true,
            rewind: false,
            pagination: false,
            arrows: false,
            flickPower: '150',
            wheelSleep: '0',
          },
          '.tt-usecase-card-slider': {
            type     : 'loop',
            focus    : 'center',
            autoWidth: true,
            drag   : true,
            rewind: false,
            pagination: false,
            arrows: false,
            autoplay: true,
            flickPower: '150',
            wheelSleep: '0',
          },
          '.tt-blog-card-slider': {
            autoWidth: true,
            drag   : true,
            rewind: false,
            pagination: false,
            arrows: false,
            flickPower: '150',
            wheelSleep: '0',
          },
      // Weitere Konfigurationen können hier hinzugefügt werden
    };
  
    // Array von Objekten, die definieren, welche Slider synchronisiert werden sollen
    var syncPairs = [
      { parent: '.tt-usecases-slider', primary: '.tt-usecase-slider', secondary: '.tt-category-slider' },
      { parent: '.tt-feature-accordion', primary: '.tt-accordion-media-slider', secondary: '.tt-caccordion-content-slider' },
      // Weitere Sync-Paar-Objekte können hier hinzugefügt werden
    ];
  
    // Objekt zur Speicherung der erstellten Splide-Instanzen
    var sliders = {};
  
    // Über jede Slider-Klasse iterieren, um die Instanzen zu erstellen
    Object.keys(sliderOptions).forEach(function(sliderClass) {
      // Alle Elemente auswählen, die zur aktuellen Klasse gehören
      document.querySelectorAll(sliderClass).forEach(function(sliderElement) {
        // Erstellen einer neuen Splide-Instanz mit den Optionen
        var splideInstance = new Splide(sliderElement, sliderOptions[sliderClass]);
        // Speichern der Instanzen in einem Array für jede Klasse
        sliders[sliderClass] = sliders[sliderClass] || [];
        sliders[sliderClass].push(splideInstance);
        // Aufrufen der mount-Methode, um den Slider zu initialisieren
        splideInstance.mount();
      });
    });
  
    // Über das Array von Sync-Paaren iterieren
    syncPairs.forEach(function(pair) {
      // Überprüfen, ob das übergeordnete Element existiert
      var parentElement = document.querySelector(pair.parent);
      if (parentElement && sliders[pair.primary] && sliders[pair.secondary]) {
        // Jede primary Slider-Instanz mit jeder secondary Slider-Instanz synchronisieren
        sliders[pair.primary].forEach(function(primarySlider, i) {
          sliders[pair.secondary].forEach(function(secondarySlider, j) {
            // Aufrufen der sync-Methode, um die Slider zu synchronisieren
            primarySlider.sync(secondarySlider);
          });
        });
      } else {
        // console.log('Unable to sync pair: ', pair); // Log if syncing failed
      }
    });

  });