// SCROLL REVEAL
const obs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 65);
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// CASE STUDY EXPAND / COLLAPSE
function toggleCC(btn) {
  var body = btn.nextElementSibling;
  btn.classList.toggle('open');
  body.classList.toggle('open');
  btn.querySelector('.lbl').textContent = btn.classList.contains('open') ? 'Close' : 'Read Case Study';
}

// TEAM CAROUSEL — infinite loop via cloning
(function () {
  const track    = document.getElementById('teamCarousel');
  const dotsWrap = document.getElementById('tcDots');
  if (!track) return;

  // Grab original slides BEFORE we clone
  const origSlides = Array.from(track.querySelectorAll('.tc-slide'));
  const total      = origSlides.length;
  const GAP        = 22; // px — must match CSS gap (1.4rem ≈ 22px)

  // ── Clone head & tail for seamless wrapping ────────────────────────────────
  // We clone ALL slides and prepend/append them so any jump is seamless.
  const clonesBefore = origSlides.map(s => { const c = s.cloneNode(true); c.setAttribute('aria-hidden','true'); return c; });
  const clonesAfter  = origSlides.map(s => { const c = s.cloneNode(true); c.setAttribute('aria-hidden','true'); return c; });
  clonesBefore.reverse().forEach(c => track.insertBefore(c, track.firstChild));
  clonesAfter.forEach(c => track.appendChild(c));

  // After cloning, full slide list = [clone-before×total] [real×total] [clone-after×total]
  const allSlides = Array.from(track.querySelectorAll('.tc-slide'));
  // Real slides start at index = total  (after the clonesBefore set)
  let current    = total; // index into allSlides; points to first real slide
  let locked     = false; // prevent double-firing during transition
  let autoTimer  = null;

  // ── Build dots (one per real slide) ────────────────────────────────────────
  origSlides.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'tc-dot';
    d.setAttribute('aria-label', 'Slide ' + (i + 1));
    d.addEventListener('click', () => {
      stopAuto();
      goTo(total + i, true);
      startAuto();
    });
    dotsWrap.appendChild(d);
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function slideWidth() {
    return allSlides[0].offsetWidth + GAP;
  }

  function getOffset(idx) {
    // Translate so that slide[idx] is centred in the track
    const sw      = slideWidth();
    const trackW  = track.parentElement.offsetWidth - 88; // subtract arrow widths
    const cardW   = allSlides[idx].offsetWidth;
    return -(idx * sw) + (trackW / 2) - (cardW / 2);
  }

  function applyTransform(animate) {
    track.style.transition = animate ? 'transform .55s cubic-bezier(.4,0,.2,1)' : 'none';
    track.style.transform  = 'translateX(' + getOffset(current) + 'px)';
  }

  function applyClasses() {
    allSlides.forEach((s, i) => {
      s.classList.remove('active', 'adjacent');
      if (i === current)              s.classList.add('active');
      else if (Math.abs(i-current)===1) s.classList.add('adjacent');
    });
    // Dot — map current to real index
    const realIdx = (current - total + total * 99) % total;
    dotsWrap.querySelectorAll('.tc-dot').forEach((d, i) => d.classList.toggle('active', i === realIdx));
  }

  function goTo(idx, animate) {
    current = idx;
    applyClasses();
    applyTransform(animate !== false);
  }

  // After a CSS transition ends, silently jump if we're in the clone zone
  track.addEventListener('transitionend', () => {
    locked = false;
    if (current < total) {
      // In the before-clones zone → jump to equivalent real slide
      goTo(current + total, false);
    } else if (current >= total * 2) {
      // In the after-clones zone → jump to equivalent real slide
      goTo(current - total, false);
    }
  });

  // ── Public slide function (used by arrow buttons) ───────────────────────────
  window.teamSlide = function (dir) {
    if (locked) return;
    locked = true;
    stopAuto();
    goTo(current + dir, true);
    startAuto();
  };

  // Clicking a non-active slide navigates to it
  allSlides.forEach((s, i) => {
    s.addEventListener('click', () => {
      if (i === current || locked) return;
      locked = true;
      stopAuto();
      goTo(i, true);
      startAuto();
    });
  });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  window.teamSlide(-1);
    if (e.key === 'ArrowRight') window.teamSlide(1);
  });

  // Touch / swipe
  let touchX = 0;
  track.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) window.teamSlide(dx < 0 ? 1 : -1);
  });

  // Auto-play
  function startAuto() {
    stopAuto();
    autoTimer = setInterval(() => window.teamSlide(1), 4500);
  }
  function stopAuto() {
    clearInterval(autoTimer);
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  // We need layout to be complete before we can compute offsets
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      applyClasses();
      applyTransform(false); // position without animation
      startAuto();
    });
  });

  // Recalculate on resize
  window.addEventListener('resize', () => {
    applyTransform(false);
  });
})();
