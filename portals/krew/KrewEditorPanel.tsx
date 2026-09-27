"use client";
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { X, Database, Sparkles, Plus, Edit3, Trash2, ShieldAlert, ArrowRight, Book, Server, CheckCircle, Layout, Layers, Box } from 'lucide-react';


const GRADES = [
  'FLN', 'Balvatika 1', 'Balvatika 2', 'Balvatika 3', 
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 
  'Grade 6', 'Grade 7', 'Grade 8'
];

const SUBJECTS = [
  'English', 'Hindi', 'Maths', 'EVS', 'SST', 
  'Mental Training', 'Physical Training and Sports', 
  'Art', 'Social emotional learning', 'Computer Science'
];

const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled, type = "button" }: any) => {
  const baseStyle = "font-black rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95";
  const variants: any = {
    primary: "bg-sky-500 hover:bg-sky-400 text-white border-b-4 border-sky-600 hover:border-sky-500 shadow-sm",
    secondary: "bg-amber-400 hover:bg-amber-300 text-amber-950 border-b-4 border-amber-500 hover:border-amber-400 shadow-sm",
    danger: "bg-rose-500 hover:bg-rose-400 text-white border-b-4 border-rose-600 hover:border-rose-500 shadow-sm",
    outline: "bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed scale-100' : ''} ${className}`}>
      {Icon && <Icon className="mr-2" size={20} />}
      {children}
    </button>
  );
};

