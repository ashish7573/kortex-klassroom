import React, { useState } from 'react';
import { Star, Heart, ArrowRight, ExternalLink } from 'lucide-react';
import { KortexCourse } from '../koursesData';

export interface KortexCourseCardProps {
  course: KortexCourse;
  size?: 'default' | 'compact'; // 'compact' is tailored for dashboard carousels
  price?: string;              // Defaults to '₹499' or 'Free with Pro'
  rating?: number;             // Defaults to 4.8
  level?: string;              // Defaults to course.gradeGroup
  isFavorite?: boolean;
  onToggleFavorite?: (courseId: string, e: React.MouseEvent) => void;
  onEnroll?: (course: KortexCourse, e: React.MouseEvent) => void;
  onClick?: (course: KortexCourse) => void;
  ctaText?: string;            // Defaults to 'Enroll Now'
  useExternalIcon?: boolean;   // Set true to render ExternalLink icon
  className?: string;
}

export const KortexCourseCard: React.FC<KortexCourseCardProps> = ({
  course,
  size = 'default',
  price = '₹499',
  rating = 4.8,
  level,
  isFavorite: controlledFavorite,
  onToggleFavorite,
  onEnroll,
  onClick,
  ctaText = 'Enroll Now',
  useExternalIcon = false,
  className = '',
}) => {
  const [internalFavorite, setInternalFavorite] = useState(false);
  const isFav = controlledFavorite !== undefined ? controlledFavorite : internalFavorite;
  const isCompact = size === 'compact';

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(course.id, e);
    } else {
      setInternalFavorite(prev => !prev);
    }
  };

  const handleEnrollClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEnroll) {
      onEnroll(course, e);
    } else if (onClick) {
      onClick(course);
    }
  };

  const displayLevel = level || `${course.gradeGroup} • ${course.ageBand}`;

  return (
    <div
      onClick={() => onClick?.(course)}
      className={`group relative bg-white border border-slate-100 transition-all duration-300 hover:-translate-y-1 flex flex-col overflow-hidden cursor-pointer select-none ${
        isCompact
          ? 'rounded-3xl shadow-sm hover:shadow-md'
          : 'rounded-[32px] shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/80'
      } ${className}`}
    >
      {/* ---------------------------------------------------- */}
      {/* 1. IMAGE BANNER (TOP HALF)                            */}
      {/* ---------------------------------------------------- */}
      <div
        className={`relative w-full bg-gradient-to-b from-indigo-50/90 via-slate-50 to-indigo-50/40 flex items-center justify-center ${
          isCompact ? 'h-28 sm:h-30' : 'h-44 sm:h-48'
        }`}
      >
        {/* Ambient Radial Accents */}
        <div className="absolute -top-10 -left-10 w-28 h-28 rounded-full bg-indigo-100/50 blur-xl pointer-events-none" />
        <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-emerald-100/40 blur-xl pointer-events-none" />

        {/* Geometric Framing Graphics */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="20%" cy="30%" r="30" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 6" />
          <path d="M 60 140 Q 140 100 220 140" fill="none" stroke="#0ea5e9" strokeWidth="2" />
        </svg>

        {/* 3D Course Graphic Frame */}
        <div className="relative z-10 flex flex-col items-center justify-center transform group-hover:scale-108 transition-transform duration-500">
          <div
            className={`bg-white/80 backdrop-blur-xs border border-white/90 shadow-md flex items-center justify-center ${
              isCompact
                ? 'w-14 h-14 rounded-2xl'
                : 'w-20 h-20 sm:w-22 sm:h-22 rounded-3xl'
            }`}
          >
            <span
              className={`filter drop-shadow-md select-none ${
                isCompact ? 'text-3xl' : 'text-4xl sm:text-5xl'
              }`}
            >
              {course.icon}
            </span>
          </div>
        </div>

        {/* Floating Favorite / Heart Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFav ? "Remove from favorites" : "Save to favorites"}
          className={`absolute z-20 rounded-full bg-white/95 backdrop-blur-xs shadow-md border border-slate-100/80 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer ${
            isCompact
              ? 'top-2 right-2 w-7 h-7'
              : 'top-3.5 right-3.5 w-9 h-9'
          }`}
        >
          <Heart
            size={isCompact ? 13 : 17}
            className={`transition-colors duration-200 ${
              isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-400 hover:text-rose-400'
            }`}
          />
        </button>

        {/* ---------------------------------------------------- */}
        {/* 2. THE CUTOUT TRANSITION & OVERLAPPING RATING BADGE  */}
        {/* ---------------------------------------------------- */}
        
        {/* Cutout Mask Divider: Curves up immediately beside the rating badge */}
        {isCompact ? (
          <div className="absolute -bottom-[1px] left-0 right-0 h-5 flex items-end pointer-events-none z-10">
            <svg
              className="h-5 w-[110px] shrink-0 block"
              viewBox="0 0 110 20"
              fill="none"
            >
              <path
                d="M 0 20 L 64 20 C 76 20 84 0 96 0 L 110 0 L 110 20 Z"
                fill="#ffffff"
              />
            </svg>
            <div className="flex-1 h-5 bg-white" />
          </div>
        ) : (
          <div className="absolute -bottom-[1px] left-0 right-0 h-6 flex items-end pointer-events-none z-10">
            <svg
              className="h-6 w-[140px] shrink-0 block"
              viewBox="0 0 140 24"
              fill="none"
            >
              <path
                d="M 0 24 L 82 24 C 98 24 106 0 120 0 L 140 0 L 140 24 Z"
                fill="#ffffff"
              />
            </svg>
            <div className="flex-1 h-6 bg-white" />
          </div>
        )}

        {/* Rating Badge: Stands proud with top higher than the right white edge */}
        <div
          className={`absolute z-20 inline-flex items-center gap-1 rounded-full bg-white shadow-md border border-slate-100/90 ${
            isCompact
              ? 'bottom-1 left-3.5 px-2 py-0.5'
              : 'bottom-1.5 left-5 px-3 py-1'
          }`}
        >
          <span
            className={`font-black text-slate-800 ${
              isCompact ? 'text-[11px]' : 'text-xs'
            }`}
          >
            {rating.toFixed(1)}
          </span>
          <Star
            size={isCompact ? 11 : 13}
            className="fill-amber-400 text-amber-400 shrink-0"
          />
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. CONTENT AREA (BOTTOM HALF)                        */}
      {/* ---------------------------------------------------- */}
      <div
        className={`flex-1 flex flex-col bg-white ${
          isCompact ? 'p-3.5 sm:p-4 pt-2.5' : 'p-6 sm:p-7 pt-3.5'
        }`}
      >
        {/* Category Tag */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 rounded-md ${
              isCompact ? 'text-[9px] px-2 py-0.5' : 'text-[10px] sm:text-xs px-2.5 py-0.5'
            }`}
          >
            {course.category}
          </span>
        </div>

        {/* Title */}
        <h3
          className={`font-black text-slate-900 leading-snug tracking-tight group-hover:text-indigo-600 transition-colors ${
            isCompact
              ? 'text-sm sm:text-base line-clamp-1'
              : 'text-xl sm:text-2xl'
          }`}
        >
          {course.title}
        </h3>

        {/* Subtitle / Level */}
        <p
          className={`font-semibold text-slate-400 line-clamp-1 ${
            isCompact ? 'text-[10px] mt-0.5' : 'text-xs sm:text-sm mt-1'
          }`}
        >
          {displayLevel}
        </p>

        {/* Description */}
        <p
          className={`text-slate-500 font-medium leading-relaxed ${
            isCompact
              ? 'text-[11px] line-clamp-2 mt-1.5'
              : 'text-xs sm:text-sm line-clamp-3 mt-2.5'
          }`}
        >
          {course.description}
        </p>

        {/* ---------------------------------------------------- */}
        {/* 4. FOOTER / CALL TO ACTION                           */}
        {/* ---------------------------------------------------- */}
        <div
          className={`flex items-center justify-between border-t border-slate-100 ${
            isCompact
              ? 'mt-auto pt-2.5 gap-2'
              : 'mt-auto pt-4 gap-3'
          }`}
        >
          {/* Price */}
          <div className="flex flex-col">
            {!isCompact && (
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Tuition
              </span>
            )}
            <span
              className={`font-black text-slate-900 tracking-tight leading-none ${
                isCompact ? 'text-sm sm:text-base' : 'text-2xl'
              }`}
            >
              {price}
            </span>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleEnrollClick}
            className={`inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 transition-all active:scale-95 cursor-pointer shrink-0 rounded-full ${
              isCompact
                ? 'py-1.5 px-3 text-xs'
                : 'py-2.5 px-5 text-sm'
            }`}
          >
            <span>{ctaText}</span>
            {useExternalIcon ? (
              <ExternalLink size={isCompact ? 12 : 15} className="stroke-[2.5]" />
            ) : (
              <ArrowRight size={isCompact ? 12 : 15} className="stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
