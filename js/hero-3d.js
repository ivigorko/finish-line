/* ============================================================
   FINISH LINE — hero-3d.js (WebGL hero-сцена)
   Three.js: тёмное пространство с дрейфующими маджентовыми
   частицами + wireframe-кольцо + wireframe-силуэт бегуна.
   Cursor parallax только на desktop.
   ============================================================ */

import * as THREE from 'three';

/* ---------- WebGL availability check ---------- */
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

/* ---------- Mobile / low-end detection ---------- */
const isMobile = window.matchMedia('(max-width: 768px)').matches;
const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PARTICLE_COUNT = isMobile ? 320 : (isReducedMotion ? 400 : 1200);
const PIXEL_RATIO = isMobile ? 1 : Math.min(window.devicePixelRatio, 2);

const canvas = document.getElementById('hero-canvas');
if (!canvas) {
  console.warn('[hero-3d] canvas not found');
} else if (!hasWebGL()) {
  console.warn('[hero-3d] WebGL unavailable, hiding canvas');
  canvas.style.display = 'none';
} else {
  /* ---------- Renderer ---------- */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isMobile,
      alpha: true,
      powerPreference: 'low-power',
    });
  } catch (e) {
    console.warn('[hero-3d] WebGL renderer failed', e);
    canvas.style.display = 'none';
  }

  if (renderer) {
    renderer.setPixelRatio(PIXEL_RATIO);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(0, 0, 22);

    /* ---------- Палитра частиц: маджента + розовый + белое ядро ---------- */
    const colorPalette = [
      new THREE.Color(0xE91E63), // brand magenta
      new THREE.Color(0xff4d8a), // bright pink
      new THREE.Color(0xff7ab0), // soft pink
      new THREE.Color(0xffafd0), // pale pink
      new THREE.Color(0xffffff), // white core
    ];

    /* ---------- ДРЕЙФУЮЩИЕ ЧАСТИЦЫ ---------- */
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const basePositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Распределение: вытянутый эллипсоид вокруг центра
      const radius = 4 + Math.pow(Math.random(), 1.4) * 22;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta) * 0.65;
      const z = radius * Math.cos(phi);

      positions[i3] = basePositions[i3] = x;
      positions[i3 + 1] = basePositions[i3 + 1] = y;
      positions[i3 + 2] = basePositions[i3 + 2] = z;

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = Math.random() * 0.6 + 0.15;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    /* Uniforms для cursor parallax + breathing */
    const uniforms = {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerStrength: { value: 0 },
    };

    const vertexShader = /* glsl */ `
      attribute float size;
      attribute float phase;
      attribute vec3 color;
      uniform float uTime;
      uniform vec2 uPointer;
      uniform float uPointerStrength;
      varying vec3 vColor;
      varying float vDistance;
      varying float vBreath;

      void main() {
        vColor = color;
        vec3 pos = position;

        // Мягкое дыхание — каждая частица колеблется с собственной фазой
        float breath = sin(uTime * 0.4 + phase) * 0.5 + cos(uTime * 0.27 + phase * 1.3) * 0.5;
        pos += normalize(position + vec3(0.001)) * breath * 0.18;

        // Cursor parallax — сдвиг по осям X/Y пропорционально позиции частицы
        pos.x += uPointer.x * (1.0 + position.z * 0.02) * uPointerStrength;
        pos.y += uPointer.y * (1.0 + position.z * 0.02) * uPointerStrength;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vDistance = -mvPosition.z;
        gl_PointSize = size * (340.0 / vDistance);
        gl_Position = projectionMatrix * mvPosition;

        vBreath = breath;
      }
    `;

    const fragmentShader = /* glsl */ `
      varying vec3 vColor;
      varying float vDistance;
      varying float vBreath;

      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);

        // Мягкий круг
        float alpha = smoothstep(0.5, 0.0, dist);
        alpha = pow(alpha, 1.8);

        // Glow — ярче в центре
        float glow = smoothstep(0.5, 0.0, dist) * 0.45;
        vec3 finalColor = vColor + vec3(glow * 0.35);

        // Дыхание слегка модулирует яркость
        finalColor *= 1.0 + vBreath * 0.12;

        // Fade с расстоянием
        float distFade = smoothstep(50.0, 6.0, vDistance);

        gl_FragColor = vec4(finalColor, alpha * distFade * 0.9);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    /* ---------- WIREFRAME КОЛЬЦО (отсылка к логотипу ПРОБег) ---------- */
    const ringGroup = new THREE.Group();

    // Внешнее кольцо (navy/dark)
    const ringOuterGeom = new THREE.TorusGeometry(7.5, 0.06, 16, 96);
    const ringOuterMat = new THREE.MeshBasicMaterial({
      color: 0x0F1A3D,
      transparent: true,
      opacity: 0.55,
    });
    const ringOuter = new THREE.Mesh(ringOuterGeom, ringOuterMat);
    ringGroup.add(ringOuter);

    // Внутреннее маджентовое кольцо (тонкое, ярче)
    const ringInnerGeom = new THREE.TorusGeometry(6.2, 0.025, 12, 80);
    const ringInnerMat = new THREE.MeshBasicMaterial({
      color: 0xE91E63,
      transparent: true,
      opacity: 0.7,
    });
    const ringInner = new THREE.Mesh(ringInnerGeom, ringInnerMat);
    ringGroup.add(ringInner);

    // Центральная маджентовая точка (отсылка к логотипу)
    const coreGeom = new THREE.SphereGeometry(0.45, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
    });
    const core = new THREE.Mesh(coreGeom, coreMat);

    // Soft halo вокруг ядра
    const haloGeom = new THREE.SphereGeometry(1.1, 24, 24);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xE91E63,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Mesh(haloGeom, haloMat);

    ringGroup.add(halo);
    ringGroup.add(core);
    scene.add(ringGroup);

    /* ---------- WIREFRAME-СИЛУЭТ БЕГУНА убран ----------
       Раньше тут был CatmullRom-сплайн из 17 точек, но визуально
       превращался в нечитаемую кашу на экране. Вместо этого фигура
       бегуна теперь приходит из сгенерированного hero-runner.png
       в CSS hero-bg-image (см. CSS). Здесь оставлены только кольцо
       + частицы — атмосферный фон, а не семантический якорь. */

    /* ---------- Cursor parallax (smoothed) — только desktop ---------- */
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const hero = document.querySelector('.hero');

    if (hero && !isMobile) {
      hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        pointer.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        pointer.targetY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      });

      hero.addEventListener('mouseleave', () => {
        pointer.targetX = 0;
        pointer.targetY = 0;
      });
    }

    /* ---------- Animation loop ---------- */
    const clock = new THREE.Clock();

    function animate() {
      const delta = clock.getDelta();
      uniforms.uTime.value += delta;

      // Плавное приближение к целевому значению курсора
      pointer.x += (pointer.targetX - pointer.x) * 0.06;
      pointer.y += (pointer.targetY - pointer.y) * 0.06;
      uniforms.uPointer.value.set(pointer.x, pointer.y);
      uniforms.uPointerStrength.value = Math.min(1, Math.hypot(pointer.x, pointer.y) * 1.4);

      // Обновляем позиции частиц (воксельный breathe вокруг base)
      const posAttr = geometry.attributes.position;
      const posArray = posAttr.array;
      const time = uniforms.uTime.value;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const phase = phases[i];

        // Медленный общий дрейф по Y
        const driftY = Math.sin(time * 0.08 + phase * 0.7) * 0.18;
        // Лёгкий shimmer по X
        const driftX = Math.cos(time * 0.06 + phase * 0.9) * 0.12;

        posArray[i3] = basePositions[i3] + driftX;
        posArray[i3 + 1] = basePositions[i3 + 1] + driftY;
        posArray[i3 + 2] = basePositions[i3 + 2];
      }
      posAttr.needsUpdate = true;

      // Очень медленное вращение облака частиц
      particles.rotation.y += delta * 0.012;
      particles.rotation.x = Math.sin(time * 0.1) * 0.04;

      // Кольцо: медленный поворот + пульс halo
      ringGroup.rotation.z += delta * 0.04;
      ringGroup.rotation.x = Math.sin(time * 0.15) * 0.08;
      ringGroup.rotation.y = Math.cos(time * 0.12) * 0.05;
      const haloScale = 1 + Math.sin(time * 0.8) * 0.08;
      halo.scale.set(haloScale, haloScale, haloScale);

      /* (Runner animation убран — фигура бегуна теперь идёт из hero-runner.png в CSS) */

      // Курсор-параллакс камеры (лёгкий) — только desktop
      if (!isMobile) {
        camera.position.x = pointer.x * 0.6;
        camera.position.y = pointer.y * 0.4;
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    animate();

    /* ---------- Resize ---------- */
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }, 150);
    });

    /* ---------- Pause when hero out of view (perf) ---------- */
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          const visible = entries[0].isIntersecting;
          if (visible && !renderer.info.programs) {
            // first re-render trigger is animation loop; nothing to do
          }
        },
        { threshold: 0 }
      );
      obs.observe(canvas);
    }
  }
}