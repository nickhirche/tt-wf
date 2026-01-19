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
      var viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 0;
      var activationLine = viewportHeight * 0.6; // 60 % vom oberen Rand

      // Wenn ganz oben, Overview aktivieren
      if (scrollTop < scrollOffset) {
        currentActiveId = 'toc-overview';
        setActiveButtonById('toc-overview');
        return;
      }

      var activeId = null;

      // RUNTERSCROLLEN:
      // Finde die unterste Heading, deren top <= activationLine ist
      var bestCandidateId = null;
      var bestCandidateTop = -Infinity;

      headings.forEach(function (h2) {
        var rect = h2.getBoundingClientRect();
        var h2Top = rect.top;
        var inView = rect.bottom > 0 && rect.top < viewportHeight;

        if (!inView) {
          return;
        }

        // Heading hat die 60%-Linie erreicht (oder überschritten)
        if (h2Top <= activationLine && h2Top > bestCandidateTop) {
          bestCandidateTop = h2Top;
          bestCandidateId = h2.id;
        }
      });

      if (bestCandidateId) {
        activeId = bestCandidateId;
      } else {
        // HOCHSCROLLEN:
        // Keine Heading hat die 60%-Linie erreicht
        // -> suche die nächst höhere Heading oberhalb der 60%-Linie
        var nextHigherId = null;
        var nextHigherTop = Infinity;

        headings.forEach(function (h2) {
          var rect = h2.getBoundingClientRect();
          var h2Top = rect.top;

          // Heading ist über der 60%-Linie
          if (h2Top > activationLine && h2Top < nextHigherTop) {
            nextHigherTop = h2Top;
            nextHigherId = h2.id;
          }
        });

        if (nextHigherId) {
          activeId = nextHigherId;
        } else {
          // Keine passende Heading gefunden -> Overview aktivieren
          activeId = 'toc-overview';
        }
      }

      if (activeId) {
        currentActiveId = activeId;
        setActiveButtonById(activeId);
      } else {
        setActiveButtonById(currentActiveId);
      }
    },
    {
      root: null,
      threshold: [0, 0.6]
    }
  );

  headings.forEach(function (h2) {
    observer.observe(h2);
  });
});

