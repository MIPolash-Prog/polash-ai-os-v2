(function () {
  "use strict";

  var P = window.PAOS;
  if (!P) return;

  var KEY = "paos.v2.workspace";
  var DEFAULTS = { tasks: [], goals: [], notes: "", earnings: [], learning: {} };
  var state = P.readJSON(KEY, null);
  if (!state || typeof state !== "object" || Array.isArray(state)) state = {};
  Object.keys(DEFAULTS).forEach(function (k) {
    if (state[k] == null) state[k] = DEFAULTS[k];
  });
  if (!Array.isArray(state.tasks)) state.tasks = [];
  if (!Array.isArray(state.goals)) state.goals = [];
  if (!Array.isArray(state.earnings)) state.earnings = [];
  if (typeof state.notes !== "string") state.notes = "";
  if (typeof state.learning !== "object" || state.learning === null) state.learning = {};

  function save() { P.writeJSON(KEY, state); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function money(n) {
    return "$" + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  function shortDate(s) {
    if (!s) return "—";
    var d = new Date(s + "T00:00:00");
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }
  var icon = P.icon;
  var esc = P.esc;

  function updateStats() {
    var open = state.tasks.filter(function (t) { return !t.done; }).length;
    var total = state.earnings.reduce(function (a, e) { return a + Number(e.amount || 0); }, 0);
    var favs = P.getFavs().length;
    var st = document.getElementById("statTasks");
    var sg = document.getElementById("statGoals");
    var sm = document.getElementById("statMoney");
    var sf = document.getElementById("statFavs");
    if (st) st.textContent = open;
    if (sg) sg.textContent = state.goals.length;
    if (sm) sm.textContent = money(total);
    if (sf) sf.textContent = favs;
    var mt = document.getElementById("moneyTotal");
    var mc = document.getElementById("moneyCount");
    if (mt) mt.textContent = money(total);
    if (mc) mc.textContent = state.earnings.length ? state.earnings.length + " entr" + (state.earnings.length === 1 ? "y" : "ies") : "no entries yet";
  }

  function renderTasks() {
    var box = document.getElementById("taskList");
    if (!box) return;
    if (!state.tasks.length) {
      box.innerHTML = '<div class="empty" style="padding:26px 14px"><b>No tasks yet</b>Add the first one above.</div>';
    } else {
      box.innerHTML = state.tasks.map(function (t) {
        return '<div class="task' + (t.done ? " done" : "") + '">' +
          '<button class="check" type="button" data-task="' + esc(t.id) + '" aria-label="' + (t.done ? "Mark as open" : "Mark as done") + '" aria-pressed="' + t.done + '">' + icon("check") + '</button>' +
          '<span>' + esc(t.text) + '</span>' +
          '<button class="del" type="button" data-task-del="' + esc(t.id) + '" aria-label="Delete task">×</button>' +
        '</div>';
      }).join("");
    }
    updateStats();
  }

  function renderGoals() {
    var box = document.getElementById("goalList");
    if (!box) return;
    if (!state.goals.length) {
      box.innerHTML = '<div class="empty" style="padding:22px 14px"><b>No goals yet</b>Add something worth finishing.</div>';
      updateStats();
      return;
    }
    box.innerHTML = state.goals.map(function (g) {
      return '<div class="goal" data-goal="' + esc(g.id) + '">' +
        '<div class="goal-line"><span>' + esc(g.text) + '</span><span>' + Number(g.p) + '%</span></div>' +
        '<input type="range" min="0" max="100" value="' + Number(g.p) + '" data-goal-range="' + esc(g.id) + '" aria-label="Progress for ' + esc(g.text) + '">' +
        '<button type="button" data-goal-del="' + esc(g.id) + '" aria-label="Delete goal" style="border:0;background:transparent;color:var(--dim);font-size:10px;padding:2px 0;cursor:pointer">Remove</button>' +
      '</div>';
    }).join("");
    updateStats();
  }

  function renderMoney() {
    var body = document.getElementById("moneyBody");
    if (!body) return;
    if (!state.earnings.length) {
      body.innerHTML = '<tr><td colspan="4" style="color:var(--dim);text-align:center;padding:18px">No entries yet. Add your first payment above.</td></tr>';
    } else {
      body.innerHTML = state.earnings.slice().reverse().map(function (e) {
        return '<tr>' +
          '<td>' + esc(e.source || "—") + '</td>' +
          '<td class="dim">' + esc(shortDate(e.date)) + '</td>' +
          '<td class="amount">' + money(e.amount) + '</td>' +
          '<td><button type="button" data-money-del="' + esc(e.id) + '" aria-label="Delete entry" style="border:0;background:transparent;color:var(--dim);padding:2px;cursor:pointer">' + icon("trash") + '</button></td>' +
        '</tr>';
      }).join("");
    }
    updateStats();
  }

  var learnPlatforms = [
    { id: "w3schools", n: "W3Schools" },
    { id: "freecodecamp", n: "freeCodeCamp" },
    { id: "coursera", n: "Coursera" },
    { id: "udemy", n: "Udemy" },
    { id: "edx", n: "edX" },
    { id: "mdn", n: "MDN Web Docs" }
  ];

  function renderLearning() {
    var box = document.getElementById("learnList");
    if (!box) return;
    box.innerHTML = learnPlatforms.map(function (p) {
      var v = Math.max(0, Math.min(100, Number(state.learning[p.id] || 0)));
      return '<div class="learning-row">' +
        '<div class="top"><span>' + esc(p.n) + '</span><span data-learn-val="' + p.id + '">' + v + '%</span></div>' +
        '<input type="range" min="0" max="100" value="' + v + '" data-learn="' + p.id + '" aria-label="Progress for ' + esc(p.n) + '">' +
      '</div>';
    }).join("");
  }

  function renderSaved() {
    var box = document.getElementById("savedTools");
    if (!box) return;
    var favs = P.getFavs();
    if (!favs.length) {
      box.innerHTML = '<p class="dim" style="font-size:12px">No saved tools yet. <a href="tools.html" style="color:var(--gold)">Browse the directory</a> and tap the star.</p>';
      return;
    }
    box.innerHTML = favs.map(function (id) {
      var t = P.toolById(id);
      if (!t) return "";
      return '<a class="chip" href="' + esc(t.u) + '" target="_blank" rel="noopener">' + icon("star") + esc(t.n) + '</a>';
    }).join("");
    updateStats();
  }

  var taskForm = document.getElementById("taskForm");
  if (taskForm) {
    taskForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("taskInput");
      var text = (input.value || "").trim();
      if (!text) return;
      state.tasks.unshift({ id: uid(), text: text, done: false });
      input.value = "";
      save();
      renderTasks();
      input.focus();
    });
  }

  var taskList = document.getElementById("taskList");
  if (taskList) {
    taskList.addEventListener("click", function (e) {
      var toggle = e.target.closest("[data-task]");
      var del = e.target.closest("[data-task-del]");
      if (toggle) {
        var id = toggle.getAttribute("data-task");
        state.tasks.forEach(function (t) { if (t.id === id) t.done = !t.done; });
        save();
        renderTasks();
      } else if (del) {
        var did = del.getAttribute("data-task-del");
        state.tasks = state.tasks.filter(function (t) { return t.id !== did; });
        save();
        renderTasks();
      }
    });
  }

  var clearDone = document.getElementById("clearDone");
  if (clearDone) {
    clearDone.addEventListener("click", function () {
      var before = state.tasks.length;
      state.tasks = state.tasks.filter(function (t) { return !t.done; });
      if (before === state.tasks.length) { P.toast("No completed tasks to clear"); return; }
      save();
      renderTasks();
      P.toast("Completed tasks cleared");
    });
  }

  var goalForm = document.getElementById("goalForm");
  if (goalForm) {
    goalForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("goalInput");
      var text = (input.value || "").trim();
      if (!text) return;
      state.goals.push({ id: uid(), text: text, p: 0 });
      input.value = "";
      save();
      renderGoals();
      input.focus();
    });
  }

  var goalList = document.getElementById("goalList");
  if (goalList) {
    goalList.addEventListener("input", function (e) {
      var range = e.target.closest("[data-goal-range]");
      if (!range) return;
      var id = range.getAttribute("data-goal-range");
      var val = Number(range.value);
      state.goals.forEach(function (g) { if (g.id === id) g.p = val; });
      var line = range.parentElement.querySelector(".goal-line span:last-child");
      if (line) line.textContent = val + "%";
      save();
    });
    goalList.addEventListener("click", function (e) {
      var del = e.target.closest("[data-goal-del]");
      if (!del) return;
      var id = del.getAttribute("data-goal-del");
      state.goals = state.goals.filter(function (g) { return g.id !== id; });
      save();
      renderGoals();
    });
  }

  var notes = document.getElementById("notesArea");
  if (notes) {
    notes.value = state.notes;
    var notesTimer = null;
    var notesState = document.getElementById("notesState");
    notes.addEventListener("input", function () {
      state.notes = notes.value;
      if (notesState) notesState.textContent = "Saving…";
      clearTimeout(notesTimer);
      notesTimer = setTimeout(function () {
        save();
        if (notesState) notesState.textContent = "Saved";
      }, 350);
    });
  }

  var moneyForm = document.getElementById("moneyForm");
  var moneyDate = document.getElementById("moneyDate");
  if (moneyDate) moneyDate.value = new Date().toISOString().slice(0, 10);
  if (moneyForm) {
    moneyForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var source = document.getElementById("moneySource");
      var amount = document.getElementById("moneyAmount");
      var val = Number(amount.value);
      if (!(source.value || "").trim()) { P.toast("Add an income source first"); source.focus(); return; }
      if (!val || val < 0) { P.toast("Enter a valid amount"); amount.focus(); return; }
      state.earnings.push({ id: uid(), source: source.value.trim(), amount: val, date: moneyDate.value });
      source.value = "";
      amount.value = "";
      save();
      renderMoney();
      P.toast("Earning added");
    });
  }

  var moneyBody = document.getElementById("moneyBody");
  if (moneyBody) {
    moneyBody.addEventListener("click", function (e) {
      var del = e.target.closest("[data-money-del]");
      if (!del) return;
      var id = del.getAttribute("data-money-del");
      state.earnings = state.earnings.filter(function (x) { return x.id !== id; });
      save();
      renderMoney();
    });
  }

  var learnList = document.getElementById("learnList");
  if (learnList) {
    learnList.addEventListener("input", function (e) {
      var range = e.target.closest("[data-learn]");
      if (!range) return;
      var id = range.getAttribute("data-learn");
      var val = Number(range.value);
      state.learning[id] = val;
      var label = learnList.querySelector('[data-learn-val="' + id + '"]');
      if (label) label.textContent = val + "%";
      save();
    });
  }

  var clockZones = [
    { c: "Dhaka", tz: "Asia/Dhaka" },
    { c: "London", tz: "Europe/London" },
    { c: "New York", tz: "America/New_York" },
    { c: "Dubai", tz: "Asia/Dubai" }
  ];
  function renderClocks() {
    var box = document.getElementById("clockGrid");
    if (!box) return;
    box.innerHTML = clockZones.map(function (z) {
      return '<div class="clock"><b>' + esc(z.c) + '</b><div class="t" data-tz="' + esc(z.tz) + '">--:--</div></div>';
    }).join("");
    tickClocks();
  }
  function tickClocks() {
    document.querySelectorAll("[data-tz]").forEach(function (el) {
      try {
        el.textContent = new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit", minute: "2-digit", hour12: false, timeZone: el.getAttribute("data-tz")
        }).format(new Date());
      } catch (e) { el.textContent = "--:--"; }
    });
  }

  var totalSec = 25 * 60;
  var remaining = totalSec;
  var running = false;
  var tickHandle = null;
  var timerTime = document.getElementById("timerTime");
  var timerRing = document.getElementById("timerRing");
  var timerStart = document.getElementById("timerStart");
  var timerReset = document.getElementById("timerReset");

  function paintTimer() {
    var m = Math.floor(remaining / 60);
    var s = remaining % 60;
    if (timerTime) timerTime.textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    if (timerRing) timerRing.style.setProperty("--p", String(((totalSec - remaining) / totalSec) * 100));
    if (timerStart) {
      timerStart.innerHTML = icon(running ? "pause" : "play") + (running ? " Pause" : " Start");
    }
  }
  function stopTimer() {
    running = false;
    clearInterval(tickHandle);
    tickHandle = null;
    paintTimer();
  }
  if (timerStart) {
    timerStart.addEventListener("click", function () {
      if (running) { stopTimer(); return; }
      running = true;
      tickHandle = setInterval(function () {
        remaining -= 1;
        if (remaining <= 0) {
          stopTimer();
          remaining = totalSec;
          paintTimer();
          P.toast("Focus session complete — take a short break.");
          return;
        }
        paintTimer();
      }, 1000);
      paintTimer();
    });
  }
  if (timerReset) {
    timerReset.addEventListener("click", function () {
      stopTimer();
      remaining = totalSec;
      paintTimer();
    });
  }

  function exportData() {
    var payload = {
      app: "Polash AI OS",
      version: 2,
      exportedAt: new Date().toISOString(),
      workspace: state,
      favs: P.getFavs(),
      theme: document.documentElement.dataset.theme
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "polash-ai-os-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
    P.toast("Backup downloaded");
  }

  var exportBtn = document.getElementById("exportBtn");
  if (exportBtn) exportBtn.addEventListener("click", exportData);

  var importBtn = document.getElementById("importBtn");
  var importFile = document.getElementById("importFile");
  if (importBtn && importFile) {
    importBtn.addEventListener("click", function () { importFile.click(); });
    importFile.addEventListener("change", function () {
      var file = importFile.files && importFile.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(reader.result);
          var ws = data.workspace || data;
          if (!ws || typeof ws !== "object" || !Array.isArray(ws.tasks)) throw new Error("invalid");
          var clean = {
            tasks: Array.isArray(ws.tasks) ? ws.tasks : [],
            goals: Array.isArray(ws.goals) ? ws.goals : [],
            notes: typeof ws.notes === "string" ? ws.notes : "",
            earnings: Array.isArray(ws.earnings) ? ws.earnings : [],
            learning: ws.learning && typeof ws.learning === "object" ? ws.learning : {}
          };
          P.writeJSON(KEY, clean);
          if (Array.isArray(data.favs)) P.writeJSON("paos.v2.favs", data.favs);
          P.toast("Backup restored");
          setTimeout(function () { location.reload(); }, 700);
        } catch (err) {
          P.toast("That file is not a valid backup.");
        }
      };
      reader.readAsText(file);
    });
  }

  var resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (!window.confirm("Erase all workspace data, saved tools and preferences from this browser?")) return;
      try {
        Object.keys(localStorage).forEach(function (k) {
          if (k.indexOf("paos.v2.") === 0) localStorage.removeItem(k);
        });
      } catch (e) {}
      location.reload();
    });
  }

  renderTasks();
  renderGoals();
  renderMoney();
  renderLearning();
  renderSaved();
  renderClocks();
  setInterval(tickClocks, 20000);
  paintTimer();
})();
