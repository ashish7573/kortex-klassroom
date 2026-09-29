import React, { useState } from 'react';
import { OrgAdminProfile } from '../../../types/user';
import { FileSpreadsheet, Download, CheckCircle2, AlertTriangle, ShieldCheck, X, List } from 'lucide-react';

export default function SubscriptionView({ profile }: { profile: OrgAdminProfile }) {
  const [showCombosModal, setShowCombosModal] = useState(false);
  
  const licenseQuota = profile.license_quota || 0;
  const activeStudents = profile.active_students_count || 0;
  const usagePercentage = licenseQuota > 0 
    ? Math.round((activeStudents / licenseQuota) * 100) 
    : 0;

  const isNearCapacity = usagePercentage >= 90;

  const subscriptionEnd = profile.subscription_end_date;
  const approvedCombos = profile.approved_grade_subject_combos || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in relative">
      <div className="mb-6 border-b-2 border-slate-100 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Subscription & Licenses</h2>
          <p className="font-semibold text-slate-400 text-sm mt-1">Monitor your seat utilization and B2B agreements.</p>
        </div>
      </div>

      {/* Main Student Quota Progress Bar */}
      <div className="bg-white rounded-3xl border-2 border-slate-100 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="text-indigo-600" size={24} /> Student Seat Licenses
            </h3>
            <p className="text-sm font-semibold text-slate-400 mt-1">
              {activeStudents} of {licenseQuota} seats currently allocated across the organization.
            </p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 ${
            isNearCapacity ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {isNearCapacity ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
            {usagePercentage}% Capacity
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden mb-6">
          <div 
            className={`h-full transition-all duration-700 rounded-full ${isNearCapacity ? 'bg-rose-500' : 'bg-indigo-600'}`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Breakdowns and Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Purchased Combos */}
         <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl">
            <h4 className="font-black text-slate-800 text-lg mb-4">Faculty Licensing</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
                 <span className="font-bold text-slate-500 text-sm">Approved Grade-Subject Combos</span>
                 <div className="flex items-center gap-3">
                   <span className="font-black text-slate-800 text-lg">{approvedCombos.length}</span>
                   <button 
                     onClick={() => setShowCombosModal(true)}
                     className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                   >
                     <List size={14} /> See List
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-indigo-600 p-6 flex items-center justify-between shrink-0">
              <h3 className="text-white font-black text-xl flex items-center gap-2">
                <List size={24} /> Approved Combinations
              </h3>
              <button 
                onClick={() => setShowCombosModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {approvedCombos.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {approvedCombos.map((combo, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 flex items-center">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs mr-3 shrink-0">
                        {idx + 1}
                      </span>
                      {combo}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 font-bold">
                  No combinations have been approved yet.
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <button 
                onClick={() => setShowCombosModal(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

