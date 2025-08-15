// Tiptap Pricing Cards System
(function() {
    // Guard gegen Endlosschleifen durch programmgesteuerte Änderungen
    let isProgrammaticUpdate = false;

    function initPricingCardsSystem() {
        // Reagiere auf Periodenwechsel (TabMenu)
        document.addEventListener('billingPeriodChanged', function(event) {
            const activePeriod = event.detail.period;
            updatePricingCardsDisplay(activePeriod);
        });

        const initialPeriod = getInitialBillingPeriod();
        updatePricingCardsDisplay(initialPeriod);

        // Dropdown-Änderungen
        initDocumentDropdowns();

        // Initiale Inaktivitätsprüfung
        compareCardValues();
    }

    function getInitialBillingPeriod() {
        const btn = document.querySelector('.tt-billing-tab-btn.active, .tt-billing-tab-btn.is-active');
        return btn ? btn.getAttribute('data-billing-period') : 'monthly';
    }

    function updatePricingCardsDisplay(activePeriod) {
        document.querySelectorAll('.tt-pricing-card').forEach(card => {
            updateCardPrices(card, activePeriod);
            updatePeriodVisibility(card, activePeriod);
        });
        compareCardValues();
    }

    // Preise je Card aktualisieren (basierend auf Select und Periode)
    function updateCardPrices(card, activePeriod) {
        const priceEl = card.querySelector('.price-value');
        if (!priceEl) return;

        const select = card.querySelector('.document-dropdown select');

        if (select) {
            // Wenn ein valider Wert gewählt ist, Preis setzen
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

    // Periodensichtbarkeit unabhängig vom Card-Status
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

    function initDocumentDropdowns() {
        document.querySelectorAll('.tt-pricing-card .document-dropdown select').forEach(select => {
            select.addEventListener('change', function() {
                if (isProgrammaticUpdate) return;

                const activePeriod = getInitialBillingPeriod();
                const card = this.closest('.tt-pricing-card');
                if (!card) return;

                // Eigene Card-Preise updaten
                updateCardPrices(card, activePeriod);

                // Cross-Card-Regeln anwenden (ohne Sperren, nur setzen + Hinweis)
                applyCrossCardRules(this);

                // Inaktivitäts-Status aktualisieren
                compareCardValues();

                // Alle Card-Preise updaten (falls andere Selects geändert wurden)
                document.querySelectorAll('.tt-pricing-card').forEach(c => {
                    updateCardPrices(c, activePeriod);
                });
            });
        });
    }

    /**
     * Cross-Card-Regeln:
     * - Wenn selectedValue > max(other) → other = max(other) + Hinweistext anzeigen
     * - Else wenn selectedValue >= min(other) und Wert existiert → other = selectedValue
     * - Else → other = min(other)
     */
    function applyCrossCardRules(changedSelect) {
        const changedCard = changedSelect.closest('.tt-pricing-card');
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

                // 1) Größer als Max → setze auf Max + Hinweis
                if (selectedValue > maxValue && maxOpt) {
                    setSelectToOption(otherSelect, maxOpt);
                    setInfoNote(otherSelect, makeMaxNote(selectedValue, maxValue));
                    return;
                }

                // Für alle anderen Fälle: Hinweise entfernen
                clearInfoNote(otherSelect);

                // 2) Wert existiert in anderer Card und >= Min → auf diesen Wert setzen
                if (selectedValue >= minValue && hasOptionValue(otherSelect, selectedValue)) {
                    setSelectToValue(otherSelect, selectedValue);
                    return;
                }

                // 3) Sonst → Minimum setzen
                if (minOpt) setSelectToOption(otherSelect, minOpt);
            });
        } finally {
            isProgrammaticUpdate = false;
        }
    }

    /**
     * Markiert Cards als inaktiv, wenn irgendeine andere Card einen aktuell
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

    // =======================
    // Hinweis-Mechanik (Note)
    // =======================

    // Erstellt einen Hinweistext wie gewünscht, z. B.:
    // "Max limit from 100,000 cloud documents reached. Set to 50,000."
    function makeMaxNote(requiredValue, setToMaxValue) {
        const required = formatNumber(requiredValue);
        const maxv = formatNumber(setToMaxValue);
        return `Max limit from ${required} cloud documents reached. Set to ${maxv}.`;
    }

    // Hinweis an/bei einer .document-dropdown anzeigen (keine Blockade, nur Info)
    function setInfoNote(select, text) {
        const dd = select.closest('.document-dropdown');
        if (!dd) return;
        let note = dd.querySelector('.tt-select-note');
        if (!note) {
            note = document.createElement('div');
            note.className = 'tt-select-note';
            dd.appendChild(note);
        }
        note.textContent = text;
    }

    // Hinweis entfernen
    function clearInfoNote(select) {
        const dd = select.closest('.document-dropdown');
        if (!dd) return;
        const note = dd.querySelector('.tt-select-note');
        if (note) note.remove();
    }

    // =======================
    // Hilfsfunktionen (Values)
    // =======================

    function toNumber(val) {
        const n = parseFloat(String(val).replace(/[^\d.-]/g, ''));
        return isNaN(n) ? NaN : n;
    }

    function formatNumber(n) {
        try {
            return new Intl.NumberFormat('en-US').format(n);
        } catch {
            // Fallback simple
            return (n + '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
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
        return { minValue: items[0].value, maxValue: items[items.length - 1].value, minOpt: items[0].opt, maxOpt: items[items.length - 1].opt };
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