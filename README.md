# Polash AI OS · v2

Live: **https://mipolash-prog.github.io/polash-ai-os-v2/**

The rebuilt personal operating system of Monjurul Islam Polash — a static, dependency-free site with a 610-tool AI directory, a private local workspace and the full service portfolio.

## Pages

- `index.html` — hero, services, live tool preview, case studies, reviews, YouTube network, learning, pricing, FAQ, contact
- `tools.html` — searchable and filterable directory of 610 tools in 18 categories
- `dashboard.html` — tasks, goals, notes, earnings, focus timer, world clocks, learning progress, backup/restore
- `privacy-policy.html`, `404.html`

## Stack

Plain HTML, CSS and JavaScript. No build step, no framework, no backend.

- `css/main.css` — design system, dark/light themes, responsive layout
- `js/main.js` — navigation, theme, reveal animations, command palette, tool preview, contact form, PWA registration
- `js/tools.js` — directory rendering, filters, saved tools
- `js/dashboard.js` — local workspace logic and backups
- `data/tools.js` — curated tool data
- `sw.js` + `manifest.webmanifest` — installable, offline-capable PWA

## Local preview

```
python -m http.server 8080
```

Then open `http://localhost:8080/`.

## Deploy

The repository is published with GitHub Pages from the `main` branch, root folder. Any static host works without changes.
