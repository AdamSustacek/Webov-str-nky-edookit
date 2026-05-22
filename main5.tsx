"use client";

import { useState } from 'react';
import { useRole } from '@/components/login-gate';
import Sidebar, { type PageId } from '@/components/school/sidebar';
import DashboardView from '@/components/school/views/dashboard';
import GradesView from '@/components/school/views/grades';
import ScheduleView from '@/components/school/views/schedule';
import InboxView from '@/components/school/views/inbox';
import HomeworkView from '@/components/school/views/homework';
import AttendanceView from '@/components/school/views/attendance';
import TestsView from '@/components/school/views/tests';
import DiscussionView from '@/components/school/views/discussion';
import SettingsView from '@/components/school/views/settings';
import ActivityView from '@/components/school/views/activity';
import CurriculumView from '@/components/school/views/curriculum';
import AdminView from '@/components/school/views/admin';
import { Menu } from 'lucide-react';

const VIEW_COMPONENTS: Record<PageId, React.ComponentType> = {
  dashboard:  DashboardView,
  grades:     GradesView,
  schedule:   ScheduleView,
  inbox:      InboxView,
  homework:   HomeworkView,
  attendance: AttendanceView,
  tests:      TestsView,
  activity:   ActivityView,
  curriculum: CurriculumView,
  discussion: DiscussionView,
  settings:   SettingsView,
  admin:      AdminView,
};

export default function SchoolDashboard() {
  const role = useRole();
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const ActiveComponent = VIEW_COMPONENTS[activePage];
  const handlePageChange = (page: PageId) => {
    // Block student from accessing admin
    if (page === 'admin' && role !== 'admin') return;
    setActivePage(page);
    setMobileSidebarOpen(false);
  };

  const safeActivePage = activePage === 'admin' && role !== 'admin' ? 'dashboard' : activePage;
  const ActiveComponent = VIEW_COMPONENTS[safeActivePage];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative z-50 lg:z-auto h-full w-64
        transition-transform duration-300 ease-in-out
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar
          activePage={activePage}
          onPageChange={(page) => {
            setActivePage(page);
            setMobileSidebarOpen(false);
          }}
          activePage={safeActivePage}
          onPageChange={handlePageChange}
          isAdmin={role === 'admin'}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-sidebar border-b border-white/10">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white"
          >
            <Menu size={20} />
          </button>
          <span className="text-white font-bold text-sm">ZŠ Labská</span>
          <span className="text-white font-bold text-sm">ZS Alexandra I.</span>
        </div>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-7 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <ActiveComponent />
          </div>
        </main>
      </div>
    </div>
  );
}
