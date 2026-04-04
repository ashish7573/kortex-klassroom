"use client";
import React, { useState } from 'react';
import { ArrowRight, CheckCircle, Star, Sparkles, Target, Trophy } from 'lucide-react';

// ==========================================
// 1. CONCEPTUALISER: Interactive Sandbox
// ==========================================
export const DemoConcept = ({ onComplete }: any) => {
  const [ones, setOnes] = useState(0);
  const [tens, setTens] = useState(0);

  const addOne = () => {
    if (ones === 9) { setOnes(0); setTens(t => t + 1); }
    else setOnes(o => o + 1);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-purple-50 rounded-3xl p-8 animate-in zoom-in duration-500">
      <div className="bg-white p-4 px-8 rounded-full shadow-sm mb-8 border-2 border-purple-100 font-bold text-purple-600 uppercase tracking-wider text-sm flex items-center gap-2">
        <Sparkles size={18} /> Sandbox Mode
      </div>
      <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-12 text-center leading-tight">Click to add blocks.<br/>Watch what happens at 10!</h2>
      
      <div className="flex gap-8 md:gap-16 mb-12 w-full max-w-lg justify-center">
        <div className="text-center bg-white p-8 rounded-3xl border-b-8 border-sky-500 shadow-sm flex-1">
          <div className="text-6xl md:text-7xl font-black text-sky-500 mb-2">{tens}</div>
          <div className="text-sm font-black text-slate-400 uppercase tracking-widest">Tens</div>
        </div>
        <div className="text-center bg-white p-8 rounded-3xl border-b-8 border-orange-500 shadow-sm flex-1">
          <div className="text-6xl md:text-7xl font-black text-orange-500 mb-2">{ones}</div>
          <div className="text-sm font-black text-slate-400 uppercase tracking-widest">Ones</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button onClick={addOne} className="flex-1 bg-purple-500 text-white font-black text-xl py-5 rounded-2xl shadow-md border-b-4 border-purple-700 active:border-b-0 active:translate-y-1 transition-all">
          + Add 1 Block
        </button>
        {(tens > 0 || ones > 0) && (
          <button onClick={onComplete} className="flex-1 bg-slate-800 text-white font-bold text-lg py-5 rounded-2xl shadow-md border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2">
            I Understand <ArrowRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 2. QUIZ: The Dojo Check
// ==========================================
export const DemoQuiz = ({ onComplete }: any) => {
  const [selected, setSelected] = useState<number | null>(null);
  
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-orange-50 rounded-3xl p-8 animate-in fade-in duration-500">
      <div className="bg-white p-4 px-8 rounded-full shadow-sm mb-8 border-2 border-orange-100 font-bold text-orange-600 uppercase tracking-wider text-sm flex items-center gap-2">
        <Target size={18} /> Quick Check
      </div>
      <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-8 text-center max-w-lg leading-tight">If you have 3 Tens and 4 Ones, what is the number?</h2>
      
      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8">
        {[43, 34, 7, 304].map((ans, idx) => (
          <button key={idx} onClick={() => setSelected(ans)} className={`py-6 rounded-2xl font-black text-3xl transition-all border-b-4 ${selected === ans ? (ans === 34 ? 'bg-green-500 border-green-700 text-white shadow-lg scale-105' : 'bg-red-500 border-red-700 text-white shadow-lg') : 'bg-white border-slate-200 text-slate-700 hover:border-orange-400'}`}>
            {ans}
          </button>
        ))}
      </div>

      {selected === 34 && (
        <button onClick={onComplete} className="w-full max-w-md bg-orange-500 text-white font-black text-xl py-5 rounded-2xl shadow-md border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all animate-in slide-in-from-bottom-4 flex items-center justify-center gap-2">
          Perfect! Continue <ArrowRight size={20} />
        </button>
      )}
    </div>
  );
};

// ==========================================
// 3. GAME: Arcade Pop
// ==========================================
export const DemoGame = ({ onComplete }: any) => {
  const [popped, setPopped] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900 rounded-3xl p-8 animate-in zoom-in duration-500 overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
      
      {!popped ? (
        <>
          <div className="bg-white/10 backdrop-blur-md p-4 px-8 rounded-full shadow-sm mb-12 border border-white/20 font-bold text-lime-400 uppercase tracking-wider text-sm flex items-center gap-2 relative z-10">
            <Trophy size={18} /> Boss Level
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-16 text-center leading-tight relative z-10">Pop the bubble containing <span className="text-lime-400">Forty-Two</span>!</h2>
          
          <div className="flex flex-wrap justify-center gap-8 relative z-10">
            <button className="w-32 h-32 rounded-full bg-gradient-to-tr from-sky-400 to-blue-500 text-white font-black text-4xl shadow-[0_0_30px_rgba(56,189,248,0.5)] border-4 border-white/20 hover:scale-110 transition-transform animate-[bounce_3s_ease-in-out_infinite]">24</button>
            <button onClick={() => setPopped(true)} className="w-32 h-32 rounded-full bg-gradient-to-tr from-lime-400 to-green-500 text-white font-black text-4xl shadow-[0_0_30px_rgba(132,204,22,0.5)] border-4 border-white/20 hover:scale-110 transition-transform animate-[bounce_4s_ease-in-out_infinite]">42</button>
            <button className="w-32 h-32 rounded-full bg-gradient-to-tr from-pink-400 to-rose-500 text-white font-black text-4xl shadow-[0_0_30px_rgba(244,114,182,0.5)] border-4 border-white/20 hover:scale-110 transition-transform animate-[bounce_3.5s_ease-in-out_infinite]">402</button>
          </div>
        </>
      ) : (
        <div className="text-center relative z-10 flex flex-col items-center animate-in zoom-in duration-500">
           <div className="w-32 h-32 bg-lime-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(132,204,22,0.8)]"><Star size={64} className="text-white fill-white" /></div>
           <h2 className="text-5xl font-black text-white mb-4">You Win!</h2>
           <p className="text-xl text-slate-300 font-bold mb-10">This is how learning feels on Kortex Klassroom.</p>
           <button onClick={onComplete} className="bg-lime-500 text-slate-900 font-black text-xl py-5 px-12 rounded-2xl shadow-md border-b-4 border-lime-700 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-3">
             Finish Demo <CheckCircle size={24} />
           </button>
        </div>
      )}
    </div>
  );
};