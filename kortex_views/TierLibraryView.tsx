"use client";

import React, { useState, useEffect } from 'react';
import { Search, Lock, Star, X } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../backend_configurations/firebase';
import { Card } from './components/SharedUI';
import { 
  GRADES, 
  SUBJECTS, 
  getYouTubeThumbnail, 
  getSubjectFallbackImage 
} from '../kortex_library/curriculumConfig';

const TierLibraryView = ({ activeTier, isLoggedIn, requireAuth, onOpenTool }: any) => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tierItems, setTierItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTierData() {
      setIsLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'learning_tools'));
        let extractedItems: any[] = [];
        
        snapshot.docs.forEach(doc => {
          const item: any = { id: doc.id, ...doc.data() };
          const type = item.content_type?.toLowerCase() || '';
          
          let belongsToTier = false;
          if (activeTier.id === 'conceptualiser' && type === 'conceptualiser') belongsToTier = true;
          else if (activeTier.id === 'theatre' && type === 'video') belongsToTier = true;
          else if (activeTier.id === 'dojo' && type === 'quiz') belongsToTier = true;
          else if (activeTier.id === 'Notebook' && type === 'pdf') belongsToTier = true;
          else if (activeTier.id === 'arcade' && type === 'game') belongsToTier = true;

          // Added && item.is_featured === true to filter out non-featured items
          if (belongsToTier && item.is_featured === true) {
             let autoImage = item.image;

             // Force YouTube thumbnail priority first for all videos
             if (type === 'video' && item.content_url) {
                 const ytThumb = getYouTubeThumbnail(item.content_url);
                 if (ytThumb) autoImage = ytThumb;
             }

             // Apply general subject fallback if empty or if it contains an old Unsplash placeholder string
             if (!autoImage || autoImage.trim() === "" || autoImage.includes("images.unsplash.com")) {
                 autoImage = getSubjectFallbackImage(item.subject);
             }

             extractedItems.push({
               ...item, 
               image: autoImage, // FIXED: Now actually using the calculated autoImage!
               lessonContext: { chapter: item.chapter_name, book: item.book }, 
               stepIndex: 0
             });
          }
        });
        // Sort by created_at date (Newest first)
extractedItems.sort((a: any, b: any) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA; 
});

setTierItems(extractedItems);
      } catch (error) { console.error(error); } finally { setIsLoading(false); }
    }
    fetchTierData();
  }, [activeTier.id]);

  const filteredItems = tierItems.filter((item: any) => {
    const matchClass = selectedClass ? item.grade?.toLowerCase().trim() === selectedClass.toLowerCase().trim() : true;
    const dbSubj = item.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : item.subject?.toLowerCase().trim();
    const matchSubject = selectedSubject ? dbSubj === selectedSubject.toLowerCase().trim() : true;
    const matchQuery = searchQuery ? item.title?.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchClass && matchSubject && matchQuery;
  });

  const Icon = activeTier.icon;

  return (
    <div className="space-y-12 animate-fade-in max-w-6xl mx-auto">
      {/* Dynamic Header Card */}
      <div className={`bg-gradient-to-r from-slate-800 to-slate-900 rounded-[3rem] p-10 md:p-16 text-white flex flex-col md:flex-row items-center justify-between shadow-xl relative overflow-hidden`}>
        <div className={`absolute top-0 right-0 w-64 h-64 ${activeTier.mainColor} opacity-20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl`}></div>
        <div className={`absolute bottom-0 left-10 w-32 h-32 ${activeTier.mainColor} opacity-20 rounded-full translate-y-1/2 blur-2xl`}></div>
        
        <div className="relative z-10 text-center md:text-left mb-8 md:mb-0">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider mb-4 backdrop-blur-sm border border-white/20">
             <Icon size={16} className={activeTier.textColor} /> {activeTier.label}
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight">{activeTier.label}</h1>
          <p className="text-lg text-slate-300 font-medium max-w-lg">{activeTier.desc}</p>
        </div>
        <div className={`relative z-10 w-48 h-48 bg-white/5 rounded-[2.5rem] backdrop-blur-md border-4 border-white/10 flex items-center justify-center shadow-2xl transform rotate-3`}>
          <Icon size={80} className={`${activeTier.textColor} drop-shadow-lg`} />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="font-bold text-slate-500 text-sm uppercase px-2 hidden sm:block">Filter:</span>
            <select className={`flex-1 md:w-40 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:${activeTier.borderColor}`} value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="">All Grades</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select className={`flex-1 md:w-48 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:${activeTier.borderColor}`} value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="">All Subjects</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
         </div>
         <div className="relative w-full md:flex-1 flex gap-2">
            <div className="relative flex-1">
              <input type="text" placeholder={`Search ${activeTier.label}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 pl-4 pr-10 font-bold text-slate-700 outline-none focus:${activeTier.borderColor}`} />
              <Search className="absolute right-4 top-3.5 text-slate-400" size={20} />
            </div>
            {(selectedClass || selectedSubject || searchQuery) && (<button onClick={() => {setSelectedClass(""); setSelectedSubject(""); setSearchQuery("");}} className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-xl transition-colors shrink-0 flex items-center gap-2"><X size={16} /> Clear</button>)}
         </div>
      </div>

      {/* Grid */}
      <div className="pb-12">
        <h2 className="text-2xl font-extrabold text-slate-800 mb-6">{activeTier.label} Collection</h2>
        {isLoading ? (
           <div className={`py-20 text-center ${activeTier.textColor} font-bold animate-pulse`}>Loading modules...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.length > 0 ? filteredItems.map((item, idx) => (
               <Card key={idx} className={`hover:${activeTier.borderColor} cursor-pointer group relative p-0 flex flex-col border-b-4 ${activeTier.borderColor}`} onClick={() => {
                 if (item.isPremium) requireAuth(() => onOpenTool(item), `This is a Premium ${activeTier.label}. Sign up for free to access it!`);
                 else onOpenTool(item);
               }}>
                 <div className="relative h-36 w-full bg-slate-200 overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-transparent pointer-events-none"></div>
                    {item.isPremium && <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm flex items-center gap-1"><Star size={10} className="fill-white" /> PRO</div>}
                 </div>
                 <div className="p-5 bg-white flex-1 flex flex-col">
                   <div className="mb-2">
                      <p className={`text-[12px] font-black ${activeTier.textColor} uppercase tracking-wider line-clamp-1`}>{item.lessonContext?.chapter || activeTier.label}</p>
                   </div>
                   <h3 className={`text-lg font-extrabold text-slate-800 mb-2 group-hover:${activeTier.textColor} transition-colors leading-tight line-clamp-2`}>{item.title} {item.isPremium && !isLoggedIn && <Lock size={14} className="text-slate-300 inline mb-0.5 shrink-0"/>}</h3>
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-auto pt-3 border-t border-slate-100"><span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{item.grade}</span><span>•</span><span className="truncate">{item.subject}</span></div>
                 </div>
               </Card>
            )) : <div className="col-span-full py-16 text-center bg-white rounded-3xl border-2 border-slate-100"><h3 className="text-xl font-bold text-slate-700">No content found</h3></div>}
          </div>
        )}
      </div>
    </div>
  );
};










export default TierLibraryView;
