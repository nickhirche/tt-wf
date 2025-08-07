// Tiptap Pricing Table System - Minimale Version
(function() {
    // Hauptinitialisierungsfunktion
    function initPricingTableSystem() {
        console.log('Initialisiere minimales Pricing-System');
        
        // Mobile Dropdown-Auswahl initialisieren
        initPlanDropdowns();
    }

    // ===== MOBILE DROPDOWN HEADER =====
    function initPlanDropdowns() {
        document.querySelectorAll('.plan-dropdown .plan-select').forEach(select => {
            console.log('Event-Listener für Select hinzugefügt');
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
        updateTitleAndCustomValue(firstDropdown, firstActiveOption);
        updateTitleAndCustomValue(secondDropdown, secondActiveOption);
        
        // Debug-Ausgaben für Option-Texte NACH der Aktualisierung
        console.log('Option 1 Text NACH Update:', firstActiveOption.textContent);
        console.log('Option 2 Text NACH Update:', secondActiveOption.textContent);
    }
    
    function updateTitleAndCustomValue(dropdown, activeOption) {
        if (!dropdown || !activeOption) return;
        
        // 1. Titel aktualisieren
        const titleElement = dropdown.querySelector('.tt-pricing-plan-title');
        if (titleElement) {
            // WICHTIG: Wir erstellen eine Kopie des Textes, um keine Referenz zu verwenden
            const optionTextCopy = String(activeOption.textContent);
            console.log('Aktualisiere Titel mit Text:', optionTextCopy);
            titleElement.textContent = optionTextCopy;
        }
        
        // 2. Custom Value aktualisieren
        const customValueElement = dropdown.querySelector('[data-custom-value]');
        if (customValueElement && activeOption.hasAttribute('data-custom-value')) {
            const customValue = activeOption.getAttribute('data-custom-value');
            console.log('Aktualisiere Custom Value mit:', customValue);
            customValueElement.textContent = customValue;
        }
    }

    function syncOptionsDisabled(select, activeOtherOption) {
        // Für jede Option im Select
        Array.from(select.options).forEach(option => {
            // Setze disabled, wenn value gleich dem in der anderen Auswahl ist
            option.disabled = (option.value === activeOtherOption.value);
        });
    }

    // ===== INITIALIZATION =====
    // Warten, bis das DOM vollständig geladen ist
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPricingTableSystem);
    } else {
        initPricingTableSystem();
    }
})();
