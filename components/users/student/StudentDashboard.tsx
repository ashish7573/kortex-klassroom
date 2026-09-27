"use client";
import React from 'react';
import { StudentProfile } from '../../../types/user';
import { Sparkles, Trophy, Flame, Play, BookOpen, Lightbulb, Gamepad2, Target } from 'lucide-react';

interface StudentDashboardProps {
  profile: StudentProfile;
  onExploreTier?: (tierId: string) => void;
}

export default function StudentDashboard({ profile, onExploreTier }: StudentDashboardProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Student Welcome & Gamified Header */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={14} className="text-yellow-300" /> Student Realm · {profile.grade || 'Foundational'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Hello, {profile.full_name}! 👋</h1>
          <p className="text-purple-100 text-base max-w-lg font-medium">
            Ready to explore exciting games, interactive math sandboxes, and language stories today?
          </p>

          {/* Quick Stats Pill */}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-2xl">
              <Flame size={20} className="text-amber-400" />
              <div>
                <div className="text-xs text-purple-200 font-bold uppercase">Learning Streak</div>
                <div className="font-black text-lg leading-tight">3 Days</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-2xl">
              <Trophy size={20} className="text-yellow-400" />
              <div>
                <div className="text-xs text-purple-200 font-bold uppercase">Achievements</div>
                <div className="font-black text-lg leading-tight">12 Badges</div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 5-Tier Fast Jump Grid */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2">
          <Play className="text-rose-500" size={24} /> Jump Into Learning
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            onClick={() => onExploreTier?.('conceptualiser')}
            className="p-5 rounded-3xl bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg text-purple-900 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Lightbulb size={24} />
            </div>
            <h3 className="font-black text-lg mb-1">Sandbox</h3>
            <p className="text-xs text-purple-700/80 font-semibold">Interactive models & math machines</p>
          </div>

          <div 
            onClick={() => onExploreTier?.('dojo')}
            className="p-5 rounded-3xl bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg text-orange-900 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Target size={24} />
            </div>
            <h3 className="font-black text-lg mb-1">The Dojo</h3>
            <p className="text-xs text-orange-700/80 font-semibold">Test your skills in interactive quizzes</p>
          </div>

          <div 
            onClick={() => onExploreTier?.('arcade')}
            className="p-5 rounded-3xl bg-lime-50 hover:bg-lime-100 border-2 border-lime-200 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg text-lime-900 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-lime-500 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Gamepad2 size={24} />
            </div>
            <h3 className="font-black text-lg mb-1">Arcade</h3>
            <p className="text-xs text-lime-700/80 font-semibold">Learn through gamified challenges</p>
          </div>

          <div 
            onClick={() => onExploreTier?.('lessons')}
            className="p-5 rounded-3xl bg-sky-50 hover:bg-sky-100 border-2 border-sky-200 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg text-sky-900 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BookOpen size={24} />
            </div>
            <h3 className="font-black text-lg mb-1">All Lessons</h3>
            <p className="text-xs text-sky-700/80 font-semibold">Browse full curriculum flows</p>
          </div>
        </div>
      </div>
    </div>
  );
}
