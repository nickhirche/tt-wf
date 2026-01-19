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
    btn.textContent = label;
    btn.setAttribute('data-toc-target', id);

    btn.addEventListener('click', (function (targetId) {
      return function () {
        var target = document.getElementById(targetId);
        if (!target) return;

        // Active-State direkt setzen
        setActiveButtonById(targetId);

        try {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        } catch (e) {
          // Fallback für ältere Browser
          var rect = target.getBoundingClientRect();
          var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
          window.scrollTo(0, rect.top + scrollTop);
        }
      };
    })(id));

    tocEl.appendChild(btn);
    buttons.push(btn);
  }

  if (!buttons.length) {
    return;
  }

  // Ersten Eintrag initial aktiv setzen
  setActiveButtonById(headings[0].id);

  // IntersectionObserver zur Ermittlung des obersten sichtbaren H2
  var observer = new IntersectionObserver(
    function () {
      var activeId = null;
      var minTop = Infinity;
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

      headings.forEach(function (h2) {
        var rect = h2.getBoundingClientRect();
        var inView = rect.bottom > 0 && rect.top < viewportHeight;

        if (!inView) {
          return;
        }

        // Der H2, der dem oberen Viewport-Rand am nächsten ist (kleinstes top)
        if (rect.top < minTop) {
          minTop = rect.top;
          activeId = h2.id;
        }
      });

      if (activeId) {
        setActiveButtonById(activeId);
      }
    },
    {
      root: null,
      threshold: [0, 0.01, 0.1, 0.25]
    }
  );

  headings.forEach(function (h2) {
    observer.observe(h2);
  });
});

