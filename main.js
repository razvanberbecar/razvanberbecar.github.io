/* ============================================================
   Razvan Berbecar — Portfolio  ·  Editorial / Brutalist theme
   Label cursor · counter loader · clip-reveal headings · GSAP
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

/* ============================================================
   1. MAGNETIC ELEMENTS
   ============================================================ */
function initMagnetic() {
  if (isTouch || prefersReduced) return;
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const s = 0.3;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform =
        `translate(${(e.clientX - (r.left + r.width / 2)) * s}px, ${(e.clientY - (r.top + r.height / 2)) * s}px)`;
    });
    el.addEventListener("pointerleave", () => (el.style.transform = "translate(0,0)"));
  });
}

/* ============================================================
   3. LOADING SCREEN  (counter + panel wipe)
   ============================================================ */
function initLoader(onDone) {
  const loader = document.getElementById("loader");
  const count = document.getElementById("loaderCount");

  if (!loader) { onDone(); return; }
  if (prefersReduced) { loader.style.display = "none"; onDone(); return; }

  const duration = 1500;
  const start = performance.now();

  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    if (count) count.textContent = String(Math.round(eased * 100)).padStart(3, "0");
    if (p < 1) requestAnimationFrame(tick);
    else finish();
  }
  requestAnimationFrame(tick);

  function finish() {
    gsap.to(loader, {
      yPercent: -100,
      duration: 0.9,
      ease: "power4.inOut",
      onComplete: () => { loader.style.display = "none"; onDone(); },
    });
  }
}

/* ============================================================
   5. HERO / HEADING REVEALS  +  scroll reveals
   ============================================================ */
function initReveals() {
  if (typeof gsap === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  if (prefersReduced) {
    gsap.set("[data-reveal], .hero__name .l span, .contact__big .l span", { opacity: 1, y: 0, yPercent: 0 });
    return;
  }

  // hero name clip reveal (runs right after loader)
  gsap.to(".hero__name .l span", {
    yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.12, delay: 0.1,
  });

  // generic scroll reveals, staggered by parent
  const groups = new Map();
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    const key = el.parentElement;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(el);
  });
  groups.forEach((els) => {
    gsap.to(els, {
      opacity: 1, y: 0, duration: 0.85, ease: "power3.out", stagger: 0.07,
      scrollTrigger: { trigger: els[0], start: "top 88%" },
    });
  });

  // contact heading clip reveal on scroll
  gsap.to(".contact__big .l span", {
    yPercent: 0, duration: 1, ease: "power4.out", stagger: 0.1,
    scrollTrigger: { trigger: ".contact", start: "top 70%" },
  });

  ScrollTrigger.refresh();
}

/* ============================================================
   6. FIT DISPLAY HEADINGS TO CONTAINER WIDTH
   Sizes each big line so it spans edge-to-edge (poster style)
   and never overflows / clips.
   ============================================================ */
function fitHeadings() {
  document.querySelectorAll(".hero__name .l span, .contact__big .l span").forEach((span) => {
    const container = span.closest(".hero__name, .contact__big");
    if (!container) return;
    const cw = container.clientWidth;
    if (!cw) return;
    const BASE = 200;
    const prev = span.style.fontSize;
    span.style.fontSize = BASE + "px";
    const tw = span.scrollWidth;
    if (!tw) { span.style.fontSize = prev; return; }
    // 0.99 safety so sub-pixel rounding never re-triggers the clip mask
    span.style.fontSize = (BASE * (cw / tw) * 0.99) + "px";
  });
}

function initFit() {
  fitHeadings();
  // refit once the display font is actually loaded (metrics differ from fallback)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      fitHeadings();
      if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
    });
  }
  let t;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      fitHeadings();
      if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
    }, 120);
  });
}

/* ============================================================
   BOOTSTRAP
   ============================================================ */
function main() {
  initMagnetic();
  initFit();

  // mask display headings immediately so they don't flash before the reveal
  if (!prefersReduced && typeof gsap !== "undefined") {
    gsap.set(".hero__name .l span, .contact__big .l span", { yPercent: 115 });
  }

  // run loader first, then play the heading reveal + wire scroll triggers
  initLoader(() => initReveals());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
