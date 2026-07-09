/* ============================================================
   FINISH LINE — main.js
   Главный скрипт: pre-loader, GSAP, Lenis, scroll-driven сцены
   ============================================================ */

import './climax.js';
import './hero-3d.js';

/* ---------- ИНИЦИАЛИЗАЦИЯ ---------- */
gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
  duration: 1.4,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  smoothTouch: false,
});

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

/* ---------- КАСТОМНЫЙ SPLIT-TEXT (замена платного GSAP SplitText) ---------- */
function splitText(target, type = 'chars', wrap = 'span') {
  let elements;
  if (typeof target === 'string') {
    elements = document.querySelectorAll(target);
  } else if (target instanceof Element) {
    elements = [target];
  } else if (target instanceof NodeList || Array.isArray(target)) {
    elements = target;
  } else {
    return;
  }
  elements.forEach((el) => {
    if (!el || el.dataset.splitDone === '1') return;
    const text = el.textContent.trim();
    el.textContent = '';
    if (type === 'chars') {
      const chars = [...text];
      chars.forEach((char, i) => {
        const span = document.createElement(wrap);
        span.className = 'char';
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.setProperty('--char-i', i);
        el.appendChild(span);
      });
    } else if (type === 'words') {
      const words = text.split(' ');
      words.forEach((word, i) => {
        const span = document.createElement(wrap);
        span.className = 'word';
        span.textContent = word;
        span.style.setProperty('--word-i', i);
        el.appendChild(span);
        if (i < words.length - 1) {
          el.appendChild(document.createTextNode(' '));
        }
      });
    }
    el.dataset.splitDone = '1';
  });
}

/* Reveal-анимация для split-элементов */
function revealSplit(target, options = {}) {
  let elements;
  if (typeof target === 'string') {
    elements = document.querySelectorAll(target);
  } else if (target instanceof Element) {
    elements = [target];
  } else if (target instanceof NodeList || Array.isArray(target)) {
    elements = target;
  } else {
    return;
  }
  elements.forEach((el) => {
    if (!el) return;
    const parts = el.querySelectorAll('.char, .word');
    if (!parts.length) return;
    gsap.to(parts, {
      opacity: 1,
      y: 0,
      rotateX: 0,
      duration: options.duration || 0.9,
      ease: options.ease || 'expo.out',
      stagger: options.stagger || 0.025,
      delay: options.delay || 0,
      scrollTrigger: options.scrollTrigger
        ? options.scrollTrigger(el)
        : {
            trigger: el,
            start: 'top 85%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse',
          },
    });
  });
}

/* ---------- PRE-LOADER ---------- */
function hidePreloader() {
  const preloader = document.getElementById('preloader');
  const bar = document.getElementById('preloader-bar');
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15 + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(() => {
        preloader.classList.add('is-hidden');
        setTimeout(() => {
          preloader.style.display = 'none';
          // Запускаем hero-анимацию после исчезновения pre-loader
          animateHero();
        }, 800);
      }, 400);
    }
    bar.style.width = `${progress}%`;
  }, 120);
}

window.addEventListener('load', () => {
  setTimeout(hidePreloader, 400);
});

/* ---------- HERO: кинетическая типографика + cursor-эффект ---------- */
function animateHero() {
  // Reveal мета-информации
  gsap.from('.hero-meta-item', {
    opacity: 0,
    y: 20,
    duration: 0.8,
    ease: 'expo.out',
    stagger: 0.1,
  });

  // Split title и reveal
  splitText('.hero-line-1', 'chars');
  splitText('.hero-subtitle', 'words');

  gsap.to('.hero-line-1 .char', {
    opacity: 1,
    y: 0,
    rotateX: 0,
    duration: 1.4,
    ease: 'expo.out',
    stagger: 0.035,
    delay: 0.3,
  });

  gsap.to('.hero-subtitle .word', {
    opacity: 1,
    y: 0,
    duration: 1,
    ease: 'expo.out',
    stagger: 0.06,
    delay: 1.5,
  });

  // Scroll hint
  gsap.from('.hero-scroll-hint', {
    opacity: 0,
    y: 20,
    duration: 0.8,
    ease: 'expo.out',
    delay: 2.2,
  });

  // Corner HUD — последовательное появление
  gsap.from('.hero-corner', {
    opacity: 0,
    duration: 0.6,
    ease: 'expo.out',
    stagger: 0.08,
    delay: 0.5,
  });

  // Cursor parallax на hero
  const hero = document.querySelector('.hero');
  const heroContent = document.querySelector('.hero-content');
  if (hero && heroContent && window.matchMedia('(min-width: 768px)').matches) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(heroContent, {
        x: x * 16,
        y: y * 12,
        duration: 1.2,
        ease: 'power3.out',
      });
    });
  }
}

