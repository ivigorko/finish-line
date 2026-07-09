/* ============================================================
   FINISH LINE — climax.js (WebGL кульминация, v2)
   Three.js сцена: финишный взрыв частиц + wireframe ribbon,
   синхронизированные со скроллом.
   ============================================================ */

import * as THREE from 'three';

/* ---------- ИНИЦИАЛИЗАЦИЯ ---------- */
const canvas = document.getElementById('climax-canvas');
if (!canvas) {
  console.warn('[climax] canvas not found');
} else {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (e) {
    console.warn('[climax] WebGL not available, falling back to static design');
    renderer = null;
  }
  if (!renderer) {
    canvas.style.display = 'none';
  } else {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x0a0a0a, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a0a, 0.045);

  const camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  camera.position.set(0, 0, 18);

  /* ---------- PARTICLE SYSTEM (взрыв) ---------- */
  const PARTICLE_COUNT = 9000;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);

  // Палитра частиц: маджентовое ядро + золото + белое (v2 — расширена розовым)
  const colorPalette = [
    new THREE.Color(0xffd700), // gold
    new THREE.Color(0xffe57f), // light gold
    new THREE.Color(0xffffff), // white
    new THREE.Color(0xffb84d), // warm orange
    new THREE.Color(0xff8c42), // burnt orange
    new THREE.Color(0xE91E63), // brand magenta — добавлено в v2
    new THREE.Color(0xff4d8a), // bright pink
  ];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;

    const startRadius = Math.random() * 0.4;
    const startTheta = Math.random() * Math.PI * 2;
    const startPhi = Math.acos(2 * Math.random() - 1);

    positions[i3] = startRadius * Math.sin(startPhi) * Math.cos(startTheta);
    positions[i3 + 1] = startRadius * Math.sin(startPhi) * Math.sin(startTheta);
    positions[i3 + 2] = startRadius * Math.cos(startPhi);

    const explodeSpeed = 0.4 + Math.random() * 2.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    velocities[i3] = Math.sin(phi) * Math.cos(theta) * explodeSpeed;
    velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * explodeSpeed;
    velocities[i3 + 2] = Math.cos(phi) * explodeSpeed * 0.5;

    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;

    // v2: размер частицы варьируется сильнее
    sizes[i] = Math.random() * 0.9 + 0.25;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // v2: uniforms для size boost и glow
  const climaxUniforms = {
    uSizeMul: { value: 1.0 },
    uGlow: { value: 0.0 },
    uExplode: { value: 0.0 },
  };

  const vertexShader = `
    attribute float size;
    attribute vec3 color;
    uniform float uSizeMul;
    varying vec3 vColor;
    varying float vDistance;

    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vDistance = -mvPosition.z;
      // v2: размер частиц растёт при пиковом взрыве
      gl_PointSize = size * uSizeMul * (320.0 / vDistance);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform float uGlow;
    varying vec3 vColor;
    varying float vDistance;

    void main() {
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);

      float alpha = smoothstep(0.5, 0.0, dist);
      alpha = pow(alpha, 1.5);

      // v2: усиленный glow при пике
      float glow = smoothstep(0.5, 0.0, dist) * (0.6 + uGlow * 0.9);
      vec3 finalColor = vColor + vec3(glow * (0.3 + uGlow * 0.4));

      // v2: маджентовый привкус при пике
      finalColor += vec3(0.9, 0.12, 0.4) * uGlow * 0.25;

      float distFade = smoothstep(45.0, 6.0, vDistance);

      gl_FragColor = vec4(finalColor, alpha * distFade);
    }
  `;

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: climaxUniforms,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  /* ---------- ОКРУЖАЮЩИЕ ЧАСТИЦЫ (медленный фон) ---------- */
  const AMBIENT_COUNT = 1500;
  const ambientPositions = new Float32Array(AMBIENT_COUNT * 3);
  const ambientColors = new Float32Array(AMBIENT_COUNT * 3);

  for (let i = 0; i < AMBIENT_COUNT; i++) {
    const i3 = i * 3;
    ambientPositions[i3] = (Math.random() - 0.5) * 100;
    ambientPositions[i3 + 1] = (Math.random() - 0.5) * 70;
    ambientPositions[i3 + 2] = (Math.random() - 0.5) * 70 - 30;

    // Расширенная палитра ambient: розовый + золотой
    const isPink = Math.random() < 0.4;
    if (isPink) {
      ambientColors[i3] = 0.8 + Math.random() * 0.2;
      ambientColors[i3 + 1] = 0.2 + Math.random() * 0.2;
      ambientColors[i3 + 2] = 0.4 + Math.random() * 0.2;
    } else {
      ambientColors[i3] = 0.6 + Math.random() * 0.4;
      ambientColors[i3 + 1] = 0.5 + Math.random() * 0.4;
      ambientColors[i3 + 2] = 0.1 + Math.random() * 0.2;
    }
  }

  const ambientGeometry = new THREE.BufferGeometry();
  ambientGeometry.setAttribute('position', new THREE.BufferAttribute(ambientPositions, 3));
  ambientGeometry.setAttribute('color', new THREE.BufferAttribute(ambientColors, 3));

  const ambientMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true,
    uniforms: {
      uSizeMul: { value: 0.7 },
      uGlow: { value: 0.0 },
      uExplode: { value: 0.0 },
    },
  });

  const ambientParticles = new THREE.Points(ambientGeometry, ambientMaterial);
  scene.add(ambientParticles);

  /* ---------- WIREFRAME RIBBON (финишная лента, рвётся при взрыве) ---------- */
  // Лента — параметрическая кривая, проходящая через центр
  const RIBBON_SEGMENTS = 80;
  const ribbonBasePositions = [];
  for (let i = 0; i <= RIBBON_SEGMENTS; i++) {
    const t = i / RIBBON_SEGMENTS; // 0 → 1
    // Лента "змейкой" проходит через центр по синусоиде
    const x = (t - 0.5) * 28; // -14 → 14
    const y = Math.sin(t * Math.PI * 3) * 1.6;
    const z = Math.cos(t * Math.PI * 2) * 1.2;
    ribbonBasePositions.push(new THREE.Vector3(x, y, z));
  }

  // Создаём плоскую ribbon-геометрию (трубка через TubeGeometry)
  const ribbonCurve = new THREE.CatmullRomCurve3(ribbonBasePositions, false, 'centripetal');
  const ribbonGeom = new THREE.TubeGeometry(ribbonCurve, 200, 0.08, 8, false);
  const ribbonMat = new THREE.MeshBasicMaterial({
    color: 0xE91E63,
    transparent: true,
    opacity: 0.0, // начинаем невидимой — появляется при climax
    wireframe: true,
  });
  const ribbon = new THREE.Mesh(ribbonGeom, ribbonMat);
  scene.add(ribbon);

  /* ---------- CENTRAL PULSE (ядро — яркая сфера на пике) ---------- */
  const pulseGeom = new THREE.SphereGeometry(2.5, 32, 32);
  const pulseMat = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
  });
  const pulseCore = new THREE.Mesh(pulseGeom, pulseMat);
  scene.add(pulseCore);

  const pulseHaloGeom = new THREE.SphereGeometry(4.5, 32, 32);
  const pulseHaloMat = new THREE.MeshBasicMaterial({
    color: 0xE91E63,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
  });
  const pulseHalo = new THREE.Mesh(pulseHaloGeom, pulseHaloMat);
  scene.add(pulseHalo);

  /* ---------- SCROLL-DRIVEN УПРАВЛЕНИЕ ---------- */
  let climaxProgress = 0;
  let explodeAmount = 0;
  let time = 0;
  let targetExplode = 0;

  const climaxSection = document.querySelector('.climax');
  if (climaxSection) {
    if (window.gsap && window.ScrollTrigger) {
      window.ScrollTrigger.create({
        trigger: climaxSection,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          climaxProgress = self.progress;
          // Взрыв на 30-70% прохождения climax (расширили окно)
          if (climaxProgress > 0.30 && climaxProgress < 0.70) {
            targetExplode = (climaxProgress - 0.30) / 0.4;
          } else if (climaxProgress >= 0.70) {
            targetExplode = 1;
          } else {
            targetExplode = 0;
          }
        },
      });
    }
  }

  /* ---------- ANIMATION LOOP ---------- */
  const clock = new THREE.Clock();

  function animate() {
    const delta = clock.getDelta();
    time += delta;

    // Плавное приближение к целевому взрыву
    explodeAmount += (targetExplode - explodeAmount) * 0.08;
    climaxUniforms.uExplode.value = explodeAmount;

    // v2: size/glow uniforms реагируют на взрыв
    climaxUniforms.uSizeMul.value = 1.0 + explodeAmount * 1.3;
    climaxUniforms.uGlow.value = explodeAmount;

    const posAttr = geometry.attributes.position;
    const posArray = posAttr.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      if (explodeAmount > 0.01) {
        // Движение — взрыв наружу, чуть быстрее чем в v1
        posArray[i3] += velocities[i3] * explodeAmount * delta * 11;
        posArray[i3 + 1] += velocities[i3 + 1] * explodeAmount * delta * 11;
        posArray[i3 + 2] += velocities[i3 + 2] * explodeAmount * delta * 11;

        velocities[i3 + 1] -= 0.04 * delta * explodeAmount;

        velocities[i3] *= 0.985;
        velocities[i3 + 1] *= 0.985;
        velocities[i3 + 2] *= 0.985;

        const dist = Math.sqrt(
          posArray[i3] ** 2 +
          posArray[i3 + 1] ** 2 +
          posArray[i3 + 2] ** 2
        );
        if (dist > 35) {
          posArray[i3] *= 0.05;
          posArray[i3 + 1] *= 0.05;
          posArray[i3 + 2] *= 0.05;
          const newSpeed = 0.4 + Math.random() * 2.4;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          velocities[i3] = Math.sin(phi) * Math.cos(theta) * newSpeed;
          velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * newSpeed;
          velocities[i3 + 2] = Math.cos(phi) * newSpeed * 0.5;
        }
      } else {
        posArray[i3] += Math.sin(time * 0.5 + i * 0.01) * 0.002;
        posArray[i3 + 1] += Math.cos(time * 0.5 + i * 0.01) * 0.002;
      }
    }

    posAttr.needsUpdate = true;

    // Вращение облака частиц — сильнее при взрыве
    particles.rotation.y += delta * (0.05 + explodeAmount * 0.15);
    particles.rotation.x = Math.sin(time * 0.3) * 0.05;

    /* ---------- RIBBON: появляется до взрыва, "рвётся" при кульминации ---------- */
    // Ribbon visible 0.1 → 0.45, рвётся 0.45 → 0.65, исчезает после
    let ribbonOpacity = 0;
    let ribbonTearAmount = 0;
    if (climaxProgress > 0.1 && climaxProgress < 0.45) {
      ribbonOpacity = (climaxProgress - 0.1) / 0.35 * 0.8;
    } else if (climaxProgress >= 0.45 && climaxProgress < 0.65) {
      ribbonOpacity = 0.8 - (climaxProgress - 0.45) / 0.2 * 0.8;
      ribbonTearAmount = (climaxProgress - 0.45) / 0.2;
    } else if (climaxProgress >= 0.65) {
      ribbonOpacity = 0;
    }
    ribbonMat.opacity = ribbonOpacity * 0.9;

    // Деформация ribbon при разрыве — расширяется и скручивается
    const tearScale = 1 + ribbonTearAmount * 0.8;
    ribbon.scale.set(tearScale, tearScale * (1 + ribbonTearAmount * 0.4), tearScale);
    ribbon.rotation.x = ribbonTearAmount * Math.PI * 0.5;
    ribbon.rotation.y = ribbonTearAmount * Math.PI * 0.3;

    /* ---------- CENTRAL PULSE ---------- */
    // Золотое ядро нарастает при climax, исчезает при взрыве
    if (climaxProgress < 0.4) {
      pulseMat.opacity = (climaxProgress - 0.2) / 0.2 * 0.6;
    } else if (climaxProgress >= 0.4 && climaxProgress < 0.55) {
      pulseMat.opacity = 0.6 + Math.sin(time * 8) * 0.2;
    } else {
      pulseMat.opacity = Math.max(0, 0.6 - (climaxProgress - 0.55) * 3);
    }
    pulseHaloMat.opacity = pulseMat.opacity * 0.7;
    const pulseScale = 1 + Math.sin(time * 3) * 0.05 + explodeAmount * 0.3;
    pulseCore.scale.set(pulseScale, pulseScale, pulseScale);
    pulseHalo.scale.set(pulseScale * 1.2, pulseScale * 1.2, pulseScale * 1.2);

    /* ---------- КАМЕРА: более выраженное приближение + лёгкое вращение ---------- */
    const cameraZ = 18 - explodeAmount * 7;
    camera.position.z += (cameraZ - camera.position.z) * 0.05;
    camera.position.x = Math.sin(time * 0.25) * (0.5 + explodeAmount * 1.0);
    camera.position.y = Math.cos(time * 0.18) * (0.4 + explodeAmount * 0.7);
    camera.lookAt(0, 0, 0);
    // Лёгкое вращение камеры для cinematic feel
    camera.rotation.z = Math.sin(time * 0.1) * 0.02 * (1 + explodeAmount);

    // Амбиент-частицы — медленный дрейф, ускоряется при взрыве
    const ambientPosAttr = ambientGeometry.attributes.position;
    const ambientPosArray = ambientPosAttr.array;
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const i3 = i * 3;
      ambientPosArray[i3 + 1] += Math.sin(time * 0.1 + i) * 0.005 * (1 + explodeAmount);
      ambientPosArray[i3] += Math.cos(time * 0.08 + i * 0.7) * 0.004 * (1 + explodeAmount);
    }
    ambientPosAttr.needsUpdate = true;
    ambientParticles.rotation.y -= delta * (0.01 + explodeAmount * 0.05);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();

  /* ---------- RESIZE ---------- */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  }
}