document.addEventListener('DOMContentLoaded', function () {
  var tocEl = document.querySelector('[data-toc]');
  var srcEl = document.querySelector('[data-toc-source]');

  if (!tocEl || !srcEl) {
    return;
  }

  var headings = Array.prototype.slice.call(srcEl.querySelectorAll('h2'));

  // Case A/B: ToC-Items bestimmen (MUSS vor Overview-Button passieren!)
  var presetBtn = tocEl.querySelector('.tt-toc-button');
  var tocItems = [];

  if (presetBtn) {
    // Text der Vorlage holen
    var rawText = (presetBtn.innerText || presetBtn.textContent || '').trim();

    // Wenn kein Komma vorhanden oder leerer Text -> wie Case B behandeln
    if (!rawText || rawText.indexOf(',') === -1) {
      // Dummy-Vorlage entfernen, damit wir aus H2 generieren können
      presetBtn.parentNode.removeChild(presetBtn);
      presetBtn = null;
    } else {
      // Case A: echte kommaseparierte Liste
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
    }
  }

  // Case B: Automatisch aus den H2-Texten erzeugen, wenn keine gültige Vorlage existiert
  if (!presetBtn && headings.length && !tocItems.length) {
    tocItems = headings
      .map(function (h) {
        return (h.textContent || '').trim();
      })
      .filter(function (t) {
        return !!t;
      });
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

  // Overview-Button IMMER erstellen (auch wenn keine H2-Items vorhanden)
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

  // H2-Buttons erstellen, wenn es Headings UND tocItems gibt
  if (headings.length && tocItems.length) {
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
  }

  // Prüfung ob Buttons vorhanden (sollte immer mindestens Overview sein)
  if (!buttons.length) {
    return;
  }

  // Overview initial aktiv setzen und aktuellen Active-State merken
  setActiveButtonById('toc-overview');
  var currentActiveId = 'toc-overview';

  // Scroll-Listener nur initialisieren, wenn es Headings gibt
  if (headings.length) {
    var rafId = null;

    function updateActiveByScroll() {
      rafId = null;
      var scrollTop =
        window.pageYOffset || document.documentElement.scrollTop || 0;
      var viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 0;
      var activationLine = viewportHeight * 0.4; // 40 % vom oberen Rand

      // Wenn ganz oben, Overview aktivieren
      if (scrollTop < scrollOffset) {
        if (currentActiveId !== 'toc-overview') {
          currentActiveId = 'toc-overview';
          setActiveButtonById('toc-overview');
        }
        return;
      }

      var bestId = null;
      var bestTop = -Infinity;
      var activationLineAbsolute = scrollTop + activationLine; // Absolute Position der 40%-Linie

      // Finde die letzte Heading, die die 40%-Linie erreicht hat
      // (auch wenn sie jetzt außerhalb des Viewports ist)
      headings.forEach(function (h2) {
        var rect = h2.getBoundingClientRect();
        var h2TopAbsolute = rect.top + scrollTop; // Absolute Position der Heading

        // Heading hat die 40%-Linie erreicht (ist oberhalb oder auf der Linie)
        if (h2TopAbsolute <= activationLineAbsolute) {
          // Nimm die unterste Heading, die diese Bedingung erfüllt
          if (h2TopAbsolute > bestTop) {
            bestTop = h2TopAbsolute;
            bestId = h2.id;
          }
        }
      });

      var activeId = bestId || 'toc-overview';
      if (activeId !== currentActiveId) {
        currentActiveId = activeId;
        setActiveButtonById(activeId);
      }
    }

    function onScrollOrResize() {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(updateActiveByScroll);
    }

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);

    // Initial berechnen
    updateActiveByScroll();
  }
});

