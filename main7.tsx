"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
  ShieldCheck, User, CalendarDays, Star, BookOpen, FileText,
  UserCheck, Plus, Trash2, Save, ChevronDown, ChevronUp, Pencil,
  CheckCircle2,
  CheckCircle2, StickyNote, Send, Mail,
} from 'lucide-react';

const DAYS = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek'];
const PERIODS = [1, 2, 3, 4, 5, 6];
const SUBJECT_TYPES = ['lang', 'sci', 'hum', 'art', 'tech', 'sport'] as const;
const TYPE_LABELS: Record<string, string> = { lang: 'Jazyk', sci: 'Přírodověda', hum: 'Humanitní', art: 'Umění', tech: 'Technika', sport: 'Sport' };

function SectionHeader({ icon: Icon, title, open, toggle }: { icon: React.ElementType; title: string; open: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      className="w-full flex items-center gap-3 px-5 py-4 border-b border-border hover:bg-muted/20 transition-colors"
    >
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon size={15} className="text-primary" />
      </div>
      <span className="font-semibold text-foreground flex-1 text-left">{title}</span>
      {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
    </button>
  );
}

// ─── Student section ──────────────────────────────────────────────────────────
function StudentSection() {
  const student = useQuery(api.school.getStudent);
  const upsert = useMutation(api.school.upsertStudent);
  const [form, setForm] = useState<null | { name: string; class: string; school: string; year: string; classTeacher: string }>(null);
  const [saved, setSaved] = useState(false);

  const handleEdit = () => {
    if (!student) return;
    setForm({ name: student.name, class: student.class, school: student.school, year: student.year, classTeacher: student.classTeacher });
  };

  const handleSave = async () => {
    if (!form) return;
    await upsert(form);
    setSaved(true);
    setForm(null);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!student) return <div className="p-5 text-sm text-muted-foreground">Načítám…</div>;

  return (
    <div className="p-5 space-y-4">
      {saved && (
        <div className="flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/30 rounded-lg text-success text-sm font-semibold animate-fade-in">
          <CheckCircle2 size={14} /> Uloženo!
        </div>
      )}
      {form ? (
        <div className="space-y-3">
          {(['name', 'class', 'school', 'year', 'classTeacher'] as const).map(field => {
            const labels: Record<string, string> = { name: 'Jméno', class: 'Třída', school: 'Škola', year: 'Školní rok', classTeacher: 'Třídní učitel/ka' };
            return (
              <div key={field}>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">{labels[field]}</label>
                <input
                  value={form[field]}
                  onChange={e => setForm({ ...form, [field]: e.target.value })}
                  className="w-full text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                />
              </div>
            );
          })}
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
              <Save size={13} /> Uložit
            </button>
            <button onClick={() => setForm(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Zrušit</button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {[
            ['Jméno', student.name], ['Třída', student.class], ['Škola', student.school],
            ['Školní rok', student.year], ['Třídní učitel/ka', student.classTeacher],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
              <span className="text-xs text-muted-foreground w-36">{label}</span>
              <span className="text-sm font-medium text-foreground flex-1">{value}</span>
            </div>
          ))}
          <button onClick={handleEdit} className="flex items-center gap-2 mt-3 px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted/40 transition-colors">
            <Pencil size={13} /> Upravit
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Timetable section ────────────────────────────────────────────────────────
function TimetableSection() {
  const timetable = useQuery(api.school.getTimetable);
  const subjects = useQuery(api.school.getSubjects);
  const setCell = useMutation(api.school.setTimetableCell);
  const [editing, setEditing] = useState<{ day: number; period: number } | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [saved, setSaved] = useState(false);

  if (!timetable || !subjects) return <div className="p-5 text-sm text-muted-foreground">Načítám…</div>;

  const getCell = (day: number, period: number) => timetable.find(t => t.day === day && t.period === period);

  const handleCellClick = (day: number, period: number) => {
    const cell = getCell(day, period);
    setEditing({ day, period });
    setEditSubject(cell?.subject ?? '');
    setEditRoom(cell?.room ?? '');
  };

  const handleSaveCell = async () => {
    if (!editing) return;
    await setCell({ day: editing.day, period: editing.period, subject: editSubject, room: editRoom });
    setEditing(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const subjectShorts = ['', ...subjects.map(s => s.short)];

  return (
    <div className="p-5">
      {saved && (
        <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-success/10 border border-success/30 rounded-lg text-success text-sm font-semibold animate-fade-in">
          <CheckCircle2 size={14} /> Uloženo!
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left px-2 py-2 text-muted-foreground font-semibold w-8">H.</th>
              {DAYS.map(d => (
                <th key={d} className="text-center px-2 py-2 text-muted-foreground font-semibold">{d.slice(0, 2)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map(period => (
              <tr key={period}>
                <td className="px-2 py-1 text-muted-foreground font-semibold text-center">{period}</td>
                {DAYS.map((_, day) => {
                  const cell = getCell(day, period);
                  const isEditing = editing?.day === day && editing?.period === period;
                  return (
                    <td key={day} className="px-1 py-1">
                      {isEditing ? (
                        <div className="space-y-1">
                          <select
                            value={editSubject}
                            onChange={e => setEditSubject(e.target.value)}
                            className="w-full text-xs bg-card border border-primary/50 rounded px-1 py-1 focus:outline-none text-foreground"
                          >
                            {subjectShorts.map(s => <option key={s} value={s}>{s || '– prázdné –'}</option>)}
                          </select>
                          <input
                            value={editRoom}
                            onChange={e => setEditRoom(e.target.value)}
                            placeholder="Třída"
                            className="w-full text-xs bg-card border border-border rounded px-1 py-1 focus:outline-none text-foreground"
                          />
                          <div className="flex gap-1">
                            <button onClick={handleSaveCell} className="flex-1 py-0.5 bg-primary text-white rounded text-[10px] font-semibold">Uložit</button>
                            <button onClick={() => setEditing(null)} className="flex-1 py-0.5 bg-muted text-muted-foreground rounded text-[10px]">Zrušit</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCellClick(day, period)}
                          className={`w-full rounded-lg py-1.5 px-1 text-center font-semibold transition-colors ${
                            cell ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-muted/30 text-muted-foreground/40 hover:bg-muted/50'
                          }`}
                        >
                          {cell ? (
                            <div>
                              <div>{cell.subject}</div>
                              <div className="text-[9px] opacity-70">{cell.room}</div>
                            </div>
                          ) : (
                            <span className="text-[10px]">+</span>
                          )}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground mt-3">Klikněte na buňku pro úpravu</p>
    </div>
  );
}

// ─── Grades section ───────────────────────────────────────────────────────────
function GradesSection() {
  const grades = useQuery(api.school.getGrades);
  const subjects = useQuery(api.school.getSubjects);
  const addGrade = useMutation(api.school.addGrade);
  const deleteGrade = useMutation(api.school.deleteGrade);
  const [form, setForm] = useState({ subjectId: '', value: 1, type: 'Písemka', date: '', note: '' });
  const [adding, setAdding] = useState(false);

  if (!grades || !subjects) return <div className="p-5 text-sm text-muted-foreground">Načítám…</div>;

  const handleAdd = async () => {
    if (!form.subjectId || !form.date) return;
    await addGrade({ subjectId: form.subjectId, value: form.value, type: form.type, date: form.date, note: form.note || undefined });
    setForm({ subjectId: '', value: 1, type: 'Písemka', date: '', note: '' });
    setAdding(false);
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{grades.length} hodnocení celkem</span>
        <button onClick={() => setAdding(!adding)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
          <Plus size={12} /> Přidat
        </button>
      </div>

      {adding && (
        <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Předmět</label>
              <select value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}
                className="w-full text-sm bg-card border border-border rounded-lg px-2 py-2 focus:outline-none text-foreground">
                <option value="">Vyberte…</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.short} – {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Známka</label>
              <select value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })}
                className="w-full text-sm bg-card border border-border rounded-lg px-2 py-2 focus:outline-none text-foreground">
                {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Typ</label>
              <input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full text-sm bg-card border border-border rounded-lg px-2 py-2 focus:outline-none text-foreground" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Datum</label>
              <input type="text" placeholder="22.5.2026" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full text-sm bg-card border border-border rounded-lg px-2 py-2 focus:outline-none text-foreground" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Poznámka (volitelné)</label>
            <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
              className="w-full text-sm bg-card border border-border rounded-lg px-2 py-2 focus:outline-none text-foreground" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!form.subjectId || !form.date}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors">
              <Save size={13} /> Přidat
            </button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Zrušit</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {grades.map(g => {
          const subj = subjects.find(s => s.id === g.subjectId);
          return (
            <div key={g._id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/20 group">
              <span className={`grade-badge grade-${g.value}`}>{g.value}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">{subj?.short ?? g.subjectId}</span>
                <span className="text-xs text-muted-foreground ml-2">{g.type}</span>
                {g.note && <span className="text-xs text-muted-foreground ml-2">· {g.note}</span>}
              </div>
              <span className="text-xs text-muted-foreground">{g.date}</span>
              <button onClick={() => deleteGrade({ id: g._id as Id<"grades"> })}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-error rounded transition-all">
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Homework section ─────────────────────────────────────────────────────────
function HomeworkSection() {
  const homework = useQuery(api.school.getHomework);
  const subjects = useQuery(api.school.getSubjects);
  const addHw = useMutation(api.school.addHomework);
  const deleteHw = useMutation(api.school.deleteHomework);
  const [form, setForm] = useState({ subject: '', title: '', description: '', dueDate: '' });
  const [adding, setAdding] = useState(false);

  if (!homework || !subjects) return <div className="p-5 text-sm text-muted-foreground">Načítám…</div>;

  const handleAdd = async () => {
    if (!form.subject || !form.title || !form.dueDate) return;
    await addHw(form);
    setForm({ subject: '', title: '', description: '', dueDate: '' });
    setAdding(false);
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{homework.length} úkolů celkem</span>
        <button onClick={() => setAdding(!adding)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
          <Plus size={12} /> Přidat
        </button>
      </div>

      {adding && (
        <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Předmět (zkratka)</label>
              <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                className="w-full text-sm bg-card border border-border rounded-lg px-2 py-2 focus:outline-none text-foreground">
                <option value="">Vyberte…</option>
                {subjects.map(s => <option key={s.id} value={s.short}>{s.short}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Termín odevzdání</label>
              <input placeholder="22.5.2026" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                className="w-full text-sm bg-card border border-border rounded-lg px-2 py-2 focus:outline-none text-foreground" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Název</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full text-sm bg-card border border-border rounded-lg px-2 py-2 focus:outline-none text-foreground" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Popis</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full text-sm bg-card border border-border rounded-lg px-2 py-2 resize-none focus:outline-none text-foreground" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!form.subject || !form.title || !form.dueDate}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors">
              <Save size={13} /> Přidat
            </button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Zrušit</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {homework.map(hw => (
          <div key={hw._id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/20 group">
            <span className={`text-xs px-2 py-0.5 rounded font-bold subj-lang`}>{hw.subject}</span>
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium text-foreground ${hw.done ? 'line-through opacity-50' : ''}`}>{hw.title}</span>
            </div>
            <span className="text-xs text-muted-foreground">{hw.dueDate}</span>
            <button onClick={() => deleteHw({ id: hw._id as Id<"homework"> })}
              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-error rounded transition-all">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tests section ────────────────────────────────────────────────────────────
function TestsSection() {
  const tests = useQuery(api.school.getTests);
  const subjects = useQuery(api.school.getSubjects);
  const addTest = useMutation(api.school.addTest);
  const deleteTest = useMutation(api.school.deleteTest);
  const [form, setForm] = useState({ subject: '', topic: '', date: '', teacher: '' });
  const [adding, setAdding] = useState(false);

  if (!tests || !subjects) return <div className="p-5 text-sm text-muted-foreground">Načítám…</div>;

  const handleAdd = async () => {
    if (!form.subject || !form.topic || !form.date) return;
    await addTest(form);
    setForm({ subject: '', topic: '', date: '', teacher: '' });
    setAdding(false);
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{tests.length} písemek</span>
        <button onClick={() => setAdding(!adding)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
          <Plus size={12} /> Přidat
        </button>
      </div>

      {adding && (
        <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Předmět</label>
              <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                className="w-full text-sm bg-card border border-border rounded-lg px-2 py-2 focus:outline-none text-foreground">
                <option value="">Vyberte…</option>
                {subjects.map(s => <option key={s.id} value={s.short}>{s.short}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Datum</label>
              <input placeholder="22.5.2026" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full text-sm bg-card border border-border rounded-lg px-2 py-2 focus:outline-none text-foreground" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Téma</label>
              <input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })}
                className="w-full text-sm bg-card border border-border rounded-lg px-2 py-2 focus:outline-none text-foreground" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Učitel</label>
              <input value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })}
                className="w-full text-sm bg-card border border-border rounded-lg px-2 py-2 focus:outline-none text-foreground" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!form.subject || !form.topic || !form.date}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors">
              <Save size={13} /> Přidat
            </button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Zrušit</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {tests.map(t => (
          <div key={t._id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/20 group">
            <span className="text-xs px-2 py-0.5 rounded font-bold subj-sci">{t.subject}</span>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground">{t.topic}</span>
              {t.teacher && <span className="text-xs text-muted-foreground ml-2">· {t.teacher}</span>}
            </div>
            <span className="text-xs text-muted-foreground">{t.date}</span>
            <button onClick={() => deleteTest({ id: t._id as Id<"tests"> })}
              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-error rounded transition-all">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Attendance section ───────────────────────────────────────────────────────
function AttendanceSection() {
  const attendance = useQuery(api.school.getAttendance);
  const addAtt = useMutation(api.school.addAttendance);
  const deleteAtt = useMutation(api.school.deleteAttendance);
  const [form, setForm] = useState({ date: '', status: 'present', note: '' });
  const [adding, setAdding] = useState(false);

  const STATUS_OPTS = [
    { value: 'present', label: 'Přítomen' },
    { value: 'absent', label: 'Nepřítomen' },
    { value: 'excused', label: 'Omluveno' },
    { value: 'late', label: 'Pozdní příchod' },
    { value: 'school-event', label: 'Školní akce' },
  ];
  const STATUS_COLORS: Record<string, string> = {
    present: 'text-success', absent: 'text-error', excused: 'text-warning',
    late: 'text-warning', 'school-event': 'text-primary',
  };

  if (!attendance) return <div className="p-5 text-sm text-muted-foreground">Načítám…</div>;

  const handleAdd = async () => {
    if (!form.date) return;
    await addAtt({ date: form.date, status: form.status, note: form.note || undefined });
    setForm({ date: '', status: 'present', note: '' });
    setAdding(false);
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{attendance.length} záznamů</span>
        <button onClick={() => setAdding(!adding)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
          <Plus size={12} /> Přidat
        </button>
      </div>

      {adding && (
        <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Datum</label>
              <input placeholder="22.5.2026" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full text-sm bg-card border border-border rounded-lg px-2 py-2 focus:outline-none text-foreground" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Stav</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full text-sm bg-card border border-border rounded-lg px-2 py-2 focus:outline-none text-foreground">
                {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Poznámka (volitelné)</label>
              <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
                className="w-full text-sm bg-card border border-border rounded-lg px-2 py-2 focus:outline-none text-foreground" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!form.date}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors">
              <Save size={13} /> Přidat
            </button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Zrušit</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {attendance.map(a => {
          const label = STATUS_OPTS.find(o => o.value === a.status)?.label ?? a.status;
          return (
            <div key={a._id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/20 group">
              <span className="text-xs text-muted-foreground w-24">{a.date}</span>
              <span className={`text-xs font-semibold flex-1 ${STATUS_COLORS[a.status] ?? 'text-foreground'}`}>{label}</span>
              {a.note && <span className="text-xs text-muted-foreground truncate max-w-24">{a.note}</span>}
              <button onClick={() => deleteAtt({ id: a._id as Id<"attendance"> })}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-error rounded transition-all">
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Notes section ────────────────────────────────────────────────────────────
function NotesSection() {
  const notes = useQuery(api.school.getNotes);
  const addNote = useMutation(api.school.addNote);
  const updateNote = useMutation(api.school.updateNote);
  const deleteNote = useMutation(api.school.deleteNote);
  const [editing, setEditing] = useState<{ id?: Id<"notes">; title: string; content: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!editing) return;
    if (editing.id) {
      await updateNote({ id: editing.id, title: editing.title, content: editing.content });
    } else {
      await addNote({ title: editing.title, content: editing.content });
    }
    setSaved(true);
    setEditing(null);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-5 space-y-4">
      {saved && (
        <div className="flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/30 rounded-lg text-success text-sm font-semibold">
          <CheckCircle2 size={14} /> Uloženo!
        </div>
      )}
      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Název</label>
            <input
              value={editing.title}
              onChange={e => setEditing({ ...editing, title: e.target.value })}
              placeholder="Název poznámky…"
              className="w-full text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Obsah</label>
            <textarea
              value={editing.content}
              onChange={e => setEditing({ ...editing, content: e.target.value })}
              placeholder="Text poznámky…"
              rows={5}
              className="w-full text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground resize-y"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
              <Save size={13} /> Uložit
            </button>
            <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Zrušit</button>
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={() => setEditing({ title: '', content: '' })}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors"
          >
            <Plus size={14} /> Nová poznámka
          </button>
          <div className="space-y-2">
            {(!notes || notes.length === 0) && (
              <p className="text-sm text-muted-foreground py-4 text-center">Žádné poznámky</p>
            )}
            {notes?.map(note => (
              <div key={note._id} className="group flex items-start gap-3 p-3 border border-border rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
                <StickyNote size={14} className="text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground truncate">{note.title || '(bez názvu)'}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2 whitespace-pre-wrap">{note.content}</div>
                  <div className="text-[10px] text-muted-foreground/60 mt-1">{new Date(note.updatedAt).toLocaleDateString('cs-CZ')}</div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditing({ id: note._id, title: note.title, content: note.content })}
                    className="p-1.5 text-muted-foreground hover:text-primary rounded transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => deleteNote({ id: note._id })}
                    className="p-1.5 text-muted-foreground hover:text-error rounded transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Messages section (send email) ────────────────────────────────────────────
function MessagesSection() {
  const sendMsg = useAction(api.emails.sendMessage);
  const [form, setForm] = useState({ from: 'Admin', subject: '', body: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  const handleSend = async () => {
    if (!form.subject.trim() || !form.body.trim()) return;
    setStatus('sending');
    try {
      const res = await sendMsg(form);
      if (res.ok) {
        setStatus('ok');
        setForm({ from: 'Admin', subject: '', body: '' });
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
        setErrMsg(res.error ?? 'Chyba');
      }
    } catch {
      setStatus('error');
      setErrMsg('Chyba připojení');
    }
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 border border-border rounded-lg px-3 py-2">
        <Mail size={13} />
        <span>Zpráva bude odeslána na <strong>sustacek.adam@gmail.com</strong></span>
      </div>

      {status === 'ok' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/30 rounded-lg text-success text-sm font-semibold">
          <CheckCircle2 size={14} /> Zpráva odeslána!
        </div>
      )}
      {status === 'error' && (
        <div className="px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm font-semibold">
          Chyba: {errMsg}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Od</label>
          <input
            value={form.from}
            onChange={e => setForm({ ...form, from: e.target.value })}
            className="w-full text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Předmět</label>
          <input
            value={form.subject}
            onChange={e => setForm({ ...form, subject: e.target.value })}
            placeholder="Předmět zprávy…"
            className="w-full text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Zpráva</label>
          <textarea
            value={form.body}
            onChange={e => setForm({ ...form, body: e.target.value })}
            placeholder="Text zprávy…"
            rows={5}
            className="w-full text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground resize-y"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={status === 'sending' || !form.subject.trim() || !form.body.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={14} />
          {status === 'sending' ? 'Odesílám…' : 'Odeslat e-mail'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Admin view ──────────────────────────────────────────────────────────
export default function AdminView() {
  const [open, setOpen] = useState<string | null>('student');

  const sections = [
    { id: 'student', label: 'Profil žáka', icon: User, component: StudentSection },
    { id: 'timetable', label: 'Rozvrh hodin', icon: CalendarDays, component: TimetableSection },
    { id: 'grades', label: 'Hodnocení / Známky', icon: Star, component: GradesSection },
    { id: 'homework', label: 'Domácí úkoly', icon: BookOpen, component: HomeworkSection },
    { id: 'tests', label: 'Písemky a zkoušení', icon: FileText, component: TestsSection },
    { id: 'attendance', label: 'Docházka', icon: UserCheck, component: AttendanceSection },
    { id: 'notes', label: 'Poznámky', icon: StickyNote, component: NotesSection },
    { id: 'messages', label: 'Odeslat zprávu (e-mail)', icon: Send, component: MessagesSection },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
          <ShieldCheck size={18} className="text-warning" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin panel</h1>
          <p className="text-muted-foreground text-sm">Správa všech školních dat</p>
        </div>

      </div>

      <div className="space-y-3">
        {sections.map(({ id, label, icon, component: Comp }) => (
          <div key={id} className="bg-card border border-border rounded-xl card-sm overflow-hidden">
            <SectionHeader
              icon={icon}
              title={label}
              open={open === id}
              toggle={() => setOpen(open === id ? null : id)}
            />
            {open === id && <Comp />}
          </div>
        ))}
      </div>
    </div>
  );
}
