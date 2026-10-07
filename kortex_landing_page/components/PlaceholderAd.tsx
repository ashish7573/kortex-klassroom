"use client";

import React, { useState, useEffect } from 'react';
import { PlayCircle, ShieldCheck, Clock, X } from 'lucide-react';

export default function PlaceholderAd({ onComplete, onSkip, type = 'rewarded' }: { onComplete: () => void, onSkip?: () => void, type?: 'rewarded' | 'interstitial' }) {
    const [timeLeft, setTimeLeft] = useState(5);
    const [isPlaying, setIsPlaying] = useState(false);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        if (isPlaying && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        } else if (isPlaying && timeLeft === 0) {
            setCompleted(true);
        }
    }, [isPlaying, timeLeft]);

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in font-sans">
            
            {/* Header / Skip */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-2 text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-700">
                    <ShieldCheck size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Ethical Ad System</span>
                </div>
                {onSkip && !isPlaying && !completed && (
                    <button 
                        onClick={onSkip}
                        className="text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 px-4 py-2 rounded-full border border-slate-700 transition-colors font-bold text-sm flex items-center gap-2"
                    >
                        Skip <X size={16} />
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
                
                {/* Video Area Simulator */}
                <div className="aspect-video bg-black flex flex-col items-center justify-center relative">
                    {!isPlaying && !completed ? (
                        <button 
                            onClick={() => setIsPlaying(true)}
                            className="bg-white/10 hover:bg-white/20 p-4 rounded-full transition-all group backdrop-blur-sm"
                        >
                            <PlayCircle size={64} className="text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                        </button>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                            {completed ? (
                                <div className="space-y-4 animate-fade-in-up">
                                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <ShieldCheck size={32} className="text-white" />
                                    </div>
                                    <h3 className="text-2xl font-black">Ad Completed</h3>
                                    <p className="text-slate-400 font-medium text-sm max-w-sm">
                                        Thank you for supporting Kortex Klassroom!
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="absolute top-4 left-4 bg-black/60 px-3 py-1.5 rounded-full text-xs font-bold text-slate-300 flex items-center gap-2 backdrop-blur-sm border border-white/10">
                                        <Clock size={14} /> {timeLeft}s remaining
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-600 animate-pulse uppercase tracking-widest mt-8">
                                        Playing Ad...
                                    </h2>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-6 bg-slate-800 border-t border-slate-700 flex justify-between items-center">
                    <div>
                        <h4 className="text-white font-bold text-lg leading-none">Sponsored Content</h4>
                        <p className="text-slate-400 text-sm font-medium mt-1">Simulated AdSense Unit</p>
                    </div>
                    {completed && (
                        <button 
                            onClick={onComplete}
                            className="bg-sky-500 hover:bg-sky-400 text-white px-6 py-3 rounded-xl font-black transition-all shadow-[0_4px_0_rgb(2,132,199)] active:translate-y-[4px] active:shadow-none animate-fade-in-up"
                        >
                            {type === 'rewarded' ? 'Claim Reward' : 'Continue'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

