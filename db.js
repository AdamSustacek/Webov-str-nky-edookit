/* ═══════════════════════════════════════════════════════════════
   db.js – Firebase, cache dat a ukládání

   Struktura ve Firestore (NIC se ručně nemění):
     meta/hlavni       → { pins, students, parents }   (parents je nové pole,
                         vznikne samo při prvním uložení adminem)
     zaci/{studentId}  → data jednoho žáka (známky, úkoly, rozvrh…)
     zpravy/{id}       → zprávy mezi účty (nová kolekce, vznikne sama)
═══════════════════════════════════════════════════════════════ */

firebase.initializeApp(firebaseConfig);
var db_fs      = firebase.firestore();
var META_REF   = db_fs.collection('meta').doc('hlavni');
var LEGACY_REF = db_fs.collection('skola').doc('hlavni');
var ZACI_REF   = db_fs.collection('zaci');
var MSG_REF    = db_fs.collection(MSG_COLLECTION);

/* ── Stav v paměti ── */
var _cache       = null;   // data aktuálního kontextu + pins + students + parents
var _metaStore   = null;   // {pins, students, parents} – společná nastavení z meta/hlavni
var _zaciCache   = {};     // { studentId: data žáka }
var _zaciTimer   = null;
var _saveTimer   = null;
var _ignoreNext  = false;
var _ignoreZaci  = {};
var _unsubscribe = null;
var _zaciUnsubs  = {};     // real-time listenery jednotlivých žáků
var _dataReady   = false;  // true po načtení dat z Firebase

/* ═══ Loader ═══ */
function showLoader(msg) {
  var el = document.getElementById('fb-loader');
  if (!el) {
    el = document.createElement('div');
    el.id = 'fb-loader';
    el.style.cssText = 'position:fixed;inset:0;z-index:1100;background:hsl(225,43%,8%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px';
    el.innerHTML =
      '<div style="width:36px;height:36px;border:3px solid hsla(221,88%,60%,0.2);border-top-color:hsl(221,88%,60%);border-radius:50%;animation:spin 0.8s linear infinite"></div>' +
      '<div id="fb-loader-msg" style="color:hsl(215,18%,52%);font-size:13px;font-family:\'DM Sans\',sans-serif">' + msg + '</div>';
    document.body.appendChild(el);
  } else {
    var m = document.getElementById('fb-loader-msg');
    if (m) m.textContent = msg;
  }
}
function hideLoader() {
  var el = document.getElementById('fb-loader');
  if (el) { el.style.transition = 'opacity 0.3s'; el.style.opacity = '0'; setTimeout(function () { el.remove(); }, 320); }
}

/* ═══ Převody dat ═══ */
function firestoreToCache(data) {
  try { return JSON.parse(data.json); } catch (e) { return null; }
}
function cacheToFirestore(cache) {
  return { json: JSON.stringify(cache) };
}

/* Tolerantní čtení meta/hlavni – podporuje {json} i nativní pole {pins, students, parents} */
function metaFromFirestore(data) {
  if (!data) return null;
  if (data.json) {
    try {
      var p = JSON.parse(data.json);
      if (p && (p.students || p.pins)) return normMeta(p);
    } catch (e) {}
  }
  if (data.students || data.pins || data.parents) return normMeta(data);
  return null;
}
function normMeta(p) {
  return {
    pins:     p.pins || {},
    students: Array.isArray(p.students) ? p.students : [],
    parents:  Array.isArray(p.parents)  ? p.parents  : []
  };
}
/* Dokument, který se zapisuje do meta/hlavni */
function buildMetaDoc(c) {
  return {
    pins:     c.pins,
    students: JSON.parse(JSON.stringify(c.students || [])),
    parents:  JSON.parse(JSON.stringify(c.parents  || []))
  };
}
function mergeWithDefaults(data) {
  var def = defaultDB();
  Object.keys(def).forEach(function (k) { if (data[k] === undefined) data[k] = def[k]; });
  return data;
}
function loadFromLocalStorage() {
  try { var r = localStorage.getItem('zs_alexandra_db'); if (r) return mergeWithDefaults(JSON.parse(r)); } catch (e) {}
  return defaultDB();
}

