/* ═══════════════════════════════════════════════════════════════
   views.js – vykreslení běžných stránek (žák / rodič / admin)
═══════════════════════════════════════════════════════════════ */

function renderView(page) {
  var map = {
    dashboard: renderDashboard, grades: renderGrades, schedule: renderSchedule,
    homework: renderHomework, tests: renderTests, attendance: renderAttendance,
    disciplinary: renderDisciplinary, inbox: renderInbox, messages: renderMessages,
    settings: renderSettings, admin: renderAdmin
  };
  if (map[page]) map[page]();
}

/* ── DASHBOARD ── */
function renderDashboard() {
  var db = dbGet();
  var h  = new Date().getHours();
  var greet = h < 12 ? 'Dobré ráno' : h < 17 ? 'Dobré odpoledne' : 'Dobrý večer';
  var greetEl = document.getElementById('dash-greeting');

  if (currentRole === 'parent') {
    var p = currentParent();
    var first = p ? p.name.split(' ')[0] : '';
    greetEl.textContent = greet + ', ' + first + '! Přehled žáka: ' + (db.student.name || '—') + (db.student.class ? ' (' + db.student.class + ')' : '');
  } else {
    greetEl.textContent = greet + ', ' + (db.student.name || '').split(' ')[0] + '!';
  }

  var pending = db.homework.filter(function (x) { return !x.done; }).length;
  var avg = db.grades.length ? (db.grades.reduce(function (a, g) { return a + g.value; }, 0) / db.grades.length).toFixed(1) : '—';
  var present = db.attendance.filter(function (a) { return a.status === 'present'; }).length;
  var total = db.attendance.length;

  document.getElementById('dash-stats').innerHTML =
    '<div class="stat-card"><div class="stat-label">Průměr</div><div class="stat-value">' + avg + '</div><div class="stat-sub">ze všech předmětů</div></div>' +
    '<div class="stat-card"><div class="stat-label">Nesplněné úkoly</div><div class="stat-value" style="color:' + (pending > 0 ? 'var(--warning)' : 'var(--success)') + '">' + pending + '</div><div class="stat-sub">z ' + db.homework.length + ' celkem</div></div>' +
    '<div class="stat-card"><div class="stat-label">Docházka</div><div class="stat-value">' + (total ? Math.round(present / total * 100) : 100) + '<span style="font-size:16px">%</span></div><div class="stat-sub">' + present + '/' + total + ' dní</div></div>' +
    '<div class="stat-card"><div class="stat-label">Písemky</div><div class="stat-value">' + db.tests.length + '</div><div class="stat-sub">naplánované</div></div>';

  var phw = db.homework.filter(function (x) { return !x.done; });
  document.getElementById('dash-hw').innerHTML = phw.length === 0
    ? '<div class="empty-state" style="padding:20px"><p>Žádné nesplněné úkoly 🎉</p></div>'
    : phw.slice(0, 4).map(function (hw) {
        return '<div class="dash-hw-row" style="padding:9px 16px">' + subjIcon(hw.subject) + '<span style="flex:1;font-size:13px">' + esc(hw.title) + '</span><span style="font-size:11px;color:var(--fg-muted)">' + esc(hw.dueDate) + '</span></div>';
      }).join('');

  document.getElementById('dash-tests').innerHTML = db.tests.length === 0
    ? '<div class="empty-state" style="padding:20px"><p>Žádné písemky</p></div>'
    : db.tests.slice(0, 3).map(function (t) {
        return '<div class="dash-hw-row" style="padding:9px 16px">' + subjIcon(t.subject) + '<span style="flex:1;font-size:13px">' + esc(t.topic) + '</span><span style="font-size:11px;color:var(--fg-muted)">' + esc(t.date) + '</span></div>';
      }).join('');

  document.getElementById('dash-grades').innerHTML = db.grades.length === 0
    ? '<div class="empty-state" style="padding:20px"><p>Žádné známky</p></div>'
    : db.grades.slice(-4).reverse().map(function (g) {
        var subj = db.subjects.find(function (s) { return s.id === g.subjectId; });
        return '<div class="dash-hw-row" style="padding:9px 16px">' + gradeHtml(g.value) + '<span style="flex:1;font-size:13px">' + esc(subj ? subj.short : g.subjectId) + ' <span style="color:var(--fg-muted);font-size:11px">' + esc(g.type) + '</span></span><span style="font-size:11px;color:var(--fg-muted)">' + esc(g.date) + '</span></div>';
      }).join('');

  // Rozvrh dnes
  var dayIdx = new Date().getDay() - 1;   // 0=Po … 4=Pá, -1=Ne, 5=So
  var ttLabel = document.getElementById('dash-tt-label');
  var ttDiv   = document.getElementById('dash-tt');
  if (dayIdx < 0 || dayIdx > 4) {
    if (ttLabel) ttLabel.textContent = 'Rozvrh – víkend';
    if (ttDiv)   ttDiv.innerHTML = '<div class="empty-state" style="padding:16px"><p>Dnes není školní den 🏖️</p></div>';
  } else {
    if (ttLabel) ttLabel.textContent = 'Rozvrh – ' + DAYS[dayIdx];
    var slots = db.timetable.filter(function (c) { return c.day === dayIdx; }).sort(function (a, b) { return a.period - b.period; });
    if (ttDiv) ttDiv.innerHTML = slots.length === 0
      ? '<div class="empty-state" style="padding:16px"><p>Žádné hodiny v rozvrhu</p></div>'
      : slots.map(function (c) {
          return '<div class="dash-hw-row" style="padding:8px 16px"><span style="font-size:11px;color:var(--fg-muted);width:20px;font-weight:700">' + c.period + '.</span>' + subjIcon(c.subject) +
            '<span style="flex:1;font-size:13px;font-weight:500">' + esc(c.subject) + '</span><span style="font-size:11px;color:var(--fg-muted)">' + esc(c.room) + '</span></div>';
        }).join('');
  }

  // Týdenní rozvrh
  var weeklyDiv = document.getElementById('dash-weekly-tt');
  if (weeklyDiv) {
    var wh = '<table style="width:100%;border-collapse:collapse;min-width:340px"><thead><tr><th style="width:28px;padding:5px 4px;font-size:10px;color:var(--fg-muted)">H.</th>';
    DAYS.forEach(function (d, i) {
      var today = i === dayIdx;
      wh += '<th style="text-align:center;padding:5px 3px;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:' + (today ? 'var(--primary)' : 'var(--fg-muted)') + ';font-weight:' + (today ? 700 : 600) + '">' + d.slice(0, 2) + '</th>';
    });
    wh += '</tr></thead><tbody>';
    PERIODS.forEach(function (p) {
      wh += '<tr><td style="text-align:center;font-weight:700;color:var(--fg-muted);font-size:11px;padding:2px 3px">' + p + '</td>';
      DAYS.forEach(function (_, day) {
        var c = db.timetable.find(function (x) { return x.day === day && x.period === p; });
        var today = day === dayIdx;
        wh += '<td style="padding:2px 2px"><div style="min-height:40px;border-radius:6px;padding:4px 5px;text-align:center;font-size:10px;border:1px solid ' + (today ? 'hsla(221,88%,60%,0.4)' : 'var(--border)') + ';background:' + (c ? (today ? 'hsla(221,88%,60%,0.15)' : 'var(--primary-dim)') : 'var(--surface)') + ';display:flex;flex-direction:column;align-items:center;justify-content:center">';
        wh += c ? '<div style="font-weight:700;color:var(--primary);font-size:11px">' + esc(c.subject) + '</div><div style="color:var(--fg-muted);font-size:9px">' + esc(c.room) + '</div>'
                : '<div style="color:var(--fg-dim);font-size:14px">·</div>';
        wh += '</div></td>';
      });
      wh += '</tr>';
    });
    weeklyDiv.innerHTML = wh + '</tbody></table>';
  }
}

