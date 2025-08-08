// Tiptap Pricing Cards System
(function() {
    // Hauptinitialisierungsfunktion
    function initPricingCardsSystem() {
        // Event-Listener für Billing-Period-Änderungen
        document.addEventListener('billingPeriodChanged', function(event) {
            const activePeriod = event.detail.period;
            updatePricingCardsDisplay(activePeriod);
        });

        // Initialisierung mit dem aktuellen Wert
        const initialPeriod = getInitialBillingPeriod();
        updatePricingCardsDisplay(initialPeriod);

        // Dropdown-Änderungen überwachen
        initDocumentDropdowns();
    }

    // Ermittelt die aktuelle Abrechnungsperiode
    function getInitialBillingPeriod() {
        const activeButton = document.querySelector('.tt-billing-tab-btn.active, .tt-billing-tab-btn.is-active');
        if (activeButton) {
            return activeButton.getAttribute('data-billing-period');
        }
        return 'monthly'; // Default
    }

    // Aktualisiert die Anzeige der Pricing Cards basierend auf der aktiven Abrechnungsperiode
    function updatePricingCardsDisplay(activePeriod) {
        // Alle Pricing Cards durchgehen
        document.querySelectorAll('.tt-pricing-card').forEach(card => {
            // Preise aktualisieren
            updateCardPrices(card, activePeriod);
            
            // Sichtbarkeit der periodenspezifischen Elemente aktualisieren
            updatePeriodVisibility(card, activePeriod);
        });
    }

    // Aktualisiert die Preise in einer Pricing Card
    function updateCardPrices(card, activePeriod) {
        // Preis-Element finden
        const priceElement = card.querySelector('.price-value');
        if (!priceElement) return;

        // Dropdown finden, falls vorhanden
        const dropdown = card.querySelector('.document-dropdown select');
        
        if (dropdown) {
            // Wenn ein Dropdown vorhanden ist, den Preis aus der ausgewählten Option nehmen
            const selectedOption = dropdown.options[dropdown.selectedIndex];
            if (selectedOption) {
                const price = activePeriod === 'yearly' 
                    ? selectedOption.getAttribute('data-price-yearly')
                    : selectedOption.getAttribute('data-price-monthly');
                
                if (price) {
                    priceElement.textContent = price;
                }

                // Jahresgesamtpreis aktualisieren, falls vorhanden
                const yearlyTotalElement = card.querySelector('.price-value-yearly');
                if (yearlyTotalElement && activePeriod === 'yearly') {
                    const yearlyTotal = selectedOption.getAttribute('data-price-yearly-total');
                    if (yearlyTotal) {
                        yearlyTotalElement.textContent = yearlyTotal;
                    }
                }
            }
        } else {
            // Wenn kein Dropdown vorhanden ist, direkt die Attribute des Preis-Elements verwenden
            const priceMonthly = priceElement.getAttribute('data-price-monthly');
            const priceYearly = priceElement.getAttribute('data-price-yearly');
            
            if (priceMonthly && priceYearly) {
                priceElement.textContent = activePeriod === 'yearly' ? priceYearly : priceMonthly;
            }
            
            // Jahresgesamtpreis aktualisieren, falls vorhanden
            const yearlyTotalElement = card.querySelector('.price-value-yearly');
            if (yearlyTotalElement && activePeriod === 'yearly') {
                const yearlyTotal = yearlyTotalElement.getAttribute('data-price-yearly-total');
                if (yearlyTotal) {
                    yearlyTotalElement.textContent = yearlyTotal;
                }
            }
        }
    }

    // Aktualisiert die Sichtbarkeit der periodenspezifischen Elemente
    function updatePeriodVisibility(card, activePeriod) {
        // Monatliche Elemente
        card.querySelectorAll('[data-subscription-period="monthly"]').forEach(el => {
            if (activePeriod === 'monthly') {
                el.classList.remove('inactive');
            } else {
                el.classList.add('inactive');
            }
        });

        // Jährliche Elemente
        card.querySelectorAll('[data-subscription-period="yearly"]').forEach(el => {
            if (activePeriod === 'yearly') {
                el.classList.remove('inactive');
            } else {
                el.classList.add('inactive');
            }
        });
    }

    // Initialisiert die Dropdown-Funktionalität für Dokument-Vergleiche
    function initDocumentDropdowns() {
        // Alle Dropdowns finden
        document.querySelectorAll('.tt-pricing-card .document-dropdown select').forEach(select => {
            // Change-Event-Listener hinzufügen
            select.addEventListener('change', function() {
                // Aktuelle Abrechnungsperiode ermitteln
                const activePeriod = getInitialBillingPeriod();
                
                // Die zugehörige Card finden
                const card = this.closest('.tt-pricing-card');
                if (!card) return;
                
                // Preise in der Card aktualisieren
                updateCardPrices(card, activePeriod);
                
                // Wenn diese Card zum Vergleich markiert ist, alle anderen Vergleichs-Cards aktualisieren
                if (card.querySelector('.document-dropdown') || card.hasAttribute('data-document-comparison')) {
                    syncComparisonCards(card);
                }
            });
        });
    }

    // Synchronisiert alle Vergleichs-Cards
    function syncComparisonCards(changedCard) {
        // Alle Cards mit Dropdown oder data-document-comparison Attribut finden
        const comparisonCards = document.querySelectorAll('.tt-pricing-card .document-dropdown, .tt-pricing-card[data-document-comparison="true"]');
        
        // Wenn es weniger als 2 Cards gibt, nichts tun
        if (comparisonCards.length < 2) return;
        
        // Die geänderte Card identifizieren
        const changedDropdown = changedCard.querySelector('.document-dropdown select');
        if (!changedDropdown) return;
        
        // Den ausgewählten Wert aus der geänderten Card holen
        const selectedValue = changedDropdown.value;
        
        // Alle anderen Vergleichs-Cards aktualisieren
        comparisonCards.forEach(comparisonElement => {
            // Die zugehörige Card finden
            const card = comparisonElement.closest('.tt-pricing-card');
            if (!card || card === changedCard) return;
            
            // Das Dropdown in dieser Card finden
            const dropdown = card.querySelector('.document-dropdown select');
            if (!dropdown) return;
            
            // Den gleichen Wert auswählen wie in der geänderten Card
            if (dropdown.value !== selectedValue) {
                // Prüfen, ob die Option existiert
                const optionExists = Array.from(dropdown.options).some(option => option.value === selectedValue);
                
                if (optionExists) {
                    dropdown.value = selectedValue;
                    
                    // Ein Change-Event auslösen, um die Preise zu aktualisieren
                    const event = new Event('change');
                    dropdown.dispatchEvent(event);
                }
            }
        });
    }

    // ===== INITIALIZATION =====
    // Warten, bis das DOM vollständig geladen ist
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPricingCardsSystem);
    } else {
        initPricingCardsSystem();
    }
})();