/* ---------- CHAPTERS: scroll-driven анимации ---------- */
function animateChapters() {
  document.querySelectorAll('.chapter').forEach((chapter) => {
    const number = chapter.querySelector('.chapter-number');
    const title = chapter.querySelector('.chapter-title');
    const distance = chapter.querySelector('.chapter-distance');
    const lines = chapter.querySelectorAll('.chapter-line');
    const image = chapter.querySelector('.chapter-image');
    const stats = chapter.querySelectorAll('.stat');

    // Split тексты один раз
    splitText(number, 'chars');
    splitText(title, 'chars');
    splitText(distance, 'words');
    lines.forEach((line) => splitText(line, 'words'));

    // Pin сцены + параллакс фона
    if (image) {
      gsap.to(image, {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: chapter,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    }

    // Reveal number
    revealSplit(number, {
      duration: 0.8,
      stagger: 0.04,
      delay: 0.1,
      scrollTrigger: () => ({
        trigger: chapter,
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      }),
    });

    // Reveal title
    revealSplit(title, {
      duration: 1.2,
      stagger: 0.03,
      delay: 0.3,
      scrollTrigger: () => ({
        trigger: chapter,
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      }),
    });

    // Reveal distance
    revealSplit(distance, {
      duration: 0.9,
      stagger: 0.06,
      delay: 0.8,
      scrollTrigger: () => ({
        trigger: chapter,
        start: 'top 60%',
        toggleActions: 'play none none reverse',
      }),
    });

    // Reveal lines (body)
    lines.forEach((line, idx) => {
      revealSplit(line, {
        duration: 1,
        stagger: 0.04,
        delay: 1 + idx * 0.2,
        scrollTrigger: () => ({
          trigger: chapter,
          start: 'top 55%',
          toggleActions: 'play none none reverse',
        }),
      });
    });

    // Stats counter
    stats.forEach((stat, idx) => {
      gsap.from(stat, {
        opacity: 0,
        x: 30,
        duration: 0.8,
        ease: 'expo.out',
        delay: 1.5 + idx * 0.15,
        scrollTrigger: {
          trigger: chapter,
          start: 'top 40%',
          toggleActions: 'play none none reverse',
        },
      });
    });
  });
}

/* ---------- CLIMAX: scroll-driven WebGL-триггер ---------- */
function animateClimax() {
  const climax = document.querySelector('.climax');
  if (!climax) return;

  splitText('.climax-pre', 'words');
  splitText('.climax-line', 'chars');

  const subtitle = climax.querySelector('.climax-subtitle');
  if (subtitle) splitText(subtitle, 'words');

  // Pre text
  revealSplit('.climax-pre', {
    duration: 0.8,
    stagger: 0.06,
    delay: 0.2,
    scrollTrigger: () => ({
      trigger: climax,
      start: 'top 75%',
      toggleActions: 'play none none reverse',
    }),
  });

  // Title — большая ставка
  gsap.to('.climax-line .char', {
    opacity: 1,
    y: 0,
    rotateX: 0,
    duration: 1.6,
    ease: 'expo.out',
    stagger: 0.04,
    delay: 0.6,
    scrollTrigger: {
      trigger: climax,
      start: 'top 70%',
      toggleActions: 'play none none reverse',
    },
  });

  // Subtitle
  if (subtitle) {
    revealSplit(subtitle, {
      duration: 1,
      stagger: 0.05,
      delay: 1.5,
      scrollTrigger: () => ({
        trigger: climax,
        start: 'top 60%',
        toggleActions: 'play none none reverse',
      }),
    });
  }
}

/* ---------- CLOSING: финальный шёпот ---------- */
function animateClosing() {
  const closing = document.querySelector('.closing');
  if (!closing) return;

  const line = closing.querySelector('.closing-line');
  const subtitle = closing.querySelector('.closing-subtitle');
  const footer = closing.querySelector('.closing-footer');

  splitText(line, 'chars');
  splitText(subtitle, 'words');

  revealSplit(line, {
    duration: 1.4,
    stagger: 0.04,
    delay: 0.2,
    scrollTrigger: () => ({
      trigger: closing,
      start: 'top 70%',
      toggleActions: 'play none none reverse',
    }),
  });

  revealSplit(subtitle, {
    duration: 1,
    stagger: 0.06,
    delay: 1.4,
    scrollTrigger: () => ({
      trigger: closing,
      start: 'top 60%',
      toggleActions: 'play none none reverse',
    }),
  });

  gsap.from(footer, {
    opacity: 0,
    y: 30,
    duration: 1,
    ease: 'expo.out',
    delay: 2.2,
    scrollTrigger: {
      trigger: closing,
      start: 'top 50%',
      toggleActions: 'play none none reverse',
    },
  });
}

/* ---------- PROGRESS BAR ---------- */
function updateProgress() {
  const fill = document.getElementById('progress-fill');
  if (!fill) return;
  ScrollTrigger.create({
    trigger: 'body',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      fill.style.width = `${(self.progress * 100).toFixed(2)}%`;
    },
  });
}

/* ---------- SECTION NAV: активная секция + клик-навигация ---------- */
function setupSectionNav() {
  const sections = ['hero', 'chapter-1', 'chapter-2', 'chapter-3', 'climax', 'closing', 'cta'];
  const navItems = document.querySelectorAll('.section-nav li');

  // Активная секция
  sections.forEach((id) => {
    const target = id === 'hero'
      ? document.querySelector('.hero')
      : document.querySelector(`[data-section="${id}"]`);

    if (!target) return;

    ScrollTrigger.create({
      trigger: target,
      start: 'top 60%',
      end: 'bottom 40%',
      onToggle: (self) => {
        if (self.isActive) {
          navItems.forEach((item) => item.classList.remove('active'));
          const activeItem = document.querySelector(`.section-nav li[data-target="${id}"]`);
          if (activeItem) activeItem.classList.add('active');
        }
      },
    });
  });

  // Клик-навигация
  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const target = item.dataset.target;
      const el = target === 'hero'
        ? document.querySelector('.hero')
        : document.querySelector(`[data-section="${target}"]`);
      if (el) {
        lenis.scrollTo(el, { offset: 0, duration: 1.8 });
      }
    });
  });
}

