"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, and, onSnapshot } from 'firebase/firestore';
import { db } from '../../../backend_configurations/firebase';
import { OrgAdminProfile, StudentProfile } from '../../../types/user';
import { 
  FileSpreadsheet, Download, CheckCircle2, AlertTriangle, 
  ShieldCheck, X, List, Users, Layers, BookOpen, AlertCircle 
} from 'lucide-react';
import { computeOrgSeatMetrics } from '../utils/seatLedger';
import ModalPortal from '../../../components/ModalPortal';

interface SubscriptionViewProps {
  profile: OrgAdminProfile;
  students?: StudentProfile[];
  loading?: boolean;
}

export default function SubscriptionView({ profile, students: propStudents, loading: propLoading }: SubscriptionViewProps) {
  const [internalStudents, setInternalStudents] = useState<StudentProfile[]>([]);
  const [internalLoading, setInternalLoading] = useState(propStudents === undefined);
  const [showCombosModal, setShowCombosModal] = useState(false);
  const [comboSearch, setComboSearch] = useState('');

  // Self-sufficient Firestore listener if students are not passed via props
  useEffect(() => {
    if (propStudents !== undefined) return;
    if (!profile.uid) return;

    const q = query(
      collection(db, 'users'),
      and(
        where('role', '==', 'student'),
        where('org_ids', 'array-contains', profile.uid)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as StudentProfile[];
      setInternalStudents(docs);
      setInternalLoading(false);
    }, (err) => {
      console.error("Error fetching students in SubscriptionView:", err);
      setInternalLoading(false);
    });

    return () => unsubscribe();
  }, [profile.uid, propStudents]);

  const students = propStudents !== undefined ? propStudents : internalStudents;
  const loading = propStudents !== undefined ? propLoading : internalLoading;

  // Live seat ledger computation
  const metrics = useMemo(() => {
    return computeOrgSeatMetrics(
      profile.kortex_id || '',
      profile.uid,
      profile.approved_grade_subject_combos || [],
      students,
      profile.license_quota
    );
  }, [profile.kortex_id, profile.uid, profile.approved_grade_subject_combos, profile.license_quota, students]);

  const subscriptionEnd = profile.subscription_end_date;
  const isNearCapacity = metrics.isAtCapacity;

  const filteredCombos = useMemo(() => {
    if (!comboSearch.trim()) return metrics.combos;
    const q = comboSearch.toLowerCase();
    return metrics.combos.filter(c => 
      c.comboString.toLowerCase().includes(q) ||
      c.grade.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.section.toLowerCase().includes(q)
    );
  }, [metrics.combos, comboSearch]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in relative pb-8">
      {/* Page Header */}
      <div className="border-b-2 border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Subscription & Seat Licenses</h2>
          <p className="font-semibold text-slate-400 text-sm mt-1">
            Monitor your organization seat consumption, student headcount, and subject batch occupancy.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
            Org ID: {profile.kortex_id || 'N/A'}
          </span>
        </div>
      </div>

      {/* Top Dual Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Metric 1: Subject-Seat Licenses (The Billable Quota) */}
        <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Layers size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">Subject-Seat Licenses</h3>
                  <p className="text-xs font-bold text-slate-400">Total combination slots sold & consumed</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 shrink-0 ${
                isNearCapacity ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {isNearCapacity ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                {metrics.overallUsagePercentage}% Capacity
              </span>
            </div>

            <div className="mt-4 mb-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800">{metrics.totalConsumed}</span>
              <span className="text-sm font-bold text-slate-400">/ {metrics.totalCapacity} Seats Allocated</span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden my-3">
              <div 
                className={`h-full transition-all duration-700 rounded-full ${isNearCapacity ? 'bg-rose-500' : 'bg-indigo-600'}`}
                style={{ width: `${Math.min(metrics.overallUsagePercentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
            {metrics.remainingCapacity === 0 ? (
              <span className="text-rose-600 flex items-center gap-1.5 font-black">
                <AlertCircle size={14} /> All {metrics.totalCapacity} seats are 100% full.
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1.5 font-black">
                <CheckCircle2 size={14} /> {metrics.remainingCapacity} seats available for allocation.
              </span>
            )}
            <span className="text-slate-400">{metrics.combos.length} Approved Combos</span>
          </div>
        </div>

        {/* Metric 2: Student Headcount (The Physical Roster) */}
        <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-violet-50 text-violet-600 rounded-2xl">
                  <Users size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">Student Headcount</h3>
                  <p className="text-xs font-bold text-slate-400">Physical students registered in school</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-black uppercase tracking-wider">
                Roster
              </span>
            </div>

            <div className="mt-4 mb-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800">{metrics.studentHeadcount}</span>
              <span className="text-sm font-bold text-slate-400">Active Students</span>
            </div>

            <p className="text-xs font-semibold text-slate-500 my-3 leading-relaxed">
              Each student is enrolled in their grade-specific core subjects. On average, each student holds{' '}
              <span className="font-black text-indigo-600">
                {metrics.studentHeadcount > 0 ? (metrics.totalConsumed / metrics.studentHeadcount).toFixed(1) : 0}
              </span>{' '}
              subject seats.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>
              {metrics.combos.filter(c => c.isFull).length} of {metrics.combos.length} Batches Full
            </span>
            <span className="text-slate-400">Max 40 / Batch</span>
          </div>
        </div>

      </div>

      {/* Combination Seat Ledger Grid */}
      <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <BookOpen className="text-indigo-600" size={22} /> Combination Seat Ledger
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Live seat occupancy for every approved Grade, Section, and Subject classroom. Standard 40 seats per batch.
            </p>
          </div>
          {metrics.combos.length > 5 && (
            <input 
              type="text"
              placeholder="Search grade or subject..."
              value={comboSearch}
              onChange={(e) => setComboSearch(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-slate-700"
            />
          )}
        </div>

        {metrics.combos.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-bold border-2 border-dashed border-slate-100 rounded-2xl">
            No approved combinations configured. Please contact Kortex support.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-black uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Batch / Class</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Seats Occupancy</th>
                  <th className="px-4 py-3">Slots Remaining</th>
                  <th className="px-4 py-3 text-right rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCombos.map((c) => (
                  <tr key={c.comboId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">{c.grade}</div>
                      <div className="text-[11px] font-semibold text-slate-400">{c.section ? `Section ${c.section}` : 'General'}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg text-xs">
                        {c.subject || 'Core'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="w-48">
                        <div className="flex justify-between items-center text-xs font-bold mb-1">
                          <span className="text-slate-700">{c.enrolledCount} / {c.capacity}</span>
                          <span className={c.isFull ? 'text-rose-600' : 'text-slate-400'}>{c.usagePercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${c.isFull ? 'bg-rose-500' : 'bg-indigo-600'}`}
                            style={{ width: `${c.usagePercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`font-mono font-bold text-xs ${c.remainingSeats === 0 ? 'text-slate-400' : 'text-emerald-600'}`}>
                        {c.remainingSeats === 0 ? '0 available' : `${c.remainingSeats} slots left`}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {c.isFull ? (
                        <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-black uppercase tracking-wider inline-flex items-center gap-1">
                          <AlertCircle size={12} /> Full (40/40)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                          <CheckCircle2 size={12} /> Open
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Breakdowns and Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Faculty Licensing */}
        <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="font-black text-slate-800 text-lg mb-4">Faculty Licensing</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-500 text-sm">Approved Grade-Subject Combos</span>
                <div className="flex items-center gap-3">
                  <span className="font-black text-slate-800 text-lg">{metrics.combos.length}</span>
                  <button 
                    onClick={() => setShowCombosModal(true)}
                    className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <List size={14} /> View IDs
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-500 text-sm">Subscription End Date</span>
                <span className="font-bold text-slate-800">
                  {subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString() : 'Lifetime License'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Agreement Document */}
        <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex flex-col">
          <h4 className="font-black text-slate-800 text-lg mb-4">Legal & Agreements</h4>
          <p className="text-sm font-semibold text-slate-400 mb-6">
            Your signed B2B Service Level Agreement (SLA) and privacy terms regarding student data handling.
          </p>
          <div className="mt-auto space-y-3">
            {profile.agreement_url ? (
              <a href={profile.agreement_url} target="_blank" rel="noreferrer" className="w-full flex items-center justify-between p-4 bg-white rounded-xl border-2 border-indigo-100 hover:border-indigo-300 transition-colors text-indigo-700 font-bold group">
                <span className="flex items-center gap-2 truncate pr-4"><ShieldCheck size={18} className="shrink-0" /> Kortex B2B Agreement.pdf</span>
                <Download size={18} className="text-indigo-400 group-hover:text-indigo-600 shrink-0" />
              </a>
            ) : (
              <div className="w-full flex items-center justify-between p-4 bg-slate-100/50 rounded-xl border border-slate-200 text-slate-400 font-bold">
                <span className="flex items-center gap-2"><ShieldCheck size={18} /> Kortex B2B Agreement</span>
                <span className="text-xs uppercase tracking-wider">Not Uploaded</span>
              </div>
            )}

            {profile.invoice_url ? (
              <a href={profile.invoice_url} target="_blank" rel="noreferrer" className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors text-slate-600 font-bold group">
                <span className="flex items-center gap-2 truncate pr-4"><FileSpreadsheet size={18} className="shrink-0" /> Purchase Order Invoice</span>
                <Download size={18} className="text-slate-400 group-hover:text-slate-600 shrink-0" />
              </a>
            ) : (
              <div className="w-full flex items-center justify-between p-4 bg-slate-100/50 rounded-xl border border-slate-200 text-slate-400 font-bold">
                <span className="flex items-center gap-2"><FileSpreadsheet size={18} /> Purchase Order Invoice</span>
                <span className="text-xs uppercase tracking-wider">Not Uploaded</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Combos Modal */}
      {showCombosModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
              <div className="bg-indigo-600 p-6 flex items-center justify-between shrink-0">
                <h3 className="text-white font-black text-xl flex items-center gap-2">
                  <List size={24} /> Approved Combinations
                </h3>
                <button 
                  onClick={() => setShowCombosModal(false)}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-2">
                {metrics.combos.length > 0 ? (
                  metrics.combos.map((combo, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs shrink-0 font-black">
                          {idx + 1}
                        </span>
                        <div>
                          <div>{combo.comboString}</div>
                          <div className="text-[11px] font-mono text-slate-400">ID: {combo.comboId}</div>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${combo.isFull ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {combo.enrolledCount}/40
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 font-bold">
                    No combinations have been approved yet.
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button 
                  onClick={() => setShowCombosModal(false)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
