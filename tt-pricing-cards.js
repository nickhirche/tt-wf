// Tiptap Pricing Cards System
(function() {
    /**
     * Initialisiert das Pricing Cards System.
     * - Setzt Event-Listener auf das billingPeriodChanged Event.
     * - Initialisiert die Anzeige nach aktuellem Tab-Status.
     * - Setzt Listener auf alle Dropdowns innerhalb der Pricing Cards.
     */
    function initPricingCardsSystem() {
        // Reaktion auf Wechsel der Abrechnungsperiode (z.B. TabMenu)
        document.addEventListener('billingPeriodChanged', function(event) {
            const activePeriod = event.detail.period;
            updatePricingCardsDisplay(activePeriod);
        });

        // Initiale Anzeige (z.B. bei Page Load)
        const initialPeriod = getInitialBillingPeriod();
        updatePricingCardsDisplay(initialPeriod);

        // Event-Listener für alle Dropdowns in Cards setzen
        initDocumentDropdowns();
    }

    /**
     * Liest die aktuell ausgewählte Billing Periode aus den Tabs.
     * Fällt auf 'monthly' zurück, falls kein aktiver Tab gefunden.
     */
    function getInitialBillingPeriod() {
        const activeButton = document.querySelector('.tt-billing-tab-btn.active, .tt-billing-tab-btn.is-active');
        if (activeButton) {
            return activeButton.getAttribute('data-billing-period');
        }
        return 'monthly'; // Default-Fallback
    }

    /**
     * Aktualisiert alle Pricing Cards für die gewählte Abrechnungsperiode.
     * - Preise und Features werden entsprechend angepasst.
     * - Periodenspezifische Bereiche werden ein-/ausgeblendet.
     */
    function updatePricingCardsDisplay(activePeriod) {
        document.querySelectorAll('.tt-pricing-card').forEach(card => {
            updateCardPrices(card, activePeriod);
            updatePeriodVisibility(card, activePeriod);
        });
    }

    /**
     * Aktualisiert die Preisanzeige einer einzelnen Pricing Card.
     * - Holt den Wert aus dem aktiven Dropdown (falls vorhanden).
     * - Setzt die Preise im .price-value Element.
     * - Aktualisiert ggf. den Jahresgesamtpreis.
     */
    function updateCardPrices(card, activePeriod) {
        // Hauptpreis-Element
        const priceElement = card.querySelector('.price-value');
        if (!priceElement) return;

        // Dropdown innerhalb der Card suchen
        const dropdown = card.querySelector('.document-dropdown select');
        
        if (dropdown) {
            // Preis aus ausgewählter Option im Dropdown holen
            const selectedOption = dropdown.options[dropdown.selectedIndex];
            if (selectedOption) {
                const price = activePeriod === 'yearly' 
                    ? selectedOption.getAttribute('data-price-yearly')
                    : selectedOption.getAttribute('data-price-monthly');
                
                if (price) {
                    priceElement.textContent = price;
                }

                // Jahresgesamtpreis nur für 'yearly'-Period setzen
                const yearlyTotalElement = card.querySelector('.price-value-yearly');
                if (yearlyTotalElement && activePeriod === 'yearly') {
                    const yearlyTotal = selectedOption.getAttribute('data-price-yearly-total');
                    if (yearlyTotal) {
                        yearlyTotalElement.textContent = yearlyTotal;
                    }
                }
            }
        } else {
            // Ohne Dropdown: Preis aus data-Attributen des Preis-Elements
            const priceMonthly = priceElement.getAttribute('data-price-monthly');
            const priceYearly = priceElement.getAttribute('data-price-yearly');
            
            if (priceMonthly && priceYearly) {
                priceElement.textContent = activePeriod === 'yearly' ? priceYearly : priceMonthly;
            }
            
            // Jahresgesamtpreis nur für 'yearly'-Period setzen
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
     * Zeigt/Versteckt periodenspezifische Bereiche innerhalb der Card.
     * - Elemente mit data-subscription-period='monthly' bzw. 'yearly'
     *   bekommen 'inactive' je nach Auswahl.
     */
    function updatePeriodVisibility(card, activePeriod) {
        // Monatlich-Bereiche
        card.querySelectorAll('[data-subscription-period="monthly"]').forEach(el => {
            if (activePeriod === 'monthly') {
                el.classList.remove('inactive');
            } else {
                el.classList.add('inactive');
            }
        });

        // Jährlich-Bereiche
        card.querySelectorAll('[data-subscription-period="yearly"]').forEach(el => {
            if (activePeriod === 'yearly') {
                el.classList.remove('inactive');
            } else {
                el.classList.add('inactive');
            }
        });
    }

    /**
     * Initialisiert die Dropdown-Vergleichslogik:
     * - Setzt Change-Listener auf alle .document-dropdown selects in Cards.
     * - Synchronisiert beim Wechsel alle anderen Vergleichs-Cards auf den gleichen Wert.
     */
    function initDocumentDropdowns() {
        document.querySelectorAll('.tt-pricing-card .document-dropdown select').forEach(select => {
            select.addEventListener('change', function() {
                // Aktive Periode holen
                const activePeriod = getInitialBillingPeriod();
                // Zugehörige Card finden
                const card = this.closest('.tt-pricing-card');
                if (!card) return;
                // Preise aktualisieren
                updateCardPrices(card, activePeriod);
                // Vergleichssynchronisation auslösen
                syncComparisonCards(card);
            });
        });
    }

    /**
     * Synchronisiert alle Cards, die ein Dropdown besitzen:
     * - Sucht alle .tt-pricing-card .document-dropdown selects.
     * - Setzt in allen (außer der geänderten Card) den gleichen Wert wie im geänderten Dropdown.
     */
    function syncComparisonCards(changedCard) {
        // Alle Dropdown-Selects in Cards finden
        const comparisonDropdowns = document.querySelectorAll('.tt-pricing-card .document-dropdown select');
        if (comparisonDropdowns.length < 2) return; // Mindestens zwei für Vergleich nötig

        // Geändertes Dropdown holen
        const changedDropdown = changedCard.querySelector('.document-dropdown select');
        if (!changedDropdown) return;
        const selectedValue = changedDropdown.value;

        // Restliche Dropdowns synchronisieren
        comparisonDropdowns.forEach(dropdown => {
            const card = dropdown.closest('.tt-pricing-card');
            if (!card || card === changedCard) return;

            // Nur synchronisieren, wenn Option existiert und Wert unterschiedlich
            if (dropdown.value !== selectedValue) {
                const optionExists = Array.from(dropdown.options).some(option => option.value === selectedValue);
                if (optionExists) {
                    dropdown.value = selectedValue;
                    dropdown.dispatchEvent(new Event('change'));
                }
            }
        });
    }

    // Initialisierung nach DOM-Load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPricingCardsSystem);
    } else {
        initPricingCardsSystem();
    }
})();
