"use client";
import React, { useState } from 'react';
import { OrgAdminProfile } from '../../types/user';
import { 
  Building2, Users, GraduationCap, FileSpreadsheet, 
  Calendar, Headset, Megaphone, CheckCircle2, AlertCircle, Menu, X
} from 'lucide-react';

// Import Tabs
import ProfileView from './tabs/ProfileView';
import SubscriptionView from './tabs/SubscriptionView';
import TeachersView from './tabs/TeachersView';
import StudentsParentsView from './tabs/StudentsParentsView';
import StudentReportsView from './tabs/StudentReportsView';
import TimetableView from './tabs/TimetableView';
import ComplaintsView from './tabs/ComplaintsView';
import NoticeboardView from './tabs/NoticeboardView';

interface OrgAdminDashboardProps {
  profile: OrgAdminProfile;
  onAddTeacher?: () => void;
  onEnrollStudents?: () => void;
}

type TabKey = 
  | 'profile' | 'subscription' 
  | 'teachers' | 'students' 
  | 'reports' | 'timetable' 
  | 'complaints' | 'noticeboard';

export default function OrgAdminDashboard({ profile, onAddTeacher, onEnrollStudents }: OrgAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Grouped Navigation Structure
  const navigationGroups = [
    {
      title: "🏢 Organization",
      items: [
        { id: 'profile', label: 'Profile', icon: Building2 },
        { id: 'subscription', label: 'Subscription & Licenses', icon: FileSpreadsheet },
      ]
    },
    {
      title: "👥 People",
      items: [
        { id: 'teachers', label: 'Teachers', icon: GraduationCap },
        { id: 'students', label: 'Students & Parents', icon: Users },
      ]
    },
    {
      title: "📊 Academics",
      items: [
        { id: 'reports', label: 'Student Reports', icon: CheckCircle2 },
        { id: 'timetable', label: 'Timetable', icon: Calendar },
      ]
    },
    {
      title: "🛠️ Operations",
      items: [
        { id: 'complaints', label: 'Complaints & Tickets', icon: Headset },
        { id: 'noticeboard', label: 'Noticeboard', icon: Megaphone },
      ]
    }
  ];

  // Dynamic Component Renderer
  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileView profile={profile} />;
      case 'subscription': return <SubscriptionView profile={profile} />;
      case 'teachers': return <TeachersView profile={profile} />;
      case 'students': return <StudentsParentsView profile={profile} />;
      case 'reports': return <StudentReportsView profile={profile} />;
      case 'timetable': return <TimetableView />;
      case 'complaints': return <ComplaintsView />;
      case 'noticeboard': return <NoticeboardView />;
      default: return <ProfileView profile={profile} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in flex flex-col md:flex-row gap-8 min-h-[80vh]">
      
      {/* Mobile Menu Toggle */}
      <div className="md:hidden flex items-center justify-between bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm mb-4">
        <h2 className="font-black text-slate-800 flex items-center gap-2">
          <Building2 className="text-indigo-600" size={20}/> {profile.organization_name}
        </h2>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-slate-100 rounded-xl text-slate-600"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        ${isMobileMenuOpen ? 'block' : 'hidden'} 
        md:block w-full md:w-72 shrink-0 space-y-8
      `}>
        {/* Org Context Header (Desktop) */}
        <div className="hidden md:block bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
            <Building2 size={12} className="text-sky-300" /> Org Admin
          </div>
          <h2 className="text-2xl font-black leading-tight break-words">{profile.organization_name}</h2>
          <p className="text-indigo-200 text-xs font-semibold mt-2">{profile.email}</p>
        </div>

        {/* Navigation Groups */}
        <nav className="space-y-6">
          {navigationGroups.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-3">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as TabKey);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all
                        ${isActive 
                          ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }
                      `}
                    >
                      <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Dynamic Content Area */}
      <main className="flex-1 min-w-0 bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-2 sm:p-6">
        {renderContent()}
      </main>
    </div>
  );
}
