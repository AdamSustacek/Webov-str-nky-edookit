/* ═══════════════════════════════════════════════════════════════
   helpers.js – drobné pomocné funkce (bez závislosti na datech)
═══════════════════════════════════════════════════════════════ */

/* Náhodné ID */
function uid() { return Math.random().toString(36).slice(2, 10); }

/* Ochrana proti XSS – escapování textu vkládaného do HTML */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Malé HTML komponenty */
function subjIcon(s)  { return '<span class="subj-chip">' + esc(s) + '</span>'; }
function gradeHtml(v) { return '<span class="grade-badge grade-' + v + '">' + v + '</span>'; }
function svgIcon(path, size) {
  size = size || 14;
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
}
function attBadge(status) {
  var cls = {present:'badge-green', absent:'badge-red', excused:'badge-yellow', late:'badge-yellow', 'school-event':'badge-blue'};
  var lbl = {present:'Přítomen', absent:'Nepřítomen', excused:'Omluveno', late:'Pozdní příchod', 'school-event':'Školní akce'};
  return '<span class="badge ' + (cls[status] || 'badge-gray') + '">' + (lbl[status] || status) + '</span>';
}

/* Datum a čas z časové značky (ms) */
function fmtDateTime(ts) {
  if (!ts) return '';
  var d = new Date(ts);
  return d.toLocaleDateString('cs-CZ') + ' ' + d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

/* Modální okno (wide = širší okno, např. pro čtení zprávy) */
function openModal(title, bodyHTML, actionsHTML, wide) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML    = bodyHTML;
  document.getElementById('modal-actions').innerHTML = actionsHTML;
  document.getElementById('modal-box').classList.toggle('wide', !!wide);
  document.getElementById('modal-overlay').style.display = 'flex';
}
function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }
