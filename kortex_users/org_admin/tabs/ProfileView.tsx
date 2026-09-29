import React, { useState } from 'react';
import { Building2, Mail, Save, Fingerprint } from 'lucide-react';
import { OrgAdminProfile } from '../../../types/user';

export default function ProfileView({ profile }: { profile: OrgAdminProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: profile.organization_name,
    orgType: profile.org_type || 'school',
    address: '123 Education Lane, Learning City', // Mocked as it's not yet in the DB
    phone: '+1 234 567 8900' // Mocked
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: In the future, this would call a server action to update the profile in Firestore
    setIsEditing(false);
    alert('Profile updated successfully! (Mocked)');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="mb-6 border-b-2 border-slate-100 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Organization Profile</h2>
          <p className="font-semibold text-slate-400 text-sm mt-1">Manage your institution's public details and contact information.</p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="flex items-start gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
           <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Fingerprint size={24}/></div>
           <div>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Kortex ID</p>
             <p className="font-bold text-slate-800">{profile.kortex_id || 'Not Assigned'}</p>
           </div>
        </div>
        <div className="flex items-start gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
           <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Mail size={24}/></div>
           <div>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Registered Email</p>
             <p className="font-bold text-slate-800">{profile.email}</p>
           </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Organization Name</label>
          <div className="relative">
            <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              required
              disabled={!isEditing}
              value={formData.organizationName}
              onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
              className="w-full bg-white border-2 border-slate-200 rounded-xl pl-12 pr-4 py-3 font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors disabled:bg-slate-50 disabled:text-slate-500" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Organization Type</label>
            <select 
              disabled={!isEditing}
              value={formData.orgType}
              onChange={(e) => setFormData({...formData, orgType: e.target.value as any})}
              className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="school">School (K-12)</option>
              <option value="coaching">Coaching / Tutoring</option>
              <option value="ngo">NGO / Non-Profit</option>
              <option value="other">Other Educational Entity</option>
            </select>
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Contact Phone</label>
             <input 
               type="text" 
               disabled={!isEditing}
               value={formData.phone}
               onChange={(e) => setFormData({...formData, phone: e.target.value})}
               className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors disabled:bg-slate-50 disabled:text-slate-500" 
             />
          </div>
        </div>

        <div>
           <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Full Address</label>
           <textarea 
             disabled={!isEditing}
             value={formData.address}
             onChange={(e) => setFormData({...formData, address: e.target.value})}
             rows={3}
             className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors disabled:bg-slate-50 disabled:text-slate-500 resize-none" 
           />
        </div>

        <div className="pt-4 flex justify-end">
          {isEditing ? (
             <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Save size={18} /> Save Changes
                </button>
             </div>
          ) : (
            <button 
              type="button" 
              onClick={() => setIsEditing(true)}
              className="px-8 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-xl shadow-md transition-all"
            >
              Edit Profile
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
