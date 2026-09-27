"use client";
import React, { useState } from 'react';
import { AdminProfile } from '../../../types/user';
import { ShieldAlert, Database, FileText, CheckCircle2, UserCheck, Inbox } from 'lucide-react';

interface AdminDashboardProps {
  profile: AdminProfile;
  onOpenSystemConfig?: () => void;
  onOpenApprovals?: () => void;
}

export default function AdminDashboard({ profile, onOpenSystemConfig, onOpenApprovals }: AdminDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'quotes' | 'system' | 'approvals'>('quotes');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Super Admin Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider mb-3">
            <ShieldAlert size={14} className="text-indigo-400" /> Super Administrator Command Center
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Welcome, {profile.full_name || 'Admin'}</h1>
          <p className="text-slate-400 text-base max-w-xl font-medium">
            Platform governance, institutional quote approvals, faculty onboarding, and database management.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Admin Action Tabs */}
      <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={() => setActiveSubTab('quotes')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all ${
            activeSubTab === 'quotes'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Inbox size={18} /> Inquiries & Onboarding Quotes
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('approvals');
            onOpenApprovals?.();
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all ${
            activeSubTab === 'approvals'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 size={18} /> Content Approvals
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('system');
            onOpenSystemConfig?.();
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all ${
            activeSubTab === 'system'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Database size={18} /> System & Database Config
        </button>
      </div>

      {/* Inquiries & Quotes Queue */}
      {activeSubTab === 'quotes' && (
        <div className="bg-white rounded-3xl border-2 border-slate-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-black text-slate-800">Institution & Teacher Inquiries</h3>
              <p className="text-sm font-semibold text-slate-400">
                Incoming quotes and requests awaiting administrative review and credential generation
              </p>
            </div>
            <span className="text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl">
              Queue Live
            </span>
          </div>

          <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
            <UserCheck className="mx-auto text-slate-300 mb-3" size={40} />
            <h4 className="text-base font-bold text-slate-700">No pending quote inquiries</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              New inquiries submitted through the "Partner With Us" institution form will automatically appear here for one-click account creation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
