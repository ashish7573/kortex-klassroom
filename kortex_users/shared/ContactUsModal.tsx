"use client";
import React, { useState } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { submitUserFeedback } from '../../app/actions/feedback';

interface ContactUsModalProps {
  onClose: () => void;
  user: any | null; // Pass authProfile or similar
}

export default function ContactUsModal({ onClose, user }: ContactUsModalProps) {
  const [type, setType] = useState('suggestion');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    
    const payload = {
      userId: user?.uid,
      userRole: user?.role,
      userName: user?.full_name,
      userEmail: email,
      feedbackType: type,
      message: message.trim()
    };
    
    const res = await submitUserFeedback(payload);
    setIsSubmitting(false);
    
    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      alert("Failed to submit feedback. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative animate-fade-in-up">
        <div className="bg-gradient-to-r from-sky-500 to-indigo-600 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <MessageSquare size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Contact Us</h2>
              <p className="text-sky-100 text-sm font-semibold">We&apos;d love to hear your thoughts!</p>
            </div>
          </div>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800">Feedback Sent!</h3>
            <p className="text-slate-500 font-semibold">Thank you for helping us improve Kortex.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {!user && (
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Your Email (Optional)</label>
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="For follow-up questions"
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-sky-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Feedback Type</label>
              <select 
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-sky-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
              >
                <option value="suggestion">Suggestion / Idea</option>
                <option value="bug">Report a Problem / Bug</option>
                <option value="praise">Compliment / Testimonial</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Your Message</label>
              <textarea 
                required
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us what&apos;s on your mind..."
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-sky-500 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-colors resize-none"
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-white font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send size={18} /> {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