/* ---------- CTA: reveal-анимация + submit-handler ---------- */
function animateCta() {
  const cta = document.querySelector('.cta');
  if (!cta) return;

  const pre = cta.querySelector('.cta-pre');
  const titleSpans = cta.querySelectorAll('.cta-title span');
  const subtitle = cta.querySelector('.cta-subtitle');
  const form = cta.querySelector('.cta-form');

  if (pre) splitText(pre, 'words');
  titleSpans.forEach((s) => splitText(s, 'words'));
  if (subtitle) splitText(subtitle, 'words');

  // Reveal pre
  revealSplit(pre, {
    duration: 0.8,
    stagger: 0.06,
    delay: 0.1,
    scrollTrigger: () => ({
      trigger: cta,
      start: 'top 75%',
      toggleActions: 'play none none reverse',
    }),
  });

  // Reveal title
  titleSpans.forEach((span, idx) => {
    revealSplit(span, {
      duration: 1.2,
      stagger: 0.04,
      delay: 0.3 + idx * 0.15,
      scrollTrigger: () => ({
        trigger: cta,
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      }),
    });
  });

  // Reveal subtitle
  if (subtitle) {
    revealSplit(subtitle, {
      duration: 1,
      stagger: 0.05,
      delay: 0.7,
      scrollTrigger: () => ({
        trigger: cta,
        start: 'top 60%',
        toggleActions: 'play none none reverse',
      }),
    });
  }

  // Reveal form
  if (form) {
    gsap.from(form, {
      opacity: 0,
      y: 40,
      duration: 1.2,
      ease: 'expo.out',
      delay: 1.1,
      scrollTrigger: {
        trigger: cta,
        start: 'top 55%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  // Submit handler (UI-only)
  const formEl = document.getElementById('cta-form');
  const successEl = document.getElementById('cta-success');
  if (formEl && successEl) {
    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = formEl.querySelector('#cta-name').value.trim();
      const phone = formEl.querySelector('#cta-phone').value.trim();
      const goal = formEl.querySelector('#cta-goal').value;
      const when = formEl.querySelector('#cta-when').value;

      if (!name || !phone || !goal || !when) {
        // Подсветка незаполненных полей
        formEl.querySelectorAll('input, select').forEach((field) => {
          if (!field.value.trim()) {
            field.style.borderColor = 'rgba(233, 30, 99, 0.6)';
            field.addEventListener('input', () => {
              field.style.borderColor = '';
            }, { once: true });
          }
        });
        return;
      }

      // Успешная отправка (UI-only)
      formEl.style.display = 'none';
      successEl.classList.add('is-shown');
      successEl.setAttribute('aria-hidden', 'false');
      // Мягкий скролл к success через Lenis (если доступен)
      try {
        lenis.scrollTo(successEl, { offset: -80, duration: 1.4 });
      } catch (err) {
        successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
}

/* ---------- MUTE BUTTON (стаб, можно расширить в v2) ---------- */
function setupMute() {
  const btn = document.getElementById('muteBtn');
  if (!btn) return;
  let muted = false;
  btn.addEventListener('click', () => {
    muted = !muted;
    btn.classList.toggle('is-muted', muted);
    btn.querySelector('.mute-icon').textContent = muted ? '♪̸' : '♪';
    // Здесь можно подключить Web Audio API context
  });
}

/* ---------- RESIZE HANDLER ---------- */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    ScrollTrigger.refresh();
  }, 250);
});

/* ---------- ИНИЦИАЛИЗАЦИЯ ВСЕХ АНИМАЦИЙ ---------- */
function init() {
  animateChapters();
  animateClimax();
  animateClosing();
  animateCta();
  updateProgress();
  setupSectionNav();
  setupMute();

  // Refresh после полной загрузки
  ScrollTrigger.refresh();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}