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

var sliders = {};

// Warten Sie, bis das gesamte Dokument geladen ist, bevor Sie Skripte ausführen
document.addEventListener('DOMContentLoaded', function() {
  
    // Objekt, das die Konfigurationen für die verschiedenen Slider enthält
    var sliderOptions = {
          // Synced Features Slider Group
          '.tt-feauture-content-slider': { 
            type: 'fade',
            pagination: false,
            arrows: false,
            rewind: true,
            drag: false,
            updateOnMove: true,
          },
          '.tt-feature-nav-slider': {
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
            flickPower: '150',
            wheelSleep: '0',
            breakpoints: {
              667: { // or less
                type: 'loop',
                focus: 'center',
                drag: true,
              },
            },
          },
          // Synced Usecase Slider Group
          '.tt-usecase-slider': {
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
              autoScroll: false,
              autoplay: 'pause',
              intersection: {
                rootMargin: '200px',
                inView: {
                  autoplay: true,
                },
                outView: {
                  autoplay: false,
                },
              },
              rewind: false,
              pagination: false,
              arrows: false,
              flickPower: '150',
              wheelSleep: '0',
          },
          // Prodcut Slider
          '.tt-product-slider': {
            autoWidth: true,
            drag   : true,
            rewind: false,
            pagination: false,
            arrows: false,
            autoScroll: false,

            flickPower: '150',
            wheelSleep: '0',
          },
          // Synced Accordion Slider Group
          '.tt-accordion-media-slider': {
              type: 'fade',
              pagination: false,
              arrows: false,
              rewind: true,
              drag: true,
              updateOnMove: true,
              autoScroll: false,
              pauseOnHover: false,
              pauseOnFocus: false,
              autoplay: 'pause',
              intersection: {
                rootMargin: '200px',
                inView: {
                  autoplay: true,
                },
                outView: {
                  autoplay: false,
                },
              },
          },  
          '.tt-accordion-content-slider': {
            autoWidth: false,
            isNavigation: true,
            updateOnMove: true,
            drag: false,
            rewind: true,
            pagination: false,
            arrows: false,
            autoScroll: false,
            breakpoints: {
              991: { // or less
                type     : 'loop',
                focus    : 'center',
                updateOnMove: true,
                autoWidth: true,
                isNavigation: true,
                drag   : true,
                cloneStatus: false,
                autoplay: 'pause',
                intersection: {
                  rootMargin: '200px',
                  inView: {
                    autoplay: true,
                  },
                  outView: {
                    autoplay: false,
                  },
                },
                rewind: false,
                pagination: true,
                arrows: false,
                flickPower: '150',
                wheelSleep: '0',
              },
            },
          },
          // Usecase Card Slider
          '.tt-usecase-card-slider': {
            type     : 'loop',
            focus    : 'center',
            autoWidth: true,
            drag   : true,
            rewind: false,
            pagination: false,
            arrows: false,
            autoScroll: false,
            //easing: 'cubic-bezier(0.65,0.05,0.36,1)',
            //speed: 640,
            autoplay: 'pause',
            intersection: {
              rootMargin: '30%',
              inView: {
                autoplay: true,
              },
              outView: {
                autoplay: false,
              },
            },
            flickPower: '150',
            wheelSleep: '0',
          },
          // Marquee Slider
          '.tt-marquee-slider.marquee-left-speed-1': {
            type     : 'loop',
            focus    : 'center',
            drag   : false,
            autoWidth: true,
            rewind: false,
            pagination: false,
            arrows: false,
            autoScroll: {
              autoStart: false,
              speed: 1,
              pauseOnHover: false,
              pauseOnFocus: false,
            },
            intersection: {
              rootMargin: '30%',
              inView: {
                autoScroll: true,
              },
              outView: {
                autoScroll: false,
              },
            },
          },
          '.tt-marquee-slider.marquee-left-speed-2': {
            type     : 'loop',
            focus    : 'center',
            drag   : false,
            autoWidth: true,
            rewind: false,
            pagination: false,
            arrows: false,
            autoScroll: {
              autoStart: false,
              speed: 1.5,
              pauseOnHover: false,
              pauseOnFocus: false,
            },
            intersection: {
              rootMargin: '30%',
              inView: {
                autoScroll: true,
              },
              outView: {
                autoScroll: false,
              },
            },
          },
          '.tt-marquee-slider.marquee-right-speed-1': {
            type     : 'loop',
            focus    : 'center',
            drag   : false,
            autoWidth: true,
            rewind: false,
            pagination: false,
            arrows: false,
            autoScroll: {
              autoStart: false,
              speed: -1,
              pauseOnHover: false,
              pauseOnFocus: false,
            },
            intersection: {
              rootMargin: '30%',
              inView: {
                autoScroll: true,
              },
              outView: {
                autoScroll: false,
              },
            },
          },
          '.tt-marquee-slider.marquee-right-speed-2': {
            type     : 'loop',
            focus    : 'center',
            drag   : false,
            autoWidth: true,
            rewind: false,
            pagination: false,
            arrows: false,
            autoScroll: {
              autoStart: false,
              speed: -1.5,
              pauseOnHover: false,
              pauseOnFocus: false,
            },
            intersection: {
              rootMargin: '30%',
              inView: {
                autoScroll: true,
              },
              outView: {
                autoScroll: false,
              },
            },
          },
          // Blog Slider
          '.tt-blog-card-slider': {
            autoWidth: true,
            drag   : true,
            rewind: false,
            pagination: false,
            arrows: false,
            autoScroll: false,
            flickPower: '150',
            wheelSleep: '0',
          },
          
      // Weitere Konfigurationen können hier hinzugefügt werden
    };
  
    // Array von Objekten, die definieren, welche Slider synchronisiert werden sollen
    var syncPairs = [
      { parent: '.tt-features-slider', primary: '.tt-feature-nav-slider', secondary: '.tt-feauture-content-slider' },
      { parent: '.tt-usecases-slider', primary: '.tt-usecase-slider', secondary: '.tt-category-slider' },
      { parent: '.tt-feature-accordion', primary: '.tt-accordion-media-slider', secondary: '.tt-accordion-content-slider' },
      // Weitere Sync-Paar-Objekte können hier hinzugefügt werden
    ];
  
    // Objekt zur Speicherung der erstellten Splide-Instanzen
    // var sliders = {};

    // Über jede Slider-Klasse iterieren, um die Instanzen zu erstellen
    Object.keys(sliderOptions).forEach(function(sliderClass) {
      document.querySelectorAll(sliderClass).forEach(function(sliderElement) {
        // Erstellen einer neuen Splide-Instanz mit den Optionen
        var splideInstance = new Splide(sliderElement, sliderOptions[sliderClass]).mount(window.splide.Extensions);

        // Speichern der Instanzen in einem Array für jede Klasse
        sliders[sliderClass] = sliders[sliderClass] || [];
        sliders[sliderClass].push(splideInstance);
      });
    });
  
    // Über das Array von Sync-Paaren iterieren
    syncPairs.forEach(function(pair) {
      // Versuche, das übergeordnete Element zu finden
      var parentElement = document.querySelector(pair.parent);
      if (!parentElement) {
        return; // Überspringe die aktuelle Iteration und fahre mit der nächsten fort
      }

      // Speichere die Arrays der primary und secondary Sliders
      var primarySliders = sliders[pair.primary] || [];
      var secondarySliders = sliders[pair.secondary] || [];

      // Wenn beide Slider gefunden wurden, synchronisiere sie
      if (primarySliders.length && secondarySliders.length) {
        primarySliders.forEach(function(primarySlider, i) {
          // Stelle sicher, dass ein korrespondierender secondary Slider existiert
          if (secondarySliders[i]) {
            primarySlider.sync(secondarySliders[i]);
          }
        });
      }
    });

});