/* ── GRADES ── */
function renderGrades() {
  var db = dbGet();
  var html = '';
  db.subjects.forEach(function (s) {
    var gr = db.grades.filter(function (g) { return g.subjectId === s.id; });
    if (gr.length === 0) return;
    var avg = (gr.reduce(function (a, g) { return a + g.value; }, 0) / gr.length).toFixed(1);
    html += '<div class="card" style="margin-bottom:10px">' +
      '<div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px">' +
      subjIcon(s.short) + '<span style="font-weight:600;flex:1">' + esc(s.name) + '</span>' +
      '<span style="font-size:12px;color:var(--fg-muted)">' + esc(s.teacher) + '</span>' +
      '<span style="font-weight:700;background:var(--surface);padding:3px 10px;border-radius:8px;font-size:13px">∅ ' + avg + '</span></div>' +
      '<div style="padding:4px 0">' +
      gr.map(function (g) {
        return '<div class="row">' + gradeHtml(g.value) + '<span style="flex:1;font-size:13px">' + esc(g.type) + '</span>' +
          (g.note ? '<span style="font-size:11px;color:var(--fg-muted)">' + esc(g.note) + '</span>' : '') +
          '<span style="font-size:11px;color:var(--fg-muted);width:80px;text-align:right">' + esc(g.date) + '</span></div>';
      }).join('') + '</div></div>';
  });
  document.getElementById('grades-content').innerHTML = html || '<div class="card card-body"><div class="empty-state"><p>Žádné známky</p></div></div>';
}

