"use client";
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../backend_configurations/firebase';
import { CheckCircle2, MessageSquare, Star, Trash2 } from 'lucide-react';

export default function UserFeedbackTab() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'user_feedbacks'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setFeedbacks(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleTestimonial = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'user_feedbacks', id), { is_testimonial: !currentStatus });
    } catch (error) {
      console.error("Error toggling testimonial status", error);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await updateDoc(doc(db, 'user_feedbacks', id), { status: 'resolved' });
    } catch (error) {
      console.error("Error resolving feedback", error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading feedback...</div>;
  }

  if (feedbacks.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 flex flex-col items-center">
        <MessageSquare className="w-12 h-12 mb-4 text-slate-300" />
        <p>No user feedback received yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedbacks.map((fb) => (
        <div key={fb.id} className={`p-4 border rounded-xl flex flex-col md:flex-row gap-4 justify-between items-start ${fb.status === 'resolved' ? 'bg-slate-50 opacity-75' : 'bg-white shadow-sm'}`}>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-bold uppercase rounded-md ${
                fb.feedback_type === 'problem' ? 'bg-red-100 text-red-700' : 
                fb.feedback_type === 'suggestion' ? 'bg-blue-100 text-blue-700' : 
                'bg-emerald-100 text-emerald-700'
              }`}>
                {fb.feedback_type}
              </span>
              <span className="text-sm font-semibold text-slate-700">{fb.user_name}</span>
              <span className="text-xs text-slate-500">({fb.user_role})</span>
              {fb.user_email && <span className="text-xs text-slate-400">&lt;{fb.user_email}&gt;</span>}
            </div>
            
            <p className="text-slate-800 whitespace-pre-wrap">{fb.message}</p>
            
            <div className="text-xs text-slate-400">
              Submitted: {new Date(fb.created_at).toLocaleString()}
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <button 
              onClick={() => handleToggleTestimonial(fb.id, fb.is_testimonial)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                fb.is_testimonial 
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Star className="w-4 h-4" />
              {fb.is_testimonial ? 'Testimonial' : 'Mark Testimonial'}
            </button>

            {fb.status !== 'resolved' && (
              <button 
                onClick={() => handleResolve(fb.id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Resolve
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
