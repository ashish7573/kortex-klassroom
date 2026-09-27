"use client";
import React, { useState } from 'react';
import { doc, setDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../backend_configurations/firebase';
import { StudentProfile } from '../../types/user';
import { X, Sparkles, UserPlus, CheckCircle2, Copy, Check, KeyRound } from 'lucide-react';

interface AddChildModalProps {
  parentUid: string;
  onClose: () => void;
  onChildCreated: (childId: string) => void;
}

const GRADES = [
  'FLN', 'Balvatika 1', 'Balvatika 2', 'Balvatika 3', 
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 
  'Grade 6', 'Grade 7', 'Grade 8'
];

export default function AddChildModal({ parentUid, onClose, onChildCreated }: AddChildModalProps) {
  const [childName, setChildName] = useState('');
  const [username, setUsername] = useState('');
  const [grade, setGrade] = useState('Grade 1');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; pin: string } | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '').trim();
    if (cleanUsername.length < 3) {
      setErrorMsg("Username must be at least 3 alphanumeric characters.");
      setIsSubmitting(false);
      return;
    }

    if (pin.length < 4) {
      setErrorMsg("Please choose a PIN/Password with at least 4 characters.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Check if username is already taken
      const usernameQuery = query(collection(db, 'users'), where('username', '==', cleanUsername));
      const querySnap = await getDocs(usernameQuery);
      if (!querySnap.empty) {
        setErrorMsg(`Username "${cleanUsername}" is already taken. Please choose another.`);
        setIsSubmitting(false);
        return;
      }

      // 2. Generate a student virtual email for authentication
      const studentEmail = `${cleanUsername}@student.kortex.app`;

      // 3. Create the student authentication record
      const studentCred = await createUserWithEmailAndPassword(auth, studentEmail, pin);
      const studentUid = studentCred.user.uid;

      // 4. Create the student Firestore profile linked to the parent
      const studentProfile: StudentProfile = {
        uid: studentUid,
        email: studentEmail,
        username: cleanUsername,
        full_name: childName.trim(),
        role: 'student',
        grade: grade,
        parent_id: parentUid,
        org_id: null,
        teacher_ids: [],
        org_approval_status: 'none',
        status: 'active',
        is_pro: false,
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', studentUid), studentProfile);

      // 5. Update parent's children_ids array
      await updateDoc(doc(db, 'users', parentUid), {
        children_ids: arrayUnion(studentUid),
        updated_at: new Date().toISOString()
      });

      setCreatedCredentials({ username: cleanUsername, pin });
      onChildCreated(studentUid);
    } catch (err: any) {
      console.error("Error creating child account:", err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg("This student username is already in use.");
      } else {
        setErrorMsg(err.message || "Failed to create child account.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCredentials = () => {
    if (createdCredentials) {
      navigator.clipboard.writeText(`Username: ${createdCredentials.username}\nPIN: ${createdCredentials.pin}`);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in px-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl relative border-4 border-slate-100 p-8">
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors"
        >
          <X size={20} />
        </button>

        {createdCredentials ? (
          <div className="text-center py-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-1">Child Account Created!</h3>
            <p className="text-xs text-slate-400 mb-6 font-semibold">
              Save these credentials. Your child can sign in directly on the platform with this username and PIN.
            </p>

            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-left mb-6 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-500">Student Username:</span>
                <span className="font-black text-indigo-600 font-mono text-base">{createdCredentials.username}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-500">PIN / Password:</span>
                <span className="font-black text-slate-800 font-mono text-base">{createdCredentials.pin}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={copyCredentials}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {hasCopied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                {hasCopied ? 'Copied to Clipboard!' : 'Copy Credentials'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm rounded-xl shadow-md transition-all"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center">
                <Sparkles size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 leading-tight">Add Child Account</h2>
                <p className="text-xs font-semibold text-slate-400">Linked to your Parent Profile</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-6">
              Create a personalized learning portal for your child with simple credentials.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-100 text-red-600 text-sm font-bold rounded-xl animate-shake">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateChild} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Child's Full Name</label>
                <input
                  type="text"
                  required
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Student Username</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. aarav2026"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Letters, numbers, and underscores only</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Grade Level</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm"
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">PIN / Password</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="e.g. 1234"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-700 outline-none focus:border-sky-500 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-2"
              >
                {isSubmitting ? 'Creating Student Profile...' : (
                  <>
                    <UserPlus size={18} /> Create Child Account
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
