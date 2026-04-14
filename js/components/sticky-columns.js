document.addEventListener('DOMContentLoaded', function () {
  function updateStickyElementPosition() {
    const stickyElements = document.querySelectorAll(
      '.tt-col-content.sticky, .tt-client-quote-wrap'
    );

    stickyElements.forEach((el) => {
      const elementHeight = el.offsetHeight;
      const topValue = `calc(50vh - ${elementHeight / 2}px)`;
      el.style.top = topValue;
    });
  }

  function throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
      const now = new Date().getTime();
      if (now - lastCall < delay) {
        return;
      }
      lastCall = now;
      return func(...args);
    };
  }

  updateStickyElementPosition();
  window.addEventListener('resize', throttle(updateStickyElementPosition, 200));
});