/* ═══ Výchozí data ═══ */
function defaultDB() {
  return {
    student: { name:'Jan Novák', class:'8.A', school:'ZS Alexandra', year:'2025/2026', classTeacher:'Mgr. Jana Horáčková' },
    subjects: [
      {id:'mat',name:'Matematika',     short:'MAT',teacher:'Mgr. Pavel Horák',      room:'21',type:'sci',  order:1},
      {id:'csj',name:'Český jazyk',    short:'ČSJ',teacher:'Mgr. Jana Horáčková',  room:'15',type:'hum',  order:2},
      {id:'ang',name:'Anglický jazyk', short:'ANG',teacher:'Mgr. Petra Dvořáčková',room:'12',type:'lang', order:3},
      {id:'fyz',name:'Fyzika',         short:'FYZ',teacher:'Ing. Tomáš Novotný',    room:'18',type:'sci',  order:4},
      {id:'che',name:'Chemie',         short:'CHE',teacher:'RNDr. Eva Součková',    room:'19',type:'sci',  order:5},
      {id:'bio',name:'Biologie',       short:'BIO',teacher:'Mgr. Lucie Marková',    room:'14',type:'sci',  order:6},
      {id:'dej',name:'Dějepis',        short:'DEJ',teacher:'Mgr. Radek Beneš',      room:'16',type:'hum',  order:7},
      {id:'zsv',name:'Zeměpis',        short:'ZSV',teacher:'Mgr. Alena Říhová',     room:'13',type:'hum',  order:8},
      {id:'inf',name:'Informatika',    short:'INF',teacher:'Ing. Marek Procházka',  room:'20',type:'tech', order:9},
      {id:'tv', name:'Těl. výchova',   short:'TV', teacher:'Mgr. Petr Kratochvíl',  room:'TL',type:'sport',order:10}
    ],
    grades: [
      {id:'g1',subjectId:'mat',value:2,type:'Písemka',date:'15.5.2026',note:'Kvadratické rovnice'},
      {id:'g2',subjectId:'csj',value:1,type:'Sloh',   date:'12.5.2026',note:''},
      {id:'g3',subjectId:'ang',value:2,type:'Test',   date:'8.5.2026', note:'Unit 7'},
      {id:'g4',subjectId:'fyz',value:3,type:'Ústní',  date:'6.5.2026', note:'Optika'},
      {id:'g5',subjectId:'mat',value:1,type:'Ústní',  date:'2.5.2026', note:''},
      {id:'g6',subjectId:'bio',value:2,type:'Test',   date:'28.4.2026',note:'Evoluce'}
    ],
    timetable: [
      {day:0,period:1,subject:'MAT',room:'21'},{day:0,period:2,subject:'ČSJ',room:'15'},{day:0,period:3,subject:'ANG',room:'12'},{day:0,period:4,subject:'FYZ',room:'18'},{day:0,period:5,subject:'TV',room:'TL'},
      {day:1,period:1,subject:'ČSJ',room:'15'},{day:1,period:2,subject:'MAT',room:'21'},{day:1,period:3,subject:'CHE',room:'19'},{day:1,period:4,subject:'BIO',room:'14'},{day:1,period:5,subject:'INF',room:'20'},
      {day:2,period:1,subject:'ANG',room:'12'},{day:2,period:2,subject:'DEJ',room:'16'},{day:2,period:3,subject:'MAT',room:'21'},{day:2,period:4,subject:'ZSV',room:'13'},{day:2,period:5,subject:'TV',room:'TL'},
      {day:3,period:1,subject:'FYZ',room:'18'},{day:3,period:2,subject:'ANG',room:'12'},{day:3,period:3,subject:'ČSJ',room:'15'},{day:3,period:4,subject:'CHE',room:'19'},{day:3,period:5,subject:'BIO',room:'14'},
      {day:4,period:1,subject:'MAT',room:'21'},{day:4,period:2,subject:'ZSV',room:'13'},{day:4,period:3,subject:'DEJ',room:'16'},{day:4,period:4,subject:'INF',room:'20'}
    ],
    homework: [
      {id:'hw1',subject:'MAT',title:'Příklady str. 85, č.1–10',description:'Lineární nerovnice',dueDate:'26.5.2026',done:false},
      {id:'hw2',subject:'ANG',title:'Přečíst Unit 8',           description:'Slovíčka + grammar', dueDate:'27.5.2026',done:false},
      {id:'hw3',subject:'ČSJ',title:'Slohovka – popis osoby',   description:'Min. 200 slov',      dueDate:'28.5.2026',done:true},
      {id:'hw4',subject:'BIO',title:'Referát o evoluci',         description:'Prezentace 5 min',   dueDate:'2.6.2026', done:false}
    ],
    tests: [
      {id:'t1',subject:'MAT',topic:'Funkce a grafy',               date:'27.5.2026',teacher:'Mgr. Pavel Horák'},
      {id:'t2',subject:'CHE',topic:'Organická chemie – opakování', date:'29.5.2026',teacher:'RNDr. Eva Součková'},
      {id:'t3',subject:'FYZ',topic:'Elektřina a magnetismus',      date:'3.6.2026', teacher:'Ing. Tomáš Novotný'}
    ],
    attendance: [
      {id:'a1',date:'24.5.2026',status:'present',note:''},
      {id:'a2',date:'23.5.2026',status:'present',note:''},
      {id:'a3',date:'22.5.2026',status:'excused',note:'Nemoc'},
      {id:'a4',date:'21.5.2026',status:'present',note:''},
      {id:'a5',date:'20.5.2026',status:'late',   note:'Zpoždění vlaku'}
    ],
    notes: [],
    disciplinary: [],
    pins: { admin:'8520', student:'0258' },
    students: [],   // {id, name, class, pin} – data žáků jsou v kolekci zaci/{id}
    parents:  []    // {id, name, pin, studentIds:[…]} – rodiče a jejich děti
  };
}

