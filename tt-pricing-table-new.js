// Tiptap Pricing Table System - Mit TabMenu-Synchronisierung
(function() {
    // Hauptinitialisierungsfunktion
    function initPricingTableSystem() {
        
        // Event-Listener für Billing-Period-Änderungen
        document.addEventListener('billingPeriodChanged', function(event) {
            const activePeriod = event.detail.period;
            
            // Preise in der Tabelle aktualisieren
            updatePricingDisplay(activePeriod);
            
            // Auch die Dropdown-Werte aktualisieren
            updateDropdownsForBillingPeriod(activePeriod);
        });

        // Initial mit dem aktuellen Wert aktualisieren
        const initialPeriod = getInitialBillingPeriod();
        updatePricingDisplay(initialPeriod);
        
        // Mobile Dropdown-Auswahl initialisieren
        initPlanDropdowns();

        // Sticky-Header-Anpassung initialisieren
        initStickyHeader();

        // Klick-zu-Kopieren-Funktionalität initialisieren
        initCopyToClipboard();

        // Anker-Offset-Handling initialisieren
        initAnchorOffsetHandling();
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
    
    // Funktion zum Aktualisieren der Dropdown-Werte bei Billing-Period-Änderung
    function updateDropdownsForBillingPeriod(activePeriod) {
        
        // Hole alle Dropdowns
        const dropdowns = document.querySelectorAll('.plan-dropdown[data-plan-selection]');
        if (dropdowns.length === 0) return;
        
        dropdowns.forEach(dropdown => {
            // Finde das aktive Select und die aktive Option
            const select = dropdown.querySelector('.plan-select');
            if (!select) return;
            
            const activeOption = select.options[select.selectedIndex];
            if (!activeOption) return;
            
            // Aktualisiere die Preise basierend auf der aktiven Option und Billing-Periode
            updateDropdownPricesForPeriod(dropdown, activeOption, activePeriod);
        });
    }
    
    function updateDropdownPricesForPeriod(dropdown, activeOption, activePeriod) {
        // Preise aus der Option auslesen
        const priceMonthly = activeOption.getAttribute('data-price-monthly');
        const priceYearly = activeOption.getAttribute('data-price-yearly');
        const priceYearlyTotal = activeOption.getAttribute('data-price-yearly-total');
        
        // Aktuellen Preis basierend auf der Periode bestimmen
        const currentPrice = activePeriod === 'yearly' ? priceYearly : priceMonthly;
        
        // Preis-Element im Dropdown aktualisieren
        const priceElement = dropdown.querySelector(':not(option)[data-price-monthly][data-price-yearly]');
        if (priceElement && currentPrice) {
            priceElement.textContent = currentPrice;
        }
        
        // Jahresgesamtpreis-Element aktualisieren
        const totalElement = dropdown.querySelector(':not(option)[data-price-yearly-total]');
        if (totalElement) {
            if (activePeriod === 'yearly' && priceYearlyTotal) {
                totalElement.textContent = priceYearlyTotal;
                
                // Jahresgesamtpreis-Gruppe anzeigen
                const yearlyTotalGroup = dropdown.querySelector('[data-group="yearly-total"]');
                if (yearlyTotalGroup) {
                    yearlyTotalGroup.classList.remove('inactive');
                }
            } else {
                // Jahresgesamtpreis-Gruppe ausblenden
                const yearlyTotalGroup = dropdown.querySelector('[data-group="yearly-total"]');
                if (yearlyTotalGroup) {
                    yearlyTotalGroup.classList.add('inactive');
                }
            }
        }
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

        // 1. Options inaktiv setzen, wenn sie in der anderen Auswahl aktiv sind
        syncOptionsDisabled(firstSelect, secondActiveOption);
        syncOptionsDisabled(secondSelect, firstActiveOption);

        // 2. Titel und Custom Values aktualisieren
        updateDropdownContent(firstDropdown, firstActiveOption);
        updateDropdownContent(secondDropdown, secondActiveOption);
        
        // 3. Aktive Spalten in der Tabelle setzen
        setActiveCols(firstActiveOption, secondActiveOption);
        
        // 4. Preise entsprechend der aktuellen Billing-Periode aktualisieren
        const currentPeriod = getInitialBillingPeriod();
        updateDropdownPricesForPeriod(firstDropdown, firstActiveOption, currentPeriod);
        updateDropdownPricesForPeriod(secondDropdown, secondActiveOption, currentPeriod);
    }
    
    function updateDropdownContent(dropdown, activeOption) {
        if (!dropdown || !activeOption) return;
        
        // Wir kopieren alle benötigten Werte aus der Option
        const optionData = {
            text: activeOption.textContent,
            customValue: activeOption.getAttribute('data-custom-value'),
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
        
        // 3. Value-Gruppen je nach aktiver Option updaten
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

    // ===== STICKY HEADER ANPASSUNG =====
    function initStickyHeader() {
        // Initial einmal ausführen
        updateStickyOffset();
        
        // Bei Resize erneut ausführen
        window.addEventListener('resize', function() {
            // Debounce-Funktion, um nicht zu viele Updates auszuführen
            clearTimeout(window.resizeTimer);
            window.resizeTimer = setTimeout(function() {
                updateStickyOffset();
            }, 250);
        });
        
        // Bei Orientierungsänderung auf Mobilgeräten
        window.addEventListener('orientationchange', function() {
            // Kurze Verzögerung, um sicherzustellen, dass die Größenänderung abgeschlossen ist
            setTimeout(updateStickyOffset, 100);
        });
        
        // Nach Laden aller Bilder und Ressourcen (kann die Größe beeinflussen)
        window.addEventListener('load', updateStickyOffset);
    }
    
    function updateStickyOffset() {
        const tableHead = document.querySelector('.tt-pricing-table-head');
        const pricingTable = document.querySelector('.tt-pricing-table');
        
        if (tableHead && pricingTable) {
            // Höhe des Headers messen
            const headerHeight = tableHead.offsetHeight;
            
            // CSS-Variable setzen
            pricingTable.style.setProperty('--tt-table-category-sticky-offset', headerHeight + 'px');
        }
    }

    // ===== COPY ANCHOR LINK HANDLING =====
    // Funktion für die Klick-zu-Kopieren-Funktionalität
    function initCopyToClipboard() {
        // Alle Kategorie-Titel mit IDs finden
        document.querySelectorAll('.tt-pricing-category-title[id]').forEach(categoryTitle => {
            // Cursor-Stil anpassen, um zu zeigen, dass es klickbar ist
            categoryTitle.style.cursor = 'pointer';
            
            // Optionaler Tooltip
            categoryTitle.setAttribute('title', 'Click to copy link');
            
            // Klick-Event hinzufügen
            categoryTitle.addEventListener('click', function() {
                // URL mit ID erstellen
                const url = window.location.href.split('#')[0] + '#' + this.id;
                
                // In die Zwischenablage kopieren
                navigator.clipboard.writeText(url).then(() => {
                    console.log('URL kopiert:', url);
                    
                    // Visuelles Feedback hinzufügen
                    showCopiedFeedback(this);
                }).catch(err => {
                    console.error('Fehler beim Kopieren:', err);
                });
            });
        });
    }

    // Funktion für das visuelle Feedback
    function showCopiedFeedback(element) {
        // Klasse für das Feedback hinzufügen
        element.classList.add('tt-copied');
        
        // Nach einer Verzögerung wieder entfernen
        setTimeout(() => {
            element.classList.remove('tt-copied');
        }, 2000); // 2 Sekunden Feedback
    }

    // ===== ANCHOR OFFSET HANDLING =====
    // Funktion für das Handling von Anker-Sprüngen
    function initAnchorOffsetHandling() {
        // Prüfen, ob ein Hash in der URL vorhanden ist
        if (window.location.hash) {
            // Verzögerung für initiales Laden, damit alle Elemente vollständig gerendert sind
            setTimeout(() => {
                adjustScrollPositionForAnchor(window.location.hash);
            }, 300);
        }
        
        // Event-Listener für Änderungen des Hashes (z.B. durch Klicks auf interne Links)
        window.addEventListener('hashchange', function() {
            adjustScrollPositionForAnchor(window.location.hash);
        });
        
        // Für manuelles Neuladen der Seite mit dem gleichen Hash
        // (z.B. wenn der Benutzer Enter in der URL-Leiste drückt)
        window.addEventListener('load', function() {
            if (window.location.hash) {
                setTimeout(() => {
                    adjustScrollPositionForAnchor(window.location.hash);
                }, 300);
            }
        });
    }

    // Funktion zum Anpassen der Scroll-Position für Anker innerhalb der Tabelle
    function adjustScrollPositionForAnchor(hash) {
        if (!hash) return;
        
        // Das Element mit der ID finden
        const targetElement = document.querySelector(hash);
        if (!targetElement) return;
        
        // Prüfen, ob das Element innerhalb der Pricing-Tabelle ist
        const isInPricingTable = targetElement.closest('.tt-pricing-table') !== null;
        if (!isInPricingTable) return;
        
        // Verzögerung, um sicherzustellen, dass der Browser zuerst zum Anker scrollt
        setTimeout(function() {
            // Berechne den gesamten Offset
            const offset = calculateTotalOffset(targetElement);
            
            // Aktuellen Scroll-Position ermitteln
            const currentScrollPos = window.pageYOffset || document.documentElement.scrollTop;
            
            // Zu einer Position scrollen, die den berechneten Offset berücksichtigt
            window.scrollTo({
                top: currentScrollPos - offset,
                behavior: 'smooth'
            });
            
            // Visuelles Feedback für den Anker (optional)
            targetElement.classList.add('tt-anchor-highlight');
            setTimeout(function() {
                targetElement.classList.remove('tt-anchor-highlight');
            }, 2000);
        }, 100);
    }

    // Funktion zur Berechnung des gesamten Offsets
    function calculateTotalOffset(targetElement) {
        let totalOffset = 0;
        
        // 1. Höhe des Table-Head
        const tableHead = document.querySelector('.tt-pricing-table-head');
        if (tableHead) {
            totalOffset += tableHead.offsetHeight;
        }
        
        // 2. Höhe der Kategorie, falls das Ziel ein Kategorie-Titel ist
        // oder sich innerhalb einer Kategorie befindet
        const categoryElement = targetElement.closest('.tt-pricing-category');
        if (categoryElement) {
            const categoryTitle = categoryElement.querySelector('.tt-pricing-category-title');
            if (categoryTitle && categoryTitle !== targetElement) {
                totalOffset += categoryTitle.offsetHeight;
            }
        }
        
        // 3. Zusätzlicher Abstand für bessere Sichtbarkeit
        totalOffset += 20;
        
        console.log('Berechneter Gesamt-Offset:', totalOffset + 'px');
        
        return totalOffset;
    }

    // Funktion zum erneuten Anwenden des Offsets
    // (kann bei Bedarf aufgerufen werden, z.B. nach Größenänderungen)
    function reapplyAnchorOffset() {
        if (window.location.hash) {
            adjustScrollPositionForAnchor(window.location.hash);
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
