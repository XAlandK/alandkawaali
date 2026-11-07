// Smooth opening and closing for the More/Less lists on the home pages.
// Without this script (or when the visitor's system asks for less motion) the lists still
// open and close, just instantly.
(function () {
  'use strict';

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const timing = { duration: 280, easing: 'cubic-bezier(0.2, 0, 0, 1)' };
  const collapsed = { height: '0px', marginTop: '0px', opacity: 0 };

  document.querySelectorAll('.project details').forEach(details => {
    const summary = details.querySelector('summary');
    const list = details.querySelector('ul');
    if (!summary || !list || !list.animate) return;

    let animation = null;

    function play(keyframes, done) {
      const current = list.animate(keyframes, timing);
      animation = current;
      current.finished.then(() => {
        if (animation !== current) return;
        animation = null;
        list.style.overflow = '';
        if (done) done();
      }, () => {
        // Cancelled by another tap; the animation that replaced it takes over.
      });
    }

    summary.addEventListener('click', event => {
      if (reduceMotion.matches) return;
      event.preventDefault();

      const closing = details.open && !details.classList.contains('closing');

      // Start from wherever the list is now, even halfway through the previous animation.
      let start = collapsed;
      if (details.open) {
        const style = getComputedStyle(list);
        start = { height: style.height, marginTop: style.marginTop, opacity: style.opacity };
      }
      if (animation) animation.cancel();
      list.style.overflow = 'hidden';

      if (closing) {
        // "More" shows straight away, while the list is still folding up.
        details.classList.add('closing');
        play([start, collapsed], () => {
          details.open = false;
          details.classList.remove('closing');
        });
      } else {
        details.classList.remove('closing');
        details.open = true;
        const style = getComputedStyle(list);
        play([start, { height: style.height, marginTop: style.marginTop, opacity: 1 }]);
      }
    });
  });
})();