/* Čistá šablona dat žáka – předměty a rozvrh z výchozích hodnot, bez ukázkových známek/úkolů */
function cleanStudentData(name, cls) {
  var d = defaultDB();
  delete d.pins; delete d.students; delete d.parents;
  d.student.name = name || '';
  d.student.class = cls || '';
  d.grades = []; d.homework = []; d.tests = [];
  d.attendance = []; d.notes = []; d.disciplinary = [];
  return d;
}

/* ═══ Inicializace z Firebase ═══ */
async function firebaseInit() {
  showLoader('Připojování k databázi…');
  try {
    showLoader('Načítám data…');
    var snap = await META_REF.get();
    if (snap.exists) {
      var loaded = metaFromFirestore(snap.data());
      _cache = loaded ? mergeWithDefaults(loaded) : defaultDB();
      console.log('✅ Firebase: data načtena');

      // meta bez žáků → zkusit doplnit migrací ze staré kolekce
      if (!_cache.students || _cache.students.length === 0) {
        try {
          var legacy = await LEGACY_REF.get();
          if (legacy.exists) {
            var lm = mergeWithDefaults(firestoreToCache(legacy.data()) || {});
            if (lm && lm.student && lm.student.name) {
              _cache.students = [{ id:'zak1', name: lm.student.name, class: lm.student.class, pin: (lm.pins && lm.pins.student) || '0258' }];
              if (lm.pins) _cache.pins = lm.pins;
              var zakDoc = await ZACI_REF.doc('zak1').get();
              if (!zakDoc.exists) {
                var zd = Object.assign({}, lm); delete zd.pins; delete zd.students; delete zd.parents;
                await ZACI_REF.doc('zak1').set(cacheToFirestore(zd));
              }
              await META_REF.set(buildMetaDoc(_cache));
              console.log('🔁 Doplněna migrace žáka z kolekce skola');
            }
          }
        } catch (e) { console.log('ℹ️ Migrace ze skola přeskočena:', e.code || e); }
      }
    } else {
      // První spuštění – zkusit migraci starých dat ze skola/hlavni
      var migrated = null;
      try {
        var leg = await LEGACY_REF.get();
        if (leg.exists) migrated = firestoreToCache(leg.data());
      } catch (e) { console.log('ℹ️ Stará kolekce skola nenalezena – čistý start'); }

      if (migrated) {
        console.log('🔁 Migrace starých dat (skola/hlavni → meta + zaci)…');
        migrated = mergeWithDefaults(migrated);
        var zakPin = (migrated.pins && migrated.pins.student) || '0258';
        _cache = defaultDB();
        _cache.pins = migrated.pins || _cache.pins;
        _cache.students = [{ id:'zak1', name: migrated.student.name, class: migrated.student.class, pin: zakPin }];
        await META_REF.set(buildMetaDoc(_cache));
        var zakData = Object.assign({}, migrated);
        delete zakData.pins; delete zakData.students; delete zakData.parents;
        await ZACI_REF.doc('zak1').set(cacheToFirestore(zakData));
      } else {
        console.log('📝 Firebase: první spuštění, vytvářím dokument…');
        _cache = defaultDB();
        _cache.students = [{ id:'zak1', name: _cache.student.name, class: _cache.student.class, pin: _cache.pins.student }];
        await META_REF.set(buildMetaDoc(_cache));
        var zd2 = Object.assign({}, _cache);
        delete zd2.pins; delete zd2.students; delete zd2.parents;
        await ZACI_REF.doc('zak1').set(cacheToFirestore(zd2));
      }
    }
    if (!_cache.parents) _cache.parents = [];

    // Načíst žáky z kolekce zaci/{studentId}
    var zaciSnap = await ZACI_REF.get();
    _zaciCache = {};
    zaciSnap.forEach(function (d) {
      var parsed = firestoreToCache(d.data());
      if (parsed) _zaciCache[d.id] = parsed;
    });
    // Žáci bez dat dostanou výchozí šablonu
    (dbGet().students || []).forEach(function (s) {
      if (!_zaciCache[s.id]) {
        var fresh = defaultDB();
        delete fresh.pins; delete fresh.students; delete fresh.parents;
        fresh.student.name = s.name;
        fresh.student.class = s.class || fresh.student.class;
        _zaciCache[s.id] = fresh;
        ZACI_REF.doc(s.id).set(cacheToFirestore(fresh)).catch(function (e) { console.error('❌ Vytvoření dat žáka:', e.code, e.message); });
      }
    });
    _metaStore = buildMetaDoc(_cache);
  } catch (e) {
    console.error('❌ Firebase chyba:', e.code, e.message);
    showLoader('⚠️ Firebase nedostupný – používám lokální data');
    await new Promise(function (r) { setTimeout(r, 1500); });
    _cache = loadFromLocalStorage();
    if (!_cache.parents) _cache.parents = [];
    _metaStore = buildMetaDoc(_cache);
  }

  hideLoader();
  _dataReady = true;

  // Real-time listener společných nastavení (meta/hlavni)
  try {
    _unsubscribe = META_REF.onSnapshot(function (snap) {
      if (!snap.exists) return;
      if (_ignoreNext) { _ignoreNext = false; return; }
      var remote = metaFromFirestore(snap.data());
      if (!remote || !_cache) return;
      if (remote.pins)     { _cache.pins = remote.pins;         if (_metaStore) _metaStore.pins = remote.pins; }
      if (remote.students) { _cache.students = remote.students; if (_metaStore) _metaStore.students = remote.students; }
      if (remote.parents)  { _cache.parents = remote.parents;   if (_metaStore) _metaStore.parents = remote.parents; }
      try { buildNav(); renderChildSwitcher(); renderView(activePage); } catch (e) {}
    }, function (err) { console.error('❌ Firestore listener:', err.code, err.message); });
  } catch (e) { console.error('❌ onSnapshot failed:', e); }

  // Real-time listenery jednotlivých žáků
  Object.keys(_zaciCache).forEach(ensureZaciListener);

  // Obnovit přihlášení z session
  var sess = sessionLoad();
  if (sess && sess.role) restoreSession(sess);
}

