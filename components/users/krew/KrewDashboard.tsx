"use client";
import React from 'react';
import { KrewProfile } from '../../../types/user';
import { Sparkles, Edit3, Layers, BookOpen, CheckCircle } from 'lucide-react';

interface KrewDashboardProps {
  profile: KrewProfile;
  onOpenCMS?: () => void;
}

export default function KrewDashboard({ profile, onOpenCMS }: KrewDashboardProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Krew Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={14} className="text-amber-200" /> Kortex Creator Krew
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Welcome back, {profile.full_name}!</h1>
          <p className="text-amber-100 text-base max-w-xl font-medium">
            Authorized content creator console. Craft, edit, and curate experiential learning tools across NEP 2020 modules.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Editor Overview Card */}
      <div className="bg-white rounded-3xl border-2 border-slate-100 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Edit3 size={24} className="text-orange-500" /> Headless CMS Quick Launcher
            </h3>
            <p className="text-sm font-semibold text-slate-400">
              Create, update, or reorganize curriculum chapters, subtopics, and interactive steps.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCMS}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95"
          >
            <Layers size={18} /> Launch CMS Editor
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center gap-2 text-slate-700 font-extrabold mb-1">
              <BookOpen size={18} className="text-orange-500" /> Auto-Publish
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Changes submitted by verified Krew members are automatically approved and deployed.
            </p>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center gap-2 text-slate-700 font-extrabold mb-1">
              <Layers size={18} className="text-sky-500" /> 5-Tier Support
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Seamlessly link Conceptualisers, Theatre, Dojo, Notebook, and Arcade modules.
            </p>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center gap-2 text-slate-700 font-extrabold mb-1">
              <CheckCircle size={18} className="text-emerald-500" /> Real-time Sync
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Interactive changes reflect in classroom flows instantaneously.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
