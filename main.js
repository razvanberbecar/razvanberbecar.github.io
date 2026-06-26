/* ============================================================
   Razvan Berbecar — Portfolio
   Three.js particle background + GSAP scroll animations
   ============================================================ */

import * as THREE from "three";

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

/* ============================================================
   1. THREE.JS PARTICLE BACKGROUND
   ============================================================ */
function initBackground() {
  const canvas = document.getElementById("bg");
  if (!canvas) return { onScroll() {} };

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07070b, 0.055);

  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.z = 18;

  /* ---- Particle field ---- */
  const COUNT = isTouch ? 2600 : 6000;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const scales = new Float32Array(COUNT);

  const colA = new THREE.Color(0x7c5cff); // violet
  const colB = new THREE.Color(0x00e0ff); // cyan
  const tmp = new THREE.Color();

  const RADIUS = 26;
  for (let i = 0; i < COUNT; i++) {
    // distribute in a flattened disc/sphere for a "field" feel
    const r = Math.pow(Math.random(), 0.7) * RADIUS;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi) * 0.55;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    tmp.copy(colA).lerp(colB, Math.random());
    colors[i * 3]     = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;

    scales[i] = Math.random() * 1.5 + 0.5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));

  // soft round sprite generated on a canvas
  const sprite = makeCircleTexture();

  const mat = new THREE.PointsMaterial({
    size: 0.14,
    map: sprite,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  /* ---- a couple of subtle glowing orbs for depth ---- */
  const orbGeo = new THREE.SphereGeometry(1, 24, 24);
  const orb1 = new THREE.Mesh(orbGeo, new THREE.MeshBasicMaterial({
    color: 0x7c5cff, transparent: true, opacity: 0.06,
  }));
  orb1.scale.setScalar(7);
  orb1.position.set(-10, 4, -6);
  scene.add(orb1);

  const orb2 = new THREE.Mesh(orbGeo, new THREE.MeshBasicMaterial({
    color: 0x00e0ff, transparent: true, opacity: 0.05,
  }));
  orb2.scale.setScalar(9);
  orb2.position.set(12, -5, -10);
  scene.add(orb2);

  /* ---- interaction state ---- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollY = 0;

  if (!isTouch) {
    window.addEventListener("pointermove", (e) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  /* ---- resize ---- */
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  /* ---- animation loop ---- */
  const clock = new THREE.Clock();
  function tick() {
    const t = clock.getElapsedTime();

    // ease mouse
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;

    // gentle constant rotation + mouse parallax
    points.rotation.y = t * 0.035 + mouse.x * 0.35;
    points.rotation.x = mouse.y * 0.22;
    points.rotation.z = t * 0.01;

    orb1.position.y = 4 + Math.sin(t * 0.4) * 1.4;
    orb2.position.y = -5 + Math.cos(t * 0.3) * 1.6;

    // scroll dives the camera slightly into the field
    camera.position.z = 18 - scrollY * 6;
    camera.position.y = -mouse.y * 1.2 + scrollY * 2;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  return {
    onScroll(progress) { scrollY = progress; },
  };
}

function makeCircleTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,255,255,0.85)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

/* ============================================================
   2. CUSTOM CURSOR
   ============================================================ */
function initCursor() {
  if (isTouch) return;
  const dot = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  if (!dot || !ring) return;

  const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const ringPos = { ...pos };

  window.addEventListener("pointermove", (e) => {
    pos.x = e.clientX;
    pos.y = e.clientY;
    dot.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
  });

  function render() {
    ringPos.x += (pos.x - ringPos.x) * 0.18;
    ringPos.y += (pos.y - ringPos.y) * 0.18;
    ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%, -50%)`;
    requestAnimationFrame(render);
  }
  render();

  // hover state
  document.querySelectorAll("[data-cursor]").forEach((el) => {
    el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
  });

  // hide when leaving window
  document.addEventListener("mouseleave", () => {
    dot.style.opacity = "0";
    ring.style.opacity = "0";
  });
  document.addEventListener("mouseenter", () => {
    dot.style.opacity = "1";
    ring.style.opacity = "1";
  });
}

/* ============================================================
   3. MAGNETIC BUTTONS
   ============================================================ */
function initMagnetic() {
  if (isTouch || prefersReduced) return;
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const strength = 0.32;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transform = "translate(0, 0)";
    });
  });
}

/* ============================================================
   4. PROJECT CARD GLOW (follows cursor)
   ============================================================ */
function initCardGlow() {
  if (isTouch) return;
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });
}

/* ============================================================
   5. GSAP SCROLL ANIMATIONS
   ============================================================ */
function initScrollAnimations(bg) {
  if (typeof gsap === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  if (prefersReduced) {
    gsap.set(".reveal", { opacity: 1, y: 0 });
  } else {
    // generic reveals — fade + slide, staggered when siblings share a parent
    const groups = new Map();
    document.querySelectorAll(".reveal").forEach((el) => {
      const key = el.parentElement;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(el);
    });

    groups.forEach((els) => {
      gsap.to(els, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.09,
        scrollTrigger: {
          trigger: els[0],
          start: "top 85%",
        },
      });
    });
  }

  // Hero title lines — clip reveal
  if (!prefersReduced) {
    gsap.to(".hero__title .line span", {
      yPercent: 0,
      duration: 1.2,
      ease: "power4.out",
      stagger: 0.12,
      delay: 0.2,
    });
  }

  // Hero parallax on scroll
  if (!prefersReduced) {
    gsap.to("[data-parallax]", {
      yPercent: 28,
      opacity: 0.35,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }

  // Section title subtle horizontal drift
  if (!prefersReduced) {
    gsap.utils.toArray(".section__title").forEach((title) => {
      gsap.from(title, {
        x: -30,
        ease: "none",
        scrollTrigger: {
          trigger: title,
          start: "top 90%",
          end: "top 50%",
          scrub: true,
        },
      });
    });
  }

  // feed scroll progress to the Three.js background
  ScrollTrigger.create({
    trigger: document.body,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => bg.onScroll(self.progress),
  });
}

/* ============================================================
   6. NAV scrolled state + active link
   ============================================================ */
function initNav() {
  const nav = document.getElementById("nav");
  if (!nav) return;
  const onScroll = () => {
    nav.classList.toggle("scrolled", window.scrollY > 40);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ============================================================
   7. LOADING SCREEN
   ============================================================ */
function initLoader(onDone) {
  const loader = document.getElementById("loader");
  const bar = document.getElementById("loaderBar");
  const count = document.getElementById("loaderCount");

  // set hero title lines below their mask before reveal
  if (!prefersReduced) {
    gsap.set(".hero__title .line span", { yPercent: 110 });
  }

  if (!loader) { onDone(); return; }

  let progress = 0;
  const duration = prefersReduced ? 200 : 1400;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    progress = Math.min(elapsed / duration, 1);
    // ease-out for a natural feel
    const eased = 1 - Math.pow(1 - progress, 3);
    const pct = Math.round(eased * 100);
    if (bar) bar.style.width = pct + "%";
    if (count) count.textContent = pct;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      finish();
    }
  }
  requestAnimationFrame(update);

  function finish() {
    document.body.classList.add("js-loaded");
    if (typeof gsap !== "undefined" && !prefersReduced) {
      gsap.to(loader, {
        yPercent: -100,
        duration: 0.9,
        ease: "power4.inOut",
        onComplete: () => {
          loader.style.display = "none";
          onDone();
        },
      });
    } else {
      loader.style.display = "none";
      onDone();
    }
  }
}

/* ============================================================
   BOOTSTRAP
   ============================================================ */
function main() {
  const bg = initBackground();
  initCursor();
  initMagnetic();
  initCardGlow();
  initNav();

  initLoader(() => {
    initScrollAnimations(bg);
    // refresh in case layout shifted while loading
    if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