/* ═══ Ukládání ═══ */
function scheduleSave() {
  if (currentRole === 'parent') return;          // rodič nic nezapisuje
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(function () {
    if (_switching) return;                      // nepřepisovat data během přepínání žáka

    // 1) Data žáka → zaci/{studentId}
    var sid = currentStudentId();
    if (sid) {
      if (!_zaciCache[sid]) {
        var one = (dbGet().students || []).find(function (s) { return s.id === sid; });
        _zaciCache[sid] = cleanStudentData(one ? one.name : '', one ? one.class : '');
      }
      STUDENT_DATA_KEYS.forEach(function (k) { _zaciCache[sid][k] = JSON.parse(JSON.stringify(_cache[k])); });
      _zaciCache[sid]._dirty = true;
      scheduleZaciSave(sid);
    }

    // 2) Společná nastavení (PINy, žáci, rodiče) → meta/hlavni – jen admin
    if (currentRole === 'admin') {
      var metaDoc = buildMetaDoc(_cache);
      _metaStore = buildMetaDoc(_cache);
      _ignoreNext = true;
      META_REF.set(metaDoc)
        .then(function () {
          console.log('✅ Uloženo do Firebase');
          try { localStorage.setItem('zs_alexandra_db', JSON.stringify(_cache)); } catch (e) {}
        })
        .catch(function (e) {
          console.error('❌ Firebase uložení selhalo:', e.code, e.message);
          _ignoreNext = false;
          try { localStorage.setItem('zs_alexandra_db', JSON.stringify(_cache)); } catch (le) {}
        });
    }
  }, 700);
}

