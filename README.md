# FINISH LINE

> Кинематографичный арт-объект о моменте финиша. Три главы: марафон, ультра, трейл. WebGL-кульминация.

Арт-эксперимент для узкого комьюнити бегунов. Чистая типографика, scroll-driven сцены, взрыв частиц на финише.

## Что внутри

- **Hero (v2)** — 3D-сцена Three.js: дрейфующие маджентовые частицы + wireframe-кольцо как отсылка к логотипу ПРОБег + cursor parallax через uniforms. Кинетическая типографика и pink-glow.
- **Глава 1: Марафон** — scroll-driven параллакс фона + reveal-анимации
- **Глава 2: Ультра** — та же механика, своя цветовая палитра (cyan)
- **Глава 3: Трейл** — горный рельеф, earth-tones
- **Climax (v2)** — WebGL-взрыв 9000 частиц через Three.js + wireframe-ribbon финишной ленты (рвётся при кульминации) + усиленный glow на пике + cinematic camera zoom и rotation, синхронизировано со скроллом
- **Closing (v2)** — финальный шёпот с маджентовым акцентом (pulsing dot)
- **CTA (v2)** — новая секция записи в клуб ПРОБег: кинетический заголовок, форма (имя/телефон/цель/старт), маджентовая кнопка с hover-glow, inline success-сообщение
- **Палитра ПРОБег (v2)** — pink-navy CSS-переменные (`--brand-navy`, `--brand-magenta`, `--brand-pink-glow`, `--brand-pink-soft`), радиальный pink-glow на hero и closing, маджентовый акцент в climax

## Технологии

- Vanilla HTML/CSS/JavaScript (без сборки)
- [GSAP 3.12](https://gsap.com/) — анимации + ScrollTrigger
- [Lenis 1.1](https://lenis.darkroom.engineering/) — плавный скролл
- [Three.js r160](https://threejs.org/) — WebGL-кульминация
- Google Fonts (Inter Display + JetBrains Mono)

## Структура

```
finish-line/
├── index.html          # единственная страница (hero + 3 chapters + climax + closing + cta)
├── css/
│   └── style.css       # все стили + CSS variables (включая brand pink-navy)
├── js/
│   ├── main.js         # pre-loader, GSAP, scroll-trigger, smooth scroll, CTA form
│   ├── hero-3d.js      # Three.js hero-сцена (v2): частицы + wireframe кольцо
│   └── climax.js       # Three.js particle system + ribbon (v2)
└── README.md           # этот файл
```

## Запуск локально

```bash
# Любой статический сервер. Например:
python -m http.server 8080
# или
npx serve
# или просто откройте index.html в браузере (но тогда WebGL может не работать из-за CORS)
```

Откройте `http://localhost:8080` в браузере.

## Деплой на GitHub Pages

### Шаг 1: создать репозиторий

```bash
cd finish-line
git init
git add .
git commit -m "feat: finish line — initial art experiment"
git branch -M main
git remote add origin https://github.com/<your-username>/finish-line.git
git push -u origin main
```

### Шаг 2: включить GitHub Pages

1. Перейти в **Settings → Pages** репозитория
2. **Source:** Deploy from a branch
3. **Branch:** `main`, папка `/ (root)`
4. Нажать **Save**

Через 1-2 минуты сайт будет доступен по адресу:
`https://<your-username>.github.io/finish-line/`

### Альтернатива: кастомный домен

В `Settings → Pages → Custom domain` введите свой домен. Создайте CNAME-запись у регистратора, указывающую на `<your-username>.github.io`.

## Настройка под себя

### Изменить цвета глав

В `css/style.css` найдите CSS-переменные:

```css
--accent-marathon: #ff6b35; /* оранжевый */
--accent-ultra: #4ecdc4;    /* cyan */
--accent-trail: #f4a261;    /* тёплый песок */
--accent-climax: #ffd700;   /* золотой */
```

### Изменить тексты

В `index.html` каждая глава — отдельный `<section class="chapter">`. Найдите нужную и отредактируйте текст внутри `<p class="chapter-line">`.

### Изменить фоновые фото

В `index.html` в `<img class="chapter-image" src="...">` замените URL на свой. Рекомендуется Unsplash с параметрами `?w=2400&q=80&auto=format&fit=crop` для оптимизации.

### Изменить интенсивность частиц

В `js/climax.js` найдите `PARTICLE_COUNT = 4500;` и измените число. Больше = тяжелее для GPU.

## Производительность

- **Desktop (MacBook Air M1, Intel i5+):** стабильно 60 FPS
- **Mobile:** WebGL-кульминация может работать медленнее. В v2 будет добавлен fallback на статику.
- **Bundle size:** ~30 KB JS + ~12 KB CSS (без учёта CDN-библиотек)

## Что НЕ реализовано в v2 (roadmap для v3)

- [ ] Звуковой дизайн (Web Audio API: дыхание, шаги, толпа, тишина)
- [ ] Кастомный domain и SSL
- [ ] Аналитика (Plausible или без неё — арт-объект не нуждается в трекинге)
- [ ] Open Graph мета-теги для красивого шеринга
- [ ] Видео-фон вместо фото для глав (для большего immersion)
- [ ] Accessibility audit (полный WCAG)
- [ ] Реальная интеграция формы CTA (бэкенд или форма-сервис типа Formspree)

## Лицензия

Код — свободное использование. Фото — Unsplash License. Шрифты — OFL.

---

**Создано:** июль 2026
**Тип:** арт-эксперимент
**Для:** узкого комьюнити бегунов, ценящих кинематографичность и движение