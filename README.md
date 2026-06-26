# Razvan Berbecar — Portfolio

A personal portfolio site built with **Three.js** (animated particle background) and
**GSAP / ScrollTrigger** (scroll-triggered reveals, parallax, custom cursor).

It's a fully static site — no build step, no backend.

## Sections
Hero · About · Stack · Projects · Contact

## Run locally
Because it uses ES modules + an import map, it must be served over HTTP (not opened
as a `file://`). Any static server works. A tiny zero-dependency one is included:

```bash
node server.js
# → http://localhost:5173
```

## Deployment
Hosted on **GitHub Pages**, served from the `main` branch root.
`.nojekyll` disables Jekyll processing so files are served as-is.

## Tech
- [Three.js](https://threejs.org/) `0.160.0`
- [GSAP](https://gsap.com/) `3.12.5` + ScrollTrigger
- Vanilla HTML / CSS / JS