function scheduleZaciSave(studentId) {
  if (_zaciTimer) clearTimeout(_zaciTimer);
  _zaciTimer = setTimeout(function () {
    Object.keys(_zaciCache).forEach(function (id) {
      if (!_zaciCache[id]._dirty) return;
      delete _zaciCache[id]._dirty;
      _ignoreZaci[id] = true;
      var data = Object.assign({}, _zaciCache[id]);
      delete data._dirty;
      ZACI_REF.doc(id).set(cacheToFirestore(data))
        .then(function () { console.log('✅ Žák uložen:', id); })
        .catch(function (e) { _ignoreZaci[id] = false; console.error('❌ Uložení žáka selhalo:', id, e.code, e.message); });
    });
  }, 700);
}

/* ═══ Přístup k datům ═══ */
function dbGet() {
  if (_cache) return _cache;
  var def = defaultDB();
  if (_metaStore) { def.pins = _metaStore.pins; def.students = _metaStore.students || []; def.parents = _metaStore.parents || []; }
  return def;
}
function dbSet(fn) {
  if (!_cache) _cache = defaultDB();
  fn(_cache);
  scheduleSave();
}

/* Aktualizace _cache z přišlých dat žáka (pro žáka a rodiče – živé zobrazení změn od učitele) */
function refreshCacheFromZaci(sid, remote) {
  if (!_cache) return;
  var m = mergeWithDefaults(JSON.parse(JSON.stringify(remote)));
  STUDENT_DATA_KEYS.forEach(function (k) { _cache[k] = m[k]; });
  applyStudentMeta(sid);
}
/* Jméno a třída se vždy berou ze seznamu žáků (meta) */
function applyStudentMeta(sid) {
  var m = (_cache.students || []).find(function (s) { return s.id === sid; });
  if (m && _cache.student) {
    _cache.student.name = m.name;
    if (m.class) _cache.student.class = m.class;
  }
}

function ensureZaciListener(id) {
  if (_zaciUnsubs[id]) return;
  _zaciUnsubs[id] = ZACI_REF.doc(id).onSnapshot(function (snap) {
    if (!snap.exists) return;
    if (_ignoreZaci[id]) { _ignoreZaci[id] = false; return; }
    // Lokální neuložené změny mají přednost
    if (_zaciCache[id] && _zaciCache[id]._dirty) return;
    var remote = firestoreToCache(snap.data());
    if (!remote) return;
    delete remote._dirty;
    _zaciCache[id] = remote;
    // Žák a rodič vidí změny učitele hned (admin pracuje s vlastní kopií)
    if (currentRole && currentRole !== 'admin' && id === currentStudentId()) refreshCacheFromZaci(id, remote);
    try { buildNav(); renderView(activePage); } catch (e) {}
  }, function (err) { console.error('❌ Žák listener:', id, err.code, err.message); });
}

function zaciList() {
  return (dbGet().students || []).map(function (s) { return Object.assign({}, s, { data: _zaciCache[s.id] || null }); });
}

function studentDataFor(id) {
  var meta = (dbGet().students || []).find(function (s) { return s.id === id; });
  if (!meta) return null;
  var data = _zaciCache[id];
  if (data) return mergeWithDefaults(JSON.parse(JSON.stringify(data)));
  return cleanStudentData(meta.name, meta.class);
}

/* Přímý zápis do dat KONKRÉTNÍHO žáka (nezávisle na aktuálním kontextu) */
function writeStudentData(sid, fn) {
  if (!sid) return false;
  var meta = (dbGet().students || []).find(function (s) { return s.id === sid; });
  if (!meta) return false;
  var data = _zaciCache[sid]
    ? mergeWithDefaults(JSON.parse(JSON.stringify(_zaciCache[sid])))
    : cleanStudentData(meta.name, meta.class);
  delete data._dirty;
  fn(data);
  _zaciCache[sid] = data;
  _zaciCache[sid]._dirty = true;
  ensureZaciListener(sid);
  scheduleZaciSave(sid);
  return true;
}

/* Admin: přepne kontext na žáka sid a zůstane na aktuální stránce */
function targetAdmin(sid) {
  if (!sid) return;
  _keepPage = activePage || 'admin';
  _adminSelectedId = sid;
  _loadContext();
}
