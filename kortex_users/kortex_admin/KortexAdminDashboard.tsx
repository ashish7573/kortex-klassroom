"use client";
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../backend_configurations/firebase';
import { AdminProfile } from '../../types/user';
import { ShieldAlert, Database, FileText, CheckCircle2, UserCheck, Inbox, Users } from 'lucide-react';
import UsersManager from './UsersManager';
import SystemConfig from './SystemConfig';
import ContentApprovals from './ContentApprovals';

interface KortexAdminDashboardProps {
  profile: AdminProfile;
}

export default function KortexAdminDashboard({ profile }: KortexAdminDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'quotes' | 'system' | 'approvals' | 'users'>('quotes');
  const [inquiries, setInquiries] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'quote_inquiries'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);


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
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all ${
            activeSubTab === 'users'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users size={18} /> Users & Organizations
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('approvals')}
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
          onClick={() => setActiveSubTab('system')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all ${
            activeSubTab === 'system'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Database size={18} /> System & Database Config
        </button>
      </div>

      {/* Users Manager View */}
      {activeSubTab === 'users' && (
        <UsersManager />
      )}

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

          {inquiries.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
            <UserCheck className="mx-auto text-slate-300 mb-3" size={40} />
            <h4 className="text-base font-bold text-slate-700">No pending quote inquiries</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              New inquiries submitted through the "Partner With Us" institution form will automatically appear here for one-click account creation.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inq: any) => (
              <div key={inq.id} className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start gap-4 hover:border-indigo-100 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-black text-slate-800">{inq.organization_name}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${inq.status === 'new' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {inq.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-600 mb-4">
                    <p><strong className="text-slate-800">Contact:</strong> {inq.contact_person}</p>
                    <p><strong className="text-slate-800">Email:</strong> {inq.email}</p>
                    <p><strong className="text-slate-800">Phone:</strong> {inq.phone}</p>
                    <p><strong className="text-slate-800">Est. Students:</strong> {inq.estimated_students}</p>
                    <p><strong className="text-slate-800">Type:</strong> <span className="capitalize">{inq.org_type}</span></p>
                    <p><strong className="text-slate-800">Date:</strong> {new Date(inq.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 italic">
                    "{inq.message}"
                  </div>
                </div>
                <div className="flex md:flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                   {inq.status === 'new' && (
                     <button 
                       onClick={() => updateDoc(doc(db, 'quote_inquiries', inq.id), { status: 'reviewed' })}
                       className="w-full px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors whitespace-nowrap"
                     >
                       Mark Reviewed
                     </button>
                   )}
                   <a 
                     href={`mailto:${inq.email}?subject=Kortex Klassroom Institutional Quote`!}
                     className="w-full px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition-colors text-center whitespace-nowrap"
                   >
                     Email Contact
                   </a>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      )}
      {/* System Config View */}
      {activeSubTab === 'system' && (
        <div className="bg-white rounded-3xl border-2 border-slate-100 p-8 shadow-sm">
           <SystemConfig />
        </div>
      )}

      {/* Content Approvals View */}
      {activeSubTab === 'approvals' && (
        <div className="bg-white rounded-3xl border-2 border-slate-100 p-8 shadow-sm">
           <ContentApprovals />
        </div>
      )}
    </div>
  );
}
