"use client";
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { QuoteInquiry } from '../../types/user';
import { Building2, X, Send, CheckCircle2 } from 'lucide-react';

interface QuoteInquiryModalProps {
  onClose: () => void;
}

export default function QuoteInquiryModal({ onClose }: QuoteInquiryModalProps) {
  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orgType, setOrgType] = useState<'school' | 'coaching' | 'ngo' | 'other'>('school');
  const [studentCount, setStudentCount] = useState<number>(100);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const inquiryData: QuoteInquiry = {
        organization_name: orgName.trim(),
        contact_person: contactName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        org_type: orgType,
        estimated_students: Number(studentCount) || 0,
        message: message.trim(),
        status: 'new',
        created_at: new Date().toISOString()
      };

      await addDoc(collection(db, 'quote_inquiries'), inquiryData);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error("Error submitting quote inquiry:", err);
      setErrorMsg("Failed to submit inquiry. Please try again or reach out directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in px-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl relative border-4 border-slate-100 p-8 max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors"
        >
          <X size={20} />
        </button>

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
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all"
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
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Institution / School Name</label>
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
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Contact Person</label>
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
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Official Email</label>
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
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Institution Type</label>
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
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Estimated Student Licenses</label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={studentCount}
                  onChange={(e) => setStudentCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Curriculum Needs / Notes</label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about specific grades, NEP 2020 modules, or teacher requirements..."
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-medium text-slate-700 outline-none focus:border-indigo-500 text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting Proposal Request...' : (
                  <>
                    <Send size={16} /> Request Institutional Proposal & Account
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
