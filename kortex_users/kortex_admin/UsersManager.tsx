"use client";
import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../backend_configurations/firebase';
import { BaseUserProfile, OrgAdminProfile } from '../../types/user';
import { 
  Users, Building2, UserPlus, Search, ShieldCheck, 
  AlertCircle, Trash2, RotateCcw, Pencil, FileText, ExternalLink, Download, ArrowUpDown, ChevronUp, ChevronDown, Globe,
  Filter, Eye, EyeOff, Phone, CheckCircle2
} from 'lucide-react';
import ProvisionOrgModal from './ProvisionOrgModal';
import EditOrgModal from './EditOrgModal';
import EditIndividualModal from './EditIndividualModal';
import { softDeleteUser, restoreUser } from '../../app/actions/userManagement';
import { adminBulkMigrateLegacyUsers } from '../../app/actions/student';

export default function UsersManager() {
  const [activeTab, setActiveTab] = useState<'organizations' | 'individuals'>('individuals');
  const [showList, setShowList] = useState(false);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [isSyncingLegacy, setIsSyncingLegacy] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrgAdminProfile | null>(null);
  const [editingIndividual, setEditingIndividual] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');

  const [organizations, setOrganizations] = useState<OrgAdminProfile[]>([]);
  const [individuals, setIndividuals] = useState<BaseUserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Organizations
  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'org_admin'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as OrgAdminProfile));
      setOrganizations(data);
      setLoading(false);
    }, (error) => {
      if (error.code !== "permission-denied") console.error("Firestore Error (Organizations):", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Individuals
  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', 'in', ['parent', 'student', 'teacher']));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as BaseUserProfile));
      setIndividuals(data);
      setLoading(false);
    }, (error) => {
      if (error.code !== "permission-denied") console.error("Firestore Error (Individuals):", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortIndicator = (key: string) => {
    if (sortConfig?.key === key) {
       return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
    }
    return <ArrowUpDown size={12} className="inline ml-1 opacity-20 group-hover:opacity-100 transition-opacity" />;
  };

  const getResolvedCountry = (ind: any) => {
    if (ind.country && String(ind.country).trim()) return String(ind.country).trim();
    if (ind.role === 'student' && ind.parent_id && ind.parent_id !== 'PENDING') {
      const parent = individuals.find(p => p.uid === ind.parent_id);
      if (parent && (parent as any).country && String((parent as any).country).trim()) {
        return String((parent as any).country).trim();
      }
    }
    return '';
  };

  const getResolvedState = (ind: any) => {
    if (ind.state && String(ind.state).trim()) return String(ind.state).trim();
    if (ind.role === 'student' && ind.parent_id && ind.parent_id !== 'PENDING') {
      const parent = individuals.find(p => p.uid === ind.parent_id);
      if (parent && (parent as any).state && String((parent as any).state).trim()) {
        return String((parent as any).state).trim();
      }
    }
    return '';
  };

  const getResolvedCity = (ind: any) => {
    if (ind.city && String(ind.city).trim()) return String(ind.city).trim();
    if (ind.role === 'student' && ind.parent_id && ind.parent_id !== 'PENDING') {
      const parent = individuals.find(p => p.uid === ind.parent_id);
      if (parent && (parent as any).city && String((parent as any).city).trim()) {
        return String((parent as any).city).trim();
      }
    }
    return '';
  };

  const countryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    const dataset = activeTab === 'organizations' ? organizations : individuals;
    dataset.forEach((item: any) => {
      const c = activeTab === 'organizations' ? (item.country?.trim() || '') : getResolvedCountry(item);
      const countryKey = c || 'Not Specified';
      counts[countryKey] = (counts[countryKey] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [activeTab, organizations, individuals]);

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    let formattedData = data;
    if (activeTab === 'organizations') {
      formattedData = data.map(org => {
        const orgStudents = individuals.filter(ind => ind.role === 'student' && (ind as any).org_ids?.includes(org.uid));
        const headcount = orgStudents.length > 0 ? orgStudents.length : (org.active_students_count || 0);
        let totalConsumedSeats = 0;
        if (orgStudents.length > 0) {
          orgStudents.forEach(st => {
            const stAny = st as any;
            const assigned = stAny.org_links?.[org.uid]?.assigned_combos;
            if (Array.isArray(assigned) && assigned.length > 0) {
              totalConsumedSeats += assigned.length;
            } else {
              const prefix = `${stAny.grade} - Section ${stAny.section || 'A'}`;
              const defaultCombos = (org.approved_grade_subject_combos || []).filter((c: string) => c.startsWith(prefix));
              totalConsumedSeats += defaultCombos.length > 0 ? defaultCombos.length : 3;
            }
          });
        } else {
          totalConsumedSeats = org.consumed_seats_count || ((org.active_students_count || 0) * 3);
        }
        const totalSeatQuota = org.license_quota || ((org.approved_grade_subject_combos?.length || 0) * 40);
        const seatUsagePct = totalSeatQuota > 0 ? Math.min(100, Math.round((totalConsumedSeats / totalSeatQuota) * 100)) : 0;

        return {
          kortex_id: org.kortex_id || '',
          organization_name: org.organization_name || '',
          country: org.country || 'N/A',
          state: org.state || '',
          city: org.city || '',
          address: org.address || '',
          email: org.email || '',
          combos_approved: org.approved_grade_subject_combos?.length || 0,
          subject_seats: `${totalConsumedSeats} / ${totalSeatQuota} (${seatUsagePct}%)`,
          student_headcount: headcount,
          status: org.accountStatus || 'ACTIVE',
          subscription_end_date: org.subscription_end_date || '',
          created_at: org.created_at || ''
        };
      });
    } else if (activeTab === 'individuals') {
      formattedData = data.map(ind => ({
        kortex_id: ind.kortex_id || '',
        full_name: ind.full_name || '',
        role: ind.role || '',
        country: getResolvedCountry(ind) || 'N/A',
        state: getResolvedState(ind) || '',
        city: getResolvedCity(ind) || '',
        email: getSortableEmail(ind) || '',
        parent_name: ind.role === 'student' ? (ind.parent_name || '') : '',
        parent_phone: ind.role === 'student' ? (ind.emergency_contact || '') : '',
        parent_consent: ind.role === 'student' ? (ind.parent_consent_verified ? 'Verified' : 'Pending') : '',
        organization: getSortableOrgName(ind) || '',
        is_pro: ind.is_pro ? 'Yes' : 'No',
        subscription_end_date: ind.subscription_end_date || '',
        created_at: ind.created_at || '',
        accountStatus: ind.accountStatus || 'ACTIVE'
      }));
    }

    const headers = Object.keys(formattedData[0]).filter(key => key !== 'org_links' && key !== 'active_b2c_licenses' && key !== 'children_ids' && key !== 'teacher_ids'); 
    const csvRows = [];
    csvRows.push(headers.join(','));
    for (const row of formattedData) {
       const values = headers.map(header => {
          let val = (row as any)[header];
          if (typeof val === 'object') val = JSON.stringify(val);
          if (val === null || val === undefined) val = '';
          return `"${String(val).replace(/"/g, '""')}"`;
       });
       csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const processedOrgs = [...organizations].filter(org => {
    const searchLower = searchQuery.toLowerCase();
    const orgCountry = (org.country || '').trim().toLowerCase();
    const orgState = (org.state || '').trim().toLowerCase();
    const orgCity = (org.city || '').trim().toLowerCase();
    const matchesSearch = (org.organization_name || '').toLowerCase().includes(searchLower) || 
                          (org.kortex_id || '').toLowerCase().includes(searchLower) ||
                          (org.email || '').toLowerCase().includes(searchLower) ||
                          orgCountry.includes(searchLower) ||
                          orgState.includes(searchLower) ||
                          orgCity.includes(searchLower);
    const matchesCountry = countryFilter === 'all'
      ? true
      : (countryFilter === 'unspecified' ? !orgCountry : orgCountry === countryFilter.toLowerCase());
    return matchesSearch && matchesCountry;
  });
  if (sortConfig && activeTab === 'organizations') {
     processedOrgs.sort((a, b) => {
        let valA = '';
        let valB = '';
        if (sortConfig.key === 'country') {
           valA = (a.country || '').trim().toLowerCase();
           valB = (b.country || '').trim().toLowerCase();
        } else {
           valA = String((a as any)[sortConfig.key] || '').toLowerCase();
           valB = String((b as any)[sortConfig.key] || '').toLowerCase();
        }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
     });
  }

  const handleDeleteIndividual = async (uid: string, name: string) => {
    if (!confirm(`Are you sure you want to soft-delete ${name}?`)) return;
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;
      const result = await softDeleteUser(idToken, uid);
      if (!result.success) throw new Error(result.error);
      // No local state update needed; onSnapshot handles it!
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleDeleteOrg = async (uid: string, orgName: string) => {
    if (!window.confirm(`Are you sure you want to soft-delete the organization: "${orgName}"?`)) return;
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("No ID Token found. Please relogin.");
      const result = await softDeleteUser(idToken, uid);
      if (!result.success) throw new Error(result.error);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete organization.");
    }
  };

  const handleRestoreUser = async (uid: string, name: string) => {
    if (!confirm(`Restore access for ${name}?`)) return;
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;
      const result = await restoreUser(idToken, uid);
      if (!result.success) throw new Error(result.error);
    } catch (err: any) {
      alert("Failed to restore: " + err.message);
    }
  };

  const handleSyncLegacyUsers = async () => {
    if (!confirm("This will scan all legacy students and parents in Firestore and backfill missing course licenses (FLN Hindi & FLN Maths), hearts/stamina, and normalized grades. Existing progress is preserved. Proceed?")) {
      return;
    }
    setIsSyncingLegacy(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Please log in first");
      const res = await adminBulkMigrateLegacyUsers(idToken);
      if (res.success) {
        alert(`🎉 Legacy sync complete!\n\n• Students Checked: ${res.studentsChecked}\n• Students Upgraded: ${res.studentsUpdated}\n• Parents Checked: ${res.parentsChecked}\n• Parents Upgraded: ${res.parentsUpdated}`);
      } else {
        alert("Sync failed: " + res.error);
      }
    } catch (e: any) {
      alert("Error during legacy migration: " + e.message);
    } finally {
      setIsSyncingLegacy(false);
    }
  };

  const getSortableEmail = (ind: any) => {
    if (ind.role === 'student') {
      if (ind.parent_id && ind.parent_id !== 'PENDING') {
        const parent = individuals.find(p => p.uid === ind.parent_id);
        if (parent?.email) return parent.email.toLowerCase();
      }
      if (ind.parent_email) return ind.parent_email.toLowerCase();
      if (ind.emergency_contact) return ind.emergency_contact.toLowerCase();
      if (ind.parent_name) return ind.parent_name.toLowerCase();
    }
    return (ind.email || '').toLowerCase();
  };

  const getSortableOrgName = (ind: any) => {
    const orgIds = ind.org_ids || (ind.org_id ? [ind.org_id] : []);
    if (orgIds.length > 0) {
      const orgNames = orgIds.map((id: string) => organizations.find(o => o.uid === id)?.organization_name || '').filter(Boolean);
      return orgNames.join(', ').toLowerCase();
    }
    return 'independent';
  };

  const processedIndividuals = [...individuals].filter(ind => {
    const searchLower = searchQuery.toLowerCase();
    const resolvedEmail = getSortableEmail(ind);
    const resolvedCountry = getResolvedCountry(ind);
    const resolvedState = getResolvedState(ind);
    const resolvedCity = getResolvedCity(ind);
    
    const orgNames = getSortableOrgName(ind);
    
    const matchesSearch = (ind.full_name || '').toLowerCase().includes(searchLower) || 
                          resolvedEmail.includes(searchLower) ||
                          (ind.kortex_id || '').toLowerCase().includes(searchLower) ||
                          ((ind as any).parent_name || '').toLowerCase().includes(searchLower) ||
                          ((ind as any).emergency_contact || '').includes(searchLower) ||
                          ((ind as any).claim_code || '').toLowerCase().includes(searchLower) ||
                          resolvedCountry.toLowerCase().includes(searchLower) ||
                          resolvedState.toLowerCase().includes(searchLower) ||
                          resolvedCity.toLowerCase().includes(searchLower) ||
                          orgNames.includes(searchLower);
                          
    const matchesRole = roleFilter === 'all' || ind.role === roleFilter;

    const orgIds = (ind as any).org_ids || ((ind as any).org_id ? [(ind as any).org_id] : []);
    const isIndependent = orgIds.length === 0;
    
    const matchesOrg = orgFilter === 'all' 
       ? true 
       : (orgFilter === 'independent' ? isIndependent : orgIds.includes(orgFilter));

    const matchesCountry = countryFilter === 'all'
       ? true
       : (countryFilter === 'unspecified' ? !resolvedCountry : resolvedCountry.toLowerCase() === countryFilter.toLowerCase());

    return matchesSearch && matchesRole && matchesOrg && matchesCountry;
  });

  if (sortConfig && activeTab === 'individuals') {
     processedIndividuals.sort((a, b) => {
        let valA = '';
        let valB = '';
        
        if (sortConfig.key === 'email') {
           valA = getSortableEmail(a);
           valB = getSortableEmail(b);
        } else if (sortConfig.key === 'organization') {
           valA = getSortableOrgName(a);
           valB = getSortableOrgName(b);
        } else if (sortConfig.key === 'country') {
           valA = getResolvedCountry(a).toLowerCase();
           valB = getResolvedCountry(b).toLowerCase();
        } else {
           valA = String((a as any)[sortConfig.key] || '').toLowerCase();
           valB = String((b as any)[sortConfig.key] || '').toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
     });
  }

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
      // 1. Registered Parent Account is linked
      if (ind.parent_id && ind.parent_id !== 'PENDING') {
         const parent = individuals.find(p => p.uid === ind.parent_id);
         if (parent) {
           return (
             <div className="flex flex-col gap-0.5">
               <span className="font-bold text-slate-800 text-sm">{parent.email || ind.parent_email || 'N/A'}</span>
               <div className="flex items-center gap-1.5 flex-wrap">
                 <span className="text-[11px] font-bold text-slate-600">{parent.full_name} <span className="font-normal text-slate-400">(Parent Account)</span></span>
                 {ind.parent_consent_verified && (
                   <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded inline-flex items-center gap-0.5">
                     <CheckCircle2 size={10} className="text-emerald-600" /> Consent
                   </span>
                 )}
               </div>
               {ind.emergency_contact && (
                 <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                   <Phone size={11} className="text-slate-400" /> {ind.emergency_contact}
                 </span>
               )}
               <span className="text-[9px] font-mono font-bold text-slate-400">{parent.kortex_id || parent.uid}</span>
             </div>
           );
         }
      }

      // 2. Parent gave consent via Claim / WhatsApp / DPDP flow (parent_name, emergency_contact, parent_consent_verified)
      if (ind.parent_consent_verified || ind.parent_name || ind.emergency_contact) {
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-800 text-sm">{ind.parent_name || 'Parent Consent Given'}</span>
              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded border border-emerald-200 inline-flex items-center gap-1">
                <CheckCircle2 size={10} className="text-emerald-600" /> Consent Given
              </span>
            </div>
            {ind.emergency_contact && (
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Phone size={11} className="text-slate-400" /> {ind.emergency_contact}
              </span>
            )}
            {ind.parent_email && (
              <span className="text-[11px] font-medium text-slate-400">{ind.parent_email}</span>
            )}
            <span className="text-[9px] font-bold text-amber-600/90 italic">
              Account: PENDING Claim
            </span>
          </div>
        );
      }

      // 3. Completely unlinked & awaiting consent
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-amber-500 italic text-xs font-bold">Awaiting Parent Link</span>
          {ind.claim_code && (
            <span className="text-[10px] font-mono font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded w-fit">
              Code: {ind.claim_code}
            </span>
          )}
        </div>
      );
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

        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleSyncLegacyUsers}
            disabled={isSyncingLegacy}
            title="Batch-reconcile and backfill legacy students and parents with Kortex Kourses foundational licenses and hearts"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-sm transition-all active:scale-95 shrink-0 text-sm disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw size={16} className={isSyncingLegacy ? 'animate-spin' : ''} />
            <span>{isSyncingLegacy ? 'Syncing...' : 'Sync Legacy Users'}</span>
          </button>

          {activeTab === 'organizations' && (
            <button 
              onClick={() => setShowProvisionModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95 shrink-0"
            >
              <UserPlus size={18} /> Add Organization
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Console */}
      <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-5 sm:p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
            <Filter size={14} className="text-indigo-600" />
            <span>Search & Filter Console</span>
          </div>
          {(roleFilter !== 'all' || countryFilter !== 'all' || orgFilter !== 'all' || searchQuery.trim() !== '') && (
            <button
              type="button"
              onClick={() => {
                setRoleFilter('all');
                setCountryFilter('all');
                setOrgFilter('all');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
          {/* 1. User Type */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <Users size={12} className="text-indigo-600" /> User Type
            </label>
            <select
              value={activeTab}
              onChange={(e) => {
                setActiveTab(e.target.value as 'individuals' | 'organizations');
                setCountryFilter('all');
              }}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-sm transition-all cursor-pointer h-[42px]"
            >
              <option value="individuals">Individuals</option>
              <option value="organizations">Organizations</option>
            </select>
          </div>

          {/* 2. Role (for individuals) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
              Role
            </label>
            {activeTab === 'individuals' ? (
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-sm transition-all cursor-pointer h-[42px]"
              >
                <option value="all">All Roles</option>
                <option value="parent">Parents</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
              </select>
            ) : (
              <div className="w-full bg-slate-100 border border-slate-200 text-slate-400 rounded-xl px-3.5 py-2.5 text-sm font-bold select-none cursor-not-allowed h-[42px] flex items-center">
                All Organizations
              </div>
            )}
          </div>

          {/* 3. Country */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <Globe size={12} className="text-indigo-600" /> Country
            </label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-sm transition-all cursor-pointer h-[42px]"
            >
              <option value="all">All Countries</option>
              {countryStats.map(c => (
                <option key={c.name} value={c.name === 'Not Specified' ? 'unspecified' : c.name}>
                  {c.name} ({c.count})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Search */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
              Search
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Name, ID, Email, City..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setShowList(true);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-slate-700 focus:border-indigo-500 outline-none shadow-sm transition-all h-[42px]"
              />
            </div>
          </div>

          {/* 5. Show List Action Button */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-transparent mb-1.5 select-none">Action</label>
            <button
              type="button"
              onClick={() => setShowList(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md hover:shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer h-[42px]"
            >
              <Eye size={16} />
              <span>{showList ? 'Refresh List' : 'Show List'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!showList ? (
        <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center bg-slate-50/50 my-4">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Filter size={28} />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-1.5">No List Generated</h3>
          <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto mb-6">
            Configure your filters above (User Type, Role, Country, or Search) and click <span className="font-bold text-indigo-600">&quot;Show List&quot;</span> to view accounts on demand.
          </p>
          <div className="inline-flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-500 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="flex items-center gap-1.5">
              <Building2 size={14} className="text-indigo-600" />
              {organizations.length} Organizations
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-emerald-600" />
              {individuals.length} Individuals
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {/* Results Summary Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-700">
                Showing <span className="font-black text-indigo-900">{activeTab === 'organizations' ? processedOrgs.length : processedIndividuals.length}</span> {activeTab === 'organizations' ? 'Organizations' : 'Individuals'}
              </span>
              {countryFilter !== 'all' && (
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100 flex items-center gap-1">
                  <Globe size={11} /> {countryFilter === 'unspecified' ? 'Unspecified' : countryFilter}
                </span>
              )}
              {roleFilter !== 'all' && activeTab === 'individuals' && (
                <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100 capitalize">
                  {roleFilter}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <button 
                onClick={() => exportToCSV(activeTab === 'organizations' ? processedOrgs : processedIndividuals, `${activeTab}_export.csv`)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold rounded-xl text-xs transition-colors border border-emerald-100 shrink-0 cursor-pointer"
                title="Download CSV"
              >
                <Download size={14} /> <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setShowList(false)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
                title="Collapse list"
              >
                <EyeOff size={14} /> <span>Hide List</span>
              </button>
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
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider w-16 text-center">S.No.</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 group transition-colors select-none" onClick={() => handleSort("organization_name")}>Kortex ID / Org Name {sortIndicator("organization_name")}</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 group transition-colors select-none" onClick={() => handleSort("country")}>Country {sortIndicator("country")}</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 group transition-colors select-none" onClick={() => handleSort("email")}>Contact Email {sortIndicator("email")}</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Combos Approved</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Seat Licenses & Students</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Documents</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Status</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider w-16 text-center">S.No.</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 group transition-colors select-none" onClick={() => handleSort("full_name")}>Kortex ID / Name {sortIndicator("full_name")}</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 group transition-colors select-none" onClick={() => handleSort("role")}>Role {sortIndicator("role")}</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 group transition-colors select-none" onClick={() => handleSort("country")}>Country {sortIndicator("country")}</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 group transition-colors select-none" onClick={() => handleSort("organization")}>Organization {sortIndicator("organization")}</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 group transition-colors select-none" onClick={() => handleSort("email")}>Email / Parent Contact {sortIndicator("email")}</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 group transition-colors select-none" onClick={() => handleSort("created_at")}>Join Date {sortIndicator("created_at")}</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider cursor-pointer hover:bg-slate-200 group transition-colors select-none" onClick={() => handleSort("subscription_end_date")}>Pro Renewal {sortIndicator("subscription_end_date")}</th>
                    <th className="px-6 py-4 font-black uppercase text-xs tracking-wider text-right">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-bold">Loading records...</td></tr>
              ) : activeTab === 'organizations' ? (
                processedOrgs.length > 0 ? processedOrgs.map((org, index) => {
                  const orgStudents = individuals.filter(ind => ind.role === 'student' && (ind as any).org_ids?.includes(org.uid));
                  const headcount = orgStudents.length > 0 ? orgStudents.length : (org.active_students_count || 0);
                  let totalConsumedSeats = 0;
                  if (orgStudents.length > 0) {
                    orgStudents.forEach(st => {
                      const stAny = st as any;
                      const assigned = stAny.org_links?.[org.uid]?.assigned_combos;
                      if (Array.isArray(assigned) && assigned.length > 0) {
                        totalConsumedSeats += assigned.length;
                      } else {
                        const prefix = `${stAny.grade} - Section ${stAny.section || 'A'}`;
                        const defaultCombos = (org.approved_grade_subject_combos || []).filter((c: string) => c.startsWith(prefix));
                        totalConsumedSeats += defaultCombos.length > 0 ? defaultCombos.length : 3;
                      }
                    });
                  } else {
                    totalConsumedSeats = org.consumed_seats_count || ((org.active_students_count || 0) * 3);
                  }
                  const totalSeatQuota = org.license_quota || ((org.approved_grade_subject_combos?.length || 0) * 40);
                  const seatUsagePct = totalSeatQuota > 0 ? Math.min(100, Math.round((totalConsumedSeats / totalSeatQuota) * 100)) : 0;
                  const combosCount = org.approved_grade_subject_combos?.length || 0;
                  const isExpired = org.subscription_end_date && new Date(org.subscription_end_date) < new Date();

                  return (
                    <tr key={org.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-center font-bold text-slate-400 text-xs">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-black text-indigo-900">{org.kortex_id || 'NO_ID'}</div>
                        <div className="font-bold text-slate-600">{org.organization_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        {org.country ? (
                          <div>
                            <span className="font-bold text-slate-700">{org.country}</span>
                            {(org.city || org.state) && (
                              <p className="text-[11px] font-medium text-slate-400">
                                {[org.city, org.state].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs italic">Unspecified</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600">{org.email}</td>
                      <td className="px-6 py-4">
                        <span className="font-black text-slate-800 text-sm">{combosCount}</span>
                        <span className="text-slate-400 font-bold text-xs ml-1">combos</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-800 text-sm">{totalConsumedSeats}</span>
                            <span className="text-slate-400 font-bold text-xs">/ {totalSeatQuota} seats</span>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                              seatUsagePct >= 100 ? 'bg-rose-100 text-rose-700' : seatUsagePct >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {seatUsagePct}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                            <Users size={12} className="text-slate-400" />
                            <span>{headcount} enrolled {headcount === 1 ? 'student' : 'students'}</span>
                          </div>
                        </div>
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
                        {org.accountStatus === 'DELETED' ? (
                          <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-lg uppercase flex items-center gap-1 w-fit">
                            <AlertCircle size={12}/> Deleted
                          </span>
                        ) : isExpired ? (
                           <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg uppercase flex items-center gap-1 w-fit">
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
                        {org.accountStatus === 'DELETED' ? (
                          <button 
                             onClick={() => handleRestoreUser(org.uid, org.organization_name)}
                             className="p-2 bg-emerald-50 text-emerald-500 hover:bg-emerald-100 rounded-lg transition-colors"
                             title="Restore Organization"
                          >
                             <RotateCcw size={16} />
                          </button>
                        ) : (
                          <button 
                             onClick={() => handleDeleteOrg(org.uid, org.organization_name)}
                             className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                             title="Delete Organization"
                          >
                             <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-bold">No organizations found.</td></tr>
                )
              ) : (
                processedIndividuals.length > 0 ? processedIndividuals.map((ind, index) => (
                  <tr key={ind.uid} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-center font-bold text-slate-400 text-xs">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-black text-indigo-900">{ind.kortex_id || 'NO_ID'}</div>
                      <div className="font-bold text-slate-600 flex items-center gap-2">
                        {ind.full_name}
                        {ind.accountStatus === 'DELETED' && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md text-[10px] font-black uppercase tracking-wider">Deleted</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(ind.role)}</td>
                    <td className="px-6 py-4">
                      {(() => {
                        const country = getResolvedCountry(ind);
                        const state = getResolvedState(ind);
                        const city = getResolvedCity(ind);
                        if (!country) return <span className="text-slate-300 italic text-xs font-semibold">N/A</span>;
                        return (
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0"></span>
                              {country}
                            </span>
                            {(city || state) && (
                              <span className="text-[11px] font-semibold text-slate-400 pl-3.5">
                                {[city, state].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">{getOrganizationName(ind)}</td>
                    <td className="px-6 py-4">{getEmailContent(ind)}</td>

                    <td className="px-6 py-4 font-semibold text-slate-400">
                      {ind.created_at ? new Date(ind.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {ind.is_pro ? (
                        <div className="flex flex-col">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-md uppercase border border-amber-200 w-fit">Pro</span>
                          <span className="text-[10px] font-bold text-slate-500 mt-1">
                            {ind.subscription_end_date ? new Date(ind.subscription_end_date).toLocaleDateString() : 'No expiry'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-bold italic">Free</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2 items-center">
                        <button 
                           onClick={() => setEditingIndividual(ind)}
                           className="p-2 bg-indigo-50 text-indigo-500 hover:bg-indigo-100 rounded-lg transition-colors"
                           title="Edit User"
                        >
                           <Pencil size={16} />
                        </button>
                        {ind.accountStatus === 'DELETED' ? (
                          <button 
                             onClick={() => handleRestoreUser(ind.uid, ind.full_name || 'User')}
                             className="p-2 bg-emerald-50 text-emerald-500 hover:bg-emerald-100 rounded-lg transition-colors"
                             title="Restore User"
                          >
                             <RotateCcw size={16} />
                          </button>
                        ) : (
                          <button 
                             onClick={() => handleDeleteIndividual(ind.uid, ind.full_name || 'User')}
                             className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                             title="Delete User"
                          >
                             <Trash2 size={16} />
                          </button>
                        )}
                    </td>

                  </tr>
                )) : (
                  <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-bold">No individuals found.</td></tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      )}

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
             setIndividuals(prev => prev.map(p => p.uid === updatedUser.uid ? { ...p, ...updatedUser } : p));
             setEditingIndividual(null);
          }}
          organizations={organizations}
          individuals={individuals}
        />
      )}
    </div>
  );
}