// ============================================================================
// SECTION 11: KREW GLOBAL EDITOR PANEL (HEADLESS CMS)
// ============================================================================
const KrewEditorPanel = () => {
  const [wizardMode, setWizardMode] = useState<any>(null);
  const [wizardData, setWizardData] = useState<any>([]); 
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [targetLevel, setTargetLevel] = useState('TOOL'); // Handles both DELETE and EDIT scoping

  const initialWizardState = { 
     grade: '', subject: '', book: 'Kortex Klassroom', 
     chapterSelect: '', newChapter: '', chapterNumber: '', 
     subtopicSelect: '', newSubtopic: '', subtopicOrder: '', 
     toolSelect: '', toolOrder: '', toolType: 'Conceptualiser', 
     toolTitle: '', imageUrl: '', url: '', isFeatured: false, originalToolTitle: '' 
  };
  const [krewWizard, setKrewWizard] = useState(initialWizardState);

  useEffect(() => {
    async function fetchWizardData() {
      if (wizardMode && krewWizard.grade && krewWizard.subject) {
        const fg = krewWizard.grade.toLowerCase().trim();
        const fs = krewWizard.subject.toLowerCase().trim();
        try {
          const snapshot = await getDocs(collection(db, 'learning_tools'));
          const filtered = snapshot.docs.map(d => d.data()).filter((m: any) => {
             const dbSubj = m.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : m.subject?.toLowerCase().trim();
             return m.grade?.toLowerCase().trim() === fg && dbSubj === fs;
          });

          const chapterMap: any = {};
          filtered.forEach((tool: any) => {
              const chapName = tool.chapter_name || tool.chapter;
              if (!chapName) return;
              if (!chapterMap[chapName]) chapterMap[chapName] = { chapter: chapName, chapter_number: tool.chapter_number, subTopicsMap: {} };
              if (tool.subtopic) {
                  if (!chapterMap[chapName].subTopicsMap[tool.subtopic]) chapterMap[chapName].subTopicsMap[tool.subtopic] = { title: tool.subtopic, order: tool.subtopic_order || 1, tools: [] };
                  if (tool.title && tool.content_type && tool.content_type !== 'placeholder') chapterMap[chapName].subTopicsMap[tool.subtopic].tools.push(tool);
              }
          });

          const formattedData = Object.values(chapterMap).map((c: any) => ({ chapter: c.chapter, chapter_number: c.chapter_number, subTopics: Object.values(c.subTopicsMap) }));
          setWizardData(formattedData as any);
        } catch (e: any) { console.error(e); }
      } else { setWizardData([]); }
    }
    fetchWizardData();
  }, [krewWizard.grade, krewWizard.subject, wizardMode]);

  const selectedChapData: any = wizardData.find((c: any) => c.chapter === krewWizard.chapterSelect);
  const availableSubtopics = selectedChapData?.subTopics || [];
  const selectedSubtopicData: any = availableSubtopics.find((s: any) => s.title === krewWizard.subtopicSelect);
  const availableTools = selectedSubtopicData?.tools || [];

  const getExactToolDoc = async (g: any, s: any, c: any, sub: any, title: any) => {
     const snap = await getDocs(collection(db, 'learning_tools'));
     return snap.docs.find((d: any) => {
        const data = d.data();
        const dGrade = data.grade?.toLowerCase().trim() || '';
        const dSubj = data.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : (data.subject?.toLowerCase().trim() || '');
        const dChap = (data.chapter_name || data.chapter || '')?.toLowerCase().trim();
        const dSub = data.subtopic?.toLowerCase().trim() || '';
        const dTitle = data.title?.toLowerCase().trim() || '';
        return dGrade === (g||'').toLowerCase().trim() && dSubj === (s||'').toLowerCase().trim() && dChap === (c||'').toLowerCase().trim() && dSub === (sub||'').toLowerCase().trim() && dTitle === (title||'').toLowerCase().trim();
     });
  };

  const handleSubmitWizard = async () => {
     const isEdit = wizardMode === 'EDIT';
     const finalChapter = krewWizard.chapterSelect === 'NEW' ? krewWizard.newChapter : krewWizard.chapterSelect;
     const finalSubtopic = krewWizard.subtopicSelect === 'NEW' ? krewWizard.newSubtopic : krewWizard.subtopicSelect;
     
     // 1. BULK EDIT CHAPTER (Renames Chapter across all flat docs)
     if (isEdit && targetLevel === 'CHAPTER') {
         if (!krewWizard.newChapter || !krewWizard.chapterNumber) { alert("Please provide the new Chapter Name and Number!"); return; }
         setIsSendingRequest(true);
         try {
             const snapshot = await getDocs(collection(db, 'learning_tools'));
             const docsToUpdate = snapshot.docs.filter((d: any) => d.data().grade === krewWizard.grade && d.data().subject === krewWizard.subject && (d.data().chapter_name || d.data().chapter) === krewWizard.chapterSelect);
             for (const docSnap of docsToUpdate) {
                 await setDoc(doc(db, 'learning_tools', docSnap.id), { chapter: krewWizard.newChapter, chapter_name: krewWizard.newChapter, chapter_number: Number(krewWizard.chapterNumber) }, { merge: true });
             }
             await addDoc(collection(db, 'content_requests'), { krew_member_id: auth.currentUser?.uid || 'unknown', action_type: 'BULK_EDIT_CHAPTER', payload: { old: krewWizard.chapterSelect, new: krewWizard.newChapter }, status: 'APPROVED', resolved_by: 'Krew Auto-Publish', resolved_at: new Date().toISOString() });
             alert(`Successfully updated Chapter name for ${docsToUpdate.length} items!`);
             setWizardMode(null); window.location.reload();
         } catch(e: any) { console.error(e); alert("Error updating chapter."); } finally { setIsSendingRequest(false); }
         return;
     }

     // 2. BULK EDIT SUBTOPIC (Renames Subtopic across all flat docs in that chapter)
     if (isEdit && targetLevel === 'SUBTOPIC') {
         if (!krewWizard.newSubtopic || !krewWizard.subtopicOrder) { alert("Please provide the new Subtopic Name and Order!"); return; }
         setIsSendingRequest(true);
         try {
             const snapshot = await getDocs(collection(db, 'learning_tools'));
             const docsToUpdate = snapshot.docs.filter((d: any) => d.data().grade === krewWizard.grade && d.data().subject === krewWizard.subject && (d.data().chapter_name || d.data().chapter) === krewWizard.chapterSelect && d.data().subtopic === krewWizard.subtopicSelect);
             for (const docSnap of docsToUpdate) {
                 await setDoc(doc(db, 'learning_tools', docSnap.id), { subtopic: krewWizard.newSubtopic, subtopic_order: Number(krewWizard.subtopicOrder) }, { merge: true });
             }
             await addDoc(collection(db, 'content_requests'), { krew_member_id: auth.currentUser?.uid || 'unknown', action_type: 'BULK_EDIT_SUBTOPIC', payload: { old: krewWizard.subtopicSelect, new: krewWizard.newSubtopic }, status: 'APPROVED', resolved_by: 'Krew Auto-Publish', resolved_at: new Date().toISOString() });
             alert(`Successfully updated Subtopic name for ${docsToUpdate.length} items!`);
             setWizardMode(null); window.location.reload();
         } catch(e: any) { console.error(e); alert("Error updating subtopic."); } finally { setIsSendingRequest(false); }
         return;
     }

     // 3. STANDARD TOOL ADD/EDIT
     if (!krewWizard.grade || !krewWizard.subject || !finalChapter || !krewWizard.chapterNumber || !finalSubtopic || !krewWizard.toolTitle || !krewWizard.url) { 
         alert("Please fill out all required fields!"); return; 
     }

     if (!isEdit && krewWizard.chapterSelect === 'NEW') {
         const numTaken = wizardData.some((c: any) => Number(c.chapter_number) === Number(krewWizard.chapterNumber));
         if (numTaken) { alert(`Chapter Number ${krewWizard.chapterNumber} is already used. Please choose another.`); return; }
     }

     setIsSendingRequest(true);
     let toolColor = 'bg-sky-500';
     const tType = krewWizard.toolType.toLowerCase();
     if (tType === 'conceptualiser') toolColor = 'bg-purple-500';
     else if (tType === 'video') toolColor = 'bg-pink-500';
     else if (tType === 'quiz') toolColor = 'bg-orange-500';
     else if (tType === 'pdf') toolColor = 'bg-sky-500';
     else if (tType === 'game') toolColor = 'bg-lime-500';

     const flatPayload = {
        grade: krewWizard.grade, subject: krewWizard.subject, chapter_number: Number(krewWizard.chapterNumber),
        chapter_name: finalChapter, chapter: finalChapter, book: krewWizard.book || 'Kortex Klassroom', 
        subtopic_order: Number(krewWizard.subtopicOrder), subtopic: finalSubtopic, title: krewWizard.toolTitle, 
        content_type: krewWizard.toolType.toLowerCase(), type: krewWizard.toolType, image: krewWizard.imageUrl || '', 
        content_url: krewWizard.url, content_order: Number(krewWizard.toolOrder), orderIndex: Number(krewWizard.toolOrder), 
        isPremium: false, is_featured: krewWizard.isFeatured, color: toolColor, created_at: new Date().toISOString()
     };

     try {
       if (isEdit) {
          const oldDoc = await getExactToolDoc(flatPayload.grade, flatPayload.subject, krewWizard.chapterSelect, krewWizard.subtopicSelect, krewWizard.originalToolTitle);
          if (oldDoc) await setDoc(doc(db, 'learning_tools', oldDoc.id), flatPayload, { merge: true });
          else await addDoc(collection(db, 'learning_tools'), flatPayload);
       } else {
          await addDoc(collection(db, 'learning_tools'), flatPayload);
       }
       await addDoc(collection(db, 'content_requests'), { krew_member_id: auth.currentUser?.uid || 'unknown', action_type: isEdit ? 'EDIT' : 'ADD', target_type: 'TOOL', payload: flatPayload, status: 'APPROVED', resolved_by: 'Krew Auto-Publish', resolved_at: new Date().toISOString() });
       
       alert(`Success! Content ${isEdit ? 'updated' : 'added'} instantly.`);
       setWizardMode(null); window.location.reload(); 
     } catch (error: any) { console.error(error); alert("Error saving content."); } finally { setIsSendingRequest(false); }
  };

  const handleExecuteDelete = async () => {
     if (!krewWizard.grade || !krewWizard.subject || !krewWizard.chapterSelect) { alert("Please select targets to delete."); return; }
     if (!window.confirm(`WARNING: Are you sure you want to permanently DELETE this ${targetLevel}? This affects the live database instantly.`)) return;

     setIsSendingRequest(true);
     try {
       const snapshot = await getDocs(collection(db, 'learning_tools'));
       const docsToDelete = snapshot.docs.filter((docSnap: any) => {
           const data = docSnap.data();
           if (data.grade?.toLowerCase().trim() !== krewWizard.grade.toLowerCase().trim() || 
              (data.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : data.subject?.toLowerCase().trim()) !== krewWizard.subject.toLowerCase().trim()) return false;

           if (targetLevel === 'CHAPTER') return (data.chapter_name || data.chapter)?.toLowerCase().trim() === krewWizard.chapterSelect.toLowerCase().trim();
           if (targetLevel === 'SUBTOPIC') return (data.chapter_name || data.chapter)?.toLowerCase().trim() === krewWizard.chapterSelect.toLowerCase().trim() && data.subtopic?.toLowerCase().trim() === krewWizard.subtopicSelect.toLowerCase().trim();
           if (targetLevel === 'TOOL') return (data.chapter_name || data.chapter)?.toLowerCase().trim() === krewWizard.chapterSelect.toLowerCase().trim() && data.subtopic?.toLowerCase().trim() === krewWizard.subtopicSelect.toLowerCase().trim() && data.title?.toLowerCase().trim() === krewWizard.toolSelect.toLowerCase().trim();
           return false;
       });

       for (const docSnap of docsToDelete) await deleteDoc(doc(db, 'learning_tools', docSnap.id));
       await addDoc(collection(db, 'content_requests'), { krew_member_id: auth.currentUser?.uid || 'unknown', action_type: 'DELETE', target_type: targetLevel, payload: { chapter: krewWizard.chapterSelect, subtopic: krewWizard.subtopicSelect, tool: krewWizard.toolSelect }, status: 'APPROVED', resolved_by: 'Krew Auto-Publish', resolved_at: new Date().toISOString() });

       alert(`Successfully deleted ${docsToDelete.length} records!`);
       setWizardMode(null); window.location.reload(); 
     } catch (error: any) { console.error(error); alert("Error deleting content."); } finally { setIsSendingRequest(false); }
  };

  const openWizard = (mode: any) => { setWizardMode(mode); setKrewWizard(initialWizardState); setTargetLevel('TOOL'); };

  return (
    <>
      <div className="w-full bg-slate-800 text-white px-4 py-3 flex justify-between items-center shadow-md border-b-4 border-slate-900">
         <div className="font-black flex items-center gap-2 tracking-wide"><Database size={18} className="text-emerald-400"/> KREW STUDIO</div>
         <div className="flex gap-2">
            <Button onClick={()=>openWizard('ADD')} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm py-1.5 px-3 h-auto"><Plus size={16} className="mr-1"/> Add</Button>
            <Button onClick={()=>openWizard('EDIT')} className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm py-1.5 px-3 h-auto"><Edit3 size={16} className="mr-1"/> Edit</Button>
            <Button onClick={()=>openWizard('DELETE')} className="bg-rose-500 hover:bg-rose-600 text-white shadow-sm py-1.5 px-3 h-auto"><Trash2 size={16} className="mr-1"/> Delete</Button>
         </div>
      </div>

      {wizardMode && (
         <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in px-4 py-12 sm:py-24 overflow-y-auto">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-4xl w-full shadow-2xl relative border-4 border-slate-100 my-auto">
               <button onClick={() => setWizardMode(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2"><X size={20} /></button>
               
               <div className="flex items-center gap-4 mb-8 border-b-2 border-slate-100 pb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transform -rotate-3 ${wizardMode === 'ADD' ? 'bg-emerald-100 text-emerald-500' : wizardMode === 'EDIT' ? 'bg-amber-100 text-amber-500' : 'bg-rose-100 text-rose-500'}`}>
                     {wizardMode === 'ADD' ? <Plus size={28}/> : wizardMode === 'EDIT' ? <Edit3 size={28}/> : <Trash2 size={28}/>}
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-slate-800">{wizardMode === 'ADD' ? 'Add New Content' : wizardMode === 'EDIT' ? 'Edit Database Record' : 'Delete Content Protocol'}</h2>
                     <p className="text-slate-500 font-bold text-sm">Secure live database modification.</p>
                  </div>
               </div>

               <div className="space-y-6">
                  {/* --- TARGET LEVEL SELECTOR (For EDIT and DELETE) --- */}
                  {(wizardMode === 'DELETE' || wizardMode === 'EDIT') && (
                     <div className={`p-5 rounded-2xl border mb-6 ${wizardMode === 'DELETE' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
                        <label className={`block text-[10px] font-black mb-3 uppercase tracking-wider ${wizardMode === 'DELETE' ? 'text-rose-500' : 'text-amber-600'}`}>0. Target Level To {wizardMode}</label>
                        <div className="flex flex-wrap gap-4">
                           {['CHAPTER', 'SUBTOPIC', 'TOOL'].map(t => (
                              <label key={t} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer font-bold transition-all ${targetLevel === t ? (wizardMode === 'DELETE' ? 'bg-white text-rose-600 border-rose-500 shadow-sm' : 'bg-white text-amber-600 border-amber-500 shadow-sm') : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                                 <input type="radio" name="tLevel" checked={targetLevel === t} onChange={() => { setTargetLevel(t); setKrewWizard({...initialWizardState, grade: krewWizard.grade, subject: krewWizard.subject}); }} className="hidden"/> {t}
                              </label>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* STEPS 1-2: Core */}
                  <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">1. Grade *</label><select value={krewWizard.grade} onChange={(e: any) => setKrewWizard({...initialWizardState, grade: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500"><option value="">Select Grade...</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                     <div><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">2. Subject *</label><select value={krewWizard.subject} onChange={(e: any) => setKrewWizard({...krewWizard, subject: e.target.value, chapterSelect: '', subtopicSelect: '', toolSelect: ''})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500"><option value="">Select Subject...</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  </div>

                  {/* STEPS 3-4: Chapter */}
                  <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="md:col-span-3">
                         <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">3. Chapter Name *</label>
                         <div className="flex gap-2">
                             <select value={krewWizard.chapterSelect} onChange={(e: any) => {
                                 const val = e.target.value;
                                 if (val === 'NEW') setKrewWizard({...krewWizard, chapterSelect: 'NEW', chapterNumber: '', subtopicSelect: wizardMode === 'ADD' ? 'NEW' : '', newSubtopic: '', subtopicOrder: '', toolSelect: wizardMode === 'ADD' ? 'NEW' : '', toolOrder: '', toolType: 'Conceptualiser', toolTitle: '', imageUrl: '', url: '', originalToolTitle: ''});
                                 else {
                                     const chap = wizardData.find((c: any) => c.chapter === val);
                                     setKrewWizard({...krewWizard, chapterSelect: val, newChapter: (wizardMode === 'EDIT' && targetLevel === 'CHAPTER') ? val : '', chapterNumber: chap?.chapter_number || '', subtopicSelect: '', newSubtopic: '', subtopicOrder: '', toolSelect: '', toolOrder: '', toolTitle: '', imageUrl: '', url: '', originalToolTitle: ''});
                                 }
                             }} disabled={!krewWizard.subject} className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500 disabled:opacity-50">
                                 <option value="" disabled>Select Existing...</option>
                                 {wizardData.map((c: any) => <option key={c.chapter} value={c.chapter}>{c.chapter}</option>)}
                                 {wizardMode === 'ADD' && <option value="NEW" className="font-bold text-emerald-600">+ Create New Chapter</option>}
                             </select>
                             
                             {/* Show input if creating new, OR if editing this specific chapter level */}
                             {(krewWizard.chapterSelect === 'NEW' || (wizardMode === 'EDIT' && targetLevel === 'CHAPTER' && krewWizard.chapterSelect)) && (
                                <input type="text" value={krewWizard.newChapter} onChange={(e: any) => setKrewWizard({...krewWizard, newChapter: e.target.value})} className="flex-1 bg-white border-2 border-emerald-400 rounded-xl px-4 py-3 font-bold text-emerald-700 outline-none" placeholder={wizardMode === 'EDIT' ? "Update chapter name..." : "New chapter name..."} />
                             )}
                         </div>
                     </div>
                     <div className="md:col-span-1"><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">4. Chapter No.</label><input type="number" min="1" value={krewWizard.chapterNumber} onChange={(e: any) => setKrewWizard({...krewWizard, chapterNumber: e.target.value})} disabled={krewWizard.chapterSelect !== 'NEW' && !(wizardMode === 'EDIT' && targetLevel === 'CHAPTER')} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-black text-center text-slate-700 outline-none focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400" /></div>
                  </div>

                  {/* STEPS 5-6: Subtopic (Hidden if Target Level is Chapter) */}
                  {!(targetLevel === 'CHAPTER') && (
                     <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-3">
                            <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">5. Subtopic Name *</label>
                            <div className="flex gap-2">
                                <select value={krewWizard.subtopicSelect} onChange={(e: any) => {
                                    const val = e.target.value;
                                    if (val === 'NEW') setKrewWizard({...krewWizard, subtopicSelect: 'NEW', newSubtopic: '', subtopicOrder: '', toolSelect: wizardMode === 'ADD' ? 'NEW' : '', toolOrder: '', toolType: 'Conceptualiser', toolTitle: '', imageUrl: '', url: '', originalToolTitle: ''});
                                    else {
                                        const sub = availableSubtopics.find((s: any) => s.title === val);
                                        setKrewWizard({...krewWizard, subtopicSelect: val, newSubtopic: (wizardMode === 'EDIT' && targetLevel === 'SUBTOPIC') ? val : '', subtopicOrder: sub?.order || sub?.subtopic_order || '', toolSelect: '', toolOrder: '', toolTitle: '', imageUrl: '', url: '', originalToolTitle: ''});
                                    }
                                }} disabled={!krewWizard.chapterSelect || krewWizard.chapterSelect === 'NEW'} className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500 disabled:opacity-50">
                                   {krewWizard.chapterSelect === 'NEW' ? <option value="NEW" className="font-bold text-emerald-600">+ Create New Subtopic</option> : <><option value="" disabled>Select Existing...</option>{availableSubtopics.map((s: any, idx: number) => <option key={idx} value={s.title}>{s.title}</option>)} {wizardMode === 'ADD' && <option value="NEW" className="font-bold text-emerald-600">+ Create New Subtopic</option>}</>}
                                </select>
                                
                                {(krewWizard.subtopicSelect === 'NEW' || (wizardMode === 'EDIT' && targetLevel === 'SUBTOPIC' && krewWizard.subtopicSelect)) && (
                                   <input type="text" value={krewWizard.newSubtopic} onChange={(e: any) => setKrewWizard({...krewWizard, newSubtopic: e.target.value})} className="flex-1 bg-white border-2 border-emerald-400 rounded-xl px-4 py-3 font-bold text-emerald-700 outline-none" placeholder={wizardMode === 'EDIT' ? "Update subtopic name..." : "New subtopic name..."} />
                                )}
                            </div>
                        </div>
                        <div className="md:col-span-1"><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">6. Subtopic Order</label><input type="number" min="1" value={krewWizard.subtopicOrder} onChange={(e: any) => setKrewWizard({...krewWizard, subtopicOrder: e.target.value})} disabled={krewWizard.subtopicSelect !== 'NEW' && !(wizardMode === 'EDIT' && targetLevel === 'SUBTOPIC')} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-black text-center text-slate-700 outline-none focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400" /></div>
                     </div>
                  )}

                  {/* STEPS 7-12: Tool Data (Hidden if Target Level is Chapter or Subtopic) */}
                  {!(targetLevel === 'CHAPTER' || targetLevel === 'SUBTOPIC') && (
                     <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 space-y-4">
                        
                        {/* RESTORED: isFeatured Checkbox */}
                        <div className="flex justify-between items-center mb-4 border-b-2 border-slate-100 pb-4">
                           <label className={`block text-sm font-black ${wizardMode === 'EDIT' ? 'text-amber-500' : 'text-emerald-500'} uppercase tracking-wider`}>Tool Configuration</label>
                           <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border-2 border-slate-200">
                              <input type="checkbox" id="feat" checked={krewWizard.isFeatured} onChange={(e: any) => setKrewWizard({...krewWizard, isFeatured: e.target.checked})} className="w-4 h-4 accent-emerald-500 cursor-pointer" />
                              <label htmlFor="feat" className="text-xs font-bold text-slate-500 cursor-pointer flex items-center gap-1"><Sparkles size={14} className="text-emerald-400"/> Is Featured?</label>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="md:col-span-3">
                                <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">7. Target Tool *</label>
                                <select value={krewWizard.toolSelect} onChange={(e: any) => {
                                    const val = e.target.value;
                                    if (val === 'NEW') setKrewWizard({...krewWizard, toolSelect: 'NEW', toolOrder: '', toolType: 'Conceptualiser', toolTitle: '', imageUrl: '', url: '', originalToolTitle: ''});
                                    else {
                                        const tool = availableTools.find((t: any) => t.title === val);
                                        if(tool) {
                                            let tType = 'Video';
                                            if(tool.type) {
                                               const t = tool.type.toLowerCase();
                                               if (t==='game'||t==='gamepad2') tType='Game'; else if (t==='pdf') tType='PDF'; else if (t==='quiz') tType='Quiz'; else if (t==='conceptualiser') tType='Conceptualiser';
                                            }
                                            setKrewWizard({...krewWizard, toolSelect: val, toolOrder: tool.orderIndex || tool.content_order || 1, toolType: tType, toolTitle: tool.title, imageUrl: tool.image || tool.image_url || '', url: tool.content_url || '', originalToolTitle: tool.title, isFeatured: tool.is_featured || false});
                                        }
                                    }
                                }} disabled={!krewWizard.subtopicSelect || krewWizard.subtopicSelect === 'NEW'} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500 disabled:opacity-50">
                                   {krewWizard.subtopicSelect === 'NEW' ? <option value="NEW" className="font-bold text-emerald-600">+ Upload New Content</option> : <><option value="" disabled>Select Existing Content...</option>{availableTools.map((t: any, idx: number) => <option key={idx} value={t.title}>{t.title} ({t.type || t.content_type})</option>)} {wizardMode === 'ADD' && <option value="NEW" className="font-bold text-emerald-600">+ Upload New Content</option>}</>}
                                </select>
                            </div>
                            <div className="md:col-span-1"><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">8. Tool Order</label><input type="number" min="1" value={krewWizard.toolOrder} onChange={(e: any) => setKrewWizard({...krewWizard, toolOrder: e.target.value})} disabled={krewWizard.toolSelect !== 'NEW' && wizardMode !== 'ADD'} className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-3 font-black text-center text-slate-700 outline-none focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400" /></div>
                        </div>

                        {wizardMode !== 'DELETE' && krewWizard.toolSelect && (
                            <>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                   <div className="md:col-span-1">
                                      <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">9. Content Type</label>
                                      <select value={krewWizard.toolType} onChange={(e: any) => setKrewWizard({...krewWizard, toolType: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500">
                                         <option value="Conceptualiser">Conceptualiser</option><option value="Video">Video</option><option value="Quiz">Quiz</option><option value="PDF">PDF</option><option value="Game">Game</option>
                                      </select>
                                   </div>
                                   <div className="md:col-span-2"><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">10. Title of Content *</label><input type="text" value={krewWizard.toolTitle} onChange={(e: any) => setKrewWizard({...krewWizard, toolTitle: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500" placeholder="e.g. Place Value 3D" /></div>
                               </div>
                               
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">11. Image URL</label><input type="text" value={krewWizard.imageUrl} onChange={(e: any) => setKrewWizard({...krewWizard, imageUrl: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-mono text-sm text-slate-700 outline-none focus:border-sky-500" placeholder="/thumbnails/math.jpg" /></div>
                                  <div><label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-wider">12. Route Path *</label><input type="text" value={krewWizard.url} onChange={(e: any) => setKrewWizard({...krewWizard, url: e.target.value})} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-slate-700 outline-none focus:border-sky-500 text-sm" placeholder="/conceptualisers/tool" /></div>
                               </div>
                            </>
                        )}
                     </div>
                  )}
               </div>
               
               {wizardMode === 'DELETE' ? (
                  <Button onClick={handleExecuteDelete} disabled={isSendingRequest || !krewWizard.chapterSelect} className="w-full mt-8 bg-rose-500 hover:bg-rose-600 border-b-4 border-rose-700 text-white font-black py-6 text-lg shadow-xl">
                     {isSendingRequest ? 'Executing Deletion...' : `PERMANENTLY DELETE ${targetLevel}`} <Trash2 size={20} className="ml-2 inline" />
                  </Button>
               ) : (
                  <Button onClick={handleSubmitWizard} disabled={isSendingRequest || (targetLevel === 'TOOL' && (!krewWizard.toolTitle || !krewWizard.url))} className={`w-full mt-8 ${wizardMode === 'EDIT' ? 'bg-amber-500 hover:bg-amber-600 border-amber-700' : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700'} border-b-4 text-white font-black py-6 text-lg shadow-xl`}>
                     {isSendingRequest ? 'Saving...' : (wizardMode === 'EDIT' ? `UPDATE ${targetLevel} RECORD` : 'SAVE NEW CONTENT')} <Database size={20} className="ml-2 inline" />
                  </Button>
               )}
            </div>
         </div>
      )}
    </>
  );
};








export default KrewEditorPanel;
