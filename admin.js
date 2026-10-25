/* ═══════════════════════════════════════════════════════════════
   admin.js – admin panel (správa žáků, rodičů, známek, úkolů…)
═══════════════════════════════════════════════════════════════ */

var openSection = 'student';

/* Seznam sekcí admin panelu (ikona + funkce, která sekci vykreslí) */
var ADMIN_SECTIONS = [
  {id:'student',      label:'Profil žáka',          icon:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', fn: function () { renderAdminStudent(); }},
  {id:'zaci',         label:'Žáci',                 icon:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>', fn: function () { renderAdminZaci(); }},
  {id:'parents',      label:'Rodiče',               icon:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>', fn: function () { renderAdminParents(); }},
  {id:'timetable',    label:'Rozvrh hodin',         icon:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>', fn: function () { renderAdminTimetable(); }},
  {id:'subjects',     label:'Předměty',             icon:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>', fn: function () { renderAdminSubjects(); }},
  {id:'grades',       label:'Hodnocení / Známky',   icon:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>', fn: function () { renderAdminGrades(); }},
  {id:'homework',     label:'Domácí úkoly',         icon:'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>', fn: function () { renderAdminHomework(); }},
  {id:'tests',        label:'Písemky a zkoušení',   icon:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>', fn: function () { renderAdminTests(); }},
  {id:'attendance',   label:'Docházka',             icon:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', fn: function () { renderAdminAttendance(); }},
  {id:'notes',        label:'Poznámky',             icon:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>', fn: function () { renderAdminNotes(); }},
  {id:'disciplinary', label:'Výchovná opatření',    icon:'<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>', fn: function () { renderAdminDisciplinary(); }},
  {id:'reset',        label:'Vynulování dat žáka',  icon:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/>', fn: function () { renderAdminReset(); }}
];

function renderAdmin() {
  document.getElementById('admin-sections').innerHTML = ADMIN_SECTIONS.map(function (s) {
    return '<div class="card" style="margin-bottom:10px;overflow:hidden">' +
      '<button class="section-header ' + (openSection === s.id ? 'open' : '') + '" onclick="toggleSection(\'' + s.id + '\')">' +
      '<div class="sh-icon">' + svgIcon(s.icon, 15) + '</div><span class="sh-title">' + s.label + '</span>' +
      '<span class="sh-chevron">' + svgIcon('<polyline points="6 9 12 15 18 9"/>', 15) + '</span></button>' +
      '<div class="section-body ' + (openSection === s.id ? 'open' : '') + '" id="sec-' + s.id + '"></div></div>';
  }).join('');
  if (openSection) {
    var s = ADMIN_SECTIONS.find(function (x) { return x.id === openSection; });
    if (s) s.fn();
  }
  renderAdminTargetBar();
}

function toggleSection(id) {
  ADMIN_SECTIONS.forEach(function (s) {
    var btn  = document.querySelector('.section-header[onclick*="\'' + s.id + '\'"]');
    var body = document.getElementById('sec-' + s.id);
    if (s.id === id && openSection !== id) {
      if (btn) btn.classList.add('open');
      if (body) body.classList.add('open');
      openSection = id; s.fn();
    } else {
      if (btn) btn.classList.remove('open');
      if (body) body.classList.remove('open');
      if (s.id === id) openSection = null;
    }
  });
}

/* ── Kontextový výběr žáka (komu se zapisuje) ── */
function adminTargetChip() {
  if (currentRole !== 'admin') return '';
  var m = getSelectedStudentMeta();
  if (!m) return '';
  return '<div style="display:inline-flex;align-items:center;gap:5px;background:var(--primary-dim);border:1px solid var(--primary);color:var(--primary);font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;white-space:nowrap">Pro žáka: ' + esc(m.name) + (m.class ? ' (' + esc(m.class) + ')' : '') + '</div>';
}
function renderAdminTargetBar() {
  var bar = document.getElementById('admin-target-bar');
  if (!bar) return;
  if (currentRole !== 'admin') { bar.style.display = 'none'; return; }
  var students = dbGet().students || [];
  var sel = currentStudentId();
  var selEl = document.getElementById('admin-target-select');
  if (selEl) selEl.innerHTML = students.map(function (s) {
    return '<option value="' + s.id + '"' + (s.id === sel ? ' selected' : '') + '>' + esc(s.name) + (s.class ? ' – ' + esc(s.class) : '') + '</option>';
  }).join('');
  bar.style.display = 'flex';
}
function adminStudentSelect(id, selId) {
  var students = dbGet().students || [];
  var sel = selId || currentStudentId() || (students[0] && students[0].id);
  return '<select class="form-select" id="' + id + '" style="max-width:260px;background:var(--primary-dim);border-color:var(--primary);font-weight:600">' +
    students.map(function (s) { return '<option value="' + s.id + '"' + (s.id === sel ? ' selected' : '') + '>' + esc(s.name) + (s.class ? ' – ' + esc(s.class) : '') + '</option>'; }).join('') + '</select>';
}

/* ── Profil žáka ── */
function renderAdminStudent() {
  var s = dbGet().student;
  var meta = getSelectedStudentMeta();
  document.getElementById('sec-student').innerHTML = '<div style="padding:20px">' +
    (meta ? '<div style="margin-bottom:12px;font-size:12px;color:var(--fg-muted)">Upravujete data žáka: <strong style="color:var(--fg)">' + esc(meta.name) + (meta.class ? ' (' + esc(meta.class) + ')' : '') + '</strong></div>' : '') +
    '<div class="grid-2">' +
    '<div class="form-group"><label class="form-label">Jméno</label><input class="form-input" id="as-name" value="' + esc(s.name) + '"></div>' +
    '<div class="form-group"><label class="form-label">Třída</label><input class="form-input" id="as-class" value="' + esc(s.class) + '"></div>' +
    '<div class="form-group"><label class="form-label">Škola</label><input class="form-input" id="as-school" value="' + esc(s.school) + '"></div>' +
    '<div class="form-group"><label class="form-label">Školní rok</label><input class="form-input" id="as-year" value="' + esc(s.year) + '"></div>' +
    '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Třídní učitel/ka</label><input class="form-input" id="as-teacher" value="' + esc(s.classTeacher) + '"></div></div>' +
    '<div style="display:flex;gap:8px;align-items:center"><button class="btn btn-primary btn-sm" onclick="saveAdminStudent()">Uložit</button>' +
    '<span id="as-saved" style="display:none;color:var(--success);font-size:12px;font-weight:600">✓ Uloženo</span></div></div>';
}
function saveAdminStudent() {
  var sid = currentStudentId();
  var name = document.getElementById('as-name').value;
  var cls  = document.getElementById('as-class').value;
  dbSet(function (db) {
    db.student = { name: name, class: cls, school: document.getElementById('as-school').value, year: document.getElementById('as-year').value, classTeacher: document.getElementById('as-teacher').value };
    var st = (db.students || []).find(function (x) { return x.id === sid; });
    if (st) { st.name = name; st.class = cls; }   // synchronizace do seznamu žáků
  });
  var el = document.getElementById('as-saved'); el.style.display = 'inline'; setTimeout(function () { el.style.display = 'none'; }, 2000);
}

/* ── Žáci ── */
function renderAdminZaci() {
  var students = dbGet().students || [];
  var rows = students.map(function (s) {
    var active = s.id === currentStudentId();
    var pars = parentsOfStudent(s.id).map(function (p) { return '<span class="badge badge-gray">' + esc(p.name) + '</span>'; }).join('');
    return '<tr><td style="font-weight:500">' + esc(s.name) + '</td>' +
      '<td style="font-size:12px;color:var(--fg-muted)">' + esc(s.class || '') + '</td>' +
      '<td><div class="kids-list">' + (pars || '<span style="font-size:12px;color:var(--fg-dim)">—</span>') + '</div></td>' +
      '<td><span style="font-family:var(--mono);font-size:12px;background:var(--surface);padding:2px 8px;border-radius:6px">••••</span></td>' +
      '<td style="text-align:right;white-space:nowrap">' +
      '<button class="btn btn-outline btn-xs" style="margin-right:4px;' + (active ? 'background:var(--primary-dim);border-color:var(--primary);color:var(--primary);' : '') + '" onclick="adminSelectStudent(\'' + s.id + '\',true)">' + (active ? 'Aktivní' : 'Upravit data') + '</button>' +
      '<button class="btn btn-outline btn-xs" style="margin-right:4px" onclick="editZakPin(\'' + s.id + '\')">Změnit PIN</button>' +
      (students.length > 1 ? '<button class="del-btn" style="opacity:1" onclick="deleteZak(\'' + s.id + '\')">' + svgIcon(TRASH_ICON, 13) + '</button>' : '') +
      '</td></tr>';
  }).join('');
  document.getElementById('sec-zaci').innerHTML = '<div style="padding:16px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:8px">' +
    '<div style="font-size:12px;color:var(--fg-muted)">Každý žák má vlastní PIN i vlastní data. Rodiče k žákům přiřadíte v sekci <strong>Rodiče</strong>.</div>' +
    '<button class="btn btn-primary btn-sm" style="flex-shrink:0" onclick="addZakModal()">+ Přidat žáka</button></div>' +
    '<div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Jméno</th><th>Třída</th><th>Rodiče</th><th>PIN</th><th></th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="5"><div class="empty-state"><p>Žádní žáci</p></div></td></tr>') + '</tbody></table></div></div>';
  renderAdminTargetBar();
}
function addZakModal() {
  openModal('Přidat žáka',
    '<div class="form-group"><label class="form-label">Jméno</label><input class="form-input" id="nz-name" placeholder="Jan Novák"></div>' +
    '<div class="form-group"><label class="form-label">Třída</label><input class="form-input" id="nz-class" placeholder="8.A"></div>' +
    '<div class="form-group"><label class="form-label">PIN (4 číslice)</label><input class="form-input" id="nz-pin" maxlength="4" pattern="[0-9]*" inputmode="numeric" placeholder="••••"></div>',
    '<button class="btn btn-outline btn-sm" onclick="closeModal()">Zrušit</button><button class="btn btn-primary btn-sm" onclick="saveNewZak()">Přidat</button>');
}
function saveNewZak() {
  var name = document.getElementById('nz-name').value.trim();
  var cls  = document.getElementById('nz-class').value.trim();
  var pin  = document.getElementById('nz-pin').value.replace(/\D/g, '');
  if (!name) { alert('Zadejte jméno žáka'); return; }
  if (pin.length !== 4) { alert('PIN musí mít přesně 4 číslice'); return; }
  var c = pinConflict(pin); if (c) { alert(c); return; }
  var id = uid();
  dbSet(function (db) { db.students.push({ id: id, name: name, class: cls, pin: pin }); });
  var fresh = cleanStudentData(name, cls || '8.A');
  _zaciCache[id] = fresh;
  _zaciCache[id]._dirty = true;
  ensureZaciListener(id);
  scheduleZaciSave(id);
  closeModal();
  renderAdminZaci();
}
function editZakPin(id) {
  var s = (dbGet().students || []).find(function (x) { return x.id === id; });
  if (!s) return;
  openModal('Změnit PIN – ' + s.name,
    '<div class="form-group"><label class="form-label">Nový PIN (4 číslice)</label><input class="form-input" id="ez-pin" maxlength="4" pattern="[0-9]*" inputmode="numeric" placeholder="••••"></div>',
    '<button class="btn btn-outline btn-sm" onclick="closeModal()">Zrušit</button><button class="btn btn-primary btn-sm" onclick="saveZakPin(\'' + id + '\')">Uložit</button>');
}
function saveZakPin(id) {
  var pin = document.getElementById('ez-pin').value.replace(/\D/g, '');
  if (pin.length !== 4) { alert('PIN musí mít přesně 4 číslice'); return; }
  var c = pinConflict(pin, 'student', id); if (c) { alert(c); return; }
  dbSet(function (db) { var s = (db.students || []).find(function (x) { return x.id === id; }); if (s) s.pin = pin; });
  closeModal();
  renderAdminZaci();
}
function deleteZak(id) {
  var s = (dbGet().students || []).find(function (x) { return x.id === id; });
  if (!s) return;
  if (!confirm('Smazat žáka ' + s.name + '? Smazána budou i všechna jeho data (známky, úkoly, docházka…).')) return;
  dbSet(function (db) {
    db.students = (db.students || []).filter(function (x) { return x.id !== id; });
    // odebrat žáka i ze seznamu dětí rodičů
    (db.parents || []).forEach(function (p) { p.studentIds = (p.studentIds || []).filter(function (x) { return x !== id; }); });
  });
  try { ZACI_REF.doc(id).delete(); } catch (e) { console.error('Smazání žáka selhalo:', e); }
  delete _zaciCache[id];
  if (_zaciUnsubs[id]) { try { _zaciUnsubs[id](); } catch (e) {} delete _zaciUnsubs[id]; }
  if (_adminSelectedId === id) { _adminSelectedId = firstStudentId(); _keepPage = activePage; _loadContext(); }
  else renderAdminZaci();
}

/* ── Rodiče ── */
function renderAdminParents() {
  var d = dbGet();
  var parents = d.parents || [];
  var rows = parents.map(function (p) {
    var kids = (d.students || []).filter(function (s) { return (p.studentIds || []).indexOf(s.id) >= 0; });
    var chips = kids.map(function (k) { return '<span class="badge badge-blue">' + esc(k.name) + (k.class ? ' · ' + esc(k.class) : '') + '</span>'; }).join('');
    return '<tr><td style="font-weight:500">' + esc(p.name) + '</td>' +
      '<td><div class="kids-list">' + (chips || '<span style="font-size:12px;color:var(--fg-dim)">žádné dítě</span>') + '</div></td>' +
      '<td><span style="font-family:var(--mono);font-size:12px;background:var(--surface);padding:2px 8px;border-radius:6px">••••</span></td>' +
      '<td style="text-align:right;white-space:nowrap">' +
      '<button class="btn btn-outline btn-xs" style="margin-right:4px" onclick="parentModal(\'' + p.id + '\')">Upravit</button>' +
      '<button class="btn btn-outline btn-xs" style="margin-right:4px" onclick="editParentPin(\'' + p.id + '\')">Změnit PIN</button>' +
      '<button class="del-btn" style="opacity:1" onclick="deleteParent(\'' + p.id + '\')">' + svgIcon(TRASH_ICON, 13) + '</button></td></tr>';
  }).join('');
  document.getElementById('sec-parents').innerHTML = '<div style="padding:16px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:8px">' +
    '<div style="font-size:12px;color:var(--fg-muted)">Rodič se přihlašuje vlastním PINem a vidí data přiřazených dětí (jen pro čtení). Při více dětech si je přepíná v levém menu.</div>' +
    '<button class="btn btn-primary btn-sm" style="flex-shrink:0" onclick="parentModal()">+ Přidat rodiče</button></div>' +
    '<div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Jméno</th><th>Děti</th><th>PIN</th><th></th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="4"><div class="empty-state"><p>Zatím žádní rodiče</p></div></td></tr>') + '</tbody></table></div></div>';
}
/* Přidání (bez id) nebo úprava (s id) rodiče */
function parentModal(id) {
  var d = dbGet();
  var p = id ? (d.parents || []).find(function (x) { return x.id === id; }) : null;
  if (id && !p) return;
  var students = d.students || [];
  var checks = students.length
    ? '<div class="check-list">' + students.map(function (s) {
        var on = p && (p.studentIds || []).indexOf(s.id) >= 0;
        return '<label class="check-item"><input type="checkbox" class="pm-kid" value="' + s.id + '"' + (on ? ' checked' : '') + '><span>' + esc(s.name) + (s.class ? ' – ' + esc(s.class) : '') + '</span></label>';
      }).join('') + '</div>'
    : '<div style="font-size:12px;color:var(--fg-muted)">Nejprve přidejte žáky v sekci Žáci.</div>';
  openModal(p ? 'Upravit rodiče' : 'Přidat rodiče',
    '<div class="form-group"><label class="form-label">Jméno rodiče</label><input class="form-input" id="pm-name" placeholder="Jana Nováková" value="' + esc(p ? p.name : '') + '"></div>' +
    (p ? '' : '<div class="form-group"><label class="form-label">PIN (4 číslice)</label><input class="form-input" id="pm-pin" maxlength="4" pattern="[0-9]*" inputmode="numeric" placeholder="••••"></div>') +
    '<div class="form-group" style="margin-bottom:0"><label class="form-label">Děti (lze zaškrtnout více)</label>' + checks + '</div>',
    '<button class="btn btn-outline btn-sm" onclick="closeModal()">Zrušit</button><button class="btn btn-primary btn-sm" onclick="saveParent(' + (p ? '\'' + p.id + '\'' : '') + ')">' + (p ? 'Uložit' : 'Přidat') + '</button>');
}
function saveParent(id) {
  var name = document.getElementById('pm-name').value.trim();
  var kids = Array.prototype.map.call(document.querySelectorAll('.pm-kid:checked'), function (el) { return el.value; });
  if (!name) { alert('Zadejte jméno rodiče'); return; }
  var pin = '';
  if (!id) {
    pin = document.getElementById('pm-pin').value.replace(/\D/g, '');
    if (pin.length !== 4) { alert('PIN musí mít přesně 4 číslice'); return; }
    var c = pinConflict(pin); if (c) { alert(c); return; }
  }
  dbSet(function (db) {
    if (!db.parents) db.parents = [];
    if (id) {
      var p = db.parents.find(function (x) { return x.id === id; });
      if (p) { p.name = name; p.studentIds = kids; }
    } else {
      db.parents.push({ id: uid(), name: name, pin: pin, studentIds: kids });
    }
  });
  closeModal();
  renderAdminParents();
  if (openSection === 'zaci') renderAdminZaci();
}
function editParentPin(id) {
  var p = (dbGet().parents || []).find(function (x) { return x.id === id; });
  if (!p) return;
  openModal('Změnit PIN – ' + p.name,
    '<div class="form-group"><label class="form-label">Nový PIN (4 číslice)</label><input class="form-input" id="ep-pin" maxlength="4" pattern="[0-9]*" inputmode="numeric" placeholder="••••"></div>',
    '<button class="btn btn-outline btn-sm" onclick="closeModal()">Zrušit</button><button class="btn btn-primary btn-sm" onclick="saveParentPin(\'' + id + '\')">Uložit</button>');
}
function saveParentPin(id) {
  var pin = document.getElementById('ep-pin').value.replace(/\D/g, '');
  if (pin.length !== 4) { alert('PIN musí mít přesně 4 číslice'); return; }
  var c = pinConflict(pin, 'parent', id); if (c) { alert(c); return; }
  dbSet(function (db) { var p = (db.parents || []).find(function (x) { return x.id === id; }); if (p) p.pin = pin; });
  closeModal();
  renderAdminParents();
}
function deleteParent(id) {
  var p = (dbGet().parents || []).find(function (x) { return x.id === id; });
  if (!p) return;
  if (!confirm('Smazat rodiče ' + p.name + '? Jeho účet přestane fungovat (zprávy zůstanou uložené).')) return;
  dbSet(function (db) { db.parents = (db.parents || []).filter(function (x) { return x.id !== id; }); });
  renderAdminParents();
}

/* ── Vynulování dat jednoho žáka ── */
function renderAdminReset() {
  var students = dbGet().students || [];
  var items = [['grades','Známky'],['attendance','Docházka'],['homework','Domácí úkoly'],['tests','Písemky a zkoušení'],['notes','Poznámky'],['disciplinary','Výchovná opatření'],['timetable','Rozvrh hodin'],['subjects','Předměty']];
  document.getElementById('sec-reset').innerHTML = '<div style="padding:18px">' +
    '<div class="alert alert-error" style="align-items:flex-start"><span style="font-size:18px;line-height:1">⚠</span>' +
    '<div><strong>Nevratné smazání vybraných dat</strong><div style="font-weight:400;margin-top:3px">Vyberte konkrétního žáka a pouze oblasti, které chcete vymazat. PINy, seznam žáků, rodiče a profil žáka se nemění.</div></div></div>' +
    (students.length
      ? '<div class="form-group"><label class="form-label">Žák, jehož data chcete vynulovat</label>' + adminStudentSelect('reset-sid', currentStudentId()) + '</div>' +
        '<div style="font-weight:700;font-size:13px;margin:16px 0 8px">Vyberte data k vymazání</div><div class="grid-2" style="gap:8px">' +
        items.map(function (it) {
          return '<label style="display:flex;align-items:center;gap:9px;padding:11px 12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer"><input type="checkbox" class="reset-data-check" value="' + it[0] + '" style="width:16px;height:16px;accent-color:var(--error)"><span style="font-size:13px">' + it[1] + '</span></label>';
        }).join('') + '</div>' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:16px"><button class="btn btn-danger" onclick="resetSelectedStudentData()">Vynulovat vybraná data</button><span style="font-size:11px;color:var(--fg-muted)">Hesla/PINy nejsou součástí této funkce.</span></div>'
      : '<div class="empty-state"><p>Nejprve přidejte žáka v sekci Žáci.</p></div>') + '</div>';
}
function resetSelectedStudentData() {
  if (currentRole !== 'admin') { alert('Tuto funkci může použít pouze administrátor.'); return; }
  var sid = document.getElementById('reset-sid') ? document.getElementById('reset-sid').value : null;
  var student = (dbGet().students || []).find(function (s) { return s.id === sid; });
  if (!sid || !student) { alert('Vyberte žáka.'); return; }
  var allowed = ['grades','attendance','homework','tests','notes','disciplinary','timetable','subjects'];
  var selected = Array.prototype.map.call(document.querySelectorAll('.reset-data-check:checked'), function (el) { return el.value; })
    .filter(function (k) { return allowed.indexOf(k) >= 0; });
  if (!selected.length) { alert('Nejprve zaškrtněte alespoň jednu oblast.'); return; }
  var labels = {grades:'známky',attendance:'docházku',homework:'domácí úkoly',tests:'písemky a zkoušení',notes:'poznámky',disciplinary:'výchovná opatření',timetable:'rozvrh hodin',subjects:'předměty'};
  if (!confirm('Opravdu chcete vynulovat ' + selected.map(function (k) { return labels[k]; }).join(', ') + ' u žáka ' + student.name + '? Tuto změnu nelze automaticky vrátit. Profil žáka a jeho PIN zůstanou beze změny.')) return;
  var defaults = defaultDB();
  var ok = writeStudentData(sid, function (data) {
    selected.forEach(function (key) {
      if (key === 'timetable' || key === 'subjects') data[key] = JSON.parse(JSON.stringify(defaults[key]));
      else data[key] = [];
    });
  });
  if (!ok) { alert('Data se nepodařilo změnit. Zkuste to prosím znovu.'); return; }
  alert('Hotovo. Vybraná data žáka ' + student.name + ' byla vynulována. PINy a profil zůstaly zachovány.');
  if (sid === currentStudentId()) { _keepPage = 'admin'; _loadContext(); }
  else renderAdminReset();
}

/* ── Rozvrh ── */
function renderAdminTimetable() {
  var db = dbGet();
  var html = '<div style="padding:16px;overflow-x:auto"><table style="width:100%;border-collapse:collapse;min-width:420px"><thead><tr><th style="width:32px;text-align:center;font-size:10px;color:var(--fg-muted);padding:6px 3px">H.</th>' +
    DAYS.map(function (d) { return '<th style="text-align:center;font-size:10px;color:var(--fg-muted);text-transform:uppercase;letter-spacing:.05em;padding:6px 3px">' + d.slice(0, 2) + '</th>'; }).join('') + '</tr></thead><tbody>';
  PERIODS.forEach(function (p) {
    html += '<tr><td style="text-align:center;font-weight:700;color:var(--fg-muted);font-size:11px;padding:2px 3px">' + p + '</td>';
    DAYS.forEach(function (_, day) {
      var c = db.timetable.find(function (x) { return x.day === day && x.period === p; });
      html += '<td style="padding:2px 2px"><button onclick="editTTCell(' + day + ',' + p + ')" class="tt-cell ' + (c ? 'filled' : '') + '" style="width:100%;cursor:pointer">' +
        (c ? '<div class="tt-subj">' + esc(c.subject) + '</div><div class="tt-room">' + esc(c.room) + '</div>' : '<div class="tt-empty">+</div>') + '</button></td>';
    });
    html += '</tr>';
  });
  document.getElementById('sec-timetable').innerHTML = html + '</tbody></table><p style="font-size:11px;color:var(--fg-muted);margin-top:10px">Klikněte na buňku pro úpravu</p></div>';
}
function editTTCell(day, period) {
  var db = dbGet();
  var cell = db.timetable.find(function (c) { return c.day === day && c.period === period; });
  var opts = [''].concat(db.subjects.map(function (s) { return s.short; })).map(function (s) {
    return '<option value="' + esc(s) + '"' + (cell && cell.subject === s ? ' selected' : '') + '>' + (s || '– prázdné –') + '</option>';
  }).join('');
  openModal('Úprava ' + DAYS[day] + ' – hodina ' + period,
    '<div class="form-group"><label class="form-label">Předmět</label><select class="form-select" id="tt-subj">' + opts + '</select></div>' +
    '<div class="form-group"><label class="form-label">Učebna</label><input class="form-input" id="tt-room" value="' + esc(cell ? cell.room : '') + '"></div>',
    '<button class="btn btn-outline btn-sm" onclick="closeModal()">Zrušit</button><button class="btn btn-primary btn-sm" onclick="saveTTCell(' + day + ',' + period + ')">Uložit</button>');
}
function saveTTCell(day, period) {
  var subj = document.getElementById('tt-subj').value;
  var room = document.getElementById('tt-room').value;
  dbSet(function (db) {
    var idx = db.timetable.findIndex(function (c) { return c.day === day && c.period === period; });
    if (subj === '') { if (idx >= 0) db.timetable.splice(idx, 1); }
    else if (idx >= 0) { db.timetable[idx].subject = subj; db.timetable[idx].room = room; }
    else db.timetable.push({ day: day, period: period, subject: subj, room: room });
  });
  closeModal(); renderAdminTimetable();
  if (activePage === 'schedule') renderSchedule();
  if (activePage === 'dashboard') renderDashboard();
}

/* ── Předměty ── */
var SUBJECT_TYPES = {lang:'Jazyk', sci:'Přírodověda', hum:'Humanitní', art:'Umění', tech:'Technika', sport:'Sport'};
function renderAdminSubjects() {
  var db = dbGet();
  document.getElementById('sec-subjects').innerHTML = '<div style="padding:16px"><div style="display:flex;justify-content:flex-end;margin-bottom:12px"><button class="btn btn-primary btn-sm" onclick="addSubjectModal()">+ Přidat předmět</button></div>' +
    '<div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Zkratka</th><th>Název</th><th>Učitel</th><th>Učebna</th><th>Typ</th><th></th></tr></thead><tbody>' +
    db.subjects.map(function (s) {
      return '<tr><td>' + subjIcon(s.short) + '</td><td style="font-weight:500">' + esc(s.name) + '</td><td style="color:var(--fg-muted);font-size:12px">' + esc(s.teacher) + '</td><td style="font-size:12px">' + esc(s.room) + '</td><td><span class="badge badge-gray">' + (SUBJECT_TYPES[s.type] || s.type) + '</span></td><td><button class="del-btn" style="opacity:1" onclick="deleteSubject(\'' + s.id + '\')">' + svgIcon(TRASH_ICON, 13) + '</button></td></tr>';
    }).join('') + '</tbody></table></div></div>';
}
function addSubjectModal() {
  openModal('Přidat předmět',
    '<div class="grid-2"><div class="form-group"><label class="form-label">Zkratka</label><input class="form-input" id="ns-short" maxlength="4" style="text-transform:uppercase"></div>' +
    '<div class="form-group"><label class="form-label">Název</label><input class="form-input" id="ns-name"></div>' +
    '<div class="form-group"><label class="form-label">Učitel</label><input class="form-input" id="ns-teacher"></div>' +
    '<div class="form-group"><label class="form-label">Učebna</label><input class="form-input" id="ns-room"></div>' +
    '<div class="form-group" style="grid-column:1/-1"><label class="form-label">Typ</label><select class="form-select" id="ns-type">' +
    Object.keys(SUBJECT_TYPES).map(function (v) { return '<option value="' + v + '">' + SUBJECT_TYPES[v] + '</option>'; }).join('') + '</select></div></div>',
    '<button class="btn btn-outline btn-sm" onclick="closeModal()">Zrušit</button><button class="btn btn-primary btn-sm" onclick="saveNewSubject()">Přidat</button>');
}
function saveNewSubject() {
  var short = document.getElementById('ns-short').value.trim().toUpperCase();
  var name  = document.getElementById('ns-name').value.trim();
  if (!short || !name) { alert('Zkratka a název jsou povinné'); return; }
  dbSet(function (db) {
    db.subjects.push({ id: uid(), name: name, short: short, teacher: document.getElementById('ns-teacher').value, room: document.getElementById('ns-room').value, type: document.getElementById('ns-type').value, order: db.subjects.length + 1 });
  });
  closeModal(); renderAdminSubjects();
}
function deleteSubject(id) {
  if (!confirm('Smazat?')) return;
  dbSet(function (db) { db.subjects = db.subjects.filter(function (s) { return s.id !== id; }); });
  renderAdminSubjects();
}

/* ── Známky ── */
function renderAdminGrades() {
  var db = dbGet();
  var opts = db.subjects.map(function (s) { return '<option value="' + s.id + '">' + esc(s.short) + ' – ' + esc(s.name) + '</option>'; }).join('');
  document.getElementById('sec-grades').innerHTML = '<div style="padding:16px"><div class="add-form">' +
    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;padding:10px 12px;background:var(--primary-dim);border:1px solid var(--primary);border-radius:var(--radius)"><span style="font-weight:700;font-size:13px;color:var(--primary)">✎ Známka bude zapsána žáku:</span>' + adminStudentSelect('ag-sid') + '</div>' +
    '<div class="grid-2">' +
    '<div class="form-group" style="margin-bottom:8px"><label class="form-label">Předmět</label><select class="form-select" id="ag-subj"><option value="">Vyberte…</option>' + opts + '</select></div>' +
    '<div class="form-group" style="margin-bottom:8px"><label class="form-label">Datum</label><input class="form-input" id="ag-date" placeholder="22.5.2026"></div>' +
    '<div class="form-group" style="margin-bottom:8px"><label class="form-label">Typ</label><input class="form-input" id="ag-type" value="Písemka"></div>' +
    '<div class="form-group" style="margin-bottom:8px"><label class="form-label">Známka</label><select class="form-select" id="ag-val"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></div>' +
    '<div class="form-group" style="margin-bottom:8px;grid-column:1/-1"><label class="form-label">Poznámka</label><input class="form-input" id="ag-note"></div></div>' +
    '<button class="btn btn-primary btn-sm" onclick="addGrade()">Přidat</button></div>' +
    '<div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Předmět</th><th>Typ</th><th>Hodnota</th><th>Datum</th><th>Poznámka</th><th></th></tr></thead><tbody>' +
    db.grades.map(function (g) {
      var subj = db.subjects.find(function (s) { return s.id === g.subjectId; });
      return '<tr><td>' + subjIcon(subj ? subj.short : g.subjectId) + '</td><td style="font-size:12px;color:var(--fg-muted)">' + esc(g.type) + '</td><td>' + gradeHtml(g.value) + '</td><td style="font-size:12px;color:var(--fg-muted)">' + esc(g.date) + '</td><td style="font-size:12px;color:var(--fg-muted)">' + esc(g.note || '') + '</td><td><button class="del-btn" style="opacity:1" onclick="deleteGrade(\'' + g.id + '\')">' + svgIcon(TRASH_ICON, 13) + '</button></td></tr>';
    }).join('') + '</tbody></table></div></div>';
}
function addGrade() {
  var sidSel = document.getElementById('ag-sid');
  var sid = sidSel ? sidSel.value : currentStudentId();
  var subj = document.getElementById('ag-subj').value;
  var date = document.getElementById('ag-date').value.trim();
  if (!sid) { alert('Nejprve přidejte žáka v sekci Žáci'); return; }
  if (!subj || !date) { alert('Vyberte předmět a zadejte datum'); return; }
  var grade = { id: uid(), subjectId: subj, date: date, value: Number(document.getElementById('ag-val').value), type: document.getElementById('ag-type').value, note: document.getElementById('ag-note').value };
  writeStudentData(sid, function (db) { db.grades.push(grade); });   // zápis přímo žákovi
  targetAdmin(sid);
}
function deleteGrade(id) {
  var sid = Object.keys(_zaciCache).find(function (k) { return (_zaciCache[k].grades || []).some(function (g) { return g.id === id; }); }) || currentStudentId();
  writeStudentData(sid, function (db) { db.grades = db.grades.filter(function (g) { return g.id !== id; }); });
  targetAdmin(sid);
}

/* ── Domácí úkoly ── */
function renderAdminHomework() {
  var db = dbGet();
  var opts = db.subjects.map(function (s) { return '<option value="' + esc(s.short) + '">' + esc(s.short) + '</option>'; }).join('');
  var check = svgIcon('<polyline points="20 6 9 17 4 12"/>', 11);
  document.getElementById('sec-homework').innerHTML = '<div style="padding:16px"><div class="add-form"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px"><span style="font-weight:600;font-size:13px">Přidat domácí úkol</span>' + adminTargetChip() + '</div>' +
    '<div class="grid-2">' +
    '<div class="form-group" style="margin-bottom:8px"><label class="form-label">Předmět</label><select class="form-select" id="ahw-subj"><option value="">Vyberte…</option>' + opts + '</select></div>' +
    '<div class="form-group" style="margin-bottom:8px"><label class="form-label">Termín</label><input class="form-input" id="ahw-due" placeholder="22.5.2026"></div>' +
    '<div class="form-group" style="margin-bottom:8px;grid-column:1/-1"><label class="form-label">Název</label><input class="form-input" id="ahw-title"></div>' +
    '<div class="form-group" style="margin-bottom:8px;grid-column:1/-1"><label class="form-label">Popis</label><input class="form-input" id="ahw-desc"></div></div>' +
    '<button class="btn btn-primary btn-sm" onclick="addHomework()">Přidat</button></div><div>' +
    (db.homework.map(function (hw) {
      return '<div class="row hw-row" style="padding:10px 8px"><button class="checkbox-btn ' + (hw.done ? 'checked' : '') + '" onclick="adminToggleHw(\'' + hw.id + '\')">' + (hw.done ? check : '') + '</button>' + subjIcon(hw.subject) +
        '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:500;' + (hw.done ? 'text-decoration:line-through;opacity:.5' : '') + '">' + esc(hw.title) + '</div>' + (hw.description ? '<div style="font-size:11px;color:var(--fg-muted)">' + esc(hw.description) + '</div>' : '') + '</div>' +
        '<span style="font-size:11px;color:var(--fg-muted)">' + esc(hw.dueDate) + '</span><button class="del-btn" style="opacity:1" onclick="adminDeleteHw(\'' + hw.id + '\')">' + svgIcon(TRASH_ICON, 13) + '</button></div>';
    }).join('') || '<div class="empty-state"><p>Žádné úkoly</p></div>') + '</div></div>';
}
function addHomework() {
  var subj = document.getElementById('ahw-subj').value;
  var title = document.getElementById('ahw-title').value.trim();
  var due = document.getElementById('ahw-due').value;
  if (!subj || !title || !due) { alert('Vyplňte předmět, název a termín'); return; }
  dbSet(function (db) { db.homework.push({ id: uid(), subject: subj, title: title, description: document.getElementById('ahw-desc').value, dueDate: due, done: false }); });
  buildNav(); renderAdminHomework(); if (activePage === 'homework') renderHomework();
}
function adminToggleHw(id) {
  dbSet(function (db) { var h = db.homework.find(function (x) { return x.id === id; }); if (h) h.done = !h.done; });
  buildNav(); renderAdminHomework(); if (activePage === 'homework') renderHomeworkList();
}
function adminDeleteHw(id) {
  dbSet(function (db) { db.homework = db.homework.filter(function (h) { return h.id !== id; }); });
  buildNav(); renderAdminHomework(); if (activePage === 'homework') renderHomeworkList();
}

/* ── Písemky ── */
function renderAdminTests() {
  var db = dbGet();
  var opts = db.subjects.map(function (s) { return '<option value="' + esc(s.short) + '">' + esc(s.short) + '</option>'; }).join('');
  document.getElementById('sec-tests').innerHTML = '<div style="padding:16px"><div class="add-form"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px"><span style="font-weight:600;font-size:13px">Přidat písemku</span>' + adminTargetChip() + '</div>' +
    '<div class="grid-2">' +
    '<div class="form-group" style="margin-bottom:8px"><label class="form-label">Předmět</label><select class="form-select" id="at-subj"><option value="">Vyberte…</option>' + opts + '</select></div>' +
    '<div class="form-group" style="margin-bottom:8px"><label class="form-label">Datum</label><input class="form-input" id="at-date" placeholder="22.5.2026"></div>' +
    '<div class="form-group" style="margin-bottom:8px;grid-column:1/-1"><label class="form-label">Téma</label><input class="form-input" id="at-topic"></div>' +
    '<div class="form-group" style="margin-bottom:8px;grid-column:1/-1"><label class="form-label">Učitel</label><input class="form-input" id="at-teacher"></div></div>' +
    '<button class="btn btn-primary btn-sm" onclick="addTest()">Přidat</button></div><div>' +
    (db.tests.map(function (t) {
      return '<div class="row" style="padding:10px 8px">' + subjIcon(t.subject) + '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:500">' + esc(t.topic) + '</div>' + (t.teacher ? '<div style="font-size:11px;color:var(--fg-muted)">' + esc(t.teacher) + '</div>' : '') + '</div>' +
        '<span style="font-size:12px;color:var(--fg-muted);font-weight:600">' + esc(t.date) + '</span><button class="del-btn" style="opacity:1" onclick="deleteTest(\'' + t.id + '\')">' + svgIcon(TRASH_ICON, 13) + '</button></div>';
    }).join('') || '<div class="empty-state"><p>Žádné písemky</p></div>') + '</div></div>';
}
function addTest() {
  var subj = document.getElementById('at-subj').value;
  var topic = document.getElementById('at-topic').value.trim();
  var date = document.getElementById('at-date').value;
  if (!subj || !topic || !date) { alert('Vyplňte předmět, téma a datum'); return; }
  dbSet(function (db) { db.tests.push({ id: uid(), subject: subj, topic: topic, date: date, teacher: document.getElementById('at-teacher').value }); });
  renderAdminTests(); if (activePage === 'tests') renderTests();
}
function deleteTest(id) {
  dbSet(function (db) { db.tests = db.tests.filter(function (t) { return t.id !== id; }); });
  renderAdminTests(); if (activePage === 'tests') renderTests();
}

/* ── Docházka ── */
function renderAdminAttendance() {
  var db = dbGet();
  var STATUS = [{value:'present',label:'Přítomen'},{value:'absent',label:'Nepřítomen'},{value:'excused',label:'Omluveno'},{value:'late',label:'Pozdní příchod'},{value:'school-event',label:'Školní akce'}];
  document.getElementById('sec-attendance').innerHTML = '<div style="padding:16px"><div class="add-form"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px"><span style="font-weight:600;font-size:13px">Přidat záznam</span>' + adminTargetChip() + '</div>' +
    '<div class="grid-2">' +
    '<div class="form-group" style="margin-bottom:8px"><label class="form-label">Datum</label><input class="form-input" id="aa-date" placeholder="22.5.2026"></div>' +
    '<div class="form-group" style="margin-bottom:8px"><label class="form-label">Stav</label><select class="form-select" id="aa-status">' + STATUS.map(function (o) { return '<option value="' + o.value + '">' + o.label + '</option>'; }).join('') + '</select></div>' +
    '<div class="form-group" style="margin-bottom:8px;grid-column:1/-1"><label class="form-label">Poznámka</label><input class="form-input" id="aa-note"></div></div>' +
    '<button class="btn btn-primary btn-sm" onclick="addAttendance()">Přidat</button></div><div>' +
    (db.attendance.map(function (a) {
      return '<div class="row" style="padding:10px 8px"><span style="font-size:12px;color:var(--fg-muted);width:90px">' + esc(a.date) + '</span>' + attBadge(a.status) + '<span style="flex:1;font-size:12px;color:var(--fg-muted);margin-left:8px">' + esc(a.note || '') + '</span><button class="del-btn" style="opacity:1" onclick="deleteAttendance(\'' + a.id + '\')">' + svgIcon(TRASH_ICON, 13) + '</button></div>';
    }).join('') || '<div class="empty-state"><p>Žádné záznamy</p></div>') + '</div></div>';
}
function addAttendance() {
  var date = document.getElementById('aa-date').value;
  if (!date) { alert('Zadejte datum'); return; }
  dbSet(function (db) { db.attendance.unshift({ id: uid(), date: date, status: document.getElementById('aa-status').value, note: document.getElementById('aa-note').value }); });
  renderAdminAttendance(); if (activePage === 'attendance') renderAttendance();
}
function deleteAttendance(id) {
  dbSet(function (db) { db.attendance = db.attendance.filter(function (a) { return a.id !== id; }); });
  renderAdminAttendance(); if (activePage === 'attendance') renderAttendance();
}

/* ── Poznámky ── */
function renderAdminNotes() {
  var db = dbGet();
  document.getElementById('sec-notes').innerHTML = '<div style="padding:16px"><div class="add-form">' +
    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;padding:10px 12px;background:var(--primary-dim);border:1px solid var(--primary);border-radius:var(--radius)"><span style="font-weight:700;font-size:13px;color:var(--primary)">✎ Poznámka bude zapsána žáku:</span>' + adminStudentSelect('an-sid') + '</div>' +
    '<div class="form-group"><label class="form-label">Název</label><input class="form-input" id="an-title" placeholder="Název poznámky…"></div>' +
    '<div class="form-group"><label class="form-label">Obsah</label><textarea class="form-textarea" id="an-content" placeholder="Text poznámky…"></textarea></div>' +
    '<button class="btn btn-primary btn-sm" onclick="addNote()">Přidat</button></div><div>' +
    (db.notes.length === 0 ? '<div class="empty-state"><p>Žádné poznámky</p></div>' : db.notes.map(function (n) {
      return '<div class="card" style="margin-bottom:8px"><div style="padding:12px 14px;display:flex;gap:10px;align-items:flex-start">' +
        svgIcon('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>', 14) +
        '<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13px">' + esc(n.title || '(bez názvu)') + '</div><div style="font-size:12px;color:var(--fg-muted);margin-top:3px;white-space:pre-wrap">' + esc(n.content) + '</div><div style="font-size:10px;color:var(--fg-dim);margin-top:6px">' + esc(n.updatedAt || '') + '</div></div>' +
        '<button class="del-btn" style="opacity:1;flex-shrink:0" onclick="deleteNote(\'' + n.id + '\')">' + svgIcon(TRASH_ICON, 13) + '</button></div></div>';
    }).join('')) + '</div></div>';
}
function addNote() {
  var sidSel = document.getElementById('an-sid');
  var sid = sidSel ? sidSel.value : currentStudentId();
  var title = document.getElementById('an-title').value.trim();
  var content = document.getElementById('an-content').value.trim();
  if (!sid) { alert('Nejprve přidejte žáka v sekci Žáci'); return; }
  if (!title && !content) return;
  var now = new Date().toLocaleDateString('cs-CZ');
  writeStudentData(sid, function (db) { db.notes.unshift({ id: uid(), title: title, content: content, createdAt: now, updatedAt: now }); });
  targetAdmin(sid);
}
function deleteNote(id) {
  var sid = Object.keys(_zaciCache).find(function (k) { return (_zaciCache[k].notes || []).some(function (n) { return n.id === id; }); }) || currentStudentId();
  writeStudentData(sid, function (db) { db.notes = db.notes.filter(function (n) { return n.id !== id; }); });
  targetAdmin(sid);
}

/* ── Výchovná opatření ── */
function renderAdminDisciplinary() {
  var db = dbGet();
  var disc = db.disciplinary || [];
  var KINDS = [
    {value:'pochvala',     label:'Pochvala třídního učitele'},
    {value:'pochvala-red', label:'Pochvala ředitele'},
    {value:'napomenuti',   label:'Napomenutí třídního učitele'},
    {value:'dttu',         label:'Důtka třídního učitele'},
    {value:'dtred',        label:'Důtka ředitele'},
    {value:'podminecne',   label:'Podmínečné vyloučení'},
    {value:'vylouceni',    label:'Vyloučení ze školy'}
  ];
  var BADGE = {pochvala:'badge-green','pochvala-red':'badge-green',napomenuti:'badge-yellow',dttu:'badge-yellow',dtred:'badge-red',podminecne:'badge-red',vylouceni:'badge-red'};
  document.getElementById('sec-disciplinary').innerHTML = '<div style="padding:16px"><div class="add-form">' +
    '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px"><span style="font-weight:600;font-size:13px">Přidat opatření</span>' + adminTargetChip() + '</div>' +
    '<div class="grid-2"><div class="form-group" style="margin-bottom:8px;grid-column:1/-1"><label class="form-label">Typ opatření</label><select class="form-select" id="ad-kind">' + KINDS.map(function (k) { return '<option value="' + k.value + '">' + k.label + '</option>'; }).join('') + '</select></div>' +
    '<div class="form-group" style="margin-bottom:8px"><label class="form-label">Datum</label><input class="form-input" id="ad-date" placeholder="22.5.2026"></div>' +
    '<div class="form-group" style="margin-bottom:8px"><label class="form-label">Udělil</label><input class="form-input" id="ad-teacher" placeholder="Mgr. Jana Horáčková"></div>' +
    '<div class="form-group" style="margin-bottom:8px;grid-column:1/-1"><label class="form-label">Důvod / popis</label><input class="form-input" id="ad-reason" placeholder="Popis důvodu…"></div></div>' +
    '<button class="btn btn-primary btn-sm" onclick="addDisciplinary()">Přidat</button></div><div>' +
    (disc.length === 0 ? '<div class="empty-state"><p>Žádná výchovná opatření</p></div>' : disc.map(function (d) {
      var k = KINDS.find(function (x) { return x.value === d.kind; }) || {label: d.kind};
      return '<div class="row" style="padding:12px 8px"><span class="badge ' + (BADGE[d.kind] || 'badge-gray') + '" style="white-space:nowrap;flex-shrink:0">' + k.label + '</span>' +
        '<div style="flex:1;min-width:0;margin-left:10px"><div style="font-size:13px;font-weight:500">' + esc(d.reason) + '</div>' + (d.teacher ? '<div style="font-size:11px;color:var(--fg-muted)">' + esc(d.teacher) + '</div>' : '') + '</div>' +
        '<span style="font-size:11px;color:var(--fg-muted);white-space:nowrap;margin-right:8px">' + esc(d.date) + '</span><button class="del-btn" style="opacity:1" onclick="deleteDisciplinary(\'' + d.id + '\')">' + svgIcon(TRASH_ICON, 13) + '</button></div>';
    }).join('')) + '</div></div>';
}
function addDisciplinary() {
  var kind = document.getElementById('ad-kind').value;
  var date = document.getElementById('ad-date').value;
  var reason = document.getElementById('ad-reason').value.trim();
  if (!date || !reason) { alert('Vyplňte datum a důvod'); return; }
  dbSet(function (db) {
    if (!db.disciplinary) db.disciplinary = [];
    db.disciplinary.unshift({ id: uid(), kind: kind, date: date, reason: reason, teacher: document.getElementById('ad-teacher').value });
  });
  renderAdminDisciplinary(); if (activePage === 'disciplinary') renderDisciplinary();
}
function deleteDisciplinary(id) {
  dbSet(function (db) { db.disciplinary = (db.disciplinary || []).filter(function (d) { return d.id !== id; }); });
  renderAdminDisciplinary(); if (activePage === 'disciplinary') renderDisciplinary();
}
