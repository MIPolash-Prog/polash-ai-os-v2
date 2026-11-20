(function () {
  "use strict";

  var THEME_KEY = "paos.v2.theme";
  var FAV_KEY = "paos.v2.favs";
  var root = document.documentElement;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function icon(name) {
    return '<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#i-' + name + '"></use></svg>';
  }
  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function getFavs() {
    var list = readJSON(FAV_KEY, []);
    return Array.isArray(list) ? list : [];
  }
  function isFav(id) { return getFavs().indexOf(id) > -1; }
  function toggleFav(id) {
    var list = getFavs();
    var i = list.indexOf(id);
    if (i > -1) list.splice(i, 1); else list.push(id);
    writeJSON(FAV_KEY, list);
    return i === -1;
  }
  function hue(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
    return h;
  }
  function logoStyle(name) {
    var h = hue(name);
    return "background:linear-gradient(140deg,hsl(" + h + " 82% 66%),hsl(" + ((h + 42) % 360) + " 82% 54%))";
  }
  function monogram(name) {
    var words = String(name).replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/);
    if (words.length > 1 && words[0] && words[1]) return (words[0][0] + words[1][0]).toUpperCase();
    return String(name).slice(0, 2).toUpperCase();
  }
  function toolById(id) {
    var list = window.PAOS_TOOLS || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function toolMatches(t, q) {
    if (!q) return true;
    var hay = (t.n + " " + t.cat + " " + t.tags.join(" ") + " " + t.d).toLowerCase();
    return q.split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
  }
  function catName(id) {
    var cats = window.PAOS_CATS || [];
    for (var i = 0; i < cats.length; i++) if (cats[i].id === id) return cats[i].n;
    return id;
  }

  function setTheme(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f4f6fc" : "#070b16");
  }

  (function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (saved === "light" || saved === "dark") setTheme(saved);
  })();

  var themeBtn = $("#themeBtn");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      setTheme(root.dataset.theme === "light" ? "dark" : "light");
    });
  }

  var header = $("#header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var menuBtn = $("#menuBtn");
  var mobileNav = $("#mobileNav");
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    $$("a", mobileNav).forEach(function (a) {
      a.addEventListener("click", function () {
        mobileNav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("click", function (e) {
      if (!mobileNav.classList.contains("open")) return;
      if (menuBtn.contains(e.target) || mobileNav.contains(e.target)) return;
      mobileNav.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    });
  }

  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  var toastEl = document.createElement("div");
  toastEl.className = "toast";
  toastEl.setAttribute("role", "status");
  toastEl.setAttribute("aria-live", "polite");
  document.body.appendChild(toastEl);
  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }

  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    items.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 60 + "ms";
      io.observe(el);
    });
  }

  function initCounters() {
    var nums = $$("[data-count]");
    if (!nums.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        var target = Number(el.getAttribute("data-count")) || 0;
        var suffix = el.getAttribute("data-suffix") || "";
        var start = performance.now();
        var dur = 1100;
        function tick(now) {
          var p = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    nums.forEach(function (el) { io.observe(el); });
  }

  var CHANNELS = [
    { name: "USA — New Hub", region: "US", niche: "1-minute trending shorts", subs: "12.4K" },
    { name: "USA — Legacy Hub", region: "US", niche: "5-minute documentaries", subs: "8.9K" },
    { name: "United Kingdom", region: "GB", niche: "Shorts and long videos", subs: "6.1K" },
    { name: "Australia", region: "AU", niche: "Shorts and long videos", subs: "4.7K" },
    { name: "Japan", region: "JP", niche: "Shorts and long videos", subs: "5.3K" },
    { name: "Germany", region: "DE", niche: "Shorts and long videos", subs: "4.2K" },
    { name: "Spain & Latin America", region: "ES", niche: "Shorts and long videos", subs: "5.8K" },
    { name: "Switzerland", region: "CH", niche: "Shorts and long videos", subs: "3.4K" },
    { name: "Netherlands", region: "NL", niche: "Shorts and long videos", subs: "3.9K" },
    { name: "Norway", region: "NO", niche: "Shorts and long videos", subs: "2.8K" },
    { name: "United Arab Emirates", region: "AE", niche: "Shorts and long videos", subs: "4.5K" },
    { name: "Bangladesh", region: "BD", niche: "Shorts and long videos", subs: "7.2K" },
    { name: "Mystic Globe Relaxing", region: "GL", niche: "Ambient loops · 30 min–3 hours", subs: "15.6K" }
  ];

  function renderChannels() {
    var grid = $("#channelGrid");
    if (!grid) return;
    grid.innerHTML = CHANNELS.map(function (c) {
      return '<div class="channel">' +
        '<span class="flag" aria-hidden="true">' + esc(c.region === "GL" ? "GL" : c.region) + '</span>' +
        '<span class="meta"><b>' + esc(c.name) + '</b><small>' + esc(c.niche) + '</small></span>' +
        '<span class="subs">' + esc(c.subs) + '</span>' +
        '</div>';
    }).join("");
  }

  function renderPreview() {
    var list = $("#previewList");
    if (!list) return;
    var input = $("#previewSearch");
    var chips = $("#previewCats");
    var active = "all";
    var tools = window.PAOS_TOOLS || [];

    if (chips && window.PAOS_CATS) {
      var order = ["assistants", "coding", "design", "seo", "video", "ytools", "teaching", "jobs"];
      var picked = order.map(function (id) {
        return window.PAOS_CATS.filter(function (c) { return c.id === id; })[0];
      }).filter(Boolean);
      chips.innerHTML = '<button class="chip active" type="button" data-pcat="all">All</button>' + picked.map(function (c) {
        return '<button class="chip" type="button" data-pcat="' + esc(c.id) + '">' + esc(c.n) + ' <span class="count">' + c.count + '</span></button>';
      }).join("");
      chips.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-pcat]");
        if (!btn) return;
        active = btn.getAttribute("data-pcat");
        $$(".chip", chips).forEach(function (c) { c.classList.toggle("active", c.getAttribute("data-pcat") === active); });
        draw();
      });
    }

    function draw() {
      var q = (input && input.value ? input.value : "").trim().toLowerCase();
      var matches = tools.filter(function (t) {
        if (active !== "all" && t.cat !== active) return false;
        return toolMatches(t, q);
      }).slice(0, 6);
      if (!matches.length) {
        list.innerHTML = '<div class="empty" style="padding:28px 16px"><b>No match</b>Try a different word or category.</div>';
        return;
      }
      list.innerHTML = matches.map(function (t) {
        return '<a class="preview-row" href="' + esc(t.u) + '" target="_blank" rel="noopener">' +
          '<span class="plogo" aria-hidden="true">' + esc(monogram(t.n)) + '</span>' +
          '<span class="pmeta"><b>' + esc(t.n) + '</b><small>' + esc(catName(t.cat)) + '</small></span>' +
          (t.badge ? '<span class="badge badge-' + t.badge.toLowerCase() + '">' + esc(t.badge) + '</span>' : '') +
          icon("ext") +
          '</a>';
      }).join("");
      $$(".plogo", list).forEach(function (el, i) { el.setAttribute("style", logoStyle(matches[i].n)); });
    }

    if (input) {
      var timer = null;
      input.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(draw, 90);
      });
    }
    draw();
  }

  function initContactForm() {
    var form = $("#contactForm");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = ($("#cName") || {}).value || "";
      var email = ($("#cEmail") || {}).value || "";
      var service = ($("#cService") || {}).value || "";
      var message = ($("#cMessage") || {}).value || "";
      if (!name.trim() || !email.trim() || !message.trim()) {
        toast("Please fill in your name, email and project details.");
        return;
      }
      var text = "Hello Polash,\n\n" +
        "Name: " + name.trim() + "\n" +
        "Email: " + email.trim() + "\n" +
        "Service: " + service + "\n\n" +
        message.trim();
      window.open("https://wa.me/8801723328481?text=" + encodeURIComponent(text), "_blank", "noopener");
      toast("WhatsApp opened with your message.");
    });
  }

  var PAGES = [
    { label: "Home", href: "index.html", kind: "Page", icon: "rocket" },
    { label: "Services", href: "index.html#services", kind: "Page", icon: "wrench" },
    { label: "AI Tools directory", href: "tools.html", kind: "Page", icon: "spark" },
    { label: "Selected work", href: "index.html#work", kind: "Page", icon: "layers" },
    { label: "YouTube network", href: "index.html#youtube", kind: "Page", icon: "youtube" },
    { label: "Learning hub", href: "index.html#learn", kind: "Page", icon: "book" },
    { label: "Workspace", href: "dashboard.html", kind: "Page", icon: "grid" },
    { label: "Contact", href: "index.html#contact", kind: "Page", icon: "mail" }
  ];

  function initPalette() {
    if ($("#cmdk")) return;
    var wrap = document.createElement("div");
    wrap.className = "cmdk";
    wrap.id = "cmdk";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", "Universal search");
    wrap.innerHTML =
      '<div class="cmdk-box">' +
        '<div class="cmdk-input-wrap">' + icon("search") +
          '<input id="cmdkInput" type="text" placeholder="Search 610 tools and pages…" aria-label="Search tools and pages" autocomplete="off">' +
          '<span class="kbd" style="font-size:10px;color:var(--dim);border:1px solid var(--line);border-radius:5px;padding:1px 5px">ESC</span>' +
        '</div>' +
        '<div class="cmdk-list" id="cmdkList" role="listbox" aria-label="Results"></div>' +
        '<div class="cmdk-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span><span><kbd>enter</kbd> open</span><span>Tools open in a new tab</span></div>' +
      '</div>';
    document.body.appendChild(wrap);

    var input = $("#cmdkInput");
    var list = $("#cmdkList");
    var selected = 0;
    var results = [];

    function build(q) {
      q = (q || "").trim().toLowerCase();
      var tools = (window.PAOS_TOOLS || []).filter(function (t) { return toolMatches(t, q); });
      var pages = PAGES.filter(function (p) {
        return !q || p.label.toLowerCase().indexOf(q) > -1;
      });
      var items = pages.map(function (p) {
        return { label: p.label, kind: p.kind, href: p.href, icon: p.icon };
      });
      items = items.concat(tools.slice(0, q ? 10 : 6).map(function (t) {
        return { label: t.n, kind: catName(t.cat), href: t.u, external: true, logo: t.n, badge: t.badge };
      }));
      return items;
    }

    function render() {
      if (!results.length) {
        list.innerHTML = '<div class="cmdk-empty">No results for “' + esc(input.value) + '”.</div>';
        return;
      }
      list.innerHTML = results.map(function (r, i) {
        return '<div class="cmdk-item' + (i === selected ? " sel" : "") + '" data-i="' + i + '" role="option" aria-selected="' + (i === selected) + '">' +
          (r.logo
            ? '<span class="ico" style="' + logoStyle(r.logo) + '">' + esc(monogram(r.logo)) + '</span>'
            : '<span class="ico" style="background:linear-gradient(140deg,rgba(245,196,81,.3),rgba(55,224,255,.22));color:var(--gold)">' + icon(r.icon || "arrow") + '</span>') +
          '<span>' + esc(r.label) + '</span>' +
          (r.badge ? '<span class="badge badge-' + r.badge.toLowerCase() + '">' + esc(r.badge) + '</span>' : '') +
          '<span class="kind">' + esc(r.kind) + '</span>' +
        '</div>';
      }).join("");
      $$(".cmdk-item", list).forEach(function (el) {
        el.addEventListener("mouseenter", function () {
          selected = Number(el.getAttribute("data-i"));
          $$(".cmdk-item", list).forEach(function (x) { x.classList.remove("sel"); });
          el.classList.add("sel");
        });
        el.addEventListener("click", function () { activate(Number(el.getAttribute("data-i"))); });
      });
    }

    function activate(i) {
      var r = results[i];
      if (!r) return;
      close();
      if (r.external) window.open(r.href, "_blank", "noopener");
      else window.location.href = r.href;
    }

    function open() {
      wrap.classList.add("open");
      document.body.style.overflow = "hidden";
      input.value = "";
      selected = 0;
      results = build("");
      render();
      setTimeout(function () { input.focus(); }, 30);
    }
    function close() {
      wrap.classList.remove("open");
      document.body.style.overflow = "";
    }

    input.addEventListener("input", function () {
      selected = 0;
      results = build(input.value);
      render();
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        selected = Math.min(selected + 1, results.length - 1);
        render();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selected = Math.max(selected - 1, 0);
        render();
      } else if (e.key === "Enter") {
        e.preventDefault();
        activate(selected);
      }
    });
    wrap.addEventListener("click", function (e) {
      if (e.target === wrap) close();
    });
    document.addEventListener("keydown", function (e) {
      var typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (wrap.classList.contains("open")) close(); else open();
      } else if (e.key === "Escape" && wrap.classList.contains("open")) {
        close();
      } else if (e.key === "/" && !typing && !wrap.classList.contains("open")) {
        var search = document.querySelector('input[type="search"], #toolSearch');
        if (search) {
          e.preventDefault();
          search.focus();
        }
      }
    });
    window.paosOpenPalette = open;
  }

  function initServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "http:" && location.protocol !== "https:") return;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }

  window.PAOS = {
    getFavs: getFavs,
    isFav: isFav,
    toggleFav: toggleFav,
    toast: toast,
    icon: icon,
    esc: esc,
    monogram: monogram,
    logoStyle: logoStyle,
    catName: catName,
    toolById: toolById,
    readJSON: readJSON,
    writeJSON: writeJSON
  };

  renderChannels();
  renderPreview();
  initContactForm();
  initPalette();
  initReveal();
  initCounters();
  initServiceWorker();
})();
