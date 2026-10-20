"use client";
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../backend_configurations/firebase';
import { QuoteInquiry } from '../../types/user';
import { Building2, X, Send, CheckCircle2, ShieldCheck, Check } from 'lucide-react';
import ModalPortal from '../../components/ModalPortal';

const KORTEX_INNOVATIONS = [
  {
    id: 'individualized_learning',
    title: 'Guaranteed Individualized Learning',
    description: 'Empowers teachers to automatically track progress, assign custom homework, and provide tailored feedback to every single child.'
  },
  {
    id: 'multimodal_pedagogy',
    title: '360° Multi-Modal Pedagogy',
    description: 'Goes beyond digital screens by blending interactive conceptualizers with physical games, arts, crafts, and performing arts for all-round development ensuring Quality Education.'
  },
  {
    id: 'tier_architecture',
    title: 'The 5-Tier Lesson Architecture',
    description: 'A rigorously researched lesson structure and custom designed Learning tools, equips teachers with the exactly what they need to guide students from concept introduction to true mastery.'
  },
  {
    id: 'unified_ecosystem',
    title: 'The Unified Educational Ecosystem',
    description: 'A single, frictionless platform that seamlessly connects school management, teachers, students, and parents in real-time.'
  }
];

interface QuoteInquiryModalProps {
  onClose: () => void;
}

export default function QuoteInquiryModal({ onClose }: QuoteInquiryModalProps) {
  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orgType, setOrgType] = useState<'school' | 'coaching' | 'ngo' | 'other'>('school');
  const [studentCount, setStudentCount] = useState<string>('');
  const [selectedInnovations, setSelectedInnovations] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleInnovation = (title: string) => {
    setSelectedInnovations(prev => {
      if (prev.includes(title)) {
        return prev.filter(t => t !== title);
      }
      if (prev.length >= 2) {
        return [prev[1], title];
      }
      return [...prev, title];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (!studentCount.trim()) {
        throw new Error("Please enter estimated number of students.");
      }

      const inquiryData: QuoteInquiry = {
        organization_name: orgName.trim(),
        contact_person: contactName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        org_type: orgType,
        estimated_students: Number(studentCount) || 0,
        selected_innovations: selectedInnovations,
        message: selectedInnovations.length > 0 ? `Selected Innovations: ${selectedInnovations.join('; ')}` : '',
        status: 'new',
        created_at: new Date().toISOString()
      };

      await addDoc(collection(db, 'quote_inquiries'), inquiryData);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error("Error submitting quote inquiry:", err);
      setErrorMsg("Failed to submit. Please contact us directly at kortexkrew@gmail.com");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4 sm:p-6">
      <div className="bg-white rounded-[28px] sm:rounded-3xl max-w-lg w-full shadow-2xl relative border-2 border-slate-100/90 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Pinned Close Button: Stays fixed in the top-right corner on all screen sizes */}
        <button 
          type="button"
          onClick={onClose} 
          aria-label="Close dialog"
          className="absolute top-4 right-4 z-30 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-slate-100/90 hover:bg-slate-200 active:scale-95 rounded-full transition-all cursor-pointer shadow-xs"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
        {isSubmitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Inquiry Received!</h3>
            <p className="text-sm font-medium text-slate-500 mb-6 max-w-sm mx-auto">
              Thank you for partnering with Kortex Klassroom. Our education team will review your institution's profile and send your custom quote and setup credentials to <strong className="text-slate-700">{email}</strong>.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 leading-tight">Partner With Us</h2>
                <p className="text-xs font-semibold text-slate-400">Schools, Coaching Academies & NGOs</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-6">
              Educators and institutional administrators receive custom quotes and direct account provisioning by our team.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-100 text-red-600 text-sm font-bold rounded-xl animate-shake">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Institution / School Name <span className="text-rose-500 font-black">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. St. Xavier's International School"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                    Contact Person <span className="text-rose-500 font-black">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Principal / Academic Head"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                    Official Email <span className="text-rose-500 font-black">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="principal@school.edu"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                    Phone / WhatsApp <span className="text-rose-500 font-black">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                    Institution Type <span className="text-rose-500 font-black">*</span>
                  </label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value as any)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:border-indigo-500 text-sm"
                  >
                    <option value="school">K-12 School</option>
                    <option value="coaching">Coaching / Academy</option>
                    <option value="ngo">NGO / Foundation</option>
                    <option value="other">Other Educational Hub</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Estimated Number of Students <span className="text-rose-500 font-black">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={studentCount}
                  onChange={(e) => setStudentCount(e.target.value)}
                  placeholder="e.g. 250"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Which of these Kortex innovations will help your organisation the most?
                  </label>
                  <span className="text-[10px] font-bold text-indigo-600 shrink-0 ml-2">
                    (Select up to 2)
                  </span>
                </div>
                <div className="space-y-2">
                  {KORTEX_INNOVATIONS.map((item) => {
                    const isSelected = selectedInnovations.includes(item.title);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleInnovation(item.title)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-indigo-600 text-white' : 'border-2 border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check size={11} strokeWidth={3.5} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 leading-snug">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Submitting Proposal Request...' : (
                  <>
                    <Send size={16} /> Request Institutional Proposal & Account
                  </>
                )}
              </button>

              {/* Child Safety & Data Privacy Compliance Badges */}
              <div className="pt-2 flex items-center justify-center gap-3 text-center">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-600">
                  <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                  <span>COPPA Compliant</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-600">
                  <ShieldCheck size={13} className="text-indigo-600 shrink-0" />
                  <span>DPDP Act Compliant</span>
                </div>
              </div>
            </form>
          </div>
        )}
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
