"use client";

import React, { useState, useEffect } from 'react';
import { 
  Globe, Play, ArrowRight, Layers, BookOpen, Zap, Brain, 
  Shield, Users, Lock, Star, Settings 
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../backend_configurations/firebase';
import { Card, Button } from './components/SharedUI';
import { 
  SUBJECTS, 
  SUBJECT_ICONS, 
  FIVE_TIERS, 
  TESTIMONIALS 
} from './curriculumConfig';

const LandingView = ({ onTryDemo, onNavigateToTier, onNavigateToLessons, onOpenFeatured, onNavigateToSubject }: any) => {
  const [activeUsp, setActiveUsp] = useState(0);
  const [activeTierId, setActiveTierId] = useState('conceptualiser');
  const [tierData, setTierData] = useState({ conceptualiser: [], theatre: [], dojo: [], Notebook: [], arcade: [] });
  const [isLoadingTiers, setIsLoadingTiers] = useState(true);

  // UPDATED: Highlighting the 5-Tier, Curriculum, and Frictionless approach!
  const USPS = [
    { icon: Layers, title: "The 5-Tier Loop", desc: "Master concepts through a proven cycle: Sandbox ➔ Video ➔ Quiz ➔ PDF ➔ Game.", color: "text-purple-500", bg: "bg-purple-100", shadow: "shadow-purple-200/50" },
    { icon: BookOpen, title: "Structured Curriculum", desc: "Not just a random arcade. Every tool is perfectly mapped to chapter-wise progressions.", color: "text-sky-500", bg: "bg-sky-100", shadow: "shadow-sky-200/50" },
    { icon: Zap, title: "Frictionless Access", desc: "Zero paywalls. Zero sign-ups. Click, play, and learn instantly across all devices.", color: "text-orange-500", bg: "bg-orange-100", shadow: "shadow-orange-200/50" },
    { icon: Brain, title: "Individualised Learning", desc: "Child learns at their own pace saving Time, Money and Efforts that boosts Confidence.", color: "text-emerald-500", bg: "bg-emerald-100", shadow: "shadow-emerald-200/50" }
  ];

  useEffect(() => {
    const interval = setInterval(() => { setActiveUsp((prev) => (prev + 1) % USPS.length); }, 4000);
    return () => clearInterval(interval);
  }, []);

  
  useEffect(() => {
    async function fetchTierData() {
      setIsLoadingTiers(true);
      try {
        // Grab featured items (Removed the limit here so we don't accidentally cut off games!)
        const q = query(collection(db, 'learning_tools'), where('is_featured', '==', true));
        const snapshot = await getDocs(q);
        let items = snapshot.docs.map((d: any) => ({id: d.id, ...d.data()}));

        // 1. Sort all items by 'created_at' so the NEWEST are at the top of the list
        items.sort((a: any, b: any) => {
           const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
           const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
           return dateB - dateA;
        });

        const categorized: any = { conceptualiser: [], theatre: [], dojo: [], Notebook: [], arcade: [] };

        items.forEach((item: any) => {
          // 2. Add .trim() to bulletproof against accidental spaces in your CSV
          const type = item.content_type?.toLowerCase().trim(); 
          
          // 3. Distribute them, but strictly stop when a category hits 10 items
          if (type === 'video' && categorized.theatre.length < 10) categorized.theatre.push(item);
          else if (type === 'quiz' && categorized.dojo.length < 10) categorized.dojo.push(item);
          else if ((type === 'pdf' || type === 'worksheet' || type === 'document') && categorized.Notebook.length < 10) categorized.Notebook.push(item);
          else if ((type === 'game' || type === 'arcade') && categorized.arcade.length < 10) categorized.arcade.push(item);
          else if (type === 'conceptualiser' && categorized.conceptualiser.length < 10) categorized.conceptualiser.push(item);
        });
        
        setTierData(categorized);
      } catch (error) { console.error(error); } finally { setIsLoadingTiers(false); }
    }
    fetchTierData();
  }, []);

  const activeTier = FIVE_TIERS.find(t => t.id === activeTierId) || FIVE_TIERS[0];
  const activeItems = tierData[activeTierId as keyof typeof tierData] || [];

  return (
  <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in relative overflow-x-hidden">
    
    {/* HERO SECTION */}
    <div className="bg-sky-50 pt-16 pb-32 px-4 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-20 h-20 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-20 w-32 h-32 bg-lime-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-40 h-40 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wider mb-2 border border-sky-200">
             <Globe size={16} /> Bringing Effectiveness and Efficiency in Education
          </div>
          {/* UPDATED: Headline & Subheadline */}
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">Smarter Tools,<br/><span className="text-sky-500">Stronger Minds.</span></h1>
          <p className="text-xl text-slate-600 font-medium max-w-lg mx-auto md:mx-0">Go beyond random videos and worksheets. Explore a Pedagogically sequenced curriculum of Interactive Concept Learning, Quizzes, worksheets and Games mapped to your exact syllabus.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
            <Button variant="primary" className="text-lg px-8 py-4 w-full sm:w-auto shadow-sky-500/30" onClick={() => document.getElementById('five-tiers')?.scrollIntoView({behavior: 'smooth'})}>Explore 5-Tier System</Button>
            <Button variant="secondary" className="text-lg px-8 py-4 w-full sm:w-auto border-2 border-slate-300" onClick={onTryDemo}>Play Master Demo</Button>
          </div>
        </div>
        <div className="hidden md:flex justify-center items-center relative h-[450px] w-full z-10">
           {USPS.map((usp: any, idx: any) => {
              let diff = idx - activeUsp;
              if (diff < -2) diff += 4; if (diff > 2) diff -= 4;
              const isCenter = diff === 0; const isNext = diff === 1; const isPrev = diff === -1;
              let transform = 'translateX(0) scale(0.4)'; let opacity = '0'; let zIndex = 10; let blur = 'blur(8px)';
              if (isCenter) { transform = 'translateX(0) scale(1.05)'; opacity = '1'; zIndex = 30; blur = 'blur(0px)'; } 
              else if (isNext) { transform = 'translateX(180px) scale(0.85)'; opacity = '0.6'; zIndex = 20; blur = 'blur(2px)'; } 
              else if (isPrev) { transform = 'translateX(-180px) scale(0.85)'; opacity = '0.6'; zIndex = 20; blur = 'blur(2px)'; } 
              return (
                 <div key={idx} className={`absolute w-72 bg-white/95 backdrop-blur-md rounded-[2.5rem] pt-16 pb-8 px-6 transition-all duration-[800ms] ease-out flex flex-col items-center text-center ${isCenter ? 'shadow-2xl ring-8 ring-white/60 ' + usp.shadow : 'shadow-lg'}`} style={{ transform, opacity, zIndex, filter: blur }}>
                    <div className={`absolute -top-12 w-24 h-24 ${usp.bg} rounded-[2rem] flex items-center justify-center shadow-lg transition-all duration-[800ms] border-[6px] border-white ${isCenter ? 'rotate-6 scale-110 shadow-xl' : '-rotate-3'} `}><usp.icon size={44} className={usp.color} /></div>
                    <h3 className="text-2xl font-black text-slate-800 mb-3">{usp.title}</h3>
                    <p className="text-sm font-bold text-slate-500 leading-relaxed">{usp.desc}</p>
                 </div>
              );
           })}
        </div>
      </div>
    </div>

    {/* Marquee */}
    <div className="w-full bg-white border-y-4 border-slate-100 py-4 overflow-hidden relative flex items-center z-30 shadow-sm group">
      <div className="flex animate-marquee w-max group-hover-pause">
        {[...SUBJECTS, ...SUBJECTS, ...SUBJECTS].map((subject: any, idx: any) => {
          const subjectData = SUBJECT_ICONS[subject] || { icon: Star, color: 'text-slate-400' };
          const Icon = subjectData.icon;
          return (
             <button 
                key={idx} 
                onClick={() => onNavigateToSubject && onNavigateToSubject(subject)}
                className="mx-3 px-5 py-2 bg-slate-50 border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 transition-all rounded-full font-black text-slate-500 text-xs uppercase tracking-wider flex-shrink-0 flex items-center gap-2 shadow-sm cursor-pointer"
             >
                <Icon size={16} className={subjectData.color} />
                {subject}
             </button>
          );
        })}
      </div>
    </div>

    {/* THE 5-TIER LEARNING LOOP */}
    <div id="five-tiers" className="max-w-[90rem] mx-auto px-4 pt-24 pb-12 w-full relative z-20 scroll-mt-20">
      
      {/* Upgraded Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider mb-4 border border-sky-200 shadow-sm">
          <Layers size={16} /> Pedagogical Framework
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-6 leading-tight">The <span className="text-sky-500">5-Tier</span> Learning Loop</h2>
        <p className="text-center text-slate-500 font-medium max-w-2xl mx-auto text-lg">From using latest AI based conceptualisers and quizzes to tradionally proved Paper-Pencil practice sheet, Our 5 types of tools enable deepest understanding of any concept in a perfect ecosystem bridging digital interactivity with physical classroom practice.</p>
      </div>

      {/* Upgraded Tabs: Floating Pill Navigation */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-3 lg:gap-4 mb-10 max-w-7xl mx-auto px-2">
        {FIVE_TIERS.map(tier => {
          const isActive = activeTierId === tier.id;
          const Icon = tier.icon;
          return (
            <button 
              key={tier.id} 
              onClick={() => setActiveTierId(tier.id)} 
              className={`relative px-4 py-2.5 md:px-5 md:py-3 lg:px-6 lg:py-4 rounded-2xl md:rounded-[2rem] transition-all duration-300 flex items-center gap-2 md:gap-3 font-bold text-sm lg:text-base border-2 shadow-sm whitespace-nowrap
                ${isActive 
                  ? `${tier.mainColor} border-transparent text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] scale-105 z-10` 
                  : `bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:scale-105`
                }`}
            >
              <Icon size={20} className={isActive ? 'text-white' : tier.textColor} />
              <span className="hidden sm:block">{tier.label}</span>
            </button>
          );
        })}
      </div>

      {/* Upgraded Content Area: Soft Glassmorphic Container */}
      <div className={`w-full max-w-7xl mx-auto rounded-[3rem] p-6 md:p-10 lg:p-12 transition-colors duration-700 relative z-30 ${activeTier.lightColor} border-4 border-white shadow-xl`}>
        
        {/* Dynamic Header & View All Button */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-6 rounded-[2rem] border border-white shadow-sm">
          <div>
            <h3 className={`text-2xl md:text-3xl font-black ${activeTier.textColor} flex items-center gap-3`}>
               <activeTier.icon size={28} /> {activeTier.label}
            </h3>
            <p className="text-slate-600 font-medium mt-2 leading-relaxed">{activeTier.desc}. Swipe to explore featured modules.</p>
          </div>
          
          <button 
            onClick={() => onNavigateToTier && onNavigateToTier(activeTier.id)}
            className={`shrink-0 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-black text-sm border-2 ${activeTier.borderColor} ${activeTier.textColor} hover:${activeTier.mainColor} hover:text-white transition-all bg-white shadow-sm`}
          >
            {activeTier.actionText} <ArrowRight size={18} />
          </button>
        </div>

        {/* Database Driven Cards */}
        <div className="flex overflow-x-auto gap-6 pb-8 pt-4 snap-x hide-scrollbar px-2 -mx-2">
          {isLoadingTiers ? (
            <div className="w-full text-center py-16 text-slate-500 font-bold animate-pulse">Loading {activeTier.label} tools...</div>
          ) : activeItems.length > 0 ? (
            activeItems.map((item: any) => (
              <Card 
                key={item.id} 
                className={`w-[280px] min-w-[280px] max-w-[280px] sm:w-[320px] sm:min-w-[320px] sm:max-w-[320px] snap-start flex-shrink-0 cursor-pointer p-0 flex flex-col bg-white overflow-hidden hover:-translate-y-3 transition-all duration-300 shadow-lg hover:shadow-2xl group border-none ring-4 ring-transparent hover:ring-${activeTier.mainColor.replace('bg-', '')}/30`} 
                onClick={() => onOpenFeatured(item)}
              >
                {/* Image Area */}
                <div className={`h-40 sm:h-48 w-full ${activeTier.lightColor} relative flex items-center justify-center overflow-hidden`}>
                  {item.image ? (
                     <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                     <activeTier.icon size={80} className={`${activeTier.textColor} opacity-20 transform group-hover:scale-110 transition-transform duration-500`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-transparent to-transparent pointer-events-none"></div>
                  
                  {/* Dynamic Badge */}
                  <div className={`absolute top-4 left-4 ${activeTier.mainColor} text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5`}>
                    <activeTier.icon size={14} /> {activeTier.label}
                  </div>

                  {item.isPremium && <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm flex items-center gap-1"><Star size={10} className="fill-white" /> PRO</div>}
                </div>
                
                {/* Details Area */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-3">
                     <div className="mb-3">
                        <p className={`text-14 font-black ${activeTier.textColor} uppercase tracking-wider line-clamp-1`}>{item.chapter_name || item.subject || 'Resource'}</p>
                      </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 mb-4 leading-tight line-clamp-2 group-hover:text-slate-900">{item.title}</h3>
                  
                  <div className="mt-auto pt-5 flex justify-between items-center border-t-2 border-slate-50">
                    
                    {/* Grade and Subject Badge */}
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <span className="bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600">
                        {item.grade} • {item.subject}
                      </span>
                    </div>
                    
                    {/* Dynamic Action Button */}
                    <div className={`px-4 py-2.5 rounded-xl ${activeTier.lightColor} flex items-center justify-center group-hover:${activeTier.mainColor} transition-colors duration-300 shadow-sm`}>
                      <span className={`text-[11px] font-black uppercase tracking-wider ${activeTier.textColor} group-hover:text-black flex items-center gap-1.5`}>
                        {{
                          'Conceptualiser': 'Learn Concept',
                          'Video': 'Play Video',
                          'Game': 'Play Game',
                          'Quiz': 'Take Quiz',
                          'PDF': 'Read PDF',
                        }[item.content_type] || 'Start Lesson'}
                        <Play size={12} className="fill-current" />
                      </span>
                    </div>

                  </div>
                </div>
              </Card>
            ))
          ) : (
            /* "COMING SOON" FALLBACK CARD */
            <Card className="w-[280px] min-w-[280px] max-w-[280px] sm:w-[320px] sm:min-w-[320px] sm:max-w-[320px] snap-start flex-shrink-0 p-0 flex flex-col bg-white overflow-hidden shadow-lg border-none">
              <div className={`h-40 sm:h-48 w-full ${activeTier.lightColor} relative flex items-center justify-center`}>
                <activeTier.icon size={80} className={`${activeTier.textColor} opacity-20`} />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl border-2 border-white shadow-lg font-black text-slate-700 tracking-wider uppercase text-sm transform -rotate-3 flex items-center gap-2">
                     <Settings size={18} className="animate-spin text-slate-400" /> In Development
                   </div>
                </div>
              </div>
              <div className="p-6 text-center flex-1 flex flex-col justify-center">
                <h3 className={`text-xl font-extrabold ${activeTier.textColor} mb-3 leading-tight`}>Interactive {activeTier.label}s</h3>
                <p className="text-sm font-bold text-slate-500">Our pedagogical engineers are currently building revolutionary new tools for this tier. Check back soon!</p>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>

    {/* NEW: THE CURRICULUM STRATEGY MAP */}
    <div className="w-full bg-slate-900 text-white py-24 relative overflow-hidden border-t-8 border-sky-500">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-400 px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider mb-4 border border-sky-500/30">
            <BookOpen size={16} /> 100% NCF Mapped Content
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Find exactly what you need,<br/>when you need it.</h2>
          <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">Kortex Klassroom isn't just a random arcade. Every single game, video, and quiz is meticulously organized into a structured curriculum.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
           <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 z-0"></div>
           
           <div className="bg-slate-800 border-2 border-slate-700 p-8 rounded-3xl relative z-10 text-center transform md:-translate-y-4 hover:-translate-y-6 transition-transform shadow-xl">
             <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black text-slate-300 border-4 border-slate-900 shadow-inner">1</div>
             <h3 className="text-2xl font-black text-white mb-2">Select Grade</h3>
             <p className="text-slate-400 font-bold text-sm">From Balvatika to Grade 8.</p>
           </div>

           <div className="bg-sky-900 border-2 border-sky-700 p-8 rounded-3xl relative z-10 text-center transform md:translate-y-4 hover:translate-y-2 transition-transform shadow-xl">
             <div className="w-16 h-16 bg-sky-800 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black text-sky-300 border-4 border-slate-900 shadow-inner">2</div>
             <h3 className="text-2xl font-black text-white mb-2">Pick Subject</h3>
             <p className="text-sky-200/70 font-bold text-sm">Maths, Languages, EVS & More.</p>
           </div>

           <div className="bg-indigo-900 border-2 border-indigo-700 p-8 rounded-3xl relative z-10 text-center transform md:-translate-y-4 hover:-translate-y-6 transition-transform shadow-xl">
             <div className="w-16 h-16 bg-indigo-800 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black text-indigo-300 border-4 border-slate-900 shadow-inner">3</div>
             <h3 className="text-2xl font-black text-white mb-2">Open Chapter</h3>
             <p className="text-indigo-200/70 font-bold text-sm">Mapped directly to school books.</p>
           </div>

           <div className="bg-emerald-900 border-2 border-emerald-700 p-8 rounded-3xl relative z-10 text-center transform md:translate-y-4 hover:translate-y-2 transition-transform shadow-xl">
             <div className="w-16 h-16 bg-emerald-800 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black text-emerald-300 border-4 border-slate-900 shadow-inner">4</div>
             <h3 className="text-2xl font-black text-white mb-2">Start Playing</h3>
             <p className="text-emerald-200/70 font-bold text-sm">Access the 5-Tier tools instantly.</p>
           </div>
        </div>

        <div className="mt-16 text-center relative z-10 flex justify-center">
           <Button variant="primary" onClick={onNavigateToLessons} className="text-lg px-10 py-5 w-full sm:w-auto shadow-[0_0_40px_rgba(14,165,233,0.3)] hover:shadow-[0_0_60px_rgba(14,165,233,0.5)]">
              Explore All Lessons <ArrowRight size={20} className="ml-2 inline" />
           </Button>
        </div>
        
      </div>
    </div>

    {/* NEW: THE KORTEX KREW SECTION */}
    <div className="bg-amber-50 py-24 w-full border-t-8 border-amber-400 relative overflow-hidden">
       <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
       <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="order-2 md:order-1 relative h-[400px] w-full hidden md:block">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-200 rounded-full blur-2xl opacity-60"></div>
             <div className="absolute top-10 left-10 w-48 h-48 bg-white rounded-[2rem] border-4 border-amber-100 shadow-xl flex items-center justify-center transform -rotate-6 overflow-hidden"><img src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=400&q=80" className="object-cover w-full h-full opacity-90"/></div>
             <div className="absolute bottom-10 right-10 w-56 h-56 bg-white rounded-[2.5rem] border-4 border-amber-100 shadow-2xl flex items-center justify-center transform rotate-3 overflow-hidden"><img src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=80" className="object-cover w-full h-full opacity-90"/></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-amber-500 rounded-full border-8 border-white shadow-2xl flex items-center justify-center z-20"><Users size={48} className="text-white" /></div>
          </div>
          <div className="order-1 md:order-2 space-y-6 text-center md:text-left">
             <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wider mb-2 border border-amber-200">
               <Shield size={16} /> Built by Real Experts
             </div>
             <h2 className="text-4xl md:text-5xl font-black text-slate-800 leading-tight">Meet the <br/><span className="text-amber-500">Kortex Krew.</span></h2>
             <p className="text-lg text-slate-600 font-medium">This platform isn't built by a faceless corporation. Every game, lesson, and concept is painstakingly engineered by a collective of real teachers, child psychologists, and passionate parents across India.</p>
             <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button variant="fun" className="text-lg px-8 py-4 w-full sm:w-auto shadow-xl shadow-amber-500/20" onClick={() => window.open('https://forms.gle/g1AY5rG5F6zCoSiw5', '_blank')}>
                   Apply to Join the Krew <ArrowRight size={20} className="ml-2 inline"/>
                </Button>
             </div>
          </div>
       </div>
    </div>

    {/* RESTORED: Testimonials Section */}
    <div className="bg-sky-50 py-24 w-full border-t-4 border-sky-100 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16"><h2 className="text-4xl font-extrabold text-slate-800">Loved by our Community</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial: any, idx: any) => (
            <Card key={idx} className="p-8 relative border-none shadow-xl hover:-translate-y-2 transition-transform duration-300 flex flex-col h-full">
              <div className="flex gap-1 mb-6 relative z-10">{[...Array(5)].map((_: any, i: any) => (<Star key={i} size={20} className="fill-amber-400 text-amber-400" />))}</div>
              <p className="text-slate-700 font-bold text-lg leading-relaxed mb-8 relative z-10 italic flex-1">"{testimonial.text}"</p>
              <div className="flex items-center gap-4 mt-auto relative z-10">
                <div className="w-14 h-14 rounded-full border-4 border-sky-50 overflow-hidden shadow-sm shrink-0"><img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full object-cover" /></div>
                <div><h4 className="font-extrabold text-slate-800">{testimonial.name}</h4><p className="text-sm font-bold text-sky-500">{testimonial.role}</p></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>

  </div>
  );
};
















export default LandingView;
