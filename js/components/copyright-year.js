function setCopyrightYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll('.copyright-year').forEach((el) => {
    el.textContent = year;
  });
}

if (typeof Webflow !== 'undefined' && typeof Webflow.push === 'function') {
  Webflow.push(setCopyrightYear);
} else if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setCopyrightYear);
} else {
  setCopyrightYear();
}
