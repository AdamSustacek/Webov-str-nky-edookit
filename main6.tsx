"use client";

import { STUDENT } from '@/lib/school-data';
import {
  LayoutDashboard, Inbox, Star, BookOpen, FileText,
  BookMarked, Activity, GraduationCap,
  CalendarDays, UserCheck,
  MessageSquare, Settings, ChevronDown, ShieldCheck, LogOut,
  Settings, ChevronDown, ShieldCheck, LogOut,
} from 'lucide-react';

const STORAGE_KEY = "zs_labska_auth";
const STORAGE_KEY = "zs_alexandra_auth";

function handleLogout() {
  sessionStorage.removeItem(STORAGE_KEY);
  window.location.reload();
export type PageId =
  | 'dashboard' | 'inbox' | 'grades' | 'homework' | 'tests'
  | 'curriculum' | 'activity'
  | 'schedule' | 'attendance'
  | 'discussion' | 'settings' | 'admin';
  | 'settings' | 'admin';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ElementType;
  badge?: number;
  section?: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',  label: 'Hlavní panel',     icon: LayoutDashboard, section: 'Přehled' },
  { id: 'inbox',      label: 'Schránka',          icon: Inbox,           badge: 2 },
  { id: 'grades',     label: 'Hodnocení',         icon: Star },
  { id: 'homework',   label: 'Domácí úkoly',      icon: BookOpen,        badge: 4, section: 'Výuka' },
  { id: 'tests',      label: 'Písemky',           icon: FileText },
  { id: 'curriculum', label: 'Učivo',             icon: BookMarked },
  { id: 'activity',   label: 'Aktivita',          icon: Activity },
  { id: 'schedule',   label: 'Rozvrh',            icon: CalendarDays, section: 'Správa' },
  { id: 'attendance', label: 'Docházka',          icon: UserCheck },
  { id: 'discussion', label: 'Diskuze',           icon: MessageSquare, section: 'Ostatní' },
  { id: 'settings',   label: 'Nastavení',         icon: Settings },
  { id: 'admin',      label: 'Admin panel',       icon: ShieldCheck, section: 'Administrace' },
  { id: 'settings',   label: 'Nastavení',         icon: Settings, section: 'Ostatní' },
  { id: 'admin',      label: 'Admin panel',       icon: ShieldCheck, section: 'Administrace', adminOnly: true },
];

interface SidebarProps {
  activePage: PageId;
  onPageChange: (page: PageId) => void;
  studentName?: string;
  studentClass?: string;
  isAdmin?: boolean;
}

export default function Sidebar({ activePage, onPageChange, studentName, studentClass }: SidebarProps) {
  const displayName = studentName ?? STUDENT.name;
  const displayClass = studentClass ?? STUDENT.class;
export default function Sidebar({ activePage, onPageChange, isAdmin = false }: SidebarProps) {
  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside
      className="flex flex-col h-full select-none"
      style={{
        background: 'linear-gradient(180deg, hsl(225,43%,9%) 0%, hsl(225,43%,11%) 100%)',
        borderRight: '1px solid hsl(224,22%,18%)',
      }}
    >
      {/* Logo */}
      <div className="px-4 py-5" style={{ borderBottom: '1px solid hsl(224,22%,18%)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, hsl(221,90%,60%) 0%, hsl(250,80%,65%) 100%)', boxShadow: '0 2px 10px rgba(80,120,255,0.35)' }}
          >
            <GraduationCap size={17} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-tight">ZŠ Labská</div>
            <div className="font-bold text-white text-sm leading-tight">ZS Alexandra I.</div>
            <div className="text-xs leading-tight mt-0.5" style={{ color: 'hsl(215,18%,52%)' }}>
              {displayClass} · {displayName}
              Žákovská knížka
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
        {NAV_ITEMS.map((item, i) => {
          const showSection = item.section && (i === 0 || NAV_ITEMS[i - 1].section !== item.section);
          const isAdmin = item.id === 'admin';
        {visibleItems.map((item, i) => {
          const isAdminItem = item.id === 'admin';
          const prevVisible = visibleItems[i - 1];
          const showSection = item.section && (!prevVisible || prevVisible.section !== item.section);
          return (
            <div key={item.id}>
              {showSection && (
                <div
                  className="px-2 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: isAdmin ? 'hsl(38,80%,42%)' : 'hsl(215,18%,38%)' }}
                  style={{ color: isAdminItem ? 'hsl(38,80%,42%)' : 'hsl(215,18%,38%)' }}
                >
                  {item.section}
                </div>
              )}
              <button
                onClick={() => onPageChange(item.id)}
                className={`nav-item w-full text-left ${activePage === item.id ? 'active' : ''}`}
                style={isAdmin && activePage !== item.id ? { color: 'hsl(38,80%,55%)' } : undefined}
                style={isAdminItem && activePage !== item.id ? { color: 'hsl(38,80%,55%)' } : undefined}
              >
                <item.icon size={15} className="flex-shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge ? (
                  <span
                    className="text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0 px-1.5 py-0.5"
                    style={{ background: activePage === item.id ? 'rgba(255,255,255,0.25)' : 'hsl(221,90%,56%)', fontSize: '10px', lineHeight: 1 }}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Bottom: year + logout */}
      <div className="px-2.5 pb-4 space-y-1" style={{ borderTop: '1px solid hsl(224,22%,18%)', paddingTop: '12px' }}>
        <button
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ color: 'hsl(215,18%,52%)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'hsl(224,32%,16%)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span>2025/2026</span>
          <ChevronDown size={13} />
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ color: 'hsl(0,70%,55%)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'hsl(0,50%,15%)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={13} />
          <span>Odhlásit se</span>
        </button>
      </div>
    </aside>
  );
}
