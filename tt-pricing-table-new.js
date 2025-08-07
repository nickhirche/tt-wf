// Tiptap Pricing Table System - Vereinfachte Version mit :not(option)
(function() {
    // Hauptinitialisierungsfunktion
    function initPricingTableSystem() {
        console.log('Initialisiere vereinfachtes Pricing-System');
        
        // Event-Listener für Billing-Period-Änderungen
        document.addEventListener('billingPeriodChanged', function(event) {
            const activePeriod = event.detail.period;
            updatePricingDisplay(activePeriod);
        });

        // Initial mit dem aktuellen Wert aktualisieren
        const initialPeriod = getInitialBillingPeriod();
        updatePricingDisplay(initialPeriod);
        
        // Mobile Dropdown-Auswahl initialisieren
        initPlanDropdowns();
    }

    function getInitialBillingPeriod() {
        const activeButton = document.querySelector('.tt-billing-tab-btn.active');
        if (activeButton) {
            return activeButton.getAttribute('data-billing-period');
        }
        return 'monthly'; // Default
    }
    
    // --------- PRICE DISPLAY FUNCTIONS ---------
    function updatePricingDisplay(activePeriod) {
        console.log('Aktualisiere Preisanzeige für Periode:', activePeriod);
        
        // WICHTIG: Wir schließen option-Elemente explizit aus!
        // 1. Preise ersetzen
        document.querySelectorAll(':not(option)[data-price-monthly][data-price-yearly]').forEach(el => {
            const price = (activePeriod === 'yearly')
                ? el.getAttribute('data-price-yearly')
                : el.getAttribute('data-price-monthly');
            if (price !== null) {
                el.textContent = price;
            }
        });

        // 2. Gesamtjahrespreis einsetzen
        document.querySelectorAll(':not(option)[data-price-yearly-total]').forEach(el => {
            const total = el.getAttribute('data-price-yearly-total');
            if (total !== null) {
                el.textContent = total;
            }
        });

        // 3. Sichtbarkeit der "Jahresgesamtpreis"-Gruppe steuern
        document.querySelectorAll('[data-group="yearly-total"]').forEach(groupEl => {
            if (activePeriod === 'yearly') {
                groupEl.classList.remove('inactive');
            } else {
                groupEl.classList.add('inactive');
            }
        });
    }

    // ===== MOBILE DROPDOWN HEADER =====
    function initPlanDropdowns() {
        document.querySelectorAll('.plan-dropdown .plan-select').forEach(select => {
            select.addEventListener('change', updatePlanDropdowns);
        });
        
        // Initialer Sync beim Laden
        updatePlanDropdowns();
    }

    function updatePlanDropdowns() {
        console.log('updatePlanDropdowns wurde aufgerufen');
        
        // Hole beide Dropdowns
        const dropdowns = document.querySelectorAll('.plan-dropdown[data-plan-selection]');
        if (dropdowns.length !== 2) return;

        const [firstDropdown, secondDropdown] = dropdowns;

        // Hole jeweils das select-Element
        const firstSelect = firstDropdown.querySelector('.plan-select');
        const secondSelect = secondDropdown.querySelector('.plan-select');
        
        if (!firstSelect || !secondSelect) return;
        
        // Hole die aktiven Optionen
        const firstActiveOption = firstSelect.options[firstSelect.selectedIndex];
        const secondActiveOption = secondSelect.options[secondSelect.selectedIndex];
        
        if (!firstActiveOption || !secondActiveOption) return;
        
        // Debug-Ausgaben für Option-Texte
        console.log('Option 1:', firstActiveOption.value, 'Text:', firstActiveOption.textContent);
        console.log('Option 2:', secondActiveOption.value, 'Text:', secondActiveOption.textContent);

        // 1. Options inaktiv setzen, wenn sie in der anderen Auswahl aktiv sind
        syncOptionsDisabled(firstSelect, secondActiveOption);
        syncOptionsDisabled(secondSelect, firstActiveOption);

        // 2. Titel und Custom Values aktualisieren
        updateDropdownContent(firstDropdown, firstActiveOption);
        updateDropdownContent(secondDropdown, secondActiveOption);
        
        // 3. Aktive Spalten in der Tabelle setzen
        setActiveCols(firstActiveOption, secondActiveOption);
        
        // Debug-Ausgaben nach der Aktualisierung
        console.log('Nach Update - Option 1:', firstActiveOption.textContent);
        console.log('Nach Update - Option 2:', secondActiveOption.textContent);
    }
    
    function updateDropdownContent(dropdown, activeOption) {
        if (!dropdown || !activeOption) return;
        
        // Wir kopieren alle benötigten Werte aus der Option
        const optionData = {
            text: activeOption.textContent,
            customValue: activeOption.getAttribute('data-custom-value'),
            priceMonthly: activeOption.getAttribute('data-price-monthly'),
            priceYearly: activeOption.getAttribute('data-price-yearly'),
            priceYearlyTotal: activeOption.getAttribute('data-price-yearly-total'),
            valueType: activeOption.getAttribute('data-value-type')
        };
        
        // 1. Titel aktualisieren
        const titleElement = dropdown.querySelector('.tt-pricing-plan-title');
        if (titleElement) {
            titleElement.textContent = optionData.text;
        }
        
        // 2. Custom Value aktualisieren - WICHTIG: :not(option) Selektor!
        const customValueElement = dropdown.querySelector(':not(option)[data-custom-value]');
        if (customValueElement && optionData.customValue) {
            customValueElement.textContent = optionData.customValue;
        }
        
        // 3. Preise aktualisieren - WICHTIG: :not(option) Selektor!
        if (optionData.priceMonthly) {
            const monthlyEl = dropdown.querySelector(':not(option)[data-price-monthly]');
            if (monthlyEl) monthlyEl.textContent = optionData.priceMonthly;
        }
        
        if (optionData.priceYearly) {
            const yearlyEl = dropdown.querySelector(':not(option)[data-price-yearly]');
            if (yearlyEl) yearlyEl.textContent = optionData.priceYearly;
        }
        
        if (optionData.priceYearlyTotal) {
            const totalEl = dropdown.querySelector(':not(option)[data-price-yearly-total]');
            if (totalEl) totalEl.textContent = optionData.priceYearlyTotal;
        }
        
        // 4. Value-Gruppen je nach aktiver Option updaten
        updateValueGroups(dropdown, optionData.valueType);
    }
    
    function updateValueGroups(dropdown, valueType) {
        if (!valueType) return;
        
        const groups = dropdown.querySelectorAll('.pricing-value-group[data-value-type]');
        groups.forEach(group => {
            if (group.getAttribute('data-value-type') === valueType) {
                group.classList.remove('inactive');
            } else {
                group.classList.add('inactive');
            }
        });
    }

    function syncOptionsDisabled(select, activeOtherOption) {
        // Für jede Option im Select
        Array.from(select.options).forEach(option => {
            // Setze disabled, wenn value gleich dem in der anderen Auswahl ist
            option.disabled = (option.value === activeOtherOption.value);
        });
    }

    function setActiveCols(firstActiveOption, secondActiveOption) {
        const table = document.querySelector('.tt-pricing-table');
        if (!table) return;
        
        const col1 = firstActiveOption.getAttribute('data-col');
        const col2 = secondActiveOption.getAttribute('data-col');
        
        if (col1) table.setAttribute('data-active-col-first', col1);
        if (col2) table.setAttribute('data-active-col-second', col2);
    }

    // ===== INITIALIZATION =====
    // Warten, bis das DOM vollständig geladen ist
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPricingTableSystem);
    } else {
        initPricingTableSystem();
    }
})();
