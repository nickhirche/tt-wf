// Tiptap Billing Tab System
(function() {
    // Hauptinitialisierungsfunktion
    function initBillingTabSystem() {
        // Nur initialisieren, wenn Billing-Tab-Menüs vorhanden sind
        const billingTabMenus = document.querySelectorAll('.tt-billing-tab-menu');
        if (billingTabMenus.length === 0) return;

        // Tab-System initialisieren
        initTabMenus(billingTabMenus);
        
        // Initial den aktiven Abrechnungszeitraum ermitteln
        const initialPeriod = getActiveBillingPeriod();
        
        // Gleich am Anfang Event auslösen
        triggerBillingPeriodChanged(initialPeriod);
    }

    // ===== TAB MENU MODULE =====
    function initTabMenus(billingTabMenus) {
        billingTabMenus.forEach(menu => {
            const buttons = menu.querySelectorAll('.tt-billing-tab-btn');
            buttons.forEach(button => {
                button.addEventListener('click', function() {
                    const activePeriod = this.getAttribute('data-billing-period');
                    
                    // Alle Tab-Menüs aktualisieren
                    updateTabMenus(activePeriod);
                    
                    // Event auslösen für andere Komponenten
                    triggerBillingPeriodChanged(activePeriod);
                });
            });
        });
    }

    function updateTabMenus(activePeriod) {
        document.querySelectorAll('.tt-billing-tab-menu .tt-billing-tab-btn').forEach(button => {
            if (button.getAttribute('data-billing-period') === activePeriod) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    function getActiveBillingPeriod() {
        const activeButton = document.querySelector('.tt-billing-tab-btn.active');
        if (activeButton) {
            return activeButton.getAttribute('data-billing-period');
        }
        return 'monthly'; // Default to monthly if no active button found
    }

    // ===== EVENT SYSTEM =====
    function triggerBillingPeriodChanged(activePeriod) {
        // Erstelle ein benutzerdefiniertes Event, das andere Scripts abfangen können
        const event = new CustomEvent('billingPeriodChanged', {
            detail: { period: activePeriod }
        });
        document.dispatchEvent(event);
    }

    // ===== INITIALIZATION =====
    // Warten, bis das DOM vollständig geladen ist
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBillingTabSystem);
    } else {
        initBillingTabSystem();
    }
})();