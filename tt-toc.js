document.addEventListener('DOMContentLoaded', function () {
  var tocEl = document.querySelector('[data-toc]');
  var srcEl = document.querySelector('[data-toc-source]');

  if (!tocEl || !srcEl) {
    return;
  }

  var headings = Array.prototype.slice.call(srcEl.querySelectorAll('h2'));

  if (!headings.length) {
    return;
  }

  // Case A: Vorlage-Button mit kommaseparierter Liste
  var presetBtn = tocEl.querySelector('.tt-toc-button');
  var tocItems = [];

  if (presetBtn) {
    var rawText = presetBtn.innerText || presetBtn.textContent || '';

    tocItems = rawText
      .split(',')
      .map(function (t) {
        return t.trim();
      })
      .filter(function (t) {
        return !!t;
      });

    // Vorlage entfernen
    presetBtn.parentNode.removeChild(presetBtn);
  } else {
    // Case B: Automatisch aus den H2-Texten erzeugen
    tocItems = headings
      .map(function (h) {
        return (h.textContent || '').trim();
      })
      .filter(function (t) {
        return !!t;
      });
  }

  if (!tocItems.length) {
    return;
  }

  // Versatz nach oben: 5rem
  var rootFontSize = parseFloat(
    window.getComputedStyle(document.documentElement).fontSize
  );
  var scrollOffset = 5 * rootFontSize; // 5rem

  var buttons = [];

  function setActiveButtonById(id) {
    buttons.forEach(function (btn) {
      var targetId = btn.getAttribute('data-toc-target');
      if (!targetId) return;
      if (targetId === id) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Overview-Button erstellen (springt ganz nach oben)
  var overviewBtn = document.createElement('button');
  overviewBtn.type = 'button';
  overviewBtn.className = 'tt-toc-button w-button';
  overviewBtn.textContent = 'Overview';
  overviewBtn.setAttribute('data-toc-target', 'toc-overview');

  overviewBtn.addEventListener('click', function () {
    setActiveButtonById('toc-overview');
    try {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  });

  tocEl.appendChild(overviewBtn);
  buttons.push(overviewBtn);

  // IDs erzeugen und Buttons bauen – nur so viele, wie es Überschriften gibt
  var count = Math.min(tocItems.length, headings.length);

  for (var index = 0; index < count; index++) {
    var label = tocItems[index];
    var id = 'toc-' + index;
    var h2 = headings[index];

    if (!h2) {
      continue;
    }

    // H2 bekommt ID
    h2.id = id;

    // Button erzeugen
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tt-toc-button w-button';
    btn.textContent = label;
    btn.setAttribute('data-toc-target', id);

    btn.addEventListener('click', (function (targetId) {
      return function () {
        var target = document.getElementById(targetId);
        if (!target) return;

        // Active-State direkt setzen
        setActiveButtonById(targetId);

        var rect = target.getBoundingClientRect();
        var scrollTop =
          window.pageYOffset || document.documentElement.scrollTop || 0;
        var targetY = rect.top + scrollTop - scrollOffset;

        try {
          window.scrollTo({
            top: targetY,
            behavior: 'smooth',
          });
        } catch (e) {
          // Fallback für ältere Browser
          window.scrollTo(0, targetY);
        }
      };
    })(id));

    tocEl.appendChild(btn);
    buttons.push(btn);
  }

  if (!buttons.length) {
    return;
  }

  // Overview initial aktiv setzen und aktuellen Active-State merken
  setActiveButtonById('toc-overview');
  var currentActiveId = 'toc-overview';

  // IntersectionObserver zur Ermittlung der aktiven Section
  var observer = new IntersectionObserver(
    function () {
      var scrollTop =
        window.pageYOffset || document.documentElement.scrollTop || 0;

      // Wenn ganz oben, Overview aktivieren
      if (scrollTop < scrollOffset) {
        currentActiveId = 'toc-overview';
        setActiveButtonById('toc-overview');
        return;
      }

      var activeId = null;
      var minTop = Infinity;
      var viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 0;
      var activationThreshold = viewportHeight * 0.2; // 20 % des Viewports
      var bottomThreshold = viewportHeight * 0.4; // 40 % vom unteren Viewport entfernt

      headings.forEach(function (h2) {
        var rect = h2.getBoundingClientRect();
        var inView = rect.bottom > 0 && rect.top < viewportHeight;

        if (!inView) {
          return;
        }

        // sichtbare Höhe des Elements
        var visibleHeight =
          Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
        var elementHeight = rect.height;
        var visiblePercentage =
          elementHeight > 0 ? visibleHeight / elementHeight : 0;

        // Bedingung 1: H2 hat den oberen Offset überschritten
        var hasPassedOffset = rect.top <= scrollOffset;

        // Bedingung 2: Mindestens 20 % sichtbar (oder 20 % des Viewports)
        var isVisibleEnough =
          visiblePercentage >= 0.2 || visibleHeight >= activationThreshold;

        // Bedingung 3: Beim Runter-Scrollen – Heading muss mehr als 40 % vom unteren Viewport entfernt sein
        // D. h.: rect.top muss kleiner sein als viewportHeight - bottomThreshold = viewportHeight * 0.6
        var isFarEnoughFromBottom = rect.top < viewportHeight - bottomThreshold;

        // Nur H2s berücksichtigen, die unsere Aktivierungs-Regel erfüllen
        if (
          (hasPassedOffset || isVisibleEnough) &&
          isFarEnoughFromBottom &&
          rect.top < minTop
        ) {
          minTop = rect.top;
          activeId = h2.id;
        }
      });

      // Wenn keine Heading die Bedingung erfüllt (z.B. beim Hochscrollen)
      // → finde die oberste Heading, die bereits den Offset überschritten hat
      if (!activeId) {
        var lastPassedId = null;
        var lastPassedTop = -Infinity;

        headings.forEach(function (h2) {
          var h2Top = h2.getBoundingClientRect().top + scrollTop;

          // Heading hat den Offset bereits überschritten UND ist oberhalb der aktuellen Scroll-Position
          if (h2Top <= scrollTop + scrollOffset && h2Top > lastPassedTop) {
            lastPassedTop = h2Top;
            lastPassedId = h2.id;
          }
        });

        if (lastPassedId) {
          activeId = lastPassedId;
        }
      }

      if (activeId) {
        currentActiveId = activeId;
        setActiveButtonById(activeId);
      } else {
        // Fallback: vorherige aktiv lassen
        setActiveButtonById(currentActiveId);
      }
    },
    {
      root: null,
      threshold: [0, 0.2, 0.5]
    }
  );

  headings.forEach(function (h2) {
    observer.observe(h2);
  });
});

