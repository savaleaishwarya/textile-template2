/* Lucknow Textile Industry — interactions (vanilla JS) */
document.documentElement.classList.add('js');

(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Image fallback: keep the navy placeholder if a photo fails ---------- */
  $$('img').forEach((img) => {
    const mark = () => img.classList.add('is-broken');
    img.addEventListener('error', mark);
    if (img.complete && img.naturalWidth === 0 && img.src) mark();
  });

  /* ---------- Sticky header shadow + back-to-top ---------- */
  const header = $('#header');
  const toTop = $('#toTop');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 10);
    toTop.classList.toggle('show', y > 700);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ---------- Mobile navigation ---------- */
  const burger = $('#burger');
  const nav = $('#nav');
  const setNav = (open) => {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setNav(!nav.classList.contains('open')));
  $$('a', nav).forEach((a) => a.addEventListener('click', () => setNav(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false); });
  window.matchMedia('(min-width: 981px)').addEventListener('change', () => setNav(false));

  /* ---------- Smooth scrolling (CSS handles it; this closes menus and sets focus) ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) { e.preventDefault(); return; }
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', id);
    });
  });

  /* ---------- Active nav link while scrolling ---------- */
  const sections = $$('main > section[id], footer[id]');
  const navLinks = $$('a', nav);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = '#' + entry.target.id;
      navLinks.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));

  /* ---------- Scroll reveal ---------- */
  const revealEls = $$('.reveal, .reveal-left, .reveal-right');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('in'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---------- Count-up numbers ---------- */
  const counters = $$('[data-count]');
  const countIO = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const end = Number(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      obs.unobserve(el);
      if (reduceMotion) { el.textContent = end + suffix; return; }
      const dur = 1400;
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => countIO.observe(c));

  /* ---------- Gallery filter ---------- */
  const tabs = $$('.tab');
  const items = $$('.g-item');
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.toggle('active', t === tab));
    const f = tab.dataset.filter;
    items.forEach((it) => {
      const show = f === 'all' || it.dataset.cat === f;
      it.classList.toggle('hide', !show);
      if (show) { it.classList.remove('pop'); void it.offsetWidth; it.classList.add('pop'); }
    });
  }));

  /* ---------- Testimonials slider ---------- */
  const track = $('#tTrack');
  const cards = $$('.t-card', track);
  let tIndex = 0;
  const perView = () => (window.innerWidth <= 640 ? 1 : window.innerWidth <= 980 ? 2 : 3);
  const slide = () => {
    const max = Math.max(0, cards.length - perView());
    tIndex = Math.min(Math.max(tIndex, 0), max);
    const step = cards[0].getBoundingClientRect().width + 16;
    track.style.transform = `translateX(${-tIndex * step}px)`;
  };
  $('#tNext').addEventListener('click', () => {
    const max = cards.length - perView();
    tIndex = tIndex >= max ? 0 : tIndex + 1;
    slide();
  });
  $('#tPrev').addEventListener('click', () => {
    const max = cards.length - perView();
    tIndex = tIndex <= 0 ? max : tIndex - 1;
    slide();
  });
  window.addEventListener('resize', slide);

  // swipe support
  let startX = null;
  track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) { tIndex += dx < 0 ? 1 : -1; slide(); }
    startX = null;
  });

  /* ---------- FAQ: one open at a time ---------- */
  const qas = $$('.qa');
  qas.forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) qas.forEach((o) => { if (o !== d) o.open = false; });
  }));

  /* ---------- Bulk enquiry modal ---------- */
  const modal = $('#enquiry');
  const form = $('#enquiryForm');
  const ok = $('#enquiryOk');
  $$('[data-open-enquiry]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    ok.hidden = true;
    if (typeof modal.showModal === 'function') modal.showModal();
    else document.getElementById('contact').scrollIntoView();
  }));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
  form.addEventListener('submit', (e) => {
    if (e.submitter && e.submitter.value === 'cancel') return;
    e.preventDefault();
    // TODO: connect to your backend, Formspree, or WhatsApp API here.
    ok.hidden = false;
    form.reset();
    setTimeout(() => modal.close(), 1800);
  });
})();
