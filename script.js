/* ===================================================
   Âme & Conscience — JS Pro
   - Thème clair/sombre + realm (paradis/enfer/terre)
   - Nav hamburger + scroll-spy + progress lecture
   - Carrousel accessible (clavier + dots + swipe)
   - Révélations à l’écran (IntersectionObserver)
=================================================== */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const DOM = {
  html: document.documentElement,
  navToggle: $('#navToggle'),
  siteNav: $('#siteNav'),
  themeToggle: $('#themeToggle'),
  realmBtns: $$('.segmented__btn'),
  readingBar: $('#readingProgress'),
  sections: $$('.section'),
  navLinks: $$('#siteNav a'),
  // carousel
  viewport: $('#galleryViewport'),
  slides: $$('#galleryViewport .carousel__slide'),
  prev: $('#prevSlide'),
  next: $('#nextSlide'),
  dots: $$('.carousel__dots .dot'),
  live: $('#live')
};

const PREFS_KEY = 'ac_prefs_v1';
const prefs = loadPrefs();

/* -----------------------------------------------
   INIT
------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initRealm();
  initNav();
  initScrollSpy();
  initReadingProgress();
  initReveal();
  initCarousel();
  console.log('%cÂme & Conscience — prêt', 'color:#8fdcff');
});

/* -----------------------------------------------
   THEME (clair/sombre)
------------------------------------------------ */
function initTheme(){
  // init from user/system
  const systemDark = matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = prefs.theme ?? (systemDark ? 'dark' : 'light');
  setTheme(theme);
  DOM.themeToggle.checked = (theme === 'light');

  DOM.themeToggle.addEventListener('change', () => {
    setTheme(DOM.themeToggle.checked ? 'light' : 'dark');
  });
}
function setTheme(mode){
  DOM.html.setAttribute('data-theme', mode);
  savePrefs({ theme: mode });
}

/* -----------------------------------------------
   REALM (paradis/enfer/terre)
------------------------------------------------ */
function initRealm(){
  const realm = prefs.realm ?? 'enfer';
  setRealm(realm);
  DOM.realmBtns.forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.realm === realm);
    btn.setAttribute('aria-pressed', String(btn.dataset.realm === realm));
    btn.addEventListener('click', () => {
      setRealm(btn.dataset.realm);
      DOM.realmBtns.forEach(b => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      announce(`Palette ${btn.dataset.realm} activée`);
    });
  });
}
function setRealm(realm){
  DOM.html.setAttribute('data-realm', realm);
  savePrefs({ realm });
}

/* -----------------------------------------------
   NAV + HAMBURGER
------------------------------------------------ */
function initNav(){
  DOM.navToggle.addEventListener('click', () => {
    const open = DOM.siteNav.classList.toggle('open');
    DOM.navToggle.setAttribute('aria-expanded', String(open));
  });

  // Smooth scroll + close on click (mobile)
  DOM.navLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const id = a.getAttribute('href');
      const target = $(id);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      DOM.siteNav.classList.remove('open');
      DOM.navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* -----------------------------------------------
   SCROLL SPY
------------------------------------------------ */
function initScrollSpy(){
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = '#' + e.target.id;
        DOM.navLinks.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0.01 });

  DOM.sections.forEach(s => io.observe(s));
}

/* -----------------------------------------------
   READING PROGRESS
------------------------------------------------ */
function initReadingProgress(){
  const onScroll = () => {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const height = doc.scrollHeight - doc.clientHeight;
    const p = Math.max(0, Math.min(1, scrollTop / height));
    DOM.readingBar.style.width = (p * 100) + '%';
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}

/* -----------------------------------------------
   REVEAL ON VIEW
------------------------------------------------ */
function initReveal(){
  const cards = $$('.card');
  cards.forEach(c => c.classList.add('reveal'));
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  cards.forEach(c => io.observe(c));
}

/* -----------------------------------------------
   CAROUSEL (accessible)
------------------------------------------------ */
function initCarousel(){
  const state = { i: 0, total: DOM.slides.length, touch: null, autoplay: null };
  updateCarousel();

  // Prev/Next
  DOM.prev.addEventListener('click', () => { go(-1); });
  DOM.next.addEventListener('click', () => { go(1); });

  // Dots
  DOM.dots.forEach(d => d.addEventListener('click', () => {
    state.i = +d.dataset.index;
    updateCarousel(true);
  }));

  // Keyboard
  DOM.viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });
  // Make viewport focusable
  DOM.viewport.setAttribute('tabindex', '0');

  // Swipe (pointer events)
  DOM.viewport.addEventListener('pointerdown', (e) => { state.touch = { x: e.clientX, y: e.clientY }; });
  DOM.viewport.addEventListener('pointerup', (e) => {
    if (!state.touch) return;
    const dx = e.clientX - state.touch.x;
    if (Math.abs(dx) > 40) go(dx > 0 ? -1 : 1);
    state.touch = null;
  });

  // Autoplay respectful of reduced motion
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    state.autoplay = setInterval(() => go(1), 6000);
    // pause on hover
    const wrap = DOM.viewport.parentElement;
    wrap.addEventListener('mouseenter', () => clearInterval(state.autoplay));
    wrap.addEventListener('mouseleave', () => state.autoplay = setInterval(() => go(1), 6000));
  }

  function go(delta){
    state.i = (state.i + delta + state.total) % state.total;
    updateCarousel(true);
  }

  function updateCarousel(announceChange = false){
    const x = -state.i * 100;
    DOM.viewport.style.transform = `translate3d(${x}%,0,0)`;
    DOM.slides.forEach((s, idx) => {
      const active = idx === state.i;
      s.classList.toggle('is-active', active);
      s.setAttribute('aria-hidden', String(!active));
      if (active) s.setAttribute('tabindex', '0'); else s.setAttribute('tabindex', '-1');
    });
    DOM.dots.forEach((d, idx) => {
      const active = idx === state.i;
      d.classList.toggle('is-active', active);
      d.setAttribute('aria-selected', String(active));
    });
    if (announceChange) announce(`Image ${state.i + 1} sur ${state.total}`);
  }
}

/* -----------------------------------------------
   PREFS
------------------------------------------------ */
function savePrefs(partial){
  const next = { ...(loadPrefs() || {}), ...partial };
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch {}
}
function loadPrefs(){
  try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; }
}

/* -----------------------------------------------
   A11y Live
------------------------------------------------ */
function announce(msg){
  if (!DOM.live) return;
  DOM.live.textContent = msg;
  setTimeout(()=>{ DOM.live.textContent = ''; }, 700);
}
