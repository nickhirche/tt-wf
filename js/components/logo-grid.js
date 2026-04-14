document.addEventListener('DOMContentLoaded', function () {
  var systems = document.querySelectorAll('.tt-logo-grid-system');

  systems.forEach(function (systemEl, systemIndex) {
    var rotateEnabled = (systemEl.dataset.rotate || '').toLowerCase() === 'true';
    if (!rotateEnabled) return;

    var intervalValue = parseInt(systemEl.dataset.interval, 10);
    var fadeValue = parseInt(systemEl.dataset.fade, 10);
    var pauseOnHoverValue = (systemEl.dataset.pauseOnHover || 'true').toLowerCase();
    var debugValue = (systemEl.dataset.debug || 'false').toLowerCase();
    var slotCooldownValue = parseInt(systemEl.dataset.slotCooldown, 10);
    var logoCooldownValue = parseInt(systemEl.dataset.logoCooldown, 10);
    var lockNeighborsValue = (systemEl.dataset.lockNeighbors || 'true').toLowerCase();

    var config = {
      interval: Number.isFinite(intervalValue) ? intervalValue : 2500,
      fade: Number.isFinite(fadeValue) ? fadeValue : 120,
      pauseOnHover: pauseOnHoverValue !== 'false',
      debug: debugValue === 'true',
      slotCooldown: Number.isFinite(slotCooldownValue) ? Math.max(0, slotCooldownValue) : 1,
      logoCooldown: Number.isFinite(logoCooldownValue) ? Math.max(0, logoCooldownValue) : 1,
      lockNeighbors: lockNeighborsValue !== 'false',
    };

    function warn(message, extra) {
      if (!config.debug) return;
      if (typeof extra === 'undefined') {
        console.warn('[tt-logo-grid]', message);
        return;
      }
      console.warn('[tt-logo-grid]', message, extra);
    }

    var gridEl = systemEl.querySelector('.tt-logo-grid');
    if (!gridEl) {
      warn('Keine .tt-logo-grid in der Instanz gefunden.');
      return;
    }

    var slotEls = Array.from(
      systemEl.querySelectorAll('.tt-logo-grid .tt-logo-item-slot')
    );
    var poolSlotEls = Array.from(
      systemEl.querySelectorAll('.tt-logo-pool .tt-logo-item-slot')
    );

    if (slotEls.length < 1 || poolSlotEls.length < 1) {
      warn('Abbruch: Slots oder Pool leer.', {
        slots: slotEls.length,
        pool: poolSlotEls.length,
      });
      return;
    }

    var fallbackIdCounter = 0;
    var fallbackIdMap = new WeakMap();
    var visibleIds = new Set();
    var lastIdBySlot = new WeakMap();

    function getSlotItem(slotEl) {
      return slotEl ? slotEl.querySelector('.tt-logo-item') : null;
    }

    function getLogoId(logoItemEl) {
      if (!logoItemEl) return null;

      var id = (logoItemEl.dataset.logoId || '').trim();
      if (id) return id;

      if (!fallbackIdMap.has(logoItemEl)) {
        fallbackIdCounter += 1;
        fallbackIdMap.set(
          logoItemEl,
          'tt-logo-fallback-' + systemIndex + '-' + fallbackIdCounter
        );
      }

      id = fallbackIdMap.get(logoItemEl);
      logoItemEl.dataset.logoId = id;
      return id;
    }

    slotEls.forEach(function (slotEl) {
      var itemEl = getSlotItem(slotEl);
      var id = getLogoId(itemEl);
      if (!id) return;

      if (visibleIds.has(id)) {
        warn('Doppelte initial sichtbare Logo-ID gefunden: ' + id);
      }

      visibleIds.add(id);
      lastIdBySlot.set(slotEl, id);
    });

    var poolCandidates = poolSlotEls
      .map(function (poolSlotEl) {
        var itemEl = poolSlotEl.querySelector('.tt-logo-item');
        if (!itemEl) return null;

        var id = getLogoId(itemEl);
        if (!id) return null;

        return {
          id: id,
          templateEl: itemEl,
        };
      })
      .filter(Boolean);

    if (poolCandidates.length < 1) {
      warn('Abbruch: Keine gueltigen Pool-Kandidaten gefunden.');
      return;
    }

    slotEls.forEach(function (slotEl) {
      if (!slotEl.style.transition) {
        slotEl.style.transition = 'opacity ' + config.fade + 'ms ease';
      }
    });

    var paused = false;
    var stopped = false;
    var timeoutId = null;
    var tickRunning = false;
    var lastChangedSlotIndex = -1;
    var slotCooldown = [];
    var logoCooldownById = new Map();
    var lastInsertedLogoId = null;

    function pickRandom(list) {
      return list[Math.floor(Math.random() * list.length)];
    }

    function getNeighborIndices(index, total) {
      if (total <= 1 || index < 0) return [];
      var prev = (index - 1 + total) % total;
      var next = (index + 1) % total;
      if (prev === next) return [prev];
      return [prev, next];
    }

    function decrementCooldowns() {
      slotCooldown = slotCooldown.map(function (value) {
        return Math.max(0, value - 1);
      });

      logoCooldownById.forEach(function (value, id) {
        var next = Math.max(0, value - 1);
        if (next === 0) {
          logoCooldownById.delete(id);
          return;
        }
        logoCooldownById.set(id, next);
      });
    }

    function setCooldowns(changedSlotIndex, insertedLogoId) {
      if (config.slotCooldown > 0) {
        slotCooldown[changedSlotIndex] = config.slotCooldown;
      }
      if (config.logoCooldown > 0 && insertedLogoId) {
        logoCooldownById.set(insertedLogoId, config.logoCooldown);
      }
    }

    function buildAllowedSlotIndices(strict) {
      var lockedNeighbors = config.lockNeighbors && strict;
      var lockedIndexSet = new Set();

      if (lockedNeighbors && lastChangedSlotIndex >= 0) {
        lockedIndexSet.add(lastChangedSlotIndex);
        getNeighborIndices(lastChangedSlotIndex, slotEls.length).forEach(function (idx) {
          lockedIndexSet.add(idx);
        });
      }

      return slotEls
        .map(function (_slotEl, index) {
          return index;
        })
        .filter(function (index) {
          if (lockedIndexSet.has(index)) return false;
          if (strict && slotCooldown[index] > 0) return false;
          return true;
        });
    }

    function buildCandidatesForSlot(slotEl, strict) {
      var slotLastId = lastIdBySlot.get(slotEl) || null;

      return poolCandidates.filter(function (candidate) {
        if (visibleIds.has(candidate.id)) return false;
        if (candidate.id === slotLastId) return false;

        if (strict) {
          if (lastInsertedLogoId && candidate.id === lastInsertedLogoId) return false;
          if ((logoCooldownById.get(candidate.id) || 0) > 0) return false;
        }

        return true;
      });
    }

    function scheduleNext() {
      if (stopped) return;
      timeoutId = window.setTimeout(runTick, config.interval);
    }

    function runTick() {
      if (stopped) return;
      if (paused || tickRunning) {
        scheduleNext();
        return;
      }

      tickRunning = true;

      decrementCooldowns();

      var allowedSlotIndices = buildAllowedSlotIndices(true);
      if (allowedSlotIndices.length < 1) {
        allowedSlotIndices = buildAllowedSlotIndices(false);
      }
      if (allowedSlotIndices.length < 1) {
        tickRunning = false;
        scheduleNext();
        return;
      }

      var slotIndex = pickRandom(allowedSlotIndices);
      var slotEl = slotEls[slotIndex];
      var currentItemEl = getSlotItem(slotEl);
      var oldId = getLogoId(currentItemEl);
      var available = buildCandidatesForSlot(slotEl, true);

      if (available.length < 1) {
        available = buildCandidatesForSlot(slotEl, false);
      }

      if (available.length < 1) {
        tickRunning = false;
        scheduleNext();
        return;
      }

      var chosen = pickRandom(available);

      slotEl.style.opacity = '0';

      window.setTimeout(function () {
        var oldLogoEl = getSlotItem(slotEl);
        if (oldLogoEl) oldLogoEl.remove();

        var newLogoEl = chosen.templateEl.cloneNode(true);
        newLogoEl.dataset.logoId = chosen.id;
        slotEl.appendChild(newLogoEl);

        if (oldId) visibleIds.delete(oldId);
        visibleIds.add(chosen.id);
        lastIdBySlot.set(slotEl, chosen.id);
        setCooldowns(slotIndex, chosen.id);
        lastChangedSlotIndex = slotIndex;
        lastInsertedLogoId = chosen.id;

        // Reflow, damit der anschliessende Fade-in sauber greift.
        void slotEl.offsetWidth;
        slotEl.style.opacity = '1';

        tickRunning = false;
        scheduleNext();
      }, config.fade);
    }

    if (config.pauseOnHover) {
      gridEl.addEventListener('mouseenter', function () {
        paused = true;
      });

      gridEl.addEventListener('mouseleave', function () {
        paused = false;
      });
    }

    scheduleNext();

    // Optional hilfreich fuer SPA-Setups/Debugging.
    systemEl.__ttLogoGridStop = function () {
      stopped = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  });
});

