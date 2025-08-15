// Tiptap Pricing Cards System
(function() {
    // Guard gegen Endlosschleifen bei programmgesteuerten Änderungen
    let isProgrammaticUpdate = false;

    function initPricingCardsSystem() {
        // Auf Periodenwechsel (TabMenu) reagieren
        document.addEventListener('billingPeriodChanged', function(event) {
            const activePeriod = event.detail.period;
            updatePricingCardsDisplay(activePeriod);
        });

        const initialPeriod = getInitialBillingPeriod();
        updatePricingCardsDisplay(initialPeriod);

        // Dropdown-Änderungen initialisieren
        initDocumentDropdowns();

        // Erste globale Auswertung
        compareCardValues();
        updateNotes();
    }

    // Liest die aktuell aktive Periode (monthly/yearly) aus dem TabMenu
    function getInitialBillingPeriod() {
        const btn = document.querySelector('.tt-billing-tab-btn.active, .tt-billing-tab-btn.is-active');
        return btn ? btn.getAttribute('data-billing-period') : 'monthly';
    }

    // Aktualisiert Preise, periodenspezifische Sichtbarkeit und globale Zustände
    function updatePricingCardsDisplay(activePeriod) {
        document.querySelectorAll('.tt-pricing-card').forEach(card => {
            updateCardPrices(card, activePeriod);
            updatePeriodVisibility(card, activePeriod);
        });
        compareCardValues();
        updateNotes();
    }

    // Preise in einer Card anhand der aktiven Periode und der Select-Option setzen
    function updateCardPrices(card, activePeriod) {
        const priceEl = card.querySelector('.price-value');
        if (!priceEl) return;

        const select = card.querySelector('.document-dropdown select');

        if (select) {
            if (select.selectedIndex >= 0) {
                const opt = select.options[select.selectedIndex];
                if (opt) {
                    const price = activePeriod === 'yearly'
                        ? opt.getAttribute('data-price-yearly')
                        : opt.getAttribute('data-price-monthly');

                    if (price) priceEl.textContent = price;

                    const yearlyTotalEl = card.querySelector('.price-value-yearly');
                    if (yearlyTotalEl && activePeriod === 'yearly') {
                        const yearlyTotal = opt.getAttribute('data-price-yearly-total');
                        if (yearlyTotal) yearlyTotalEl.textContent = yearlyTotal;
                    }
                }
            }
            return;
        }

        // Fallback ohne Dropdown
        const pm = priceEl.getAttribute('data-price-monthly');
        const py = priceEl.getAttribute('data-price-yearly');
        if (pm && py) priceEl.textContent = activePeriod === 'yearly' ? py : pm;

        const yearlyTotalEl = card.querySelector('.price-value-yearly');
        if (yearlyTotalEl && activePeriod === 'yearly') {
            const total = yearlyTotalEl.getAttribute('data-price-yearly-total');
            if (total) yearlyTotalEl.textContent = total;
        }
    }

    // Periodensichtbarkeit unabhängig vom Card-Inaktiv-Status
    function updatePeriodVisibility(card, activePeriod) {
        card.querySelectorAll('[data-subscription-period="monthly"]').forEach(el => {
            if (activePeriod === 'monthly') el.classList.remove('inactive');
            else el.classList.add('inactive');
        });
        card.querySelectorAll('[data-subscription-period="yearly"]').forEach(el => {
            if (activePeriod === 'yearly') el.classList.remove('inactive');
            else el.classList.add('inactive');
        });
    }

    // Change-Listener für alle Dropdowns
    function initDocumentDropdowns() {
        document.querySelectorAll('.tt-pricing-card .document-dropdown select').forEach(select => {
            select.addEventListener('change', function() {
                if (isProgrammaticUpdate) return;

                const activePeriod = getInitialBillingPeriod();
                const card = this.closest('.tt-pricing-card');
                if (!card) return;

                // Eigene Card-Preise updaten
                updateCardPrices(card, activePeriod);

                // Cross-Card-Regeln anwenden (Selects bleiben klickbar)
                applyCrossCardRules(this);

                // Globale Zustände neu bewerten
                compareCardValues();
                updateNotes();

                // Preise aller Cards aktualisieren (falls andere Selects geändert wurden)
                document.querySelectorAll('.tt-pricing-card').forEach(c => {
                    updateCardPrices(c, activePeriod);
                });
            });
        });
    }

    /**
     * Cross-Card-Regeln:
     * - Wenn selectedValue > max(other):
     *     -> setze other auf max(other) und zeige dessen .tt-select-note (inactive entfernen)
     * - Else wenn selectedValue >= min(other) und Wert existiert in other:
     *     -> setze other = selectedValue (Note ausblenden)
     * - Else:
     *     -> setze other = min(other) (Note ausblenden)
     */
    function applyCrossCardRules(changedSelect) {
        const changedOpt = changedSelect.options[changedSelect.selectedIndex];
        if (!changedOpt) return;

        const selectedValue = toNumber(changedSelect.value);
        if (isNaN(selectedValue)) return;

        const allSelects = Array.from(document.querySelectorAll('.tt-pricing-card .document-dropdown select'));

        isProgrammaticUpdate = true;
        try {
            allSelects.forEach(otherSelect => {
                if (otherSelect === changedSelect) return;

                const { minValue, maxValue, minOpt, maxOpt } = getMinMaxWithRefs(otherSelect);

                // 1) größer als Maximum -> auf Max setzen + Note zeigen
                if (selectedValue > maxValue) {
                    if (maxOpt) setSelectToOption(otherSelect, maxOpt);
                    showNote(otherSelect);
                    return;
                }

                // Unter/gleich max -> Note ausblenden
                hideNote(otherSelect);

                // 2) Wenn Wert existiert und >= min -> exakt auf diesen Wert setzen
                if (selectedValue >= minValue && hasOptionValue(otherSelect, selectedValue)) {
                    setSelectToValue(otherSelect, selectedValue);
                    return;
                }

                // 3) Sonst -> Minimum setzen
                if (minOpt) setSelectToOption(otherSelect, minOpt);
            });
        } finally {
            isProgrammaticUpdate = false;
        }
    }

    /**
     * Card als inaktiv markieren, wenn irgendeine andere Card einen aktuell
     * gewählten Wert hat, der größer als das Maximum dieser Card ist.
     */
    function compareCardValues() {
        const selects = document.querySelectorAll('.tt-pricing-card .document-dropdown select');
        if (selects.length < 2) return;

        const info = [];
        selects.forEach(select => {
            const card = select.closest('.tt-pricing-card');
            const { maxValue } = getMinMax(select);

            const selected = select.options[select.selectedIndex];
            let currentValue = -Infinity;
            if (selected) {
                const val = toNumber(selected.value);
                if (!isNaN(val)) currentValue = val;
            }

            info.push({ card, maxValue, currentValue });
        });

        info.forEach(a => {
            const shouldBeInactive = info.some(b => b.card !== a.card && b.currentValue > a.maxValue);
            if (shouldBeInactive) a.card.classList.add('inactive');
            else a.card.classList.remove('inactive');
        });
    }

    /**
     * Notes global aktualisieren:
     * - Für jedes Select prüfen, ob irgendein anderer aktuell gewählter Wert > dessen Max ist.
     * - Falls ja: Note zeigen (inactive entfernen), sonst: Note ausblenden (inactive hinzufügen).
     * Hinweis: Der Text steht bereits im Markup; wir toggeln nur die Anzeige.
     */
    function updateNotes() {
        const selects = Array.from(document.querySelectorAll('.tt-pricing-card .document-dropdown select'));

        selects.forEach(select => {
            const card = select.closest('.tt-pricing-card');
            if (!card) return;

            const { maxValue } = getMinMax(select);

            // Prüfe alle anderen aktuellen Werte
            const someoneExceeds = selects.some(other => {
                if (other === select) return false;
                const selOpt = other.options[other.selectedIndex];
                const val = selOpt ? toNumber(selOpt.value) : NaN;
                return !isNaN(val) && val > maxValue;
            });

            if (someoneExceeds) {
                showNote(select);
            } else {
                hideNote(select);
            }
        });
    }

    // =======================
    // Hilfsfunktionen Anzeige Note
    // =======================

    function showNote(select) {
        const card = select.closest('.tt-pricing-card');
        if (!card) return;
        const notes = card.querySelectorAll('.tt-select-note');
        notes.forEach(n => n.classList.remove('inactive'));
    }

    function hideNote(select) {
        const card = select.closest('.tt-pricing-card');
        if (!card) return;
        const notes = card.querySelectorAll('.tt-select-note');
        notes.forEach(n => n.classList.add('inactive'));
    }

    // =======================
    // Hilfsfunktionen Werte/Optionen
    // =======================

    function toNumber(val) {
        const n = parseFloat(String(val).replace(/[^\d.-]/g, ''));
        return isNaN(n) ? NaN : n;
    }

    function getNumericOptions(select) {
        return Array.from(select.options)
            .map(opt => ({ opt, value: toNumber(opt.value) }))
            .filter(item => !isNaN(item.value))
            .sort((a, b) => a.value - b.value);
    }

    function getMinMax(select) {
        const items = getNumericOptions(select);
        if (items.length === 0) return { minValue: -Infinity, maxValue: -Infinity };
        return { minValue: items[0].value, maxValue: items[items.length - 1].value };
    }

    function getMinMaxWithRefs(select) {
        const items = getNumericOptions(select);
        if (items.length === 0) return { minValue: -Infinity, maxValue: -Infinity, minOpt: null, maxOpt: null };
        return {
            minValue: items[0].value,
            maxValue: items[items.length - 1].value,
            minOpt: items[0].opt,
            maxOpt: items[items.length - 1].opt
        };
    }

    function hasOptionValue(select, val) {
        const target = toNumber(val);
        return Array.from(select.options).some(opt => toNumber(opt.value) === target);
    }

    function setSelectToValue(select, val) {
        const target = toNumber(val);
        const idx = Array.from(select.options).findIndex(opt => toNumber(opt.value) === target);
        if (idx >= 0) select.selectedIndex = idx;
    }

    function setSelectToOption(select, opt) {
        const idx = Array.from(select.options).indexOf(opt);
        if (idx >= 0) select.selectedIndex = idx;
    }

    // Init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPricingCardsSystem);
    } else {
        initPricingCardsSystem();
    }
})();