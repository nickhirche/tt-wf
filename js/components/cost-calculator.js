function initCostCalculator() {
  const rangeInput = document.querySelector('input[data-type="calculator-range"]');
  const workloadDiv = document.querySelector('div[data-value-type="workload"]');
  const peopleCostDiv = document.getElementById('editable-value');
  const peopleNumberDiv = document.querySelector('div[data-value-type="people-number"]');
  const maintenanceDiv = document.querySelector('div[data-cost-type="maintenance"]');
  const maintenanceValueDiv = document.querySelector('div[data-cost-value-type="maintenance"]');
  const initialCostDiv = document.querySelector('div[data-cost-value-type="initial"]');
  const mediumLabel = document.querySelector('label[data-range-label="medium"]');
  const complexLabel = document.querySelector('label[data-range-label="complex"]');
  const descriptions = document.querySelectorAll('.range-description');
  const resetButton = document.querySelector('.value-reset');
  const editCustomValue = document.querySelector('.value-edit');

  if (
    !rangeInput ||
    !workloadDiv ||
    !peopleCostDiv ||
    !peopleNumberDiv ||
    !maintenanceDiv ||
    !maintenanceValueDiv ||
    !initialCostDiv ||
    !mediumLabel ||
    !complexLabel ||
    !descriptions.length ||
    !resetButton ||
    !editCustomValue
  ) {
    return;
  }

  const maintenanceHoursDiv = maintenanceDiv.querySelector('.maintenance-hours');
  if (!maintenanceHoursDiv) return;

  let peopleCostOverride = false;

  const values = {
    0: {
      workload: 24,
      peopleCost: 36,
      peopleNumber: 1,
      description: 'simple',
      maintenance: null,
      maintenanceValue: null,
    },
    25: {
      workload: 41,
      peopleCost: 41,
      peopleNumber: 2,
      description: 'simple',
      maintenance: null,
      maintenanceValue: null,
    },
    50: {
      workload: 63,
      peopleCost: 53,
      peopleNumber: 3,
      description: 'medium',
      maintenance: null,
      maintenanceValue: null,
    },
    75: {
      workload: 215,
      peopleCost: 55,
      peopleNumber: 5,
      description: 'medium',
      maintenance: 'active',
      maintenanceValue: 128,
    },
    100: {
      workload: 560,
      peopleCost: 63,
      peopleNumber: 8,
      description: 'complex',
      maintenance: 'active',
      maintenanceValue: 220,
    },
  };

  function formatEditableValue() {
    const sel = window.getSelection();
    const range = sel.getRangeAt(0);
    const preCursorPosition = range.endOffset;

    let value = peopleCostDiv.textContent.replace(/[^\d]/g, '');

    if (value === '') {
      peopleCostDiv.textContent = '';
      return;
    }

    const formattedValue = parseInt(value, 10).toLocaleString('en-US');
    peopleCostDiv.textContent = formattedValue;

    let cursorPosition = preCursorPosition;
    const newCommaCount = (formattedValue.slice(0, cursorPosition).match(/,/g) || []).length;
    const originalCommaCount = (peopleCostDiv.textContent.slice(0, preCursorPosition).match(/,/g) || []).length;

    if (newCommaCount > originalCommaCount) {
      cursorPosition += newCommaCount - originalCommaCount;
    }

    cursorPosition = Math.min(cursorPosition, peopleCostDiv.textContent.length);

    const newRange = document.createRange();
    newRange.setStart(peopleCostDiv.childNodes[0], cursorPosition);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }

  function formatNumber(value) {
    return Math.round(value).toLocaleString('en-US');
  }

  function calculateInitialCost() {
    const workload = parseFloat(workloadDiv.textContent);
    const peopleCost = parseFloat(peopleCostDiv.textContent.replace(/,/g, ''));

    const initialCost = Math.round(workload * peopleCost * 8);
    initialCostDiv.textContent = formatNumber(initialCost);
  }

  function calculateMaintenanceCost(data) {
    const peopleCost = parseFloat(peopleCostDiv.textContent.replace(/,/g, ''));
    const maintenanceValue = data.maintenanceValue;

    if (maintenanceValue) {
      const calculatedMaintenance = Math.round(maintenanceValue * 12 * peopleCost);
      maintenanceValueDiv.textContent = formatNumber(calculatedMaintenance);
      maintenanceHoursDiv.textContent = Math.round(maintenanceValue).toString();
    } else {
      maintenanceValueDiv.textContent = '';
      maintenanceHoursDiv.textContent = '';
    }
  }

  function updateValues() {
    const value = parseInt(rangeInput.value, 10);
    const data = values[value];

    if (!peopleCostOverride) {
      peopleCostDiv.textContent = data.peopleCost.toString();
      peopleCostDiv.setAttribute('data-custom-value', 'false');
    }

    workloadDiv.textContent = data.workload;
    peopleNumberDiv.textContent = data.peopleNumber;

    descriptions.forEach((desc) => {
      if (desc.dataset.descriptionTyp === data.description) {
        desc.classList.add('active');
      } else {
        desc.classList.remove('active');
      }
    });

    if (data.maintenance) {
      maintenanceDiv.classList.add('active');
      calculateMaintenanceCost(data);
    } else {
      maintenanceDiv.classList.remove('active');
      maintenanceValueDiv.textContent = '';
      maintenanceHoursDiv.textContent = '';
    }

    calculateInitialCost();

    if (value >= 50) {
      mediumLabel.classList.add('active');
    } else {
      mediumLabel.classList.remove('active');
    }

    if (value === 100) {
      complexLabel.classList.add('active');
    } else {
      complexLabel.classList.remove('active');
    }

    rangeInput.style.setProperty('--range-value', String(value));
  }

  rangeInput.addEventListener('input', function () {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'cost_calculator',
    });
    updateValues();
  });

  peopleCostDiv.addEventListener('input', function () {
    peopleCostOverride = true;
    peopleCostDiv.setAttribute('data-custom-value', 'true');
    formatEditableValue();
    calculateInitialCost();
    const value = parseInt(rangeInput.value, 10);
    const data = values[value];
    calculateMaintenanceCost(data);
  });

  peopleCostDiv.addEventListener('focus', function () {
    const range = document.createRange();
    range.selectNodeContents(peopleCostDiv);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  });

  editCustomValue.addEventListener('click', function () {
    peopleCostDiv.focus();
  });

  resetButton.addEventListener('click', function () {
    peopleCostOverride = false;
    updateValues();
  });

  rangeInput.value = '0';
  updateValues();

  const contactForm = document.querySelector('form[data-name="Contact form"]');
  const ctaLink = document.querySelector('.tt-calculator-cta a.tt-button');
  const firstNameInput = document.getElementById('firstname');

  if (contactForm && ctaLink && firstNameInput) {
    ctaLink.addEventListener('click', function (event) {
      event.preventDefault();
      firstNameInput.focus();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCostCalculator);
} else {
  initCostCalculator();
}
