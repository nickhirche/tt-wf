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
        
        // Initial einmal Vergleich durchführen
        compareCardValues();
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
        
        // Nach dem Update der Preise auch den Vergleich aktualisieren
        compareCardValues();
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
     * Initialisiert die Dropdown-Funktionalität:
     * - Setzt Change-Listener auf alle .document-dropdown selects in Cards.
     * - Aktualisiert die Preise in der jeweiligen Card.
     * - Führt nach Änderung einen Vergleich aller Cards durch.
     */
    function initDocumentDropdowns() {
        document.querySelectorAll('.tt-pricing-card .document-dropdown select').forEach(select => {
            select.addEventListener('change', function() {
                // Aktive Periode holen
                const activePeriod = getInitialBillingPeriod();
                // Zugehörige Card finden
                const card = this.closest('.tt-pricing-card');
                if (!card) return;
                // Nur die Preise in dieser Card aktualisieren
                updateCardPrices(card, activePeriod);
                // Vergleich aller Cards durchführen
                compareCardValues();
            });
        });
    }

    /**
     * Vergleicht die numerischen Werte aller Dropdowns und markiert Cards als inaktiv,
     * wenn ihr Wert nicht gleich oder größer als der Wert einer anderen Card ist.
     */
    function compareCardValues() {
        // Alle Cards mit Dropdowns sammeln
        const cardsWithDropdowns = document.querySelectorAll('.tt-pricing-card .document-dropdown');
        if (cardsWithDropdowns.length < 2) return; // Mindestens 2 für Vergleich nötig
        
        // Werte und Cards sammeln
        const cardValues = [];
        cardsWithDropdowns.forEach(dropdownContainer => {
            const card = dropdownContainer.closest('.tt-pricing-card');
            const dropdown = dropdownContainer.querySelector('select');
            if (!card || !dropdown) return;
            
            const selectedOption = dropdown.options[dropdown.selectedIndex];
            if (!selectedOption) return;
            
            // Numerischen Wert aus value extrahieren
            const value = selectedOption.value;
            const numericValue = parseFloat(value) || 0; // Falls value keine Zahl ist, 0 verwenden
            
            cardValues.push({
                card: card,
                value: numericValue
            });
        });
        
        // Für jede Card prüfen, ob es eine andere Card mit gleichem oder größerem Wert gibt
        cardValues.forEach(currentCard => {
            // Wir suchen nach einer anderen Card mit gleichem oder höherem Wert
            const hasEqualOrHigherValue = cardValues.some(otherCard => 
                otherCard.card !== currentCard.card && otherCard.value >= currentCard.value
            );
            
            // Card markieren, wenn keine andere Card mit gleichem oder höherem Wert gefunden wurde
            if (!hasEqualOrHigherValue) {
                currentCard.card.classList.add('inactive');
            } else {
                currentCard.card.classList.remove('inactive');
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