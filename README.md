# Polash AI OS v2

Beautiful upgraded version of https://mipolash-prog.github.io/polash-ai-os/#home

## Features
- Modern dark theme with animated aurora background & glassmorphism cards
- Responsive sidebar navigation that collapses on mobile
- Sections: Home, About, Services, Portfolio, AI Tools Hub, Contact
- Theme toggle (dark/light), smooth scroll, section highlighting on scroll
- Terminal-styled hero visual, 500+ AI tools directory with search & favorites
- Single-file `index.html` — zero dependencies, ready for GitHub Pages

## Deploy to GitHub Pages

1. Create a new repository on GitHub (e.g. `polash-ai-os-v2`).
2. Clone it locally:
   ```
   git clone https://github.com/<your-username>/polash-ai-os-v2.git
   cd polash-ai-os-v2
   ```
3. Copy `index.html` and `README.md` into the repo, then:
   ```
   git add index.html README.md
   git commit -m "chore: upgrade Polash AI OS v2"
   git push origin main
   ```
4. In GitHub: Settings → Pages → Build and deployment → Branch: `main` → Save.
5. Your site will be live at `https://<your-username>.github.io/polash-ai-os-v2/`.

## Local development
Open `index.html` directly in your browser, or serve it:
```
python3 -m http.server 8000
# then visit http://localhost:8000
```
