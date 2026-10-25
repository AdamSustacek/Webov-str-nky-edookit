/* ═══════════════════════════════════════════════════════════════
   messages.js – zprávy mezi účty (učitel ↔ rodič ↔ žák)

   Klíč účtu:  'admin' | 'parent:<id>' | 'student:<id>'
   Zpráva (kolekce zpravy):
     { from, fromName, to:[klíče], toLabel, participants:[klíče],
       subject, body, studentId, studentName, ts, readBy:[klíče] }
   Každý účet odebírá jen zprávy, kde je v `participants`
   (dotaz array-contains – nepotřebuje žádný index).
═══════════════════════════════════════════════════════════════ */

var _msgs     = [];      // zprávy přihlášeného účtu (nejnovější první)
var _msgUnsub = null;
var _msgKey   = null;
var _msgTab   = 'inbox'; // 'inbox' | 'sent'
var _compose  = null;    // předvyplnění nové zprávy (odpověď)

/* ── Identita přihlášeného účtu ── */
function myKey() {
  if (currentRole === 'admin')   return 'admin';
  if (currentRole === 'student') return _currentStudentId ? 'student:' + _currentStudentId : null;
  if (currentRole === 'parent')  return _parentId ? 'parent:' + _parentId : null;
  return null;
}
function keyLabel(key) {
  var d = dbGet();
  if (key === 'admin') return TEACHER_NAME;
  if (key.indexOf('parent:') === 0) {
    var p = (d.parents || []).find(function (x) { return 'parent:' + x.id === key; });
    return p ? p.name : 'Rodič';
  }
  if (key.indexOf('student:') === 0) {
    var s = (d.students || []).find(function (x) { return 'student:' + x.id === key; });
    return s ? s.name : 'Žák';
  }
  return key;
}
function myName() { return keyLabel(myKey() || ''); }

/* ── Odběr zpráv ── */
function startMessagesListener() {
  var key = myKey();
  if (!key) return;
  if (_msgUnsub && _msgKey === key) return;      // už běží pro tento účet
  stopMessagesListener();
  _msgKey = key;
  _msgUnsub = MSG_REF.where('participants', 'array-contains', key).onSnapshot(function (snap) {
    _msgs = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); })
                     .sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    buildNav();
    if (activePage === 'inbox') renderInbox();
  }, function (err) { console.error('❌ Zprávy listener:', err.code, err.message); });
}
function stopMessagesListener() {
  if (_msgUnsub) { try { _msgUnsub(); } catch (e) {} }
  _msgUnsub = null; _msgKey = null; _msgs = [];
}

function isReceived(m, key) { return m.from !== key && (m.to || []).indexOf(key) >= 0; }
function isUnread(m, key)   { return isReceived(m, key) && (m.readBy || []).indexOf(key) < 0; }
function unreadCount() {
  var key = myKey();
  if (!key) return 0;
  return _msgs.filter(function (m) { return isUnread(m, key); }).length;
}

/* ── Schránka ── */
function renderInbox() {
  var el = document.getElementById('inbox-content');
  var key = myKey();
  if (!el || !key) return;

  var received = _msgs.filter(function (m) { return isReceived(m, key); });
  var sent     = _msgs.filter(function (m) { return m.from === key; });
  var list     = _msgTab === 'sent' ? sent : received;
  var unread   = unreadCount();

  var sub = document.getElementById('inbox-subtitle');
  if (sub) sub.textContent = unread > 0 ? unread + ' nepřečtených zpráv' : 'Zprávy a oznámení';

  var html = '<div class="msg-tabs">' +
    '<button class="btn btn-sm ' + (_msgTab === 'inbox' ? 'btn-primary' : 'btn-outline') + '" onclick="setMsgTab(\'inbox\')">Doručené (' + received.length + ')</button>' +
    '<button class="btn btn-sm ' + (_msgTab === 'sent'  ? 'btn-primary' : 'btn-outline') + '" onclick="setMsgTab(\'sent\')">Odeslané (' + sent.length + ')</button>' +
    '</div><div class="card">';

  if (list.length === 0) {
    html += '<div class="empty-state"><p>' + (_msgTab === 'sent' ? 'Zatím jste nic neodeslali' : 'Žádné zprávy') + '</p></div>';
  } else {
    html += list.map(function (m) {
      var un = isUnread(m, key);
      var who = _msgTab === 'sent' ? 'Komu: ' + (m.toLabel || (m.to || []).map(keyLabel).join(', ')) : (m.fromName || keyLabel(m.from));
      var chip = m.studentName ? '<span class="kid-chip">' + esc(m.studentName) + '</span>' : '';
      var prev = String(m.body || '').replace(/\s+/g, ' ').slice(0, 140);
      return '<div class="msg-row' + (un ? ' unread' : '') + '" onclick="openMessage(\'' + m.id + '\')">' +
        '<span class="msg-dot"></span>' +
        '<div class="msg-main">' +
          '<div class="msg-top"><span class="msg-who">' + esc(who) + '</span>' + chip + '<span class="msg-date">' + esc(fmtDateTime(m.ts)) + '</span></div>' +
          '<div class="msg-subj">' + esc(m.subject || '(bez předmětu)') + '</div>' +
          '<div class="msg-prev">' + esc(prev) + '</div>' +
        '</div></div>';
    }).join('');
  }
  el.innerHTML = html + '</div>';
}
function setMsgTab(t) { _msgTab = t; renderInbox(); }

/* ── Detail zprávy ── */
function openMessage(id) {
  var m = _msgs.find(function (x) { return x.id === id; });
  var key = myKey();
  if (!m || !key) return;

  // Označit jako přečtenou
  if (isUnread(m, key)) {
    MSG_REF.doc(id).update({ readBy: firebase.firestore.FieldValue.arrayUnion(key) })
      .catch(function (e) { console.error('❌ Označení přečtené:', e.code, e.message); });
  }

  var meta =
    '<div class="msg-meta">' +
    '<div><strong>Od:</strong> ' + esc(m.fromName || keyLabel(m.from)) + '</div>' +
    '<div><strong>Komu:</strong> ' + esc(m.toLabel || (m.to || []).map(keyLabel).join(', ')) + '</div>' +
    (m.studentName ? '<div><strong>Týká se žáka:</strong> ' + esc(m.studentName) + '</div>' : '') +
    '<div><strong>Datum:</strong> ' + esc(fmtDateTime(m.ts)) + '</div></div>';

  var actions = '<button class="btn btn-outline btn-sm" onclick="closeModal()">Zavřít</button>';
  if (isReceived(m, key)) actions += '<button class="btn btn-primary btn-sm" onclick="replyTo(\'' + m.id + '\')">Odpovědět</button>';
  if (currentRole === 'admin') actions += '<button class="btn btn-danger btn-sm" onclick="deleteMessage(\'' + m.id + '\')">Smazat</button>';

  openModal(m.subject || '(bez předmětu)', meta + '<div class="msg-text">' + esc(m.body) + '</div>', actions, true);
}
function replyTo(id) {
  var m = _msgs.find(function (x) { return x.id === id; });
  if (!m) return;
  _compose = {
    to: m.from,
    subject: /^Re:/i.test(m.subject || '') ? m.subject : 'Re: ' + (m.subject || ''),
    studentId: m.studentId || null
  };
  closeModal();
  navigate('messages');
}
function deleteMessage(id) {
  if (!confirm('Smazat zprávu? Zmizí všem příjemcům.')) return;
  MSG_REF.doc(id).delete().catch(function (e) { alert('Smazání se nezdařilo: ' + e.message); });
  closeModal();
}
function composeNew() { _compose = null; navigate('messages'); }

/* ── Příjemci (pro admina) ── */
function adminRecipientOptions(selected) {
  var d = dbGet();
  var students = d.students || [];
  var parents  = d.parents  || [];
  var classes  = [];
  students.forEach(function (s) { if (s.class && classes.indexOf(s.class) < 0) classes.push(s.class); });
  classes.sort();

  function opt(v, label) { return '<option value="' + esc(v) + '"' + (v === selected ? ' selected' : '') + '>' + esc(label) + '</option>'; }

  var html = '<optgroup label="Skupiny">' + opt('all-parents', 'Všichni rodiče') + opt('all-students', 'Všichni žáci');
  classes.forEach(function (c) { html += opt('class:' + c, 'Rodiče třídy ' + c); });
  html += '</optgroup>';

  if (students.length) {
    html += '<optgroup label="Rodiče konkrétního žáka">';
    students.forEach(function (s) { html += opt('kids:' + s.id, 'Rodiče žáka ' + s.name + (s.class ? ' (' + s.class + ')' : '')); });
    html += '</optgroup>';
  }
  if (parents.length) {
    html += '<optgroup label="Rodiče">';
    parents.forEach(function (p) {
      var kids = students.filter(function (s) { return (p.studentIds || []).indexOf(s.id) >= 0; }).map(function (s) { return s.name; });
      html += opt('parent:' + p.id, p.name + (kids.length ? ' – ' + kids.join(', ') : ''));
    });
    html += '</optgroup>';
  }
  if (students.length) {
    html += '<optgroup label="Žáci">';
    students.forEach(function (s) { html += opt('student:' + s.id, s.name + (s.class ? ' (' + s.class + ')' : '')); });
    html += '</optgroup>';
  }
  return html;
}

/* Hodnota výběru příjemce → { keys, label, studentId } */
function resolveRecipients(v) {
  var d = dbGet();
  var students = d.students || [];
  var parents  = d.parents  || [];
  var keys = [], label = '', studentId = null;

  function pk(p) { return 'parent:' + p.id; }

  if (v === 'all-parents')      { keys = parents.map(pk); label = 'Všichni rodiče'; }
  else if (v === 'all-students'){ keys = students.map(function (s) { return 'student:' + s.id; }); label = 'Všichni žáci'; }
  else if (v.indexOf('class:') === 0) {
    var c = v.slice(6);
    var ids = students.filter(function (s) { return s.class === c; }).map(function (s) { return s.id; });
    keys = parents.filter(function (p) { return (p.studentIds || []).some(function (i) { return ids.indexOf(i) >= 0; }); }).map(pk);
    label = 'Rodiče třídy ' + c;
  }
  else if (v.indexOf('kids:') === 0) {
    var sid = v.slice(5);
    var st = students.find(function (s) { return s.id === sid; });
    keys = parents.filter(function (p) { return (p.studentIds || []).indexOf(sid) >= 0; }).map(pk);
    label = 'Rodiče žáka ' + (st ? st.name : '');
    studentId = sid;
  }
  else if (v.indexOf('parent:') === 0 || v.indexOf('student:') === 0) { keys = [v]; label = keyLabel(v); }
  else if (v === 'admin') { keys = ['admin']; label = TEACHER_NAME; }

  return { keys: keys, label: label, studentId: studentId };
}

/* ── Psaní nové zprávy ── */
function renderMessages() {
  var el = document.getElementById('compose-content');
  if (!el) return;
  var pre = _compose || {};
  var html = '';

  if (currentRole === 'admin') {
    html += '<div class="form-group"><label class="form-label">Komu</label>' +
      '<select class="form-select" id="msg-to">' + adminRecipientOptions(pre.to || '') + '</select></div>';
  } else {
    html += '<div class="alert alert-info"><span>Zpráva bude doručena: <strong>' + esc(TEACHER_NAME) + '</strong></span></div>';
    if (currentRole === 'parent') {
      var kids = parentChildren();
      var selKid = pre.studentId || _parentChildId;
      if (kids.length) {
        html += '<div class="form-group"><label class="form-label">Týká se dítěte</label>' +
          '<select class="form-select" id="msg-kid">' +
          kids.map(function (k) { return '<option value="' + k.id + '"' + (k.id === selKid ? ' selected' : '') + '>' + esc(k.name) + (k.class ? ' – ' + esc(k.class) : '') + '</option>'; }).join('') +
          '</select></div>';
      }
    }
  }

  html += '<div class="form-group"><label class="form-label">Předmět</label><input class="form-input" id="msg-subject" placeholder="Předmět zprávy…" value="' + esc(pre.subject || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Zpráva</label><textarea class="form-textarea" id="msg-body" placeholder="Text zprávy…" style="min-height:140px"></textarea></div>' +
    '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">' +
    '<button class="btn btn-primary" id="msg-send-btn" onclick="doSendMessage()">' +
    svgIcon('<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>', 14) + ' Odeslat zprávu</button>' +
    '<span id="msg-status" style="font-size:13px"></span></div>';

  el.innerHTML = html;
  _compose = null;
}

function doSendMessage() {
  var key = myKey();
  if (!key) return;
  var subject = document.getElementById('msg-subject').value.trim();
  var body    = document.getElementById('msg-body').value.trim();
  var status  = document.getElementById('msg-status');
  var btn     = document.getElementById('msg-send-btn');
  if (!subject || !body) { alert('Vyplňte předmět a text zprávy'); return; }

  var keys, label, studentId = null;
  if (currentRole === 'admin') {
    var r = resolveRecipients(document.getElementById('msg-to').value);
    if (!r.keys.length) { alert('Vybraný příjemce nemá žádný účet (např. žák zatím nemá přiřazeného rodiče).'); return; }
    keys = r.keys; label = r.label; studentId = r.studentId;
  } else {
    keys = ['admin']; label = TEACHER_NAME;
    if (currentRole === 'parent') { var ks = document.getElementById('msg-kid'); studentId = ks ? ks.value : _parentChildId; }
    else studentId = _currentStudentId;
  }
  var stu = studentId ? (dbGet().students || []).find(function (s) { return s.id === studentId; }) : null;

  var participants = [key];
  keys.forEach(function (k) { if (participants.indexOf(k) < 0) participants.push(k); });

  btn.disabled = true;
  status.style.color = 'var(--fg-muted)';
  status.textContent = 'Odesílám…';

  MSG_REF.add({
    from: key, fromName: myName(),
    to: keys, toLabel: label, participants: participants,
    subject: subject, body: body,
    studentId: studentId || null, studentName: stu ? stu.name : null,
    ts: Date.now(), readBy: [key]
  }).then(function () {
    _msgTab = 'sent';
    navigate('inbox');
  }).catch(function (e) {
    console.error('❌ Odeslání zprávy:', e.code, e.message);
    btn.disabled = false;
    status.style.color = 'var(--error)';
    status.textContent = 'Chyba při odeslání: ' + (e.message || e.code);
  });
}
