"use client";
import React from 'react';
import { TeacherProfile } from '../../types/user';
import { BookOpen, Users, BarChart3, PlusCircle, CheckCircle2, Award } from 'lucide-react';

interface TeacherDashboardProps {
  profile: TeacherProfile;
  onAssignLesson?: () => void;
}

export default function TeacherDashboard({ profile, onAssignLesson }: TeacherDashboardProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Teacher Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Award size={14} className="text-emerald-200" /> Educator Console
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Welcome, {profile.full_name}!</h1>
          <p className="text-emerald-100 text-base max-w-xl font-medium">
            Subjects: {profile.assigned_combos?.join(', ') || 'General Educator'} · Organization ID: {profile.org_id}
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-400">Assigned Students</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-800">{profile.assigned_student_ids?.length || 0}</div>
          <p className="text-xs text-slate-400 mt-1 font-semibold">Active learners in your cohorts</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-400">Average Mastery</span>
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <BarChart3 size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-800">84%</div>
          <p className="text-xs text-emerald-600 mt-1 font-semibold">↑ 6% higher this week</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-400">Completed Modules</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-800">142</div>
          <p className="text-xs text-slate-400 mt-1 font-semibold">Across all conceptual sandboxes</p>
        </div>
      </div>

      {/* Classroom Actions */}
      <div className="bg-white rounded-3xl border-2 border-slate-100 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Classroom Management</h2>
            <p className="text-sm text-slate-400 font-semibold">Assign lesson pathways and track competency reports</p>
          </div>
          <button
            type="button"
            onClick={onAssignLesson}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95"
          >
            <PlusCircle size={18} /> Assign Lesson Flow
          </button>
        </div>

        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center">
          <BookOpen className="mx-auto text-slate-400 mb-2" size={32} />
          <h4 className="font-bold text-slate-700">Roster View & Cohort Analytics</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Student individual reports and detailed breakdown will synchronize once your organization administrator assigns class rosters.
          </p>
        </div>
      </div>
    </div>
  );
}