/* ── SCHEDULE ── */
function renderSchedule() {
  var db = dbGet();
  var html = '<table style="width:100%;border-collapse:collapse"><thead><tr><th style="width:36px;color:var(--fg-muted);font-size:11px;text-align:center;padding:8px 4px">H.</th>' +
    DAYS.map(function (d) { return '<th style="color:var(--fg-muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em;padding:8px 4px;text-align:center">' + d.slice(0, 2) + '</th>'; }).join('') +
    '</tr></thead><tbody>';
  PERIODS.forEach(function (p) {
    html += '<tr><td style="text-align:center;font-weight:700;color:var(--fg-muted);font-size:12px;padding:3px 4px">' + p + '</td>';
    DAYS.forEach(function (_, day) {
      var c = db.timetable.find(function (x) { return x.day === day && x.period === p; });
      html += '<td style="padding:3px 3px"><div class="tt-cell ' + (c ? 'filled' : '') + '">' +
        (c ? '<div class="tt-subj">' + esc(c.subject) + '</div><div class="tt-room">' + esc(c.room) + '</div>' : '<div class="tt-empty">·</div>') + '</div></td>';
    });
    html += '</tr>';
  });
  document.getElementById('timetable-view').innerHTML = html + '</tbody></table>';
}

/* ── HOMEWORK (rodič má jen čtení) ── */
var hwFilter = 'all';
function setHwFilter(f) {
  hwFilter = f;
  ['all', 'pending', 'done'].forEach(function (x) {
    var b = document.getElementById('hwf-' + x);
    if (b) b.className = 'btn btn-sm ' + (x === f ? 'btn-primary' : 'btn-outline');
  });
  renderHomeworkList();
}
function renderHomework() { renderHomeworkList(); }
function renderHomeworkList() {
  var db = dbGet();
  var ro = currentRole === 'parent';
  var items = db.homework;
  if (hwFilter === 'pending') items = items.filter(function (h) { return !h.done; });
  if (hwFilter === 'done')    items = items.filter(function (h) { return h.done; });
  var pending = db.homework.filter(function (h) { return !h.done; }).length;
  var lbl = document.getElementById('hw-count-label');
  if (lbl) lbl.textContent = pending + ' nesplněných z ' + db.homework.length + ' celkem';
  var list = document.getElementById('hw-list');
  if (!list) return;
  var check = svgIcon('<polyline points="20 6 9 17 4 12"/>', 11);
  list.innerHTML = items.length === 0 ? '<div class="empty-state"><p>Žádné úkoly</p></div>'
    : items.map(function (hw) {
        var box = ro
          ? '<span class="checkbox-btn readonly ' + (hw.done ? 'checked' : '') + '">' + (hw.done ? check : '') + '</span>'
          : '<button class="checkbox-btn ' + (hw.done ? 'checked' : '') + '" onclick="toggleHw(\'' + hw.id + '\')">' + (hw.done ? check : '') + '</button>';
        var del = ro ? '' : '<button class="del-btn" onclick="deleteHw(\'' + hw.id + '\')">' + svgIcon(TRASH_ICON, 13) + '</button>';
        return '<div class="row hw-row" style="padding:10px 12px">' + box + subjIcon(hw.subject) +
          '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:500;' + (hw.done ? 'text-decoration:line-through;opacity:.5' : '') + '">' + esc(hw.title) + '</div>' +
          (hw.description ? '<div style="font-size:11px;color:var(--fg-muted)">' + esc(hw.description) + '</div>' : '') + '</div>' +
          '<span style="font-size:11px;color:var(--fg-muted);white-space:nowrap">' + esc(hw.dueDate) + '</span>' + del + '</div>';
      }).join('');
}
function toggleHw(id) {
  if (currentRole === 'parent') return;
  dbSet(function (db) { var h = db.homework.find(function (x) { return x.id === id; }); if (h) h.done = !h.done; });
  buildNav(); renderHomeworkList();
}
function deleteHw(id) {
  if (currentRole === 'parent') return;
  dbSet(function (db) { db.homework = db.homework.filter(function (h) { return h.id !== id; }); });
  buildNav(); renderHomeworkList();
}

