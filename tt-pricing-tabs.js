document.addEventListener("DOMContentLoaded", function() {
    // Bei Seitenladung
    updateActiveDataCol();
    updateBillingPeriod();

    // Bei Klick auf ein '.tt-pricing-plan-col.plans'-Element
    let planCols = document.querySelectorAll('.tt-pricing-plan-col.plans');
    planCols.forEach(col => {
        col.addEventListener('click', function() {
            // Entfernen Sie die 'is-active'-Klasse vom aktuellen aktiven Element
            let activeElement = document.querySelector('.tt-pricing-plan-col.plans.is-active');
            if (activeElement) {
                activeElement.classList.remove('is-active');
            }

            // Fügen Sie die 'is-active'-Klasse zum geklickten Element hinzu
            this.classList.add('is-active');

            // Aktualisieren Sie den 'data-col'-Wert
            updateActiveDataCol();
        });
    });

    // Bei Klick auf ein '.tt-billing-tab-btn'-Element
    let billingBtns = document.querySelectorAll('.tt-billing-tab-btn');
    billingBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Nehmen Sie den 'data-billing-period'-Wert
            let billingPeriod = this.getAttribute('data-billing-period');

            // Setzen Sie die 'is-active'-Klasse für alle Elemente mit dem gleichen 'data-billing-period'-Wert
            billingBtns.forEach(otherBtn => {
                if (otherBtn.getAttribute('data-billing-period') === billingPeriod) {
                    otherBtn.classList.add('is-active');
                } else {
                    otherBtn.classList.remove('is-active');
                }
            });

            // Aktualisieren Sie den 'data-billing-period'-Wert
            updateBillingPeriod();
        });
    });

    function updateActiveDataCol() {
        // Finden Sie das aktive Element
        let activeElement = document.querySelector('.tt-pricing-plan-col.plans.is-active');

        // Wenn es ein aktives Element gibt
        if (activeElement) {
            // Nehmen Sie den 'data-col'-Wert
            let activeDataCol = activeElement.getAttribute('data-col');

            // Setzen Sie den 'data-col'-Wert im '.tt-pricing-table'-Element
            let pricingTables = document.querySelectorAll('.tt-pricing-table');
            pricingTables.forEach(pricingTable => {
                pricingTable.setAttribute('data-col', activeDataCol);
            });
        }
    }

    function updateBillingPeriod() {
        // Finden Sie das aktive Element
        let activeElement = document.querySelector('.tt-billing-tab-btn.is-active');

        // Wenn es ein aktives Element gibt
        if (activeElement) {
            // Nehmen Sie den 'data-billing-period'-Wert
            let activeBillingPeriod = activeElement.getAttribute('data-billing-period');

            // Suchen Sie alle '.tt-price-wrap'-Elemente und aktualisieren Sie den 'is-active'-Status
            let priceWraps = document.querySelectorAll('.tt-price-wrap');
            priceWraps.forEach(wrap => {
                if (wrap.getAttribute('data-billing-period') === activeBillingPeriod) {
                    wrap.classList.add('is-active');
                } else {
                    wrap.classList.remove('is-active');
                }
            });
        }
    }
});