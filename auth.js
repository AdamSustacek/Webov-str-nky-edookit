/* ═══════════════════════════════════════════════════════════════
   auth.js – přihlášení PINem, session, role (admin / žák / rodič)
═══════════════════════════════════════════════════════════════ */

/* ── Stav přihlášení ── */
var currentRole       = null;   // 'admin' | 'student' | 'parent'
var _currentStudentId = null;   // žák přihlášený PINem
var _parentId         = null;   // rodič přihlášený PINem
var _parentChildId    = null;   // dítě, které má rodič právě vybrané
var _adminSelectedId  = null;   // žák vybraný v admin panelu
var _keepPage         = null;   // stránka, na které zůstat po přepnutí kontextu
var _switching        = false;  // probíhá přepnutí kontextu (blokuje mezilehlé ukládání)

/* ── PIN klávesnice ── */
var pinBuffer = '';
var pinBusy   = false;

function renderDots() {
  document.querySelectorAll('.pin-dot').forEach(function (d, i) { d.classList.toggle('filled', i < pinBuffer.length); });
}
function setError(msg) {
  var el = document.getElementById('pin-error');
  if (el) el.textContent = msg || ' ';
}
function pinKey(d) {
  if (pinBusy || pinBuffer.length >= 4) return;
  pinBuffer += d; setError(''); renderDots();
  if (pinBuffer.length === 4) verifyPin();
}
function pinDel() {
  if (pinBusy) return;
  pinBuffer = pinBuffer.slice(0, -1); setError(''); renderDots();
}

/* ── Session ── */
function sessionLoad() {
  try {
    var s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (s && s.expires > Date.now()) return s;
  } catch (e) {}
  return null;
}
function sessionSave(role, studentId, parentId, childId) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    role: role, studentId: studentId || null, parentId: parentId || null, childId: childId || null,
    expires: Date.now() + SESSION_TTL
  }));
}
function restoreSession(s) {
  currentRole = s.role;
  _currentStudentId = s.studentId || null;
  _parentId = s.parentId || null;
  _parentChildId = s.childId || null;
  if (s.role === 'admin') _adminSelectedId = firstStudentId();
  if (s.role === 'parent') {
    if (!currentParent()) { logout(); return; }          // rodič mezitím zrušen
    var kids = parentChildren();
    if (!kids.some(function (k) { return k.id === _parentChildId; })) _parentChildId = kids.length ? kids[0].id : null;
  }
  _loadContext();
}
function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  stopMessagesListener();
  currentRole = null;
  _currentStudentId = null; _parentId = null; _parentChildId = null;
  _adminSelectedId = null; _keepPage = null;
  _cache = null;
  document.getElementById('app').classList.remove('visible');
  document.getElementById('login-screen').style.display = 'flex';
  pinBuffer = ''; pinBusy = false; renderDots();
}

/* ── Pomocné funkce pro role ── */
function firstStudentId() {
  var st = dbGet().students || [];
  return st.length ? st[0].id : null;
}
function currentStudentId() {
  if (currentRole === 'student') return _currentStudentId;
  if (currentRole === 'admin')   return _adminSelectedId || firstStudentId();
  if (currentRole === 'parent')  return _parentChildId;
  return null;
}
function currentParent() {
  return (dbGet().parents || []).find(function (p) { return p.id === _parentId; }) || null;
}
/* Děti přihlášeného rodiče (jen existující žáci) */
function parentChildren() {
  var p = currentParent();
  if (!p) return [];
  return (dbGet().students || []).filter(function (s) { return (p.studentIds || []).indexOf(s.id) >= 0; });
}
/* Rodiče daného žáka */
function parentsOfStudent(sid) {
  return (dbGet().parents || []).filter(function (p) { return (p.studentIds || []).indexOf(sid) >= 0; });
}

/* Kontrola, jestli PIN už nepoužívá někdo jiný. Vrací text chyby nebo null. */
function pinConflict(pin, exceptType, exceptId) {
  var d = dbGet();
  if (exceptType !== 'admin' && d.pins.admin === pin) return 'Tento PIN je admin PIN. Zvolte jiný.';
  if ((d.students || []).some(function (s) { return s.pin === pin && !(exceptType === 'student' && s.id === exceptId); }))
    return 'Tento PIN už používá jiný žák. Zvolte jiný.';
  if ((d.parents || []).some(function (p) { return p.pin === pin && !(exceptType === 'parent' && p.id === exceptId); }))
    return 'Tento PIN už používá jiný rodič. Zvolte jiný.';
  return null;
}

/* ── Ověření PINu ── */
function verifyPin() {
  pinBusy = true;
  // Dokud nejsou načtena data z Firebase, počkat
  if (!_dataReady) {
    setError('Načítám data…');
    var wait = setInterval(function () {
      if (_dataReady) { clearInterval(wait); setError(''); verifyPin(); }
    }, 100);
    return;
  }

  var d = dbGet();
  var pins = d.pins;
  var role = null, studentId = null, parentId = null, childId = null;

  if (pinBuffer === pins.admin) {
    role = 'admin';
  } else {
    var sm = (d.students || []).find(function (s) { return s.pin === pinBuffer; });
    var pm = (d.parents  || []).find(function (p) { return p.pin === pinBuffer; });
    if (sm) { role = 'student'; studentId = sm.id; }
    else if (pm) {
      role = 'parent'; parentId = pm.id;
      var kids = (d.students || []).filter(function (s) { return (pm.studentIds || []).indexOf(s.id) >= 0; });
      childId = kids.length ? kids[0].id : null;
    }
    // zpětná kompatibilita: starý společný žákovský PIN
    else if (pinBuffer === pins.student) { role = 'student'; studentId = firstStudentId(); }
  }

  if (role) {
    currentRole = role;
    _currentStudentId = studentId;
    _parentId = parentId;
    _parentChildId = childId;
    if (role === 'admin') _adminSelectedId = firstStudentId();
    sessionSave(role, studentId, parentId, childId);
    _loadContext();
  } else {
    var card = document.getElementById('pin-card');
    if (card) card.classList.add('shake');
    setError('Nesprávný PIN');
    setTimeout(function () {
      if (card) card.classList.remove('shake');
      pinBuffer = ''; renderDots(); setError(''); pinBusy = false;
    }, 1200);
  }
}

/* Přepne _cache na data aktuálního kontextu (admin = vybraný žák, rodič = vybrané dítě) */
function _loadContext() {
  _switching = true;
  var sid = currentStudentId();
  var keepPins     = (_metaStore && _metaStore.pins)     || (_cache && _cache.pins) || defaultDB().pins;
  var keepStudents = (_metaStore && _metaStore.students) || (_cache && _cache.students) || [];
  var keepParents  = (_metaStore && _metaStore.parents)  || (_cache && _cache.parents)  || [];

  var data = sid ? studentDataFor(sid) : null;
  _cache = mergeWithDefaults(JSON.parse(JSON.stringify(data || cleanStudentData('', ''))));
  _cache.pins = keepPins;
  _cache.students = keepStudents;
  _cache.parents = keepParents;
  if (sid) applyStudentMeta(sid);

  setTimeout(function () {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').classList.add('visible');
    initApp();
    startMessagesListener();
    _switching = false;
    pinBusy = false; pinBuffer = ''; renderDots();
  }, 180);
}

/* Admin: přepnutí na jiného žáka */
function adminSelectStudent(id, stay) {
  if (!id) return;
  _adminSelectedId = id;
  _keepPage = stay ? (activePage || 'admin') : null;
  _loadContext();
}
function getSelectedStudentMeta() {
  var sid = _adminSelectedId || firstStudentId();
  return (dbGet().students || []).find(function (s) { return s.id === sid; }) || null;
}

/* Rodič: přepnutí na jiné dítě */
function parentSelectChild(id) {
  if (!id || currentRole !== 'parent') return;
  _parentChildId = id;
  sessionSave('parent', null, _parentId, id);
  _keepPage = activePage || 'dashboard';
  _loadContext();
}
