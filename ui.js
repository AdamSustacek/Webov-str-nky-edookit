/* ═══════════════════════════════════════════════════════════════
   ui.js – navigace, sidebar, přepínač dítěte, tutoriál
═══════════════════════════════════════════════════════════════ */

var NAV_ITEMS = [
  {id:'dashboard',    label:'Hlavní panel',       section:'Přehled',      icon:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'},
  {id:'inbox',        label:'Schránka',           section:null,           icon:'<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'},
  {id:'grades',       label:'Hodnocení',          section:null,           icon:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'},
  {id:'homework',     label:'Domácí úkoly',       section:'Výuka',        icon:'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'},
  {id:'tests',        label:'Písemky',            section:null,           icon:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'},
  {id:'curriculum',   label:'Učivo',              section:null,           icon:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'},
  {id:'activity',     label:'Aktivita',           section:null,           icon:'<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'},
  {id:'schedule',     label:'Rozvrh',             section:'Správa',       icon:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'},
  {id:'attendance',   label:'Docházka',           section:null,           icon:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'},
  {id:'disciplinary', label:'Výchovná opatření',  section:null,           icon:'<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'},
  {id:'messages',     label:'Nová zpráva',        section:'Zprávy',       icon:'<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'},
  {id:'settings',     label:'Nastavení',          section:'Administrace', icon:'<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M20 12h2M2 12h2M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41"/>', adminOnly:true},
  {id:'admin',        label:'Admin panel',        section:null,           icon:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', adminOnly:true}
];
var activePage = 'dashboard';

function buildNav() {
  var nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  nav.innerHTML = '';
  var db = dbGet();
  var pending = (db.homework || []).filter(function (h) { return !h.done; }).length;
  var unread  = unreadCount();
  var visible = NAV_ITEMS.filter(function (i) { return !i.adminOnly || currentRole === 'admin'; });
  var lastSection = null;

  visible.forEach(function (item) {
    if (item.section && item.section !== lastSection) {
      var lbl = document.createElement('div');
      lbl.className = 'nav-section-label' + (item.adminOnly ? ' admin-label' : '');
      lbl.textContent = item.section;
      nav.appendChild(lbl);
      lastSection = item.section;
    }
    var btn = document.createElement('button');
    btn.className = 'nav-btn' + (item.adminOnly ? ' admin-btn' : '') + (activePage === item.id ? ' active' : '');
    btn.id = 'nav-' + item.id;
    btn.addEventListener('click', function () { navigate(item.id); });
    var badge = '';
    if (item.id === 'homework' && pending > 0) badge = '<span class="nav-badge">' + pending + '</span>';
    if (item.id === 'inbox' && unread > 0)     badge = '<span class="nav-badge red">' + unread + '</span>';
    btn.innerHTML = svgIcon(item.icon, 15) + '<span class="label">' + item.label + '</span>' + badge;
    nav.appendChild(btn);
  });
}

function navigate(page) {
  if (['admin', 'settings'].indexOf(page) >= 0 && currentRole !== 'admin') return;
  activePage = page;
  document.querySelectorAll('.nav-btn').forEach(function (b) { b.classList.remove('active'); });
  var btn = document.getElementById('nav-' + page);
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
  var view = document.getElementById('view-' + page);
  if (view) view.classList.add('active');
  closeSidebar();
  renderView(page);
}

/* ── Přepínač dítěte (jen pro rodiče) ── */
function renderChildSwitcher() {
  var el = document.getElementById('child-switcher');
  if (!el) return;
  if (currentRole !== 'parent') { el.style.display = 'none'; el.innerHTML = ''; return; }
  var kids = parentChildren();
  var p = currentParent();
  var html = '<div class="cs-label">Zobrazené dítě</div>';
  if (kids.length === 0) {
    html += '<div class="cs-single" style="color:var(--fg-muted)">Žádné přiřazené dítě</div>';
  } else if (kids.length === 1) {
    html += '<div class="cs-single">' + esc(kids[0].name) + (kids[0].class ? ' · ' + esc(kids[0].class) : '') + '</div>';
  } else {
    html += '<select onchange="parentSelectChild(this.value);this.blur()">' +
      kids.map(function (k) {
        return '<option value="' + k.id + '"' + (k.id === _parentChildId ? ' selected' : '') + '>' + esc(k.name) + (k.class ? ' – ' + esc(k.class) : '') + '</option>';
      }).join('') + '</select>';
  }
  if (p) html += '<div class="cs-parent">Přihlášen: ' + esc(p.name) + '</div>';
  el.innerHTML = html;
  el.style.display = 'block';
}

/* ═══ Sidebar (mobil) ═══ */
function openSidebar() {
  var sb = document.getElementById('sidebar'); if (sb) sb.classList.add('mobile-open');
  document.getElementById('sidebar-overlay').style.display = 'block';
}
function closeSidebar() {
  var sb = document.getElementById('sidebar'); if (sb) sb.classList.remove('mobile-open');
  document.getElementById('sidebar-overlay').style.display = 'none';
}

/* ═══ Tutoriál ═══ */
var tutIndex = 0;
var TUT_STEPS = [
  {
    icon: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
    title: 'Vítejte ve Žákovské knížce',
    text: 'Přihlašujete se <strong>4místným PINem</strong> pomocí klávesnice na obrazovce. Každý žák i každý rodič má <strong>svůj vlastní PIN</strong>.'
  },
  {
    icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    title: 'Tři typy účtů',
    text: '<strong>Učitel (admin)</strong> spravuje vše. <strong>Žák</strong> vidí svá data a odškrtává úkoly. <strong>Rodič</strong> vidí data svého dítěte (jen pro čtení) – pokud má více dětí, vybere si je v levém menu.'
  },
  {
    icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    title: 'Žáci a rodiče',
    text: 'V admin panelu otevřete sekci <strong>Žáci</strong> nebo <strong>Rodiče</strong> a klikněte na <strong>„+ Přidat“</strong>. Rodiči při vytvoření zaškrtnete jedno nebo více dětí. Jedno dítě může mít i více rodičů.'
  },
  {
    icon: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    title: 'Zprávy mezi účty',
    text: '<strong>Učitel</strong> může psát jednomu rodiči či žákovi, všem rodičům, rodičům třídy nebo rodičům konkrétního žáka. <strong>Rodič a žák</strong> píší učiteli. Nové zprávy se ukazují v <strong>Schránce</strong> s červeným číslem.'
  },
  {
    icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    title: 'Automatické ukládání',
    text: 'Vše se ukládá do databáze <strong>automaticky v cloudu</strong> (Firestore) a změny se projeví na všech zařízeních. Tuto nápovědu znovu otevřete odkazem <strong>„Jak aplikace funguje?“</strong> pod přihlášením.'
  }
];

function tutRender() {
  var s = TUT_STEPS[tutIndex];
  document.getElementById('tut-icon').innerHTML = svgIcon(s.icon, 22);
  document.getElementById('tut-step').textContent = 'Krok ' + (tutIndex + 1) + ' z ' + TUT_STEPS.length;
  document.getElementById('tut-title').textContent = s.title;
  document.getElementById('tut-text').innerHTML = s.text;
  document.getElementById('tut-prev').style.visibility = tutIndex === 0 ? 'hidden' : 'visible';
  document.getElementById('tut-next').textContent = tutIndex === TUT_STEPS.length - 1 ? 'Hotovo' : 'Další';
  document.getElementById('tut-skip').style.display = tutIndex === TUT_STEPS.length - 1 ? 'none' : 'inline-flex';
  document.getElementById('tut-dots').innerHTML = TUT_STEPS.map(function (_, i) {
    return '<span class="tut-dot ' + (i === tutIndex ? 'active' : '') + '"></span>';
  }).join('');
}
function startTutorial() {
  tutIndex = 0; tutRender();
  document.getElementById('tutorial-overlay').classList.add('open');
}
function tutFinish() {
  document.getElementById('tutorial-overlay').classList.remove('open');
  try { localStorage.setItem(TUTORIAL_KEY, 'done'); } catch (e) {}
}
function tutNext() { if (tutIndex < TUT_STEPS.length - 1) { tutIndex++; tutRender(); } else { tutFinish(); } }
function tutPrev() { if (tutIndex > 0) { tutIndex--; tutRender(); } }

/* ═══ Spuštění aplikace po přihlášení ═══ */
function initApp() {
  buildNav();
  renderChildSwitcher();
  navigate(_keepPage || 'dashboard');
  _keepPage = null;
}
