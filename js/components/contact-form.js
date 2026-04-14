document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('div[name="Form Block"] form[name="Form"]');
    const submitButton = document.getElementById('submit-button');
    const freeDomains = [];
    let isSubmitting = false; // Lock mechanism

    // Hubspot turnstile
    turnstile.ready(function () {
        turnstile.render('#turnstile-container', {
            sitekey: '0x4AAAAAAAixPXTb4W3Kgcf2',
            theme: 'light',
            language: 'en',
            appearance: 'interaction-only',
            callback: function(token) {
                submitButton.removeAttribute("disabled");
            },
        });
    }); 
    
    // No Workemails
    function parseCSV(csv) {
        const lines = csv.split('\n');
        lines.forEach(line => {
            const domain = line.trim();
            if (domain) {
                freeDomains.push(domain);
            }
        });
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function isFreeDomain(email) {
        const domain = email.split('@')[1];
        return freeDomains.includes(domain);
    }

    function onSuccess() {
        const contactContainer = document.querySelector('.tt-contact-container');
        const contactSuccess = document.querySelector('.tt-contact-success');
        const successPlaceholder = contactSuccess.querySelector('.success-placeholder');

        contactContainer.style.display = 'none';
        contactSuccess.style.display = 'block';

        const firstName = form.querySelector('input[name="firstname"]').value;
        successPlaceholder.textContent = firstName;
    }

    function updateFormData(formData) {
        for (const [name, value] of formData.entries()) {
            switch (name) {
                case 'hutk':
                    const cookies = document.cookie.split(';');
                    const cookieMap = {};
                    cookies.forEach(cookie => {
                        const [name, value] = cookie.trim().split('=');
                        cookieMap[name] = value;
                    });
                    const hubspotCookie = cookieMap.hubspotutk;
                    if (hubspotCookie) {
                        formData.set(name, hubspotCookie);
                    }
                    break;
                case 'pageUri':
                    formData.set(name, window.location.href);
                    break;
                case 'pageName':
                    formData.set(name, document.title);
                    break;
                case 'pageId':
                    formData.set(name, window.location.pathname);
                    break;
                default:
                    break;
            }
        }
        return formData;
    }

    fetch('https://f.hubspotusercontent40.net/hubfs/2832391/Marketing/Lead-Capture/free-domains-2.csv')
        .then(response => response.text())
        .then(data => parseCSV(data));

    if (form) {
        form.setAttribute('novalidate', true);

        form.addEventListener('submit', async event => {
            event.preventDefault();
            event.stopImmediatePropagation();

            if (isSubmitting) { return; }
            isSubmitting = true;

            let isValid = true;
            let firstInvalidField = null;
            const requiredFields = form.querySelectorAll('.field-wrap[data-required="true"]');

            requiredFields.forEach(fieldWrap => {
                if (!fieldWrap.hasAttribute('data-message')) {
                    fieldWrap.setAttribute('data-message', 'Fill in this field.');
                }

                const inputs = fieldWrap.querySelectorAll('input, textarea, select');
                let fieldIsValid = true;

                inputs.forEach(input => {
                    if (input.type === 'checkbox') {
                        const checkboxes = fieldWrap.querySelectorAll('input[type="checkbox"]');
                        const isChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
                        if (!isChecked) {
                            fieldIsValid = false;
                        }
                    } else if (input.type === 'radio') {
                        const radios = fieldWrap.querySelectorAll('input[type="radio"]');
                        const isRadioChecked = Array.from(radios).some(radio => radio.checked);
                        if (!isRadioChecked) {
                            fieldIsValid = false;
                        }
                    } else if (input.tagName === 'SELECT') {
                        if (!input.value) {
                            fieldIsValid = false;
                        }
                    } else if (input.type === 'email') {
                        if (!validateEmail(input.value)) {
                            fieldIsValid = false;
                            fieldWrap.setAttribute('data-error', 'true');
                        } else if (isFreeDomain(input.value)) {
                            fieldWrap.setAttribute('data-no-company-mail', 'true');
                            fieldIsValid = false;
                        } else {
                            fieldWrap.setAttribute('data-no-company-mail', 'false');
                        }
                    } else if (!input.value.trim()) {
                        fieldIsValid = false;
                    }
                });

                if (fieldIsValid) {
                    fieldWrap.setAttribute('data-error', 'false');
                } else {
                    fieldWrap.setAttribute('data-error', 'true');
                    if (!firstInvalidField) {
                        firstInvalidField = fieldWrap.querySelector('input, textarea, select');
                    }
                    isValid = false;
                }
            });

            if (!isValid && firstInvalidField) {
                firstInvalidField.focus();
                isSubmitting = false;
                return;
            }

            if (isValid) {
                try {
                    const formData = new FormData(form);
                    updateFormData(formData);

                    const response = await fetch(form.action, {
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        method: form.method,
                        body: formData,
                    });

                    if (response.ok) {
                        onSuccess();
                    }
                } catch (error) {
                    // Error handling if necessary
                } finally {
                    isSubmitting = false;
                }
            } else {
                isSubmitting = false;
            }
        });

        form.addEventListener('input', event => {
            const fieldWrap = event.target.closest('.field-wrap[data-required="true"]');

            if (fieldWrap) {
                if (!fieldWrap.hasAttribute('data-message')) {
                    fieldWrap.setAttribute('data-message', 'Fill in this field.');
                }

                const inputs = fieldWrap.querySelectorAll('input, textarea, select');
                let fieldIsValid = true;

                inputs.forEach(input => {
                    if (input.type === 'checkbox') {
                        const checkboxes = fieldWrap.querySelectorAll('input[type="checkbox"]');
                        const isChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
                        if (!isChecked) {
                            fieldIsValid = false;
                        }
                    } else if (input.type === 'radio') {
                        const radios = fieldWrap.querySelectorAll('input[type="radio"]');
                        const isRadioChecked = Array.from(radios).some(radio => radio.checked);
                        if (!isRadioChecked) {
                            fieldIsValid = false;
                        }
                    } else if (input.tagName === 'SELECT') {
                        if (!input.value) {
                            fieldIsValid = false;
                        }
                    } else if (input.type === 'email') {
                        if (!validateEmail(input.value)) {
                            fieldIsValid = false;
                            fieldWrap.setAttribute('data-error', 'true');
                        } else if (isFreeDomain(input.value)) {
                            fieldWrap.setAttribute('data-no-company-mail', 'true');
                            fieldIsValid = false;
                        } else {
                            fieldWrap.setAttribute('data-no-company-mail', 'false');
                        }
                    } else if (!input.value.trim()) {
                        fieldIsValid = false;
                    }
                });

                if (fieldIsValid) {
                    fieldWrap.setAttribute('data-error', 'false');
                } else {
                    fieldWrap.setAttribute('data-error', 'true');
                }
            }
        });
    }
});

