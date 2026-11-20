(function () {
  "use strict";

  var P = window.PAOS;
  var TOOLS = window.PAOS_TOOLS || [];
  var CATS = window.PAOS_CATS || [];
  var grid = document.getElementById("toolGrid");
  if (!grid || !P) return;

  var search = document.getElementById("toolSearch");
  var freeToggle = document.getElementById("freeToggle");
  var favToggle = document.getElementById("favToggle");
  var sortSelect = document.getElementById("sortSelect");
  var catStrip = document.getElementById("catStrip");
  var resultCount = document.getElementById("resultCount");
  var activeFilters = document.getElementById("activeFilters");
  var clearBtn = document.getElementById("clearFilters");

  var params = new URLSearchParams(location.search);
  var state = {
    q: params.get("q") || "",
    cat: params.get("cat") || "all",
    free: params.get("free") === "1",
    fav: params.get("fav") === "1",
    sort: params.get("sort") || "curated"
  };

  var freeCount = TOOLS.filter(function (t) { return t.badge === "FREE"; }).length;
  var statTools = document.getElementById("statTools");
  var statCats = document.getElementById("statCats");
  var statFree = document.getElementById("statFree");
  if (statTools) statTools.textContent = TOOLS.length;
  if (statCats) statCats.textContent = CATS.length;
  if (statFree) statFree.textContent = freeCount;

  function catName(id) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].n;
    return id;
  }

  function renderCats() {
    var html = '<button class="chip' + (state.cat === "all" ? " active" : "") + '" type="button" data-cat="all">All <span class="count">' + TOOLS.length + '</span></button>';
    html += CATS.map(function (c) {
      return '<button class="chip' + (state.cat === c.id ? " active" : "") + '" type="button" data-cat="' + P.esc(c.id) + '">' + P.esc(c.n) + ' <span class="count">' + c.count + '</span></button>';
    }).join("");
    catStrip.innerHTML = html;
  }

  function syncControls() {
    if (search) search.value = state.q;
    if (freeToggle) freeToggle.setAttribute("aria-pressed", String(state.free));
    if (favToggle) favToggle.setAttribute("aria-pressed", String(state.fav));
    if (sortSelect) sortSelect.value = state.sort;
  }

  function matches(t, q) {
    if (!q) return true;
    var hay = (t.n + " " + t.cat + " " + t.tags.join(" ") + " " + t.d).toLowerCase();
    return q.split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
  }

  function filtered() {
    var q = state.q.trim().toLowerCase();
    var favs = P.getFavs();
    var list = TOOLS.filter(function (t) {
      if (state.cat !== "all" && t.cat !== state.cat) return false;
      if (state.free && t.badge !== "FREE") return false;
      if (state.fav && favs.indexOf(t.id) === -1) return false;
      return matches(t, q);
    });
    if (state.sort === "az") list.sort(function (a, b) { return a.n.localeCompare(b.n); });
    if (state.sort === "cat") list.sort(function (a, b) {
      var x = catName(a.cat).localeCompare(catName(b.cat));
      return x !== 0 ? x : a.n.localeCompare(b.n);
    });
    return list;
  }

  function syncUrl() {
    var p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.cat !== "all") p.set("cat", state.cat);
    if (state.free) p.set("free", "1");
    if (state.fav) p.set("fav", "1");
    if (state.sort !== "curated") p.set("sort", state.sort);
    var qs = p.toString();
    try { history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "")); } catch (e) {}
  }

  function card(t) {
    var fav = P.isFav(t.id);
    var badge = t.badge ? '<span class="badge badge-' + t.badge.toLowerCase() + '">' + P.esc(t.badge) + '</span>' : "";
    var tags = (t.tags || []).slice(0, 3).map(function (g) {
      return '<span class="tag">' + P.esc(g) + '</span>';
    }).join("");
    return '<article class="card tool-card" data-id="' + P.esc(t.id) + '">' +
      '<div class="tool-top">' +
        '<span class="tool-logo" style="' + P.logoStyle(t.n) + '" aria-hidden="true">' + P.esc(P.monogram(t.n)) + '</span>' +
        '<div class="tool-title">' +
          '<a class="tool-name" href="' + P.esc(t.u) + '" target="_blank" rel="noopener">' + P.esc(t.n) + badge + '</a>' +
          '<div class="tool-cat">' + P.esc(catName(t.cat)) + '</div>' +
        '</div>' +
      '</div>' +
      '<p class="tool-desc">' + P.esc(t.d) + '</p>' +
      '<div class="tool-tags">' + tags + '</div>' +
      '<div class="tool-actions">' +
        '<a class="open" href="' + P.esc(t.u) + '" target="_blank" rel="noopener">Open ' + P.icon("ext") + '</a>' +
        '<button class="fav-btn' + (fav ? " on" : "") + '" type="button" data-fav="' + P.esc(t.id) + '" aria-pressed="' + fav + '" aria-label="' + (fav ? "Remove " : "Save ") + P.esc(t.n) + '">' + P.icon("star") + '</button>' +
      '</div>' +
    '</article>';
  }

  function render() {
    var list = filtered();
    if (!list.length) {
      grid.innerHTML = '<div class="empty"><b>No tools match those filters</b>Try a shorter search, a different category, or reset everything.</div>';
    } else {
      grid.innerHTML = list.map(card).join("");
    }
    var total = TOOLS.length;
    resultCount.innerHTML = "Showing <b>" + list.length + "</b> of " + total + " tools";
    var bits = [];
    if (state.q) bits.push("“" + state.q + "”");
    if (state.cat !== "all") bits.push(catName(state.cat));
    if (state.free) bits.push("free only");
    if (state.fav) bits.push("saved only");
    activeFilters.textContent = bits.join(" · ");
    renderCats();
    syncControls();
    syncUrl();
  }

  function setState(patch) {
    Object.keys(patch).forEach(function (k) { state[k] = patch[k]; });
    render();
  }

  if (search) {
    var timer = null;
    search.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () { setState({ q: search.value }); }, 100);
    });
  }

  catStrip.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-cat]");
    if (!btn) return;
    setState({ cat: btn.getAttribute("data-cat") });
  });

  if (freeToggle) {
    freeToggle.addEventListener("click", function () {
      setState({ free: !state.free });
      P.toast(state.free ? "Free tools only" : "Showing all tools");
    });
  }

  if (favToggle) {
    favToggle.addEventListener("click", function () {
      setState({ fav: !state.fav });
      if (state.fav) P.toast("Showing saved tools");
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      setState({ sort: sortSelect.value });
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      setState({ q: "", cat: "all", free: false, fav: false, sort: "curated" });
      P.toast("Filters reset");
    });
  }

  grid.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-fav]");
    if (!btn) return;
    e.preventDefault();
    var id = btn.getAttribute("data-fav");
    var nowSaved = P.toggleFav(id);
    btn.classList.toggle("on", nowSaved);
    btn.setAttribute("aria-pressed", String(nowSaved));
    btn.setAttribute("aria-label", (nowSaved ? "Remove " : "Save ") + id);
    P.toast(nowSaved ? "Saved to your tools" : "Removed from saved");
    if (state.fav) render();
  });

  render();
})();
