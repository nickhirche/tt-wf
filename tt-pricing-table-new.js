// Tiptap Pricing Table System
(function() {
    // Hauptinitialisierungsfunktion
    function initPricingTableSystem() {
        // Nur initialisieren, wenn Pricing-Tabellen vorhanden sind
        const pricingTables = document.querySelectorAll('.tt-pricing-table');
        if (pricingTables.length === 0) return;

        // Event-Listener für Billing-Period-Änderungen
        document.addEventListener('billingPeriodChanged', function(event) {
            const activePeriod = event.detail.period;
            updatePricingDisplay(activePeriod);
            updatePricingColState();
        });

        // Initial mit dem aktuellen Wert aktualisieren
        const initialPeriod = getInitialBillingPeriod();
        updatePricingDisplay(initialPeriod);
        updatePricingColState();

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
        // 1. Preise in der tt-pricing-table-head ersetzen
        document.querySelectorAll('.tt-pricing-table-head [data-price-monthly][data-price-yearly]').forEach(el => {
            const price = (activePeriod === 'yearly')
                ? el.getAttribute('data-price-yearly')
                : el.getAttribute('data-price-monthly');
            if (price !== null) el.textContent = price;
        });

        // 2. Gesamtjahrespreis einsetzen
        document.querySelectorAll('[data-price-yearly-total]').forEach(el => {
            const total = el.getAttribute('data-price-yearly-total');
            if (total !== null) el.textContent = total;
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

    // Sichtbarkeit von Preis oder Custom Value steuern
    function updatePricingColState() {
        // Für alle Columns mit tt-pricing-plan-col
        document.querySelectorAll('.tt-pricing-plan-col').forEach(col => {
            const colType = col.getAttribute('data-value-type');
            const customChild = col.querySelector('[data-value-type="custom"]');
            const numberChild = col.querySelector('[data-value-type="number"]');

            if (colType === 'custom') {
                if (customChild) customChild.classList.remove('inactive');
                if (numberChild) numberChild.classList.add('inactive');
            } else if (colType === 'number') {
                if (customChild) customChild.classList.add('inactive');
                if (numberChild) numberChild.classList.remove('inactive');
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
        // Hole beide Dropdowns
        const dropdowns = document.querySelectorAll('.plan-dropdown[data-plan-selection]');
        if (dropdowns.length !== 2) return; // Nur wenn 2 Auswahlen vorhanden sind

        const [firstDropdown, secondDropdown] = dropdowns;

        // Hole jeweils das select-Element
        const firstSelect = firstDropdown.querySelector('.plan-select');
        const secondSelect = secondDropdown.querySelector('.plan-select');
        
        if (!firstSelect || !secondSelect) return;
        
        // Hole die aktiven Optionen (WICHTIG: Wir verändern diese nicht!)
        const firstActiveOption = firstSelect.options[firstSelect.selectedIndex];
        const secondActiveOption = secondSelect.options[secondSelect.selectedIndex];
        
        if (!firstActiveOption || !secondActiveOption) return;

        // 1. Options inaktiv setzen, wenn sie in der anderen Auswahl aktiv sind
        syncOptionsDisabled(firstSelect, secondActiveOption);
        syncOptionsDisabled(secondSelect, firstActiveOption);

        // 2. Value-Gruppen je nach aktiver Option updaten
        updateValueGroups(firstDropdown, firstActiveOption);
        updateValueGroups(secondDropdown, secondActiveOption);

        // 3. Aktive Spalten in der Tabelle setzen
        setActiveCols(firstActiveOption, secondActiveOption);

        // 4. Setze den Titel innerhalb von plan-dropdown auf den Namen der aktiven Option
        updateDropdownTitles(firstDropdown, firstActiveOption, secondDropdown, secondActiveOption);
        
        // 5. Setze Custom Values
        // updateCustomValues(firstDropdown, firstActiveOption, secondDropdown, secondActiveOption);
    }
    
    // Separate Funktion für das Update der Dropdown-Titel
    function updateDropdownTitles(firstDropdown, firstActiveOption, secondDropdown, secondActiveOption) {
        // Finde die Titel-Elemente
        const firstPlanTitle = firstDropdown.querySelector('.tt-pricing-plan-title');
        const secondPlanTitle = secondDropdown.querySelector('.tt-pricing-plan-title');
        
        // WICHTIG: Wir lesen nur den Text aus der Option, verändern die Option selbst aber NIEMALS
        if (firstPlanTitle && firstActiveOption) {
            // Hier wird nur der Anzeigetext der Option verwendet, die Option selbst bleibt unverändert
            // Wir klonen den Text, um sicherzustellen, dass wir keinen Referenzfehler haben
            const optionText = String(firstActiveOption.textContent);
            firstPlanTitle.textContent = optionText;
        }
        
        if (secondPlanTitle && secondActiveOption) {
            const optionText = String(secondActiveOption.textContent);
            secondPlanTitle.textContent = optionText;
        }
    }
    
    // Separate Funktion für das Update der Custom Values
    function updateCustomValues(firstDropdown, firstActiveOption, secondDropdown, secondActiveOption) {
        // Elemente mit data-custom-value Attribut finden
        const firstCustomEl = firstDropdown.querySelector('[data-custom-value]');
        const secondCustomEl = secondDropdown.querySelector('[data-custom-value]');
        
        // Wenn die aktive Option ein data-custom-value hat, diesen Wert in das Element einsetzen
        if (firstCustomEl && firstActiveOption && firstActiveOption.hasAttribute('data-custom-value')) {
            // Wir setzen den Wert aus data-custom-value als textContent ein
            const customValue = firstActiveOption.getAttribute('data-custom-value');
            firstCustomEl.textContent = customValue;
        }
        
        if (secondCustomEl && secondActiveOption && secondActiveOption.hasAttribute('data-custom-value')) {
            const customValue = secondActiveOption.getAttribute('data-custom-value');
            secondCustomEl.textContent = customValue;
        }
    }

    function syncOptionsDisabled(select, activeOtherOption) {
        // Für jede Option im Select
        Array.from(select.options).forEach(option => {
            // Setze disabled, wenn value gleich dem in der anderen Auswahl ist
            // WICHTIG: Wir ändern nur das disabled-Attribut, nicht den Text!
            option.disabled = (option.value === activeOtherOption.value);
        });
    }

    function updateValueGroups(dropdown, activeOption) {
        // data-value-type der aktiven Option
        const activeType = activeOption.getAttribute('data-value-type');
        const groups = dropdown.querySelectorAll('.pricing-value-group[data-value-type]');
        groups.forEach(group => {
            if (group.getAttribute('data-value-type') === activeType) {
                group.classList.remove('inactive');
                // Preiswerte setzen
                updateGroupPrices(group, activeOption);
            } else {
                group.classList.add('inactive');
            }
        });
    }

    function updateGroupPrices(group, activeOption) {
        // Attribute aus der Option auslesen
        const monthly = activeOption.getAttribute('data-price-monthly');
        const yearly = activeOption.getAttribute('data-price-yearly');
        const yearlyTotal = activeOption.getAttribute('data-price-yearly-total');
        
        // Setze Preise für die Werte innerhalb der Gruppe
        // WICHTIG: Wir verändern nur den textContent der Ziel-Elemente, nicht die Option selbst!
        if (monthly !== null) {
            const monthlyEl = group.querySelector('[data-price-monthly]');
            if (monthlyEl) monthlyEl.textContent = monthly;
        }
        
        if (yearly !== null) {
            const yearlyEl = group.querySelector('[data-price-yearly]');
            if (yearlyEl) yearlyEl.textContent = yearly;
        }
        
        if (yearlyTotal !== null) {
            const totalEl = group.querySelector('[data-price-yearly-total]');
            if (totalEl) totalEl.textContent = yearlyTotal;
        }
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