document.addEventListener('DOMContentLoaded', function () {
  const bgDarkElements = document.querySelectorAll('.bg-black');
  const headerElement = document.querySelector('.tt-navbar');
  const navStrip = document.querySelector('.tt-navbar-strip');

  if (!headerElement || !navStrip || !bgDarkElements.length) return;

  function getOverlapHeight(a, b) {
    const top = Math.max(a.top, b.top);
    const bottom = Math.min(a.bottom, b.bottom);
    return Math.max(0, bottom - top);
  }

  function checkElementsInViewport() {
    const stripRect = navStrip.getBoundingClientRect();
    const requiredOverlap = stripRect.height / 2;
    let addClass = false;

    bgDarkElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const overlap = getOverlapHeight(stripRect, rect);
      if (overlap >= requiredOverlap) addClass = true;
    });

    headerElement.classList.toggle('dark', addClass);
  }

  let scheduled = false;
  function scheduleCheck() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      checkElementsInViewport();
    });
  }

  checkElementsInViewport();
  window.addEventListener('scroll', scheduleCheck, { passive: true });
  window.addEventListener('resize', scheduleCheck);
});
