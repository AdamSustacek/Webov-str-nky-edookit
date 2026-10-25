/* ═══════════════════════════════════════════════════════════════
   config.js – konfigurace a konstanty aplikace
═══════════════════════════════════════════════════════════════ */

/* Firebase konfigurace (stejný projekt jako dosud – nic se nemění) */
var firebaseConfig = {
  apiKey:            "AIzaSyChLAQmzNz3tXtWWwpjwt8_P7fwdOwqvC8",
  authDomain:        "test-stranky-94ae7.firebaseapp.com",
  projectId:         "test-stranky-94ae7",
  storageBucket:     "test-stranky-94ae7.firebasestorage.app",
  messagingSenderId: "414055116493",
  appId:             "1:414055116493:web:5bee467091a1680d428384"
};

/* Kolekce se zprávami (vznikne sama při odeslání první zprávy) */
var MSG_COLLECTION = 'zpravy';

/* Klíče pro sessionStorage / localStorage */
var SESSION_KEY  = 'zs_alexandra_session';
var SESSION_TTL  = 8 * 60 * 60 * 1000;      // 8 hodin
var TUTORIAL_KEY = 'zs_alexandra_tutorial_v2';

/* Jméno, pod kterým učitel (admin) píše zprávy */
var TEACHER_NAME = 'Učitel / škola';

/* Dny, hodiny a ikona koše */
var DAYS    = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek'];
var PERIODS = [1, 2, 3, 4, 5, 6];
var TRASH_ICON = '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>';

/* Klíče dat, která patří jednomu žákovi (kolekce zaci/{id}) */
var STUDENT_DATA_KEYS = ['student', 'subjects', 'grades', 'timetable', 'homework', 'tests', 'attendance', 'notes', 'disciplinary'];
