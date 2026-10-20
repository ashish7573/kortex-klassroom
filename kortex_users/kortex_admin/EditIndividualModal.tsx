"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  User, Mail, Phone, MapPin, Building2, Shield, Calendar, Key, 
  Heart, Zap, Award, CheckCircle2, AlertCircle, X, Save, Copy, 
  Check, Eye, EyeOff, Plus, Trash2, ExternalLink, RefreshCw, 
  Layers, GraduationCap, Users, ShieldAlert, Sparkles, FileText
} from 'lucide-react';
import { auth } from '../../backend_configurations/firebase';
import { updateIndividualUser, generateUserPasswordResetLink } from '../../app/actions/student';
import ModalPortal from '../../components/ModalPortal';
import { GRADES, SUBJECTS, SECTIONS } from '../../kortex_landing_page/curriculumConfig';

interface EditIndividualModalProps {
  user: any;
  onClose: () => void;
  onSuccess: (updatedUser: any) => void;
  organizations?: any[];
  individuals?: any[];
}

type TabType = 'profile' | 'academic' | 'access' | 'audit';

export default function EditIndividualModal({ 
  user, 
  onClose, 
  onSuccess,
  organizations = [],
  individuals = []
}: EditIndividualModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Password / PIN visibility
  const [showPin, setShowPin] = useState(false);

  // Password Reset Link state
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [copiedResetLink, setCopiedResetLink] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Core Identity
    full_name: user.full_name || '',
    email: user.email || '',
    kortex_id: user.kortex_id || '',
    phone: user.phone || '',
    phoneVerified: Boolean(user.phoneVerified),
    has_completed_onboarding: user.has_completed_onboarding ?? true,
    onboardingStatus: user.onboardingStatus || 'ACTIVE',
    
    // Location
    country: user.country || '',
    state: user.state || '',
    city: user.city || '',
    address: user.address || '',

    // Account & Membership Status
    accountStatus: (user.accountStatus as 'ACTIVE' | 'SUSPENDED' | 'DELETED') || 'ACTIVE',
    status: (user.status as 'active' | 'suspended' | 'pending') || 'active',
    is_pro: Boolean(user.is_pro),
    subscription_end_date: user.subscription_end_date ? String(user.subscription_end_date).split('T')[0] : '',

    // Student Specific
    username: user.username || '',
    plain_pin: user.plain_pin || '',
    grade: user.grade || '',
    section: user.section || '',
    roll_no: user.roll_no || '',
    emergency_contact: user.emergency_contact || '',
    parent_id: user.parent_id || '',
    parent_name: user.parent_name || '',
    parent_email: user.parent_email || '',
    org_id: (user.org_ids && user.org_ids[0]) || user.org_id || '',
    hearts_remaining: typeof user.hearts_remaining === 'number' ? user.hearts_remaining : 5,
    current_streak_days: typeof user.current_streak_days === 'number' ? user.current_streak_days : 0,
    total_xp: typeof user.total_xp === 'number' ? user.total_xp : 0,

    // Teacher Specific
    assigned_combos: Array.isArray(user.assigned_combos) ? [...user.assigned_combos] : []
  });

  // Combo builder state for teachers
  const [newGrade, setNewGrade] = useState<string>(GRADES[4] || 'Grade 1');
  const [newSection, setNewSection] = useState<string>(SECTIONS[0] || 'A');
  const [newSubject, setNewSubject] = useState<string>(SUBJECTS[0] || 'English');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync parent email/name when parent_id is selected from dropdown
  const handleParentSelect = (parentId: string) => {
    if (!parentId) {
      setFormData(prev => ({ ...prev, parent_id: '', parent_name: '', parent_email: '' }));
      return;
    }
    const parent = individuals.find(ind => ind.uid === parentId || ind.kortex_id === parentId);
    if (parent) {
      setFormData(prev => ({
        ...prev,
        parent_id: parent.uid,
        parent_name: parent.full_name || '',
        parent_email: parent.email || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, parent_id: parentId }));
    }
  };

  const handleAddTeacherCombo = () => {
    const combo = `${newGrade} - Section ${newSection} - ${newSubject}`;
    if (formData.assigned_combos.includes(combo)) {
      setError(`Combo "${combo}" is already assigned.`);
      return;
    }
    setError(null);
    setFormData(prev => ({
      ...prev,
      assigned_combos: [...prev.assigned_combos, combo]
    }));
  };

  const handleRemoveTeacherCombo = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      assigned_combos: prev.assigned_combos.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleGenerateResetLink = async () => {
    if (!formData.email) {
      setError("User does not have an email address to generate a password reset link.");
      return;
    }
    setResetLoading(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not authenticated");
      const res = await generateUserPasswordResetLink(idToken, formData.email);
      if (!res.success || !res.link) throw new Error(res.error || "Failed to generate link");
      setResetLink(res.link);
    } catch (err: any) {
      setError(err.message || "Failed to generate password reset link");
    } finally {
      setResetLoading(false);
    }
  };

  const copyResetLink = () => {
    if (!resetLink) return;
    navigator.clipboard.writeText(resetLink);
    setCopiedResetLink(true);
    setTimeout(() => setCopiedResetLink(false), 2000);
  };

  const copyUid = () => {
    navigator.clipboard.writeText(user.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  // Find linked children if parent
  const linkedChildren = individuals.filter(ind => 
    ind.role === 'student' && (
      ind.parent_id === user.uid || 
      (user.children_ids && Array.isArray(user.children_ids) && user.children_ids.includes(ind.uid))
    )
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessNotice(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not authenticated");

      // Construct clean update payload
      const payload: any = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        kortex_id: formData.kortex_id.trim().toUpperCase(),
        phone: formData.phone.trim() || null,
        phoneVerified: formData.phoneVerified,
        has_completed_onboarding: formData.has_completed_onboarding,
        onboardingStatus: formData.onboardingStatus,
        country: formData.country.trim() || null,
        state: formData.state.trim() || null,
        city: formData.city.trim() || null,
        address: formData.address.trim() || null,
        accountStatus: formData.accountStatus,
        status: formData.status,
        is_pro: formData.is_pro,
        subscription_end_date: formData.subscription_end_date 
          ? new Date(formData.subscription_end_date).toISOString() 
          : null
      };

      if (user.role === 'student') {
        payload.username = formData.username.trim();
        payload.grade = formData.grade.trim();
        payload.section = formData.section.trim() || null;
        payload.roll_no = formData.roll_no.trim() || null;
        payload.emergency_contact = formData.emergency_contact.trim() || null;
        payload.plain_pin = formData.plain_pin.trim() || null;
        payload.parent_id = formData.parent_id.trim() || 'PENDING';
        payload.parent_name = formData.parent_name.trim() || null;
        payload.parent_email = formData.parent_email.trim() || null;
        payload.hearts_remaining = Number(formData.hearts_remaining) || 0;
        payload.current_streak_days = Number(formData.current_streak_days) || 0;
        payload.total_xp = Number(formData.total_xp) || 0;

        // Organization link
        if (formData.org_id) {
          payload.org_ids = [formData.org_id];
          payload.org_id = formData.org_id;
        } else {
          payload.org_ids = [];
          payload.org_id = null;
        }
      }

      if (user.role === 'teacher') {
        payload.org_id = formData.org_id || null;
        payload.assigned_combos = formData.assigned_combos;
      }

      if (user.role === 'parent') {
        payload.emergency_contact = formData.emergency_contact.trim() || null;
      }

      const result = await updateIndividualUser(idToken, user.uid, payload);
      if (!result.success) throw new Error(result.error);

      setSuccessNotice("Profile updated successfully!");
      setTimeout(() => {
        onSuccess({ ...user, ...payload });
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update user profile");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const roleColors: Record<string, { bg: string; text: string; border: string }> = {
    parent: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    student: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    teacher: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    admin: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    krew: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' }
  };
  const roleStyle = roleColors[user.role] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };

  const allParents = individuals.filter(ind => ind.role === 'parent');

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md shrink-0">
              {user.role === 'student' ? <GraduationCap size={24} className="text-amber-400" /> :
               user.role === 'parent' ? <Users size={24} className="text-sky-400" /> :
               user.role === 'teacher' ? <Award size={24} className="text-emerald-400" /> :
               <User size={24} className="text-indigo-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black">{formData.full_name || 'Edit User'}</h2>
                <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider ${roleStyle.bg} ${roleStyle.text}`}>
                  {user.role}
                </span>
                {formData.is_pro && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-md text-[10px] font-black uppercase flex items-center gap-1 border border-amber-500/30">
                    <Sparkles size={10} /> Pro
                  </span>
                )}
                {user.role === 'student' && user.parent_consent_verified && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md text-[10px] font-black uppercase flex items-center gap-1 border border-emerald-500/30">
                    <CheckCircle2 size={10} /> Consent Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mt-1">
                <span>ID: <span className="font-mono text-indigo-300 font-bold">{formData.kortex_id || 'NO_ID'}</span></span>
                <span>•</span>
                <button 
                  type="button" 
                  onClick={copyUid} 
                  className="hover:text-white transition-colors flex items-center gap-1 font-mono text-[11px]" 
                  title="Copy UID"
                >
                  UID: {user.uid.substring(0, 10)}... {copiedUid ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User size={15} /> Profile & Contact
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('academic')}
            className={`py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'academic'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap size={15} /> Role & Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('access')}
            className={`py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'access'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield size={15} /> Status & Membership
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'audit'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText size={15} /> Audit & Metadata
          </button>
        </div>

        {/* Modal Body / Tabs */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-200 text-rose-700 font-bold rounded-xl text-sm flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successNotice && (
            <div className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-200 text-emerald-700 font-bold rounded-xl text-sm flex items-center gap-3">
              <CheckCircle2 size={20} className="shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          <form id="editIndividualForm" onSubmit={handleSubmit} className="space-y-6">

            {/* TAB 1: PROFILE & CONTACT */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Full Name *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.full_name} 
                      onChange={e => setFormData({ ...formData, full_name: e.target.value })} 
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Kortex ID (Custom User ID) *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.kortex_id} 
                      onChange={e => setFormData({ ...formData, kortex_id: e.target.value.toUpperCase().replace(/\s+/g, '_') })} 
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-mono font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="email" 
                        value={formData.email} 
                        onChange={e => setFormData({ ...formData, email: e.target.value })} 
                        placeholder="user@example.com"
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-4 py-2.5 font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Contact Phone</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={formData.phone} 
                        onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                        placeholder="+91 9876543210"
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-4 py-2.5 font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>

                {user.role === 'student' && (
                  <div className="p-4 bg-sky-50/70 border-2 border-sky-100 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-sky-600" />
                        <span className="text-xs font-black uppercase tracking-wider text-sky-900">Parent / Guardian Consent & Contact</span>
                      </div>
                      {user.parent_consent_verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-md border border-emerald-200">
                          <CheckCircle2 size={11} className="text-emerald-600" /> Consent Verified (सत्यापित)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black uppercase rounded-md border border-amber-200">
                          Awaiting Consent
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Consenting Parent Name:</span>
                        <span className="font-bold text-slate-800 text-sm">{formData.parent_name || user.parent_name || <span className="text-slate-400 italic font-normal">Not provided</span>}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Parent Phone (Emergency Contact):</span>
                        <span className="font-bold text-slate-800 text-sm flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" />
                          {formData.emergency_contact || user.emergency_contact || <span className="text-slate-400 italic font-normal">Not provided</span>}
                        </span>
                      </div>
                      {user.claim_code && (
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Claim Code:</span>
                          <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs border border-indigo-100 inline-block">
                            {user.claim_code}
                          </span>
                        </div>
                      )}
                      {user.parent_consent_date && (
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Consent Date:</span>
                          <span className="font-medium text-slate-600 text-xs">
                            {new Date(user.parent_consent_date).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Phone Verification Status</p>
                      <p className="text-[11px] text-slate-400">Mark whether phone number OTP was completed</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.phoneVerified} 
                        onChange={e => setFormData({ ...formData, phoneVerified: e.target.checked })} 
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Onboarding Stage</p>
                      <p className="text-[11px] text-slate-400">Forces or bypasses phone gatekeeper</p>
                    </div>
                    <select
                      value={formData.onboardingStatus}
                      onChange={e => setFormData({ ...formData, onboardingStatus: e.target.value as any })}
                      className="bg-white border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PENDING_PHONE">PENDING_PHONE</option>
                    </select>
                  </div>
                </div>

                {/* Location Fields */}
                <div className="pt-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <MapPin size={14} className="text-indigo-600" /> Location & Address Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">City</label>
                      <input 
                        type="text" 
                        value={formData.city} 
                        onChange={e => setFormData({ ...formData, city: e.target.value })} 
                        placeholder="e.g. Mumbai"
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">State / Province</label>
                      <input 
                        type="text" 
                        value={formData.state} 
                        onChange={e => setFormData({ ...formData, state: e.target.value })} 
                        placeholder="e.g. Maharashtra"
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Country</label>
                      <input 
                        type="text" 
                        value={formData.country} 
                        onChange={e => setFormData({ ...formData, country: e.target.value })} 
                        placeholder="e.g. India"
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Full Address</label>
                    <textarea 
                      rows={2}
                      value={formData.address} 
                      onChange={e => setFormData({ ...formData, address: e.target.value })} 
                      placeholder="Street address, apartment, postal code..."
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white resize-none text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ROLE SPECIFIC & ACADEMICS */}
            {activeTab === 'academic' && (
              <div className="space-y-6 animate-fade-in">
                {user.role === 'student' && (
                  <>
                    <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-4">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="text-amber-600" size={18} />
                        <h4 className="text-sm font-black text-amber-900 uppercase tracking-wider">Student Credentials & Class</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Login Username</label>
                          <input 
                            type="text" 
                            value={formData.username} 
                            onChange={e => setFormData({ ...formData, username: e.target.value })} 
                            className="w-full bg-white border-2 border-amber-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 outline-none focus:border-amber-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Student PIN</label>
                          <div className="relative">
                            <input 
                              type={showPin ? "text" : "password"} 
                              maxLength={6}
                              value={formData.plain_pin} 
                              onChange={e => setFormData({ ...formData, plain_pin: e.target.value.replace(/[^0-9]/g, '') })} 
                              placeholder="6-digit PIN"
                              className="w-full bg-white border-2 border-amber-200 rounded-xl pl-3 pr-10 py-2 font-mono font-bold text-slate-800 outline-none focus:border-amber-500 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPin(!showPin)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">If ≥6 digits, also synchronizes as user's Firebase Auth password.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Grade</label>
                          <select
                            value={formData.grade}
                            onChange={e => setFormData({ ...formData, grade: e.target.value })}
                            className="w-full bg-white border-2 border-amber-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-amber-500"
                          >
                            <option value="">Select Grade</option>
                            {GRADES.map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Section</label>
                          <select
                            value={formData.section}
                            onChange={e => setFormData({ ...formData, section: e.target.value })}
                            className="w-full bg-white border-2 border-amber-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-amber-500"
                          >
                            <option value="">None / Independent</option>
                            {SECTIONS.map(s => (
                              <option key={s} value={s}>Section {s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Roll No.</label>
                          <input 
                            type="text" 
                            value={formData.roll_no} 
                            onChange={e => setFormData({ ...formData, roll_no: e.target.value })} 
                            placeholder="e.g. 15"
                            className="w-full bg-white border-2 border-amber-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:border-amber-500 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Emergency Contact</label>
                        <input 
                          type="text" 
                          value={formData.emergency_contact} 
                          onChange={e => setFormData({ ...formData, emergency_contact: e.target.value })} 
                          placeholder="Phone number of parent/guardian"
                          className="w-full bg-white border-2 border-amber-200 rounded-xl px-3 py-2 font-semibold text-slate-800 outline-none focus:border-amber-500 text-sm"
                        />
                      </div>
                    </div>

                    {/* Parent Association */}
                    <div className="p-5 bg-sky-50/50 rounded-2xl border border-sky-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="text-sky-600" size={18} />
                          <h4 className="text-sm font-black text-sky-900 uppercase tracking-wider">Parent & Guardian Affiliation</h4>
                        </div>
                        {user.parent_consent_verified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-md border border-emerald-300">
                            <CheckCircle2 size={11} className="text-emerald-600" /> Consent Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black uppercase rounded-md border border-amber-300">
                            Awaiting Link
                          </span>
                        )}
                      </div>

                      {user.parent_consent_verified && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs space-y-1">
                          <p className="font-bold flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                            Parent consent was recorded via school claim flow.
                          </p>
                          <p className="text-[11px] text-emerald-700">
                            Parent: <strong>{formData.parent_name || user.parent_name || 'N/A'}</strong> | Phone: <strong>{formData.emergency_contact || user.emergency_contact || 'N/A'}</strong>
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Select Registered Parent Account</label>
                        <select
                          value={formData.parent_id}
                          onChange={e => handleParentSelect(e.target.value)}
                          className="w-full bg-white border-2 border-sky-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-sky-500"
                        >
                          <option value="PENDING">
                            {user.parent_consent_verified || formData.parent_name
                              ? `PENDING — Consent Given by ${formData.parent_name || 'Parent'} (No Registered Portal Account Linked)`
                              : `PENDING (No Parent Account Linked)`}
                          </option>
                          {allParents.map(p => (
                            <option key={p.uid} value={p.uid}>
                              {p.full_name} ({p.email || p.phone || 'No Contact'}) — {p.kortex_id}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Parent / Guardian Name</label>
                          <input 
                            type="text" 
                            value={formData.parent_name} 
                            onChange={e => setFormData({ ...formData, parent_name: e.target.value })} 
                            placeholder="e.g. Ramesh Kumar"
                            className="w-full bg-white border-2 border-sky-100 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-sky-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Parent Phone (Emergency Contact)</label>
                          <input 
                            type="text" 
                            value={formData.emergency_contact} 
                            onChange={e => setFormData({ ...formData, emergency_contact: e.target.value })} 
                            placeholder="e.g. 9876543210"
                            className="w-full bg-white border-2 border-sky-100 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-sky-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Parent Email Cache</label>
                        <input 
                          type="email" 
                          value={formData.parent_email} 
                          onChange={e => setFormData({ ...formData, parent_email: e.target.value })} 
                          placeholder="parent@example.com"
                          className="w-full bg-white border-2 border-sky-100 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-sky-400"
                        />
                      </div>
                    </div>

                    {/* Organization Association */}
                    <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-200 space-y-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="text-indigo-600" size={18} />
                        <h4 className="text-sm font-black text-indigo-900 uppercase tracking-wider">Organization Affiliation</h4>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Associated Organization</label>
                        <select
                          value={formData.org_id}
                          onChange={e => setFormData({ ...formData, org_id: e.target.value })}
                          className="w-full bg-white border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500"
                        >
                          <option value="">Independent (No School / Coaching)</option>
                          {organizations.map(org => (
                            <option key={org.uid} value={org.uid}>
                              {org.organization_name} ({org.kortex_id})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Gamification Stats */}
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="text-indigo-600" size={18} />
                        <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">Gamification & Stamina</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider flex items-center gap-1">
                            <Heart size={14} className="text-rose-500 fill-rose-500" /> Hearts
                          </label>
                          <input 
                            type="number" 
                            min={0} 
                            max={100}
                            value={formData.hearts_remaining} 
                            onChange={e => setFormData({ ...formData, hearts_remaining: Number(e.target.value) })} 
                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 font-black text-slate-800 outline-none focus:border-indigo-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider flex items-center gap-1">
                            <Zap size={14} className="text-amber-500 fill-amber-500" /> Streak (Days)
                          </label>
                          <input 
                            type="number" 
                            min={0}
                            value={formData.current_streak_days} 
                            onChange={e => setFormData({ ...formData, current_streak_days: Number(e.target.value) })} 
                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 font-black text-slate-800 outline-none focus:border-indigo-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider flex items-center gap-1">
                            <Award size={14} className="text-indigo-500" /> Total XP
                          </label>
                          <input 
                            type="number" 
                            min={0}
                            value={formData.total_xp} 
                            onChange={e => setFormData({ ...formData, total_xp: Number(e.target.value) })} 
                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 font-black text-slate-800 outline-none focus:border-indigo-500 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {user.role === 'teacher' && (
                  <div className="space-y-6">
                    <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="text-emerald-700" size={18} />
                        <h4 className="text-sm font-black text-emerald-900 uppercase tracking-wider">Teacher Affiliation</h4>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Assigned School / Institution *</label>
                        <select
                          value={formData.org_id}
                          onChange={e => setFormData({ ...formData, org_id: e.target.value })}
                          className="w-full bg-white border-2 border-emerald-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-emerald-500"
                        >
                          <option value="">Unassigned</option>
                          {organizations.map(org => (
                            <option key={org.uid} value={org.uid}>
                              {org.organization_name} ({org.kortex_id})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers size={14} className="text-indigo-600" /> Assigned Grade-Section Combos ({formData.assigned_combos.length})
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <select
                          value={newGrade}
                          onChange={e => setNewGrade(e.target.value)}
                          className="bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                        >
                          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select
                          value={newSection}
                          onChange={e => setNewSection(e.target.value)}
                          className="bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                        >
                          {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                        </select>
                        <select
                          value={newSubject}
                          onChange={e => setNewSubject(e.target.value)}
                          className="bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                        >
                          {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddTeacherCombo}
                        className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Combo
                      </button>

                      <div className="flex flex-wrap gap-2 pt-2">
                        {formData.assigned_combos.map((combo, idx) => (
                          <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold shadow-sm">
                            {combo}
                            <button
                              type="button"
                              onClick={() => handleRemoveTeacherCombo(idx)}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {user.role === 'parent' && (
                  <div className="space-y-6">
                    <div className="p-5 bg-sky-50/50 rounded-2xl border border-sky-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="text-sky-600" size={18} />
                          <h4 className="text-sm font-black text-sky-900 uppercase tracking-wider">
                            Linked Children ({linkedChildren.length})
                          </h4>
                        </div>
                      </div>

                      {linkedChildren.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {linkedChildren.map(child => (
                            <div key={child.uid} className="p-3 bg-white rounded-xl border border-sky-100 shadow-sm flex items-center justify-between">
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{child.full_name}</p>
                                <p className="text-xs text-slate-400 font-mono">{child.kortex_id}</p>
                                <p className="text-[11px] font-semibold text-slate-500">{child.grade || 'No Grade'} {child.section ? `• Sec ${child.section}` : ''}</p>
                              </div>
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-black uppercase">
                                Student
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 font-semibold italic">No child profiles currently associated with this parent.</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Alternate / Emergency Contact</label>
                      <input 
                        type="text" 
                        value={formData.emergency_contact} 
                        onChange={e => setFormData({ ...formData, emergency_contact: e.target.value })} 
                        placeholder="Secondary contact phone"
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-semibold text-slate-800 outline-none focus:border-indigo-500 text-sm"
                      />
                    </div>
                  </div>
                )}

                {(user.role === 'admin' || user.role === 'krew') && (
                  <div className="p-6 bg-purple-50 rounded-2xl border border-purple-200 text-center space-y-2">
                    <Shield className="text-purple-600 mx-auto" size={32} />
                    <h4 className="text-base font-black text-purple-900">Privileged System Role ({user.role.toUpperCase()})</h4>
                    <p className="text-xs text-purple-700 font-medium max-w-md mx-auto">
                      This user possesses elevated administrative access across Kortex. Profile data and credentials are kept synchronized directly with Firebase Auth.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: STATUS & MEMBERSHIP */}
            {activeTab === 'access' && (
              <div className="space-y-6 animate-fade-in">
                {/* Account Status Pill Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Account Lifecycle Status</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, accountStatus: 'ACTIVE', status: 'active' })}
                      className={`p-3 rounded-xl border-2 text-center font-bold text-xs transition-all ${
                        formData.accountStatus === 'ACTIVE'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <CheckCircle2 size={18} className="mx-auto mb-1 text-emerald-500" />
                      ACTIVE
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, accountStatus: 'SUSPENDED', status: 'suspended' })}
                      className={`p-3 rounded-xl border-2 text-center font-bold text-xs transition-all ${
                        formData.accountStatus === 'SUSPENDED'
                          ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <AlertCircle size={18} className="mx-auto mb-1 text-amber-500" />
                      SUSPENDED
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, accountStatus: 'DELETED', status: 'suspended' })}
                      className={`p-3 rounded-xl border-2 text-center font-bold text-xs transition-all ${
                        formData.accountStatus === 'DELETED'
                          ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Trash2 size={18} className="mx-auto mb-1 text-rose-500" />
                      DELETED (SOFT)
                    </button>
                  </div>
                </div>

                {/* Pro Subscription */}
                <div className="p-5 bg-amber-50/60 rounded-2xl border-2 border-amber-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-amber-900 text-sm flex items-center gap-1.5">
                        <Sparkles size={16} className="text-amber-500" /> Kortex Pro Membership
                      </h4>
                      <p className="text-xs text-amber-700/80 font-medium">Grants unlimited learning stamins, hearts, and full B2C curriculum</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.is_pro} 
                        onChange={e => setFormData({ ...formData, is_pro: e.target.checked })} 
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {formData.is_pro && (
                    <div className="pt-2 border-t border-amber-200">
                      <label className="block text-xs font-bold text-amber-900 mb-1 uppercase tracking-wider">Subscription Renewal Date</label>
                      <input 
                        type="date" 
                        value={formData.subscription_end_date} 
                        onChange={e => setFormData({ ...formData, subscription_end_date: e.target.value })} 
                        className="w-full bg-white border-2 border-amber-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-amber-500 text-sm"
                      />
                      <p className="text-[11px] text-amber-700 mt-1">Leave empty for lifetime access.</p>
                    </div>
                  )}
                </div>

                {/* Password Reset Action */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Key size={14} className="text-indigo-600" /> Account Security & Password
                      </h4>
                      <p className="text-[11px] text-slate-400">Generate an instant password reset link for this user</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateResetLink}
                      disabled={resetLoading || !formData.email}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw size={12} className={resetLoading ? "animate-spin" : ""} />
                      {resetLoading ? 'Generating...' : 'Create Reset Link'}
                    </button>
                  </div>

                  {resetLink && (
                    <div className="p-3 bg-white rounded-xl border border-indigo-200 flex items-center justify-between gap-2 mt-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={resetLink} 
                        className="bg-transparent font-mono text-xs text-indigo-900 w-full outline-none select-all"
                      />
                      <button
                        type="button"
                        onClick={copyResetLink}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg text-xs flex items-center gap-1 shrink-0"
                      >
                        {copiedResetLink ? <Check size={14} /> : <Copy size={14} />}
                        {copiedResetLink ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: AUDIT & METADATA */}
            {activeTab === 'audit' && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Created At</p>
                    <p className="font-semibold text-slate-800 text-sm">
                      {user.created_at ? new Date(user.created_at).toLocaleString() : 'Not Recorded'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Profile Update</p>
                    <p className="font-semibold text-slate-800 text-sm">
                      {user.updated_at ? new Date(user.updated_at).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Internal Firebase UID</p>
                  <p className="font-mono text-xs font-bold text-slate-700 select-all break-all">{user.uid}</p>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Raw Document State (JSON Inspector)</p>
                  <pre className="p-4 bg-slate-900 text-indigo-200 text-xs font-mono rounded-2xl overflow-x-auto max-h-60">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </div>
              </div>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={loading}
            className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="editIndividualForm" 
            disabled={loading || !formData.full_name || !formData.kortex_id}
            className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Saving Changes...' : <><Save size={18} /> Save Changes</>}
          </button>
        </div>

      </div>
    </div>
  );

  return <ModalPortal>{modalContent}</ModalPortal>;
}