/* ── TESTS ── */
function renderTests() {
  var db = dbGet();
  document.getElementById('tests-list').innerHTML = db.tests.length === 0
    ? '<div class="empty-state"><p>Žádné naplánované písemky</p></div>'
    : db.tests.map(function (t) {
        return '<div class="row" style="padding:12px 16px">' + subjIcon(t.subject) +
          '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:500">' + esc(t.topic) + '</div>' +
          (t.teacher ? '<div style="font-size:11px;color:var(--fg-muted)">' + esc(t.teacher) + '</div>' : '') + '</div>' +
          '<span style="font-size:12px;color:var(--fg-muted);font-weight:600;white-space:nowrap">' + esc(t.date) + '</span></div>';
      }).join('');
}

/* ── ATTENDANCE ── */
function renderAttendance() {
  var db = dbGet();
  var present = db.attendance.filter(function (a) { return a.status === 'present'; }).length;
  var absent  = db.attendance.filter(function (a) { return a.status === 'absent'; }).length;
  var excused = db.attendance.filter(function (a) { return a.status === 'excused'; }).length;
  var s = document.getElementById('att-summary');
  if (s) s.textContent = present + '/' + db.attendance.length + ' přítomen · ' + absent + ' absencí · ' + excused + ' omluveno';
  document.getElementById('att-list').innerHTML = db.attendance.length === 0 ? '<div class="empty-state"><p>Žádné záznamy</p></div>'
    : db.attendance.map(function (a) {
        return '<div class="row" style="padding:10px 16px"><span style="font-size:12px;color:var(--fg-muted);width:90px">' + esc(a.date) + '</span>' + attBadge(a.status) +
          '<span style="flex:1;font-size:12px;color:var(--fg-muted);margin-left:8px">' + esc(a.note || '') + '</span></div>';
      }).join('');
}

/* ── VÝCHOVNÁ OPATŘENÍ ── */
function renderDisciplinary() {
  var db = dbGet();
  var disc = db.disciplinary || [];
  var pozitive = disc.filter(function (d) { return d.kind === 'pochvala' || d.kind === 'pochvala-red'; }).length;
  var s = document.getElementById('disc-summary');
  if (s) s.textContent = disc.length + ' opatření celkem · ' + pozitive + ' pochval · ' + (disc.length - pozitive) + ' napomenutí/důtek';

  var KINDS = {
    'pochvala':     {label:'Pochvala třídního učitele',   cls:'badge-green'},
    'pochvala-red': {label:'Pochvala ředitele',           cls:'badge-green'},
    'napomenuti':   {label:'Napomenutí třídního učitele', cls:'badge-yellow'},
    'dttu':         {label:'Důtka třídního učitele',      cls:'badge-yellow'},
    'dtred':        {label:'Důtka ředitele',              cls:'badge-red'},
    'podminecne':   {label:'Podmínečné vyloučení',        cls:'badge-red'},
    'vylouceni':    {label:'Vyloučení ze školy',          cls:'badge-red'}
  };
  document.getElementById('disc-list').innerHTML = disc.length === 0
    ? '<div class="empty-state"><p>Žádná výchovná opatření</p></div>'
    : disc.map(function (d) {
        var k = KINDS[d.kind] || {label: d.kind, cls: 'badge-gray'};
        return '<div class="row" style="padding:12px 16px"><span class="badge ' + k.cls + '" style="white-space:nowrap">' + k.label + '</span>' +
          '<div style="flex:1;min-width:0;margin-left:10px"><div style="font-size:13px;font-weight:500">' + esc(d.reason) + '</div>' +
          (d.teacher ? '<div style="font-size:11px;color:var(--fg-muted)">' + esc(d.teacher) + '</div>' : '') + '</div>' +
          '<span style="font-size:11px;color:var(--fg-muted);white-space:nowrap">' + esc(d.date) + '</span></div>';
      }).join('');
}

/* ── NASTAVENÍ (jen admin) ── */
function renderSettings() {}
function savePins() {
  var ap = document.getElementById('settings-admin-pin').value.replace(/\D/g, '');
  var sp = document.getElementById('settings-student-pin').value.replace(/\D/g, '');
  if ((ap && ap.length !== 4) || (sp && sp.length !== 4)) { alert('PIN musí mít přesně 4 číslice'); return; }
  if (ap) { var c = pinConflict(ap, 'admin'); if (c) { alert(c); return; } }
  dbSet(function (db) { if (ap) db.pins.admin = ap; if (sp) db.pins.student = sp; });
  var el = document.getElementById('pin-saved-msg');
  if (el) { el.style.display = 'flex'; setTimeout(function () { el.style.display = 'none'; }, 2500); }
  document.getElementById('settings-admin-pin').value = '';
  document.getElementById('settings-student-pin').value = '';
}
