// Tiptap Pricing Cards System
(function() {
    // Reentrancy-Guard, um Endlosschleifen bei programmgesteuerten Änderungen zu vermeiden
    let isProgrammaticUpdate = false;

    /**
     * Initialisiert das Pricing Cards System.
     */
    function initPricingCardsSystem() {
        // Auf Periodenwechsel reagieren (TabMenu)
        document.addEventListener('billingPeriodChanged', function(event) {
            const activePeriod = event.detail.period;
            updatePricingCardsDisplay(activePeriod);
        });

        // Initiale Anzeige
        const initialPeriod = getInitialBillingPeriod();
        updatePricingCardsDisplay(initialPeriod);

        // Dropdown-Änderungen überwachen
        initDocumentDropdowns();

        // Initiale Vergleichslogik (inactive-Status)
        compareCardValues();
    }

    /**
     * Ermittelt die aktuelle Abrechnungsperiode (monthly/yearly).
     */
    function getInitialBillingPeriod() {
        const activeButton = document.querySelector('.tt-billing-tab-btn.active, .tt-billing-tab-btn.is-active');
        if (activeButton) {
            return activeButton.getAttribute('data-billing-period');
        }
        return 'monthly';
    }

    /**
     * Aktualisiert alle Cards auf Basis der Periodenwahl.
     */
    function updatePricingCardsDisplay(activePeriod) {
        document.querySelectorAll('.tt-pricing-card').forEach(card => {
            updateCardPrices(card, activePeriod);
            updatePeriodVisibility(card, activePeriod);
        });
        // inactive-Status nach Preisupdates erneut evaluieren
        compareCardValues();
    }

    /**
     * Aktualisiert Preise in einer Card basierend auf der aktiven Periode
     * und dem aktuell ausgewählten Dropdown-Wert (falls vorhanden).
     */
    function updateCardPrices(card, activePeriod) {
        const priceElement = card.querySelector('.price-value');
        if (!priceElement) return;

        const dropdown = card.querySelector('.document-dropdown select');

        if (dropdown && dropdown.selectedIndex >= 0) {
            const selectedOption = dropdown.options[dropdown.selectedIndex];
            if (selectedOption && !isPlaceholderOption(selectedOption)) {
                const price = activePeriod === 'yearly'
                    ? selectedOption.getAttribute('data-price-yearly')
                    : selectedOption.getAttribute('data-price-monthly');

                if (price) {
                    priceElement.textContent = price;
                }

                const yearlyTotalElement = card.querySelector('.price-value-yearly');
                if (yearlyTotalElement && activePeriod === 'yearly') {
                    const yearlyTotal = selectedOption.getAttribute('data-price-yearly-total');
                    if (yearlyTotal) {
                        yearlyTotalElement.textContent = yearlyTotal;
                    }
                }
            } else {
                // Kein valider select (z. B. Placeholder) -> Preis ggf. leeren/neutral lassen
                // Optional: priceElement.textContent = '';
            }
        } else {
            // Kein Dropdown: Fallback auf data-Attribute am Preis-Element
            const priceMonthly = priceElement.getAttribute('data-price-monthly');
            const priceYearly = priceElement.getAttribute('data-price-yearly');

            if (priceMonthly && priceYearly) {
                priceElement.textContent = activePeriod === 'yearly' ? priceYearly : priceMonthly;
            }

            const yearlyTotalElement = card.querySelector('.price-value-yearly');
            if (yearlyTotalElement && activePeriod === 'yearly') {
                const yearlyTotal = yearlyTotalElement.getAttribute('data-price-yearly-total');
                if (yearlyTotal) {
                    yearlyTotalElement.textContent = yearlyTotal;
                }
            }
        }
    }

    /**
     * Steuert die Sichtbarkeit periodenspezifischer Elemente.
     * Unabhängig vom inactive-Status der gesamten Card.
     */
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

    /**
     * Change-Listener für alle Dropdowns setzen.
     * Führt die Cross-Card-Regeln aus und aktualisiert anschließend die Preise und Inaktivität.
     */
    function initDocumentDropdowns() {
        document.querySelectorAll('.tt-pricing-card .document-dropdown select').forEach(select => {
            select.addEventListener('change', function() {
                if (isProgrammaticUpdate) return; // Programmatische Updates ignorieren

                const activePeriod = getInitialBillingPeriod();
                const card = this.closest('.tt-pricing-card');
                if (!card) return;

                // Eigene Card-Preise updaten
                updateCardPrices(card, activePeriod);

                // Regeln auf andere Dropdowns anwenden
                applyCrossCardRules(this);

                // inactive-Status evaluieren
                compareCardValues();

                // Nach allen Anpassungen auch die Preise der anderen Cards aktualisieren
                // (weil sich deren Auswahl eventuell geändert hat)
                document.querySelectorAll('.tt-pricing-card').forEach(c => {
                    updateCardPrices(c, activePeriod);
                });
            });
        });
    }

    /**
     * Cross-Card-Regeln:
     * - Wenn selectedValue > max(other) -> other: keine Auswahl + dynamischer Placeholder
     * - Else wenn selectedValue >= min(other) und Wert existiert in other -> other = selectedValue
     * - Else -> other = min(other)
     */
    function applyCrossCardRules(changedSelect) {
        const changedCard = changedSelect.closest('.tt-pricing-card');
        const changedOption = changedSelect.options[changedSelect.selectedIndex];
        if (!changedOption || isPlaceholderOption(changedOption)) return;

        const selectedValue = toNumber(changedSelect.value);
        if (isNaN(selectedValue)) return;

        const allSelects = Array.from(document.querySelectorAll('.tt-pricing-card .document-dropdown select'));

        // Placeholder-Text: Optionstext des geänderten Dropdowns (z. B. "100000 Team")
        const placeholderText = getOptionLabel(changedOption, changedCard);

        isProgrammaticUpdate = true;
        try {
            allSelects.forEach(otherSelect => {
                if (otherSelect === changedSelect) return;

                const { minValue, maxValue } = getMinMax(otherSelect);
                const otherCard = otherSelect.closest('.tt-pricing-card');

                // 1) Größer als Max -> Placeholder in anderer Card
                if (selectedValue > maxValue) {
                    setPlaceholderSelection(otherSelect, placeholderText);
                    return;
                }

                // 2) Gleich/über Min und Option vorhanden -> auf diesen Wert setzen
                if (selectedValue >= minValue && hasOptionValue(otherSelect, selectedValue)) {
                    clearPlaceholderIfAny(otherSelect);
                    setSelectToValue(otherSelect, selectedValue);
                    return;
                }

                // 3) Sonst -> auf Minimum setzen
                clearPlaceholderIfAny(otherSelect);
                setSelectToMin(otherSelect);
            });
        } finally {
            isProgrammaticUpdate = false;
        }
    }

    /**
     * Markiert Cards als inaktiv, wenn deren maximaler Wert
     * kleiner ist als der aktuell ausgewählte Wert einer anderen Card.
     */
    function compareCardValues() {
        const cardsWithDropdowns = document.querySelectorAll('.tt-pricing-card .document-dropdown select');
        if (cardsWithDropdowns.length < 2) return;

        // Aktuelle Auswahlwerte und Maxima je Card
        const info = [];
        cardsWithDropdowns.forEach(select => {
            const card = select.closest('.tt-pricing-card');
            const { maxValue } = getMinMax(select);

            const selected = select.options[select.selectedIndex];
            let currentValue = -Infinity; // Falls Placeholder/keine Auswahl, kleiner als alles
            if (selected && !isPlaceholderOption(selected)) {
                currentValue = toNumber(selected.value);
            }

            info.push({ card, select, maxValue, currentValue });
        });

        // Für jede Card prüfen, ob irgendeine andere Card einen Wert > max dieser Card hat
        info.forEach(a => {
            const shouldBeInactive = info.some(b => b.card !== a.card && b.currentValue > a.maxValue);
            if (shouldBeInactive) a.card.classList.add('inactive');
            else a.card.classList.remove('inactive');
        });
    }

    // =======================
    // Hilfsfunktionen
    // =======================

    function toNumber(val) {
        const n = parseFloat(String(val).replace(/[^\d.-]/g, ''));
        return isNaN(n) ? NaN : n;
    }

    function getNumericOptions(select) {
        return Array.from(select.options)
            .filter(opt => !isPlaceholderOption(opt))
            .map(opt => ({ opt, value: toNumber(opt.value) }))
            .filter(item => !isNaN(item.value))
            .sort((a, b) => a.value - b.value);
    }

    function getMinMax(select) {
        const items = getNumericOptions(select);
        if (items.length === 0) return { minValue: -Infinity, maxValue: -Infinity };
        return { minValue: items[0].value, maxValue: items[items.length - 1].value };
    }

    function hasOptionValue(select, val) {
        const target = toNumber(val);
        return Array.from(select.options).some(opt => !isPlaceholderOption(opt) && toNumber(opt.value) === target);
    }

    function setSelectToValue(select, val) {
        const target = toNumber(val);
        const idx = Array.from(select.options).findIndex(opt => !isPlaceholderOption(opt) && toNumber(opt.value) === target);
        if (idx >= 0) {
            select.selectedIndex = idx;
        }
    }

    function setSelectToMin(select) {
        const items = getNumericOptions(select);
        if (items.length > 0) {
            const firstIndex = Array.from(select.options).indexOf(items[0].opt);
            if (firstIndex >= 0) select.selectedIndex = firstIndex;
        }
    }

    function isPlaceholderOption(option) {
        return option && option.hasAttribute && option.hasAttribute('data-tt-placeholder');
    }

    function setPlaceholderSelection(select, text) {
        // Prüfen, ob bereits ein Placeholder existiert
        let placeholder = Array.from(select.options).find(opt => isPlaceholderOption(opt));

        if (!placeholder) {
            // Neuen Placeholder-Optionseintrag an den Anfang setzen
            placeholder = document.createElement('option');
            placeholder.setAttribute('data-tt-placeholder', 'true');
            placeholder.value = '';
            placeholder.disabled = true;
            // hidden weglassen, damit Text sichtbar ist
            select.insertBefore(placeholder, select.firstChild);
        }

        // Placeholder-Text setzen (z. B. der Labeltext des blockierenden Plans)
        placeholder.textContent = text || 'Nicht verfügbar';

        // Placeholder als ausgewählt setzen
        select.selectedIndex = Array.from(select.options).indexOf(placeholder);
    }

    function clearPlaceholderIfAny(select) {
        const placeholder = Array.from(select.options).find(opt => isPlaceholderOption(opt));
        if (placeholder) {
            // Placeholder nicht zwingend löschen, aber falls er gerade ausgewählt ist,
            // sorgen wir dafür, dass anschließend ein echter Wert gesetzt wird.
            // Optional: placeholder entfernen, um die Liste sauber zu halten:
            select.removeChild(placeholder);
        }
    }

    function getOptionLabel(option, cardEl) {
        // Basis: Optionstext
        const optionText = option.textContent?.trim() || '';
        // Optional: Card-spezifischen Titel ergänzen (falls vorhanden)
        const cardTitleEl = cardEl ? cardEl.querySelector('.tt-pricing-plan-title') : null;
        const cardTitle = cardTitleEl ? cardTitleEl.textContent.trim() : '';

        // Wenn ein Card-Titel existiert, kombinieren wir beides
        return cardTitle ? `${optionText} – ${cardTitle}` : optionText || 'Nicht verfügbar';
    }

    // Initialisierung
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPricingCardsSystem);
    } else {
        initPricingCardsSystem();
    }
})();