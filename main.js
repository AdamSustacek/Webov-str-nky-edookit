/* ═══════════════════════════════════════════════════════════════
   main.js – vstupní bod: události a spuštění aplikace
   (načítá se jako poslední, až když jsou k dispozici všechny moduly)
═══════════════════════════════════════════════════════════════ */

window.addEventListener('DOMContentLoaded', function () {

  // Klávesnice – zadávání PINu na přihlašovací obrazovce
  document.addEventListener('keydown', function (e) {
    var ls = document.getElementById('login-screen');
    if (ls && ls.offsetParent !== null && ls.style.display !== 'none') {
      var tut = document.getElementById('tutorial-overlay');
      if (tut && tut.classList.contains('open')) return;   // při tutoriálu nepsat PIN
      if (e.key >= '0' && e.key <= '9') { e.preventDefault(); pinKey(e.key); }
      if (e.key === 'Backspace')        { e.preventDefault(); pinDel(); }
    }
  });

  // Sidebar, odhlášení, modální okno
  document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('mobile-menu-btn').addEventListener('click', openSidebar);
  document.getElementById('modal-overlay').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
  });

  // Filtry domácích úkolů
  document.getElementById('hwf-all').addEventListener('click',     function () { setHwFilter('all'); });
  document.getElementById('hwf-pending').addEventListener('click', function () { setHwFilter('pending'); });
  document.getElementById('hwf-done').addEventListener('click',    function () { setHwFilter('done'); });

  // Nastavení
  document.getElementById('save-pins-btn').addEventListener('click', savePins);
  document.getElementById('settings-tutorial-btn').addEventListener('click', startTutorial);

  // Tutoriál
  document.getElementById('tut-open-btn').addEventListener('click', startTutorial);
  document.getElementById('tut-close').addEventListener('click', tutFinish);
  document.getElementById('tut-skip').addEventListener('click', tutFinish);
  document.getElementById('tut-next').addEventListener('click', tutNext);
  document.getElementById('tut-prev').addEventListener('click', tutPrev);
  document.getElementById('tutorial-overlay').addEventListener('click', function (e) {
    if (e.target === this) tutFinish();
  });
  var tutShown = false;
  try { tutShown = localStorage.getItem(TUTORIAL_KEY) === 'done'; } catch (e) {}
  if (!tutShown) startTutorial();

  // Připojení k Firebase a obnovení přihlášení
  firebaseInit();
});
