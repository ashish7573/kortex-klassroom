"use client";

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Layers, Gamepad2, Video, ChevronLeft, ChevronUp, ChevronDown, CheckCircle2, 
  Lightbulb, Target, FileText, Star, Lock, Search, X 
} from 'lucide-react';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../backend_configurations/firebase';
import { Card, Button } from './components/SharedUI';
import { 
  GRADES, 
  SUBJECTS, 
  getYouTubeThumbnail, 
  getSubjectFallbackImage,
  getTierForTool
} from './curriculumConfig';

const LessonsView = ({ isLoggedIn, requireAuth, onStartLesson, defaultClass, defaultSubject, authProfile }: any) => {
  const [selectedClass, setSelectedClass] = useState(defaultClass || "");
  const [selectedSubject, setSelectedSubject] = useState(defaultSubject || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [allLessons, setAllLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeLesson, setActiveLesson] = useState(null);
  const [expandedSubTopics, setExpandedSubTopics] = useState({});
  const [studentProgress, setStudentProgress] = useState<any[]>([]);

  const toggleSubTopic = (id: any) => setExpandedSubTopics(prev => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    if (!authProfile?.uid) return;
    const unsubscribe = onSnapshot(collection(db, 'users', authProfile.uid, 'progress'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudentProgress(data);
    });
    return () => unsubscribe();
  }, [authProfile]);


  useEffect(() => {
    async function fetchLessons() {
      try {
        // Fetch the new flat collection (Optimized)
        let toolsQuery = collection(db, 'learning_tools') as any;
        if (selectedClass && selectedClass !== '') {
            toolsQuery = query(collection(db, 'learning_tools'), where('grade', 'in', [selectedClass, selectedClass.toUpperCase(), selectedClass.toLowerCase()]));
        }
        
        const snapshot = await getDocs(toolsQuery).catch(() => ({ docs: [] }));
        let flatTools = snapshot.docs.map((d: any) => ({id: d.id, ...d.data()}));
        
        // If subject is selected, filter in memory
        if (selectedSubject && selectedSubject !== '') {
           flatTools = flatTools.filter((t: any) => {
               const s = (t.subject || '').trim().toLowerCase();
               const queryS = selectedSubject.toLowerCase();
               return s === queryS || (queryS === 'maths' && s === 'mathematics') || (queryS === 'mathematics' && s === 'maths');
           });
        }
        
        const chaptersMap = {};

        // 1. Group the flat tools into Chapters and Subtopics
        flatTools.forEach((tool: any) => {
           // Create a unique key for the chapter
           const key = `${tool.grade}_${tool.subject}_${tool.chapter_number}`;
           
           if (!chaptersMap[key]) {
              chaptersMap[key] = {
                 id: key, // Use this unique string as the React key
                 grade: tool.grade,
                 subject: tool.subject,
                 chapter_number: tool.chapter_number,
                 chapter: tool.chapter_name, // Map to UI's expected variable
                 book: tool.book || 'Kortex Klassroom',
                 image: tool.image || null,
                 items: 0,
                 color: 'border-sky-500',
                 subTopicsMap: {} // Temporary holding area for subtopics
              };
           }

           // Only count real content towards the "Items" badge, ignore empty chapter placeholders
           if (tool.content_type && tool.content_type !== 'Placeholder') {
              chaptersMap[key].items += 1;
           }

           // Group the tools into their specific subtopics
           if (tool.subtopic) {
              const subKey = tool.subtopic;
              if (!chaptersMap[key].subTopicsMap[subKey]) {
                 chaptersMap[key].subTopicsMap[subKey] = {
                    title: tool.subtopic,
                    subtopic_order: tool.subtopic_order || 1,
                    tools: []
                 };
              }
              // Don't push empty placeholders into the actual tool list
              if (tool.title && tool.content_type !== 'Placeholder') {
                 chaptersMap[key].subTopicsMap[subKey].tools.push(tool);
              }
           }
        });

        // 2. Sort Everything (Tools -> Subtopics -> Chapters)
        const processedModules = Object.values(chaptersMap).map((chapter: any) => {
           let subTopicsArray = Object.values(chapter.subTopicsMap);

           // A. Sort the tools inside each subtopic by content_order (1, 2, 3...)
           subTopicsArray.forEach((sub: any) => {
              sub.tools.sort((a: any, b: any) => (a.content_order || 1) - (b.content_order || 1));
           });

           // B. Sort the subtopics themselves by subtopic_order (1, 2, 3...)
           subTopicsArray.sort((a: any, b: any) => (a.subtopic_order || 1) - (b.subtopic_order || 1));

           chapter.subTopics = subTopicsArray;
           delete chapter.subTopicsMap; // Cleanup

           // Fallback Image handling: Run lookup if empty OR if it contains a generic Unsplash fallback string
           if (!chapter.image || chapter.image.trim() === "" || chapter.image.includes("images.unsplash.com")) {
               // If the first item in the chapter is a video, use its thumbnail!
               const firstSub = subTopicsArray[0] as any; 
               const firstTool = firstSub?.tools?.[0];
               if (firstTool && (firstTool.content_type?.toLowerCase() === 'video' || firstTool.type?.toLowerCase() === 'video') && firstTool.content_url) {
                   chapter.image = getYouTubeThumbnail(firstTool.content_url);
               }
               // Otherwise, use subject fallback if no video thumbnail was successfully pulled
               if (!chapter.image || chapter.image.trim() === "" || chapter.image.includes("images.unsplash.com")) {
                   chapter.image = getSubjectFallbackImage(chapter.subject);
               }
           }

           return chapter;
        });

        // C. Sort the final Chapters array by chapter_number
        processedModules.sort((a: any, b: any) => a.chapter_number - b.chapter_number);

        setAllLessons(processedModules);
      } catch (error: any) { 
        console.error("Error fetching lessons:", error); 
      } finally { 
        setIsLoading(false); 
      }
    }
    
    fetchLessons();
  }, [selectedClass, selectedSubject]);

  const filteredLessons = allLessons.filter((lesson: any) => {
    const matchClass = selectedClass ? lesson.grade?.toLowerCase().trim() === selectedClass.toLowerCase().trim() : true;
    const dbSubj = lesson.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : lesson.subject?.toLowerCase().trim();
    const matchSubject = selectedSubject ? dbSubj === selectedSubject.toLowerCase().trim() : true;
    const matchQuery = searchQuery ? lesson.chapter?.toLowerCase().includes(searchQuery.toLowerCase()) || lesson.book?.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchClass && matchSubject && matchQuery;
  });

  return (
    <div className="space-y-12 animate-fade-in max-w-6xl mx-auto">
      {!activeLesson ? (
        <>
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-[3rem] p-10 md:p-16 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between border-t-8 border-sky-500">
            
            <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500 opacity-10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
            
            <div className="relative z-10 text-center md:text-left mb-10 md:mb-0">
              <div className="inline-flex items-center gap-2 bg-sky-500/20 backdrop-blur-md px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider mb-6 border border-sky-500/30 shadow-sm text-sky-400">
                <BookOpen size={16} /> Kortex Master Curriculum
              </div>
              <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight drop-shadow-sm">
                Systematic.<br/>Structured.<br/><span className="text-sky-400">Simple.</span>
              </h1>
              <p className="text-lg text-slate-300 font-medium max-w-xl drop-shadow-sm leading-relaxed">
                We believe true mastery doesn't happen by playing random games. It happens through carefully sequenced, NCF-aligned learning pathways. Select your grade and subject below to explore our structured curriculum.
              </p>
            </div>

            <div className="relative z-10 hidden md:block mr-8">
               <div className="relative w-56 h-56">
                  <div className="absolute inset-0 bg-white/5 rounded-[2.5rem] backdrop-blur-md border-4 border-white/10 flex items-center justify-center shadow-2xl transform -rotate-3 hover:rotate-3 transition-transform duration-500 z-10">
                     <Layers size={90} className="text-sky-400 drop-shadow-md" />
                  </div>
                  <div className="absolute -top-6 -right-6 bg-slate-800 rounded-2xl p-4 shadow-xl border-2 border-slate-700 transform rotate-12 animate-bounce z-20" style={{animationDuration: '3.5s'}}>
                     <Gamepad2 size={28} className="text-lime-400" />
                  </div>
                  <div className="absolute -bottom-4 -left-6 bg-slate-800 rounded-2xl p-4 shadow-xl border-2 border-slate-700 transform -rotate-6 animate-bounce z-20" style={{animationDuration: '4.2s'}}>
                     <Video size={28} className="text-pink-400" />
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
             <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <span className="font-bold text-slate-500 text-sm uppercase px-2 hidden sm:block">Filter:</span>
                <select className="flex-1 md:w-40 bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500" value={selectedClass} onChange={(e: any) => setSelectedClass(e.target.value)}>
                  <option value="">All Grades</option>{GRADES.map((g: any) => <option key={g} value={g}>{g}</option>)}
                </select>
                <select className="flex-1 md:w-48 bg-slate-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-sky-500" value={selectedSubject} onChange={(e: any) => setSelectedSubject(e.target.value)}>
                  <option value="">All Subjects</option>{SUBJECTS.map((s: any) => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             <div className="relative w-full md:flex-1 flex gap-2">
                <div className="relative flex-1">
                  <input type="text" placeholder="Search chapters or books..." value={searchQuery} onChange={(e: any) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border-2 rounded-xl py-3 pl-4 pr-10 font-bold outline-none focus:border-sky-500" />
                  <Search className="absolute right-4 top-3.5 text-slate-400" size={20} />
                </div>
                {(selectedClass || selectedSubject || searchQuery) && <button onClick={() => {setSelectedClass(""); setSelectedSubject(""); setSearchQuery("");}} className="px-4 bg-slate-100 font-bold rounded-xl flex items-center gap-2 hover:bg-slate-200"><X size={16} /> Clear</button>}
             </div>
          </div>

          <div className="pb-12">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6">All Lessons</h2>
            {isLoading ? (<div className="py-20 text-center font-bold text-sky-500 animate-pulse">Loading Lessons...</div>) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLessons.length > 0 ? filteredLessons.map((lesson: any, idx: any) => (
                  <Card key={idx} className={`border-b-8 ${lesson.color} cursor-pointer group transition-all p-0 flex flex-col hover:border-sky-300`} onClick={() => setActiveLesson(lesson)}>
                    <div className="relative h-48 w-full bg-slate-200 overflow-hidden">
                       <img src={lesson.image} alt={lesson.chapter} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                       <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/20 to-transparent"></div>
                       <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-2">
                          <span className="bg-white/90 text-slate-800 text-xs font-bold uppercase px-3 py-1.5 rounded-full shadow-sm max-w-[65%] truncate">{lesson.book}</span>
                          <div className="bg-slate-900/60 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm shrink-0"><Layers size={14} /> {lesson.items} Items</div>
                       </div>
                    </div>
                    <div className="p-6 bg-white flex-1 flex flex-col group-hover:bg-slate-50 transition-colors">
                       
                       <h3 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-sky-600 leading-tight">{lesson.chapter}</h3>
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-4"><span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">{lesson.grade}</span><span>•</span><span>{lesson.subject}</span></div>
                       {(() => {
                           const cKey = `${lesson.grade}_${lesson.subject}`.toLowerCase();
                           const subjProg = studentProgress.find(p => p.id?.toLowerCase() === cKey || p.id?.toLowerCase() === lesson.subject?.toLowerCase());
                           const compObj = subjProg?.completed_tools || {};
                           let totalTools = 0;
                           let completedTools = 0;
                           if (lesson.subTopics) {
                               lesson.subTopics.forEach((st: any) => {
                                  if (st.tools) {
                                      totalTools += st.tools.length;
                                      st.tools.forEach((t: any) => { if (compObj[t.id]) completedTools++; });
                                  }
                               });
                           } else if (lesson.flow) {
                               totalTools += lesson.flow.length;
                               lesson.flow.forEach((t: any) => { if (compObj[t.id]) completedTools++; });
                           }
                           const pct = totalTools > 0 ? Math.round((completedTools / totalTools) * 100) : 0;
                           
                           return totalTools > 0 ? (
                               <div className="mb-4">
                                   <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider mb-1 text-slate-500">
                                       <span>Progress</span>
                                       <span className={pct === 100 ? 'text-emerald-500' : 'text-sky-500'}>{pct}%</span>
                                   </div>
                                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                       <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-sky-500'}`} style={{ width: `${pct}%` }}></div>
                                   </div>
                               </div>
                           ) : null;
                       })()}

                       <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-600 mt-auto pt-4 border-t border-slate-100">
                          <span className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1.5 rounded-md shadow-sm hover:border-purple-300 transition-colors"><Lightbulb size={14} className="text-purple-500"/> Concepts</span>
                          <span className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1.5 rounded-md shadow-sm hover:border-pink-300 transition-colors"><Video size={14} className="text-pink-500"/> Videos</span>
                          <span className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1.5 rounded-md shadow-sm hover:border-lime-300 transition-colors"><Gamepad2 size={14} className="text-lime-500"/> Games</span>
                          <span className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1.5 rounded-md shadow-sm hover:border-orange-300 transition-colors"><Target size={14} className="text-orange-500"/> Quizzes</span>
                          <span className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1.5 rounded-md shadow-sm hover:border-sky-300 transition-colors"><FileText size={14} className="text-sky-500"/> Docs</span>
                       </div>
                    </div>
                  </Card>
                )) : (<div className="col-span-full py-16 text-center bg-white rounded-3xl border-2"><h3 className="text-xl font-bold">No lessons found</h3></div>)}
              </div>
            )}
          </div>
        </>
      ) : (
         <div className="space-y-6 animate-fade-in pb-12">
            <button onClick={() => setActiveLesson(null)} className="flex items-center gap-2 font-bold text-sky-600 hover:text-sky-700 hover:bg-sky-50 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border-2 border-slate-100 w-fit"><ChevronLeft size={18} /> Back to Chapters</button>
            <div className="bg-white rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all border-2 border-b-8 border-sky-500">
               <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/3 z-0 bg-sky-50"></div>
               <div className="relative z-10"><span className="text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-full inline-block mb-4 bg-sky-100 text-sky-700">{activeLesson.book}</span><h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">{activeLesson.chapter}</h2></div>
            </div>

            <div className="px-0 md:px-8 py-4 space-y-4">
               {activeLesson.subTopics ? (
                  activeLesson.subTopics.map((subTopic: any, sIdx: any) => {
                     const isExpanded = expandedSubTopics[subTopic.id || sIdx];
                     return (
                        <div key={subTopic.id || sIdx} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
                           <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between p-5 transition-colors bg-slate-50 hover:bg-slate-100">
                              <button onClick={() => toggleSubTopic(subTopic.id || sIdx)} className="flex items-center gap-4 flex-1 text-left w-full">
                                 <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 transition-colors bg-sky-200 text-sky-700">{sIdx + 1}</div>
                                 <h3 className="text-lg md:text-xl font-extrabold text-slate-800 leading-tight">{subTopic.title}</h3>
                              </button>
                              <div className="flex items-center gap-3 shrink-0 mt-4 md:mt-0 md:pl-4 self-end md:self-auto">
                                 
                                 {(() => {
                                     const cKey = `${activeLesson.grade}_${activeLesson.subject}`.toLowerCase();
                                     const subjProg = studentProgress.find(p => p.id?.toLowerCase() === cKey || p.id?.toLowerCase() === activeLesson.subject?.toLowerCase());
                                     const compObj = subjProg?.completed_tools || {};
                                     const tot = subTopic.tools?.length || 0;
                                     const comp = subTopic.tools?.filter((t: any) => compObj[t.id])?.length || 0;
                                     if (tot === 0) return <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm hidden sm:block">0 Tools</span>;
                                     if (comp === tot) return <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-sm flex items-center gap-1"><CheckCircle2 size={12}/> Completed</span>;
                                     return <span className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200 shadow-sm hidden sm:block">{comp}/{tot} Completed</span>;
                                 })()}

                                 <button onClick={() => toggleSubTopic(subTopic.id || sIdx)} className="bg-white p-1 rounded-full shadow-sm border border-slate-200">{isExpanded ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}</button>
                              </div>
                           </div>

                           {isExpanded && (
                              <div className="p-4 border-t-2 border-slate-100 bg-white space-y-3">
                                 {subTopic.tools && subTopic.tools.length > 0 ? [...subTopic.tools].sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0)).map((item: any, index: any) => (
                                    <div key={index} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 rounded-xl border-2 border-slate-100 transition-colors group relative hover:border-sky-300">
                                       <div className="flex items-center gap-4">
                                          {(() => {
                                             const tier = getTierForTool(item.content_type || item.type);
                                             const Icon = tier?.icon || Gamepad2;
                                             return (
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 ${tier?.mainColor || 'bg-slate-800'} group-hover:scale-110 transition-transform`}>
                                                   <Icon size={24} />
                                                </div>
                                             );
                                          })()}
                                          <div>
                                             <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">#{index + 1} • {item.content_type || item.type || 'Tool'}</span>
                                                {item.isPremium && <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded flex items-center gap-1"><Star size={8} className="fill-amber-700"/> Pro</span>}
                                             </div>
                                             
                                             <div className="flex items-center gap-2">
                                                <h4 className="text-lg font-extrabold text-slate-800">{item.title}</h4>
                                                {(() => {
                                                    const cKey = `${activeLesson.grade}_${activeLesson.subject}`.toLowerCase();
                                                    const subjProg = studentProgress.find(p => p.id?.toLowerCase() === cKey || p.id?.toLowerCase() === activeLesson.subject?.toLowerCase());
                                                    const toolRecord = subjProg?.completed_tools?.[item.id];
                                                    if (toolRecord) {
                                                        return <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={12}/> {toolRecord.best_score !== undefined ? `Score: ${toolRecord.best_score}` : 'Done'}</span>;
                                                    }
                                                    return null;
                                                })()}
                                             </div>

                                          </div>
                                       </div>
                                       <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                          <Button variant="secondary" className="flex-1 md:flex-none py-2 px-6 text-sm font-bold border-2 shadow-none hover:border-sky-500 hover:text-sky-600" onClick={() => {
                                             const isolatedPlaylist = [...subTopic.tools].sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0));
                                             onStartLesson({ chapter: activeLesson.chapter, book: activeLesson.book, subtopic: subTopic.title, flow: isolatedPlaylist }, index);
                                          }}>{item.isPremium && !isLoggedIn ? <Lock size={14}/> : 'Start Tool'}</Button>
                                       </div>
                                    </div>
                                 )) : ( <div className="text-center py-6 text-slate-400 font-medium text-sm border-2 border-dashed border-slate-100 rounded-xl">No tools in this subtopic yet.</div> )}
                              </div>
                           )}
                        </div>
                     );
                  })
               ) : (
                  <div className="relative border-l-4 border-slate-200 space-y-8 pb-8 pl-8">
                     {activeLesson.flow && activeLesson.flow.map((item: any, index: any) => {
                        const toolType = (item.content_type || item.type || '').toLowerCase();
                        return (
                           <div key={index} className="relative group">
                              {(() => {
                                 const tier = getTierForTool(item.content_type || item.type);
                                 const Icon = tier?.icon || Gamepad2;
                                 return (
                                    <div className={`absolute -left-[54px] top-2 w-10 h-10 rounded-full border-4 border-white ${tier?.mainColor || 'bg-slate-800'} flex items-center justify-center text-white shadow-md z-10`}>
                                       <Icon size={16} />
                                    </div>
                                 );
                              })()}
                              <Card className="p-5 md:p-6 border-2 hover:border-sky-300">
                                 <div className="flex justify-between items-center">
                                    <h4 className="text-xl font-extrabold text-slate-800">{item.title}</h4>
                                    <Button variant="secondary" className="py-2 px-4 text-xs shadow-none border-2 hover:border-sky-500 hover:text-sky-600" onClick={() => onStartLesson(activeLesson, index)}>Play</Button>
                                 </div>
                              </Card>
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>
         </div>
      )}
    </div>
  );
};







// ============================================================================

export default LessonsView;
