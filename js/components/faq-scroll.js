document.addEventListener('DOMContentLoaded', function () {
  if (!document.querySelector('.tt-faq')) return;

  const categoriesElement = document.querySelector('.tt-faq-categories');
  let faqOffset;

  function calculateOffset() {
    const isMobile = window.innerWidth <= 991;

    if (categoriesElement) {
      const topStyle = window.getComputedStyle(categoriesElement).top;

      if (topStyle.endsWith('rem')) {
        const remValue = parseFloat(topStyle);
        const baseOffset = remValue * parseFloat(getComputedStyle(document.documentElement).fontSize);
        return isMobile ? 80 : baseOffset;
      }
      const baseOffset = parseInt(topStyle, 10);
      return isMobile ? 80 : baseOffset;
    }

    const baseOffset = 5 * parseFloat(getComputedStyle(document.documentElement).fontSize);
    return isMobile ? 80 : baseOffset;
  }

  faqOffset = calculateOffset();

  const faqViewportThreshold = window.innerHeight * 0.2;
  const faqTabButtons = document.querySelectorAll('.tt-faq-tab-btn');
  const faqAccordionGroups = document.querySelectorAll('.tt-faq-accordion-group');

  function updateActiveButton() {
    faqAccordionGroups.forEach((group, index) => {
      const rect = group.getBoundingClientRect();
      if (rect.top <= faqViewportThreshold && rect.bottom >= faqViewportThreshold) {
        faqTabButtons.forEach((button) => button.classList.remove('is-active'));
        if (faqTabButtons[index]) faqTabButtons[index].classList.add('is-active');
      }
    });
  }

  window.addEventListener('resize', function () {
    faqOffset = calculateOffset();
  });

  faqTabButtons.forEach((button) => {
    const href = button.getAttribute('href');
    if (!href || href.charAt(0) !== '#') return;

    const targetId = href.substring(1);

    button.removeAttribute('href');
    button.setAttribute('data-target', targetId);

    button.addEventListener('click', function () {
      const targetElement = document.getElementById(targetId);
      if (!targetElement) return;

      const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
      const scrollToPosition = targetPosition - faqOffset;

      try {
        window.scrollTo({
          top: scrollToPosition,
          behavior: 'smooth',
        });
      } catch (e) {
        window.scrollTo(0, scrollToPosition);
      }
    });
  });

  if (window.location.hash) {
    window.addEventListener('load', function () {
      const targetId = window.location.hash.substring(1);
      const targetElement = document.getElementById(targetId);

      if (!targetElement) return;

      setTimeout(() => {
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const scrollToPosition = targetPosition - faqOffset;

        try {
          window.scrollTo({
            top: scrollToPosition,
            behavior: 'smooth',
          });
        } catch (e) {
          window.scrollTo(0, scrollToPosition);
        }
      }, 100);
    });
  }

  window.addEventListener('scroll', updateActiveButton);
  updateActiveButton();

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: window.faqData,
  });
  document.head.appendChild(script);
});
