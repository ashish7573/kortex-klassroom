"use client";
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../backend_configurations/firebase';
import { BaseUserProfile, OrgAdminProfile } from '../../types/user';
import { 
  Users, Building2, UserPlus, Search, ShieldCheck, X, CheckCircle2, 
  AlertCircle, Trash2, Pencil, FileText, ExternalLink 
} from 'lucide-react';
import ProvisionOrgModal from './ProvisionOrgModal';
import EditOrgModal from './EditOrgModal';
import { auth } from '../../backend_configurations/firebase';
import { deleteOrganizationAccount } from '../../app/actions/provision';
import { deleteIndividualUser, updateIndividualUser } from '../../app/actions/student';

export default function UsersManager() {
  const [activeTab, setActiveTab] = useState<'organizations' | 'individuals'>('organizations');
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrgAdminProfile | null>(null);
  const [editingIndividual, setEditingIndividual] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [organizations, setOrganizations] = useState<OrgAdminProfile[]>([]);
  const [individuals, setIndividuals] = useState<BaseUserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Organizations
  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'org_admin'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as OrgAdminProfile));
      setOrganizations(data);
      if (activeTab === 'organizations') setLoading(false);
    }, (error) => {
      if (error.code !== "permission-denied") console.error("Firestore Error (Organizations):", error);
      if (activeTab === 'organizations') setLoading(false);
    });
    return () => unsubscribe();
  }, [activeTab]);

  // Fetch Individuals
  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', 'in', ['parent', 'student', 'teacher']));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as BaseUserProfile));
      setIndividuals(data);
      if (activeTab === 'individuals') setLoading(false);
    }, (error) => {
      if (error.code !== "permission-denied") console.error("Firestore Error (Individuals):", error);
      if (activeTab === 'individuals') setLoading(false);
    });
    return () => unsubscribe();
  }, [activeTab]);

  const filteredOrgs = organizations.filter(org => 
    org.organization_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    org.kortex_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const handleDeleteIndividual = async (uid: string, name: string, role: string) => {
    if (!confirm(`Are you sure you want to completely delete ${name}? ${role === 'parent' ? '\n\nWARNING: Deleting a Parent will ALSO delete all their child accounts!' : ''}`)) return;
    
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;
      const result = await deleteIndividualUser(idToken, uid, role);
      if (!result.success) throw new Error(result.error);
      
      // Update local state
      setIndividuals(prev => {
        if (role === 'parent') {
           // Remove the parent and their children
           return prev.filter(p => p.uid !== uid && (p as any).parent_id !== uid);
        }
        return prev.filter(p => p.uid !== uid);
      });
      alert(`Successfully deleted ${name}.`);
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleDeleteOrg = async (uid: string, orgName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the organization: "${orgName}"?`)) return;
    
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("No ID Token found. Please relogin.");
      
      const result = await deleteOrganizationAccount(idToken, uid);
      if (!result.success) throw new Error(result.error);
      
      alert(`Successfully deleted "${orgName}".`);
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to delete organization.");
    }
  };

  const filteredIndividuals = individuals.filter(ind => 
    ind.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ind.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ind.kortex_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'parent': return <span className="px-2 py-1 bg-sky-100 text-sky-700 text-xs font-bold rounded-lg uppercase">Parent</span>;
      case 'student': return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg uppercase">Student</span>;
      case 'teacher': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg uppercase">Teacher</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg uppercase">{role}</span>;
    }
  };

  const getOrganizationName = (ind: any) => {
    let orgSection = <span className="text-slate-300 italic text-xs font-bold">Independent</span>;
    const orgIds = ind.org_ids || (ind.org_id ? [ind.org_id] : []);
    
    if (orgIds.length > 0) {
       orgSection = (
          <div className="flex flex-col gap-2">
            {orgIds.map((id: string) => {
               const org = organizations.find(o => o.uid === id);
               return org ? (
                 <div key={id} className="flex flex-col">
                   <span className="font-bold text-slate-700 text-xs">{org.organization_name}</span>
                   <span className="text-[9px] font-mono font-bold text-slate-400">{org.kortex_id}</span>
                 </div>
               ) : (
                 <span key={id} className="text-slate-400 italic text-[10px] font-bold">Unknown Org</span>
               );
            })}
          </div>
       );
    }
    
    if (ind.role === 'parent') {
       return (
         <div className="flex flex-col items-start gap-1">
           {orgSection}
           {ind.is_pro 
             ? <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-md uppercase border border-amber-200">Pro Account</span>
             : <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-md uppercase border border-slate-200">Free Account</span>}
         </div>
       );
    }

    return orgSection;
  };


  const getEmailContent = (ind: any) => {
    if (ind.role === 'student') {
      if (ind.parent_id && ind.parent_id !== 'PENDING') {
         const parent = individuals.find(p => p.uid === ind.parent_id);
         if (parent) {
           return (
             <div className="flex flex-col">
               <span className="font-bold text-slate-700 text-sm">{parent.email || 'N/A'}</span>
               <span className="text-[11px] font-bold text-slate-500">{parent.full_name} <span className="font-normal">(Parent)</span></span>
               <span className="text-[9px] font-mono font-bold text-slate-400">{parent.kortex_id || parent.uid}</span>
             </div>
           );
         }
      }
      return <span className="text-slate-400 italic text-[11px] font-bold">No Parent Linked</span>;
    }
    
    return <span className="font-semibold text-slate-600">{ind.email || 'N/A'}</span>;
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-100 p-8 shadow-sm animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Users & Organizations</h2>
          <p className="text-sm font-semibold text-slate-400">Manage B2B SaaS accounts, seats, and individuals</p>
        </div>

        {activeTab === 'organizations' && (
          <button 
            onClick={() => setShowProvisionModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95 shrink-0"
          >
            <UserPlus size={18} /> Add Organization
          </button>
        )}
      </div>

      {/* Sub-navigation Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => { setActiveTab('organizations'); setLoading(true); }}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-sm font-black transition-all ${
              activeTab === 'organizations' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 size={16} /> Organizations
          </button>
          <button
            onClick={() => { setActiveTab('individuals'); setLoading(true); }}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-sm font-black transition-all ${
              activeTab === 'individuals' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users size={16} /> Individuals
          </button>
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm font-bold text-slate-700 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Data Tables */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                {activeTab === 'organizations' ? (
                  <>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Kortex ID / Org Name</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Contact Email</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Combos Approved</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Student Seats</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Documents</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Status</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Kortex ID / Name</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Role</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Organization</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Email</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Join Date</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider text-right">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">Loading records...</td></tr>
              ) : activeTab === 'organizations' ? (
                filteredOrgs.length > 0 ? filteredOrgs.map(org => {
                  const studentsUsed = org.active_students_count || 0;
                  const maxStudents = org.license_quota || 0;
                  const combosCount = org.approved_grade_subject_combos?.length || 0;
                  const isExpired = org.subscription_end_date && new Date(org.subscription_end_date) < new Date();

                  return (
                    <tr key={org.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-black text-indigo-900">{org.kortex_id || 'NO_ID'}</div>
                        <div className="font-bold text-slate-600">{org.organization_name}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600">{org.email}</td>
                      <td className="px-6 py-4">
                        <span className="font-black text-slate-800 text-sm">{combosCount}</span>
                        <span className="text-slate-400 font-bold text-xs ml-1">combos</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-black text-slate-700">{studentsUsed}</span>
                        <span className="text-slate-400 font-bold"> / {maxStudents}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {org.agreement_url ? (
                            <a 
                              href={org.agreement_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors"
                              title="View B2B Agreement"
                            >
                              <FileText size={13} /> SLA <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="text-slate-300 text-xs font-medium italic">No SLA</span>
                          )}

                          {org.invoice_url ? (
                            <a 
                              href={org.invoice_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
                              title="View Invoice"
                            >
                              <FileText size={13} /> Invoice <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="text-slate-300 text-xs font-medium italic">No Inv</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isExpired ? (
                           <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-lg uppercase flex items-center gap-1 w-fit">
                             <AlertCircle size={12}/> Expired
                           </span>
                        ) : (
                           <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg uppercase flex items-center gap-1 w-fit">
                             <ShieldCheck size={12}/> Active
                           </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2 items-center">
                        <button 
                           onClick={() => setEditingOrg(org)}
                           className="p-2 bg-indigo-50 text-indigo-500 hover:bg-indigo-100 rounded-lg transition-colors"
                           title="Edit Organization"
                        >
                           <Pencil size={16} />
                        </button>
                        <button 
                           onClick={() => handleDeleteOrg(org.uid, org.organization_name)}
                           className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                           title="Delete Organization"
                        >
                           <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">No organizations found.</td></tr>
                )
              ) : (
                filteredIndividuals.length > 0 ? filteredIndividuals.map(ind => (
                  <tr key={ind.uid} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-black text-indigo-900">{ind.kortex_id || 'NO_ID'}</div>
                      <div className="font-bold text-slate-600">{ind.full_name}</div>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(ind.role)}</td>
                    <td className="px-6 py-4">{getOrganizationName(ind)}</td>
                    <td className="px-6 py-4">{getEmailContent(ind)}</td>

                    <td className="px-6 py-4 font-semibold text-slate-400">
                      {ind.created_at ? new Date(ind.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2 items-center">
                        <button 
                           onClick={() => setEditingIndividual(ind)}
                           className="p-2 bg-indigo-50 text-indigo-500 hover:bg-indigo-100 rounded-lg transition-colors"
                           title="Edit User"
                        >
                           <Pencil size={16} />
                        </button>
                        <button 
                           onClick={() => handleDeleteIndividual(ind.uid, ind.full_name || 'User', ind.role)}
                           className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                           title="Delete User"
                        >
                           <Trash2 size={16} />
                        </button>
                    </td>

                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold">No individuals found.</td></tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showProvisionModal && (
        <ProvisionOrgModal 
          onClose={() => setShowProvisionModal(false)} 
          onSuccess={() => setShowProvisionModal(false)}
        />
      )}

      {editingOrg && (
        <EditOrgModal 
          org={editingOrg} 
          onClose={() => setEditingOrg(null)} 
          onSuccess={() => setEditingOrg(null)} 
        />
      )}
      {editingIndividual && (
        <EditIndividualModal 
          user={editingIndividual}
          onClose={() => setEditingIndividual(null)}
          onSuccess={(updatedUser) => {
             setIndividuals(prev => prev.map(p => p.uid === updatedUser.uid ? updatedUser : p));
             setEditingIndividual(null);
          }}
        />
      )}
    </div>
  );
}


function EditIndividualModal({ user, onClose, onSuccess }: { user: any; onClose: () => void; onSuccess: (updated: any) => void }) {
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    kortex_id: user.kortex_id || '',
    is_pro: user.is_pro || false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not authenticated");
      
      const result = await updateIndividualUser(idToken, user.uid, formData);
      if (!result.success) throw new Error(result.error);
      
      onSuccess({ ...user, ...formData });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h3 className="text-xl font-black text-slate-800">Edit {user.role}</h3>
            <p className="text-sm font-semibold text-slate-400">UID: {user.uid}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-xl border-2 border-rose-100 flex items-center gap-3">
              <AlertCircle size={20} />
              <span className="font-bold text-sm">{error}</span>
            </div>
          )}
          
          <form id="edit-ind-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
              <input 
                type="text" required
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:bg-white outline-none font-semibold text-slate-700 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <input 
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:bg-white outline-none font-semibold text-slate-700 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Kortex ID</label>
              <input 
                type="text"
                value={formData.kortex_id}
                onChange={e => setFormData({...formData, kortex_id: e.target.value})}
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:bg-white outline-none font-mono text-slate-700 transition-all uppercase"
              />
            </div>
            
            {(user.role === 'parent' || user.role === 'student') && (
              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer" onClick={() => setFormData({...formData, is_pro: !formData.is_pro})}>
                <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${formData.is_pro ? 'bg-amber-500 text-white' : 'bg-white border-2 border-amber-200'}`}>
                  {formData.is_pro && <CheckCircle2 size={16} />}
                </div>
                <div>
                  <h4 className="font-bold text-amber-900">Kortex Pro Account</h4>
                  <p className="text-xs font-semibold text-amber-700/70">Grants unlimited hearts and full curriculum access</p>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            form="edit-ind-form"
            type="submit" 
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}