/* Navigation changer */ 
document.addEventListener('DOMContentLoaded', function() {
  const bgDarkElements = document.querySelectorAll('.bg-black');
  const headerElement = document.querySelector('.tt-navbar');

  function checkElementsInViewport() {
      let addClass = false;

      bgDarkElements.forEach(element => {
          const rect = element.getBoundingClientRect();
          // Check if the element is at least 200px into the viewport from the top
          if (rect.top <= 200 && rect.bottom >= 100) {
              addClass = true;
          }
      });

      if (addClass) {
          headerElement.classList.add('dark');
      } else {
          headerElement.classList.remove('dark');
      }
  }

  // Initial check
  checkElementsInViewport();

  // Check on scroll
  window.addEventListener('scroll', checkElementsInViewport);

  // Check on resize
  window.addEventListener('resize', checkElementsInViewport);
});


/* COST CALCULATOR */ 
document.addEventListener('DOMContentLoaded', function() {
  const rangeInput = document.querySelector('input[data-type="calculator-range"]');
  const workloadDiv = document.querySelector('div[data-value-type="workload"]');
  const peopleCostDiv = document.getElementById('editable-value');
  const peopleNumberDiv = document.querySelector('div[data-value-type="people-number"]');
  const maintenanceDiv = document.querySelector('div[data-cost-type="maintenance"]');
  const maintenanceValueDiv = document.querySelector('div[data-cost-value-type="maintenance"]');
  const maintenanceHoursDiv = maintenanceDiv.querySelector('.maintenance-hours');
  const initialCostDiv = document.querySelector('div[data-cost-value-type="initial"]');
  const mediumLabel = document.querySelector('label[data-range-label="medium"]');
  const complexLabel = document.querySelector('label[data-range-label="complex"]');
  const descriptions = document.querySelectorAll('.range-description');
  const resetButton = document.querySelector('.value-reset');
  const editCustomValue = document.querySelector('.value-edit');

  let peopleCostOverride = false;

  const values = {
      0: { workload: 193, peopleCost: 35.69, peopleNumber: 1, description: 'simple', maintenance: null, maintenanceValue: null },
      25: { workload: 324, peopleCost: 40.69, peopleNumber: 2, description: 'simple', maintenance: null, maintenanceValue: null },
      50: { workload: 408, peopleCost: 52.88, peopleNumber: 3, description: 'medium', maintenance: null, maintenanceValue: null },
      75: { workload: 1647, peopleCost: 55.40, peopleNumber: 5, description: 'medium', maintenance: 'active', maintenanceValue: 128 },
      100: { workload: 3851, peopleCost: 62.50, peopleNumber: 8, description: 'complex', maintenance: 'active', maintenanceValue: 220 }
  };

  function formatEditableValue() {
      const sel = window.getSelection();
      const range = sel.getRangeAt(0);
      const preCursorPosition = range.endOffset;

      let value = peopleCostDiv.textContent.replace(/[^\d]/g, '');

      if (value.length <= 2) {
          peopleCostDiv.textContent = value;
          setCursorPosition(preCursorPosition);
          return;
      }

      const dollars = value.slice(0, -2);
      const cents = value.slice(-2);

      const formattedDollars = dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      const formattedValue = formattedDollars + '.' + cents;

      const diff = formattedValue.length - value.length;
      peopleCostDiv.textContent = formattedValue;

      setCursorPosition(preCursorPosition + diff);
  }

  function setCursorPosition(pos) {
      const range = document.createRange();
      const sel = window.getSelection();
      range.setStart(peopleCostDiv.childNodes[0], Math.min(pos, peopleCostDiv.textContent.length));
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
  }

  function formatNumber(value) {
      return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  function calculateInitialCost() {
      const workload = parseFloat(workloadDiv.textContent);
      const peopleCost = parseFloat(peopleCostDiv.textContent.replace(/,/g, ''));
      const peopleNumber = parseInt(peopleNumberDiv.textContent);

      const initialCost = workload * peopleCost;
      initialCostDiv.textContent = formatNumber(initialCost);
  }

  function calculateMaintenanceCost(data) {
      const peopleCost = parseFloat(peopleCostDiv.textContent.replace(/,/g, ''));
      const maintenanceValue = data.maintenanceValue;

      if (maintenanceValue) {
          const calculatedMaintenance = maintenanceValue * 12 * peopleCost;
          maintenanceValueDiv.textContent = formatNumber(calculatedMaintenance);
          maintenanceHoursDiv.textContent = maintenanceValue.toFixed(2); // Update maintenance hours
      } else {
          maintenanceValueDiv.textContent = '';
          maintenanceHoursDiv.textContent = '';
      }
  }

  function updateValues() {
      const value = parseInt(rangeInput.value);
      const data = values[value];

      if (!peopleCostOverride) {
          peopleCostDiv.textContent = data.peopleCost.toFixed(2);
          peopleCostDiv.setAttribute('data-custom-value', 'false');
      }
      
      workloadDiv.textContent = data.workload;
      peopleNumberDiv.textContent = data.peopleNumber;

      descriptions.forEach(desc => {
          if (desc.dataset.descriptionTyp === data.description) {
              desc.classList.add('active');
          } else {
              desc.classList.remove('active');
          }
      });

      if (data.maintenance) {
          maintenanceDiv.classList.add('active');
          calculateMaintenanceCost(data);
      } else {
          maintenanceDiv.classList.remove('active');
          maintenanceValueDiv.textContent = '';
          maintenanceHoursDiv.textContent = '';
      }

      calculateInitialCost();

      if (value >= 50) {
          mediumLabel.classList.add('active');
      } else {
          mediumLabel.classList.remove('active');
      }

      if (value === 100) {
          complexLabel.classList.add('active');
      } else {
          complexLabel.classList.remove('active');
      }

      rangeInput.style.setProperty('--range-value', value);
  }

  rangeInput.addEventListener('input', function() {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
          'event': 'cost_calculator',
      });
      updateValues();
  });

  peopleCostDiv.addEventListener('input', function() {
      peopleCostOverride = true;
      peopleCostDiv.setAttribute('data-custom-value', 'true');
      formatEditableValue();
      calculateInitialCost();
  });

  peopleCostDiv.addEventListener('focus', function() {
      const range = document.createRange();
      range.selectNodeContents(peopleCostDiv);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
  });
  
  editCustomValue.addEventListener('click', function() {
      peopleCostDiv.focus();
  });

  resetButton.addEventListener('click', function() {
      peopleCostOverride = false;
      updateValues();
  });

  rangeInput.value = 0;
  updateValues();

  // Check if the contact form exists
  const contactForm = document.querySelector('form[data-name="Contact form"]');
  const ctaLink = document.querySelector('.tt-calculator-cta a.tt-button');
  const firstNameInput = document.getElementById('firstname');

  // Check if all elements exist
  if (contactForm && ctaLink && firstNameInput) {
      ctaLink.addEventListener('click', function(event) {
          event.preventDefault(); // Prevent default link behavior
          firstNameInput.focus(); // Set focus on the firstname input
      });
  }
});