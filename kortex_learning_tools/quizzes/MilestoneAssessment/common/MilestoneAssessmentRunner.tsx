"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Star, Volume2, ArrowRight, RotateCcw, CheckCircle2, 
  XCircle, Target, Sparkles, AlertCircle 
} from 'lucide-react';
import { MilestoneAssessmentConfig, AssessmentCompletionData } from './types';

interface MilestoneAssessmentRunnerProps {
  config: MilestoneAssessmentConfig;
  onComplete?: (data: AssessmentCompletionData) => void;
  lesson?: any;
}

export default function MilestoneAssessmentRunner({
  config,
  onComplete,
  lesson
}: MilestoneAssessmentRunnerProps) {
  const threshold = config.thresholdScore ?? 90;
  const questions = config.questions || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime] = useState(Date.now());

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentQ = questions[currentIndex];

  // Play audio when question changes (if question has audio)
  useEffect(() => {
    if (currentQ?.audioUrl && audioRef.current) {
      audioRef.current.src = currentQ.audioUrl;
      audioRef.current.play().catch(() => {
        // Audio auto-play restricted by browser, user can click speaker button
      });
    }
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
    setIsCorrect(null);
  }, [currentIndex, currentQ]);

  const playAudio = (url?: string) => {
    if (!url || !audioRef.current) return;
    audioRef.current.src = url;
    audioRef.current.play().catch(e => console.warn("Audio playback failed", e));
  };

  const handleSelectOption = (optionId: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionId(optionId);
  };

  const handleConfirmAnswer = () => {
    if (!selectedOptionId || isAnswerSubmitted || !currentQ) return;
    
    const correct = selectedOptionId === currentQ.target;
    setIsCorrect(correct);
    setIsAnswerSubmitted(true);
    if (correct) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
    setIsCorrect(null);
    setCorrectCount(0);
    setIsFinished(false);
  };

  const finalScore = questions.length > 0 
    ? Math.round((correctCount / questions.length) * 100) 
    : 100;
  const passed = finalScore >= threshold;

  const handleFinish = () => {
    if (onComplete) {
      const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);
      onComplete({
        assessmentId: config.assessmentId,
        score: finalScore,
        maxScore: 100,
        passed,
        correctCount,
        totalQuestions: questions.length,
        milestoneLevel: config.milestoneLevel,
        timeSpentSeconds
      });
    }
  };

  // =========================================================
  // FINALE / RESULT SCREEN
  // =========================================================
  if (isFinished) {
    return (
      <div className="w-full h-full max-w-2xl mx-auto flex flex-col items-center justify-center p-6 text-center animate-fade-in font-sans">
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-8 sm:p-10 w-full relative overflow-hidden">
          
          {/* Header Tag */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              config.isMajorMilestone 
                ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
            }`}>
              {config.isMajorMilestone ? '🏆 महा-मूल्यांकन (Chapter Assessment)' : '🎯 उपविषय मूल्यांकन (Subtopic Assessment)'}
            </span>
          </div>

          {/* Trophy / Status Icon */}
          <div className="relative mx-auto mb-4 w-24 h-24 flex items-center justify-center">
            {passed ? (
              <div className="w-24 h-24 bg-gradient-to-tr from-amber-400 to-amber-200 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 animate-bounce">
                <Trophy size={48} className="text-amber-900" />
              </div>
            ) : (
              <div className="w-24 h-24 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center border-4 border-rose-200 shadow-md">
                <RotateCcw size={44} className="animate-spin-slow" />
              </div>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">
            {passed ? 'शानदार प्रदर्शन! 🎉' : 'प्रयास जारी रखें! 💪'}
          </h2>
          <p className="text-slate-500 font-bold text-sm sm:text-base mb-6">
            {passed 
              ? `बधाई हो! आपने यह माइलस्टोन ${finalScore}% स्कोर के साथ उत्तीर्ण कर लिया है!` 
              : `इस माइलस्टोन को पास करने के लिए ${threshold}% स्कोर आवश्यक है।`}
          </p>

          {/* Score Badge Card */}
          <div className={`p-4 rounded-2xl border-2 mb-6 ${
            passed ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-around">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block">आपका स्कोर</span>
                <span className={`text-3xl font-black ${passed ? 'text-emerald-600' : 'text-slate-700'}`}>
                  {finalScore}%
                </span>
              </div>
              <div className="h-10 w-[2px] bg-slate-200" />
              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block">सही उत्तर</span>
                <span className="text-3xl font-black text-slate-700">
                  {correctCount} / {questions.length}
                </span>
              </div>
              <div className="h-10 w-[2px] bg-slate-200" />
              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block">लक्ष्य</span>
                <span className="text-3xl font-black text-slate-700">
                  {threshold}%
                </span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="px-6 py-3.5 rounded-xl border-2 border-slate-200 text-slate-700 font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <RotateCcw size={18} /> फिर से प्रयास करें
            </button>
            <button
              onClick={handleFinish}
              className={`px-8 py-3.5 rounded-xl text-white font-black shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${
                passed 
                  ? 'bg-emerald-500 hover:bg-emerald-600 border-b-4 border-emerald-700 active:border-b-0' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {passed ? 'पूर्ण करें व आगे बढ़ें' : 'समाप्त करें'} <ArrowRight size={18} />
            </button>
          </div>

        </div>
      </div>
    );
  }

  // =========================================================
  // ACTIVE QUESTION SCREEN
  // =========================================================
  const progressPct = questions.length > 0 
    ? ((currentIndex + 1) / questions.length) * 100 
    : 0;

  return (
    <div className="w-full h-full max-w-3xl mx-auto flex flex-col bg-white rounded-3xl border-2 border-slate-200 shadow-md overflow-hidden font-sans">
      <audio ref={audioRef} />

      {/* Top Bar: Subject, Subtopic & Question Counter */}
      <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
            config.isMajorMilestone ? 'bg-amber-400 text-amber-950' : 'bg-indigo-500 text-white'
          }`}>
            {config.isMajorMilestone ? '🏆 Chapter Assessment' : '🎯 Subtopic Assessment'}
          </span>
          <span className="text-xs font-bold text-slate-300 truncate">
            {config.chapterName} {config.subtopicName ? `• ${config.subtopicName}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-black text-slate-400">
            प्रश्न {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* Progress Bar with 90% Target Marker */}
      <div className="w-full bg-slate-100 h-2 relative">
        <div 
          className="bg-indigo-600 h-2 transition-all duration-300 rounded-r-full"
          style={{ width: `${progressPct}%` }}
        />
        {/* 90% Target line indicator */}
        <div 
          className="absolute top-0 bottom-0 w-[2px] bg-amber-400" 
          style={{ left: `${threshold}%` }}
          title={`Milestone Threshold: ${threshold}%`}
        />
      </div>

      {/* Question Card Content */}
      <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
        
        {/* Prompt & Optional Audio / Image */}
        <div className="flex flex-col items-center text-center my-auto">
          {currentQ?.audioUrl && (
            <button
              onClick={() => playAudio(currentQ.audioUrl)}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-sky-100 hover:bg-sky-200 text-sky-600 rounded-full flex items-center justify-center mb-4 transition-all shadow-md active:scale-95 border-2 border-sky-300"
              title="Click to listen"
            >
              <Volume2 size={36} />
            </button>
          )}

          {currentQ?.imageUrl && (
            <div className="mb-4 max-h-48 flex items-center justify-center">
              <img 
                src={currentQ.imageUrl} 
                alt="Question visual" 
                className="max-h-44 object-contain rounded-2xl border-2 border-slate-100 shadow-sm"
              />
            </div>
          )}

          <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-6">
            {currentQ?.prompt}
          </h3>

          {/* Options Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
            {currentQ?.options?.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              let btnStyle = "bg-white border-slate-200 text-slate-800 hover:border-indigo-400";

              if (isAnswerSubmitted) {
                if (opt.id === currentQ.target) {
                  btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-300";
                } else if (isSelected && !isCorrect) {
                  btnStyle = "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-300";
                } else {
                  btnStyle = "opacity-40 bg-slate-50 border-slate-200 text-slate-400";
                }
              } else if (isSelected) {
                btnStyle = "bg-indigo-50 border-indigo-600 text-indigo-900 ring-2 ring-indigo-400 shadow-sm";
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  disabled={isAnswerSubmitted}
                  className={`p-4 rounded-2xl border-2 font-black text-lg sm:text-xl transition-all flex items-center justify-center gap-3 min-h-[64px] active:scale-95 ${btnStyle}`}
                >
                  {opt.imageUrl && (
                    <img src={opt.imageUrl} alt={opt.text || ''} className="w-10 h-10 object-contain rounded-lg" />
                  )}
                  <span>{opt.text}</span>
                  {opt.subText && (
                    <span className="text-xs text-slate-400 font-bold">({opt.subText})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isAnswerSubmitted && (
              isCorrect ? (
                <span className="flex items-center gap-1.5 text-emerald-600 font-black text-sm">
                  <CheckCircle2 size={18} /> सही उत्तर!
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-rose-600 font-black text-sm">
                  <XCircle size={18} /> गलत उत्तर!
                </span>
              )
            )}
          </div>

          <div>
            {!isAnswerSubmitted ? (
              <button
                onClick={handleConfirmAnswer}
                disabled={!selectedOptionId}
                className={`px-6 py-3 rounded-xl font-black text-white transition-all shadow-md ${
                  selectedOptionId 
                    ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-95' 
                    : 'bg-slate-300 cursor-not-allowed opacity-60'
                }`}
              >
                जाँचें (Check)
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-3 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2 active:scale-95"
              >
                {currentIndex < questions.length - 1 ? 'अगला प्रश्न' : 'परिणाम देखें'} <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

