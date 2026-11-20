import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CUTS, FADES } from './content.js';
import { createWork3D, hasWebGL } from './work3d.js';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
if (reduced) root.classList.add('reduced');

/* ---------- Build gallery + fades from content ---------- */
const grid = document.getElementById('grid');
CUTS.forEach((cut, i) => {
  const li = document.createElement('li');
  li.innerHTML = `
    <button class="tile" type="button" data-open="${i}" aria-label="Open ${cut.style}">
      <img src="${cut.src}" alt="${cut.alt}" loading="lazy" width="564" height="754" />
      <span class="tile__label">${cut.style}</span>
    </button>`;
  grid.appendChild(li);
});

const fadeList = document.getElementById('fade-list');
FADES.forEach((f) => {
  const ex = CUTS[f.example];
  const li = document.createElement('li');
  li.className = 'fade-card';
  li.innerHTML = `
    <div class="fade-bar" style="--s:${f.start};--e:${f.end}" aria-hidden="true"><span class="fade-bar__clipper"></span></div>
    <div class="fade-card__body">
      <h3>${f.name}</h3>
      <p>${f.note}</p>
      <button class="fade-card__ex" type="button" data-open="${f.example}">
        <img src="${ex.src}" alt="" width="36" height="36" loading="lazy" /> See Kyle's ${f.name.toLowerCase()}
      </button>
    </div>`;
  fadeList.appendChild(li);
});

/* ---------- Lightbox ---------- */
const lb = document.querySelector('.lightbox');
const lbImg = lb.querySelector('img');
const lbCap = lb.querySelector('figcaption');
let lbIndex = 0;
function showCut(i) {
  lbIndex = (i + CUTS.length) % CUTS.length;
  const c = CUTS[lbIndex];
  lbImg.src = c.src;
  lbImg.alt = c.alt;
  lbCap.textContent = `${c.style} · ${String(lbIndex + 1).padStart(2, '0')} / ${CUTS.length}`;
}
function openCut(i) {
  showCut(i);
  if (!lb.open) lb.showModal();
  lenis?.stop();
}
lb.addEventListener('close', () => lenis?.start());
lb.querySelector('.lightbox__close').addEventListener('click', () => lb.close());
lb.querySelector('.lightbox__prev').addEventListener('click', () => showCut(lbIndex - 1));
lb.querySelector('.lightbox__next').addEventListener('click', () => showCut(lbIndex + 1));
lb.addEventListener('click', (e) => e.target === lb && lb.close());
lb.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') showCut(lbIndex - 1);
  if (e.key === 'ArrowRight') showCut(lbIndex + 1);
});
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-open]');
  if (t) openCut(Number(t.dataset.open));
});

/* ---------- Smooth scroll ---------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) {
        e.preventDefault();
        lenis.scrollTo(id, { offset: id === '#work' ? 0 : -70 });
      }
    })
  );
}

/* ---------- Nav ---------- */
const nav = document.querySelector('.nav');
let lastY = 0;
function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle('is-solid', y > 40);
  nav.classList.toggle('is-hidden', y > lastY && y > window.innerHeight * 0.8 && !lb.open);
  lastY = y;
}
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- Hero video: plays once, then rests on the opening frame ---------- */
const video = document.querySelector('.hero__video');
const toggle = document.querySelector('.hero__toggle');
let finished = false;
function setToggle(playing) {
  toggle.setAttribute('aria-pressed', String(!playing));
  toggle.setAttribute('aria-label', playing ? 'Pause clipper animation' : finished ? 'Replay clipper animation' : 'Play clipper animation');
}
function play() {
  if (finished) {
    finished = false;
    video.currentTime = 0;
  }
  video.play().catch(() => {});
  setToggle(true);
}
function pause() {
  video.pause();
  setToggle(false);
}
toggle.addEventListener('click', () => (video.paused ? play() : pause()));
video.addEventListener('ended', () => {
  finished = true;
  // Last frame is black: hide, jump to the opening frame, then fade it back up.
  video.style.opacity = '0';
  video.currentTime = 0;
  video.addEventListener('seeked', () => requestAnimationFrame(() => (video.style.opacity = '1')), { once: true });
  setToggle(false);
});
if (reduced) pause();
else setToggle(true);
// Pause mid-animation when scrolled away; resume only if it hasn't finished.
let pausedByScroll = false;
new IntersectionObserver(([e]) => {
  if (!e.isIntersecting && !video.paused) {
    video.pause();
    pausedByScroll = true;
  } else if (e.isIntersecting && pausedByScroll && !finished) {
    pausedByScroll = false;
    video.play().catch(() => {});
  }
}).observe(video);

/* ---------- Loader + intro ---------- */
const loader = document.querySelector('.loader');
const bar = loader.querySelector('i');
bar.style.transform = 'scaleX(0.4)';

function splitChars(el) {
  const text = el.textContent;
  el.textContent = '';
  [...text].forEach((ch) => {
    const s = document.createElement('span');
    s.className = 'char';
    s.textContent = ch;
    el.appendChild(s);
  });
}
document.querySelectorAll('[data-split]').forEach(splitChars);

function intro() {
  bar.style.transform = 'scaleX(1)';
  setTimeout(() => loader.classList.add('is-done'), 250);
  if (reduced) return;
  const tl = gsap.timeline({ delay: 0.35 });
  tl.from('.hero .char, .hero__dot', { yPercent: 110, opacity: 0, rotate: 6, duration: 1.1, ease: 'expo.out', stagger: 0.045 })
    .to('.hero [data-reveal]', { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1 }, '-=0.7')
    .from('.nav', { opacity: 0, duration: 0.8, ease: 'power2.out' }, '-=0.9');
}
Promise.race([
  Promise.all([document.fonts.ready, new Promise((r) => (video.readyState >= 2 ? r() : video.addEventListener('loadeddata', r, { once: true })))]),
  new Promise((r) => setTimeout(r, 2200)),
]).then(intro);

/* ---------- Scroll reveals ---------- */
if (!reduced) {
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });
  gsap.from('.tile', {
    opacity: 0,
    y: 40,
    scale: 0.96,
    duration: 0.9,
    ease: 'expo.out',
    stagger: { each: 0.05, grid: 'auto', from: 'start' },
    scrollTrigger: { trigger: '#grid', start: 'top 85%' },
  });
  // Hero title drifts and the video scales slightly as you leave
  gsap.to('.hero__content', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__video', { scale: 1.12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
}

// Fade cards: clipper sweeps up and leaves the fade behind
const fio = new IntersectionObserver(
  (entries) =>
    entries.forEach((e, i) => {
      if (!e.isIntersecting) return;
      setTimeout(() => e.target.classList.add('is-in'), i * 120);
      fio.unobserve(e.target);
    }),
  { threshold: 0.4 }
);
document.querySelectorAll('.fade-card').forEach((c) => fio.observe(c));

/* ---------- 3D work flight ---------- */
const canvas = document.querySelector('.work__canvas');
if (hasWebGL() && !reduced) {
  const countEl = document.querySelector('.work__count');
  document.querySelector('.work__total').textContent = String(CUTS.length).padStart(2, '0');
  const work = createWork3D({
    canvas,
    cuts: CUTS,
    onOpen: openCut,
    onActive: (i) => (countEl.textContent = String(i + 1).padStart(2, '0')),
  });
  ScrollTrigger.create({
    trigger: '.work',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (st) => work.setProgress(st.progress),
  });
  gsap.from('.work__overlay > *', {
    opacity: 0,
    y: 30,
    stagger: 0.1,
    duration: 1,
    ease: 'expo.out',
    scrollTrigger: { trigger: '.work', start: 'top 60%' },
  });
} else {
  root.classList.add('no-webgl');
}
