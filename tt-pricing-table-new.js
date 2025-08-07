// Tiptap Pricing Table System - Erweiterte Version
(function() {
    // Hauptinitialisierungsfunktion
    function initPricingTableSystem() {
        console.log('Initialisiere erweitertes Pricing-System');
        
        // Event-Listener für Billing-Period-Änderungen
        document.addEventListener('billingPeriodChanged', function(event) {
            const activePeriod = event.detail.period;
            console.log('Event billingPeriodChanged empfangen:', activePeriod);
            updatePricingDisplay(activePeriod);
        });

        // Initial mit dem aktuellen Wert aktualisieren
        const initialPeriod = getInitialBillingPeriod();
        updatePricingDisplay(initialPeriod);
        
        // Mobile Dropdown-Auswahl initialisieren
        initPlanDropdowns();
    }

    function getInitialBillingPeriod() {
        // Versuche den Wert vom aktiven Tab-Button zu bekommen
        const activeButton = document.querySelector('.tt-billing-tab-btn.active');
        if (activeButton) {
            return activeButton.getAttribute('data-billing-period');
        }
        return 'monthly'; // Default
    }
    
    // --------- PRICE DISPLAY FUNCTIONS ---------
    function updatePricingDisplay(activePeriod) {
        console.log('Aktualisiere Preisanzeige für Periode:', activePeriod);
        
        // 1. Preise in der tt-pricing-table-head ersetzen
        document.querySelectorAll('[data-price-monthly][data-price-yearly]').forEach(el => {
            const price = (activePeriod === 'yearly')
                ? el.getAttribute('data-price-yearly')
                : el.getAttribute('data-price-monthly');
            if (price !== null) {
                console.log('Setze Preis für Element:', el, 'auf', price);
                el.textContent = price;
            }
        });

        // 2. Gesamtjahrespreis einsetzen
        document.querySelectorAll('[data-price-yearly-total]').forEach(el => {
            const total = el.getAttribute('data-price-yearly-total');
            if (total !== null) {
                console.log('Setze Jahresgesamtpreis für Element:', el, 'auf', total);
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
            console.log('Event-Listener für Select hinzugefügt:', select);
            select.addEventListener('change', updatePlanDropdowns);
        });
        
        // Initialer Sync beim Laden
        updatePlanDropdowns();
    }

    function updatePlanDropdowns() {
        console.log('updatePlanDropdowns wurde aufgerufen');
        
        // Hole beide Dropdowns
        const dropdowns = document.querySelectorAll('.plan-dropdown[data-plan-selection]');
        if (dropdowns.length !== 2) {
            console.log('Nicht genau 2 Dropdowns gefunden, Abbruch');
            return;
        }

        const [firstDropdown, secondDropdown] = dropdowns;

        // Hole jeweils das select-Element
        const firstSelect = firstDropdown.querySelector('.plan-select');
        const secondSelect = secondDropdown.querySelector('.plan-select');
        
        if (!firstSelect || !secondSelect) {
            console.log('Fehlendes Select-Element, Abbruch');
            return;
        }
        
        // Hole die aktiven Optionen
        const firstActiveOption = firstSelect.options[firstSelect.selectedIndex];
        const secondActiveOption = secondSelect.options[secondSelect.selectedIndex];
        
        if (!firstActiveOption || !secondActiveOption) {
            console.log('Fehlende aktive Option, Abbruch');
            return;
        }
        
        // Debug-Ausgaben für Option-Texte VOR der Aktualisierung
        console.log('Option 1 Text VOR Update:', firstActiveOption.textContent);
        console.log('Option 2 Text VOR Update:', secondActiveOption.textContent);

        // 1. Options inaktiv setzen, wenn sie in der anderen Auswahl aktiv sind
        syncOptionsDisabled(firstSelect, secondActiveOption);
        syncOptionsDisabled(secondSelect, firstActiveOption);

        // 2. Titel und Custom Values aktualisieren
        safeUpdateDropdown(firstDropdown, firstActiveOption);
        safeUpdateDropdown(secondDropdown, secondActiveOption);
        
        // 3. Aktive Spalten in der Tabelle setzen
        setActiveCols(firstActiveOption, secondActiveOption);
        
        // Debug-Ausgaben für Option-Texte NACH der Aktualisierung
        console.log('Option 1 Text NACH Update:', firstActiveOption.textContent);
        console.log('Option 2 Text NACH Update:', secondActiveOption.textContent);
    }
    
    function safeUpdateDropdown(dropdown, activeOption) {
        if (!dropdown || !activeOption) return;
        
        // Wir erstellen eine lokale Kopie aller benötigten Werte aus der Option
        // So vermeiden wir, dass wir versehentlich die Option selbst ändern
        const optionData = {
            text: String(activeOption.textContent),
            customValue: activeOption.hasAttribute('data-custom-value') ? 
                         activeOption.getAttribute('data-custom-value') : null,
            priceMonthly: activeOption.getAttribute('data-price-monthly'),
            priceYearly: activeOption.getAttribute('data-price-yearly'),
            priceYearlyTotal: activeOption.getAttribute('data-price-yearly-total'),
            valueType: activeOption.getAttribute('data-value-type')
        };
        
        console.log('Gesammelte Daten aus Option:', optionData);
        
        // 1. Titel aktualisieren
        const titleElement = dropdown.querySelector('.tt-pricing-plan-title');
        if (titleElement) {
            console.log('Aktualisiere Titel mit Text:', optionData.text);
            titleElement.textContent = optionData.text;
        }
        
        // 2. Custom Value aktualisieren
        const customValueElement = dropdown.querySelector('[data-custom-value]');
        if (customValueElement && optionData.customValue) {
            console.log('Aktualisiere Custom Value mit:', optionData.customValue);
            customValueElement.textContent = optionData.customValue;
        }
        
        // 3. Preise aktualisieren
        updatePricesInDropdown(dropdown, optionData);
        
        // 4. Value-Gruppen je nach aktiver Option updaten
        updateValueGroups(dropdown, optionData);
    }
    
    function updatePricesInDropdown(dropdown, optionData) {
        // Monatspreis
        if (optionData.priceMonthly) {
            const monthlyEl = dropdown.querySelector('[data-price-monthly]');
            if (monthlyEl) {
                console.log('Setze Monatspreis:', optionData.priceMonthly);
                monthlyEl.textContent = optionData.priceMonthly;
            }
        }
        
        // Jahrespreis
        if (optionData.priceYearly) {
            const yearlyEl = dropdown.querySelector('[data-price-yearly]');
            if (yearlyEl) {
                console.log('Setze Jahrespreis:', optionData.priceYearly);
                yearlyEl.textContent = optionData.priceYearly;
            }
        }
        
        // Jahresgesamtpreis
        if (optionData.priceYearlyTotal) {
            const totalEl = dropdown.querySelector('[data-price-yearly-total]');
            if (totalEl) {
                console.log('Setze Jahresgesamtpreis:', optionData.priceYearlyTotal);
                totalEl.textContent = optionData.priceYearlyTotal;
            }
        }
    }
    
    function updateValueGroups(dropdown, optionData) {
        // data-value-type der aktiven Option
        const activeType = optionData.valueType;
        if (!activeType) return;
        
        console.log('Aktualisiere Value-Gruppen für Typ:', activeType);
        
        const groups = dropdown.querySelectorAll('.pricing-value-group[data-value-type]');
        groups.forEach(group => {
            if (group.getAttribute('data-value-type') === activeType) {
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
            // WICHTIG: Wir ändern nur das disabled-Attribut, nicht den Text!
            option.disabled = (option.value === activeOtherOption.value);
        });
    }

    function setActiveCols(firstActiveOption, secondActiveOption) {
        const table = document.querySelector('.tt-pricing-table');
        if (!table) return;
        
        const col1 = firstActiveOption.getAttribute('data-col');
        const col2 = secondActiveOption.getAttribute('data-col');
        
        if (col1) {
            console.log('Setze aktive Spalte 1:', col1);
            table.setAttribute('data-active-col-first', col1);
        }
        
        if (col2) {
            console.log('Setze aktive Spalte 2:', col2);
            table.setAttribute('data-active-col-second', col2);
        }
    }

    // ===== INITIALIZATION =====
    // Warten, bis das DOM vollständig geladen ist
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPricingTableSystem);
    } else {
        initPricingTableSystem();
    }
})();
