import React, { useState } from 'react';
import { Star, Heart, ArrowRight, ExternalLink, Clock, Sparkles } from 'lucide-react';
import { KortexCourse } from '../koursesData';
import { CatalogCourse } from '../courseCatalogConfig';
import { SUBJECT_IMAGES } from '../curriculumConfig';

export interface KortexCourseCardProps {
  course: CatalogCourse | KortexCourse | any;
  size?: 'default' | 'compact'; // 'compact' is tailored for dashboard carousels
  price?: string;              // Defaults to 'Free' or '₹{price}'
  rating?: number;             // Defaults to 4.8
  level?: string;              // Defaults to course.gradeGroup or course.grade
  isFavorite?: boolean;
  isEnrolled?: boolean;        // If user/child is already enrolled in this course
  onToggleFavorite?: (courseId: string, e: React.MouseEvent) => void;
  onEnroll?: (course: any, e: React.MouseEvent) => void;
  onClick?: (course: any) => void;
  ctaText?: string;            // Defaults to 'Explore Course' or 'Coming Soon'
  useExternalIcon?: boolean;   // Set true to render ExternalLink icon
  className?: string;
}

export const KortexCourseCard: React.FC<KortexCourseCardProps> = ({
  course,
  size = 'default',
  price: explicitPrice,
  rating = 4.8,
  level,
  isFavorite: controlledFavorite,
  isEnrolled = false,
  onToggleFavorite,
  onEnroll,
  onClick,
  ctaText: explicitCtaText,
  useExternalIcon = false,
  className = '',
}) => {
  const [internalFavorite, setInternalFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isFav = controlledFavorite !== undefined ? controlledFavorite : internalFavorite;
  const isCompact = size === 'compact';

  const isComingSoon = course.status === 'coming_soon';
  const isFree = course.isFree !== undefined ? course.isFree : true;

  // Resolve Thumbnail Image (Specifically for FLN Hindi, FLN Maths, and courses with coverImage)
  const isFLNHindi = course.id === 'fln-hindi' || course.title?.toLowerCase().includes('fln hindi') || course.title === 'Hindi' || course.coverImage?.includes('hindi-cover');
  const isFLNMaths = course.id === 'fln-maths' || course.title?.toLowerCase().includes('fln math') || course.title === 'Maths' || course.coverImage?.includes('maths-cover');

  const resolvedCoverImage = isFLNHindi 
    ? '/thumbnails/hindi-cover.webp' 
    : isFLNMaths 
      ? '/thumbnails/maths-cover.webp' 
      : (course.coverImage && !course.coverImage.includes('default-cover') 
          ? course.coverImage 
          : (course.subject && (SUBJECT_IMAGES as any)[course.subject]) 
            ? (SUBJECT_IMAGES as any)[course.subject] 
            : null);

  // Resolved Display Price
  const resolvedPrice = explicitPrice !== undefined 
    ? explicitPrice 
    : isEnrolled
      ? 'Enrolled'
      : isFree 
        ? 'Free' 
        : course.price 
          ? `₹${course.price}` 
          : isComingSoon 
            ? 'Coming Soon' 
            : 'Free';

  // Resolved CTA Text
  const resolvedCtaText = explicitCtaText !== undefined
    ? explicitCtaText
    : isEnrolled
      ? 'Open Lessons'
      : isComingSoon
        ? 'Coming Soon'
        : isFree
          ? 'Explore Course'
          : 'Enroll Now';

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

  const displayLevel = level || (
    course.grade 
      ? `${course.grade}${course.ageBand ? ` • ${course.ageBand}` : ''}`
      : `${course.gradeGroup || ''}${course.ageBand ? ` • ${course.ageBand}` : ''}`
  );

  const categoryLabel = course.masterCategory || course.category || 'Curriculum';

  return (
    <div
      onClick={() => onClick?.(course)}
      className={`group relative bg-white border border-slate-100 transition-all duration-300 hover:-translate-y-1 flex flex-col overflow-hidden cursor-pointer select-none rounded-3xl shadow-md hover:shadow-xl ${className}`}
    >
      {/* ---------------------------------------------------- */}
      {/* 1. IMAGE BANNER (TOP HALF)                            */}
      {/* ---------------------------------------------------- */}
      <div
        className={`relative w-full bg-gradient-to-b from-indigo-50/90 via-slate-50 to-indigo-50/40 flex items-center justify-center overflow-hidden ${
          isCompact ? 'h-24 sm:h-28' : 'h-36 sm:h-40'
        }`}
      >
        {resolvedCoverImage && !imageError ? (
          <>
            <img
              src={resolvedCoverImage}
              alt={course.title}
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-black/10 pointer-events-none" />
          </>
        ) : (
          <>
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
                    ? 'w-12 h-12 rounded-xl'
                    : 'w-16 h-16 sm:w-18 sm:h-18 rounded-2xl'
                }`}
              >
                <span
                  className={`filter drop-shadow-md select-none ${
                    isCompact ? 'text-2xl' : 'text-3xl sm:text-4xl'
                  }`}
                >
                  {course.icon || '📚'}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Frosted Glass "Coming Soon" Overlay */}
        {isComingSoon && (
          <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-[2px] flex items-center justify-center z-25 transition-opacity group-hover:bg-slate-900/25">
            <span className="px-3.5 py-1.5 rounded-full bg-amber-500/95 text-white font-black text-xs uppercase tracking-wider shadow-md backdrop-blur-xs flex items-center gap-1.5">
              <Clock size={13} className="shrink-0" /> Coming Soon
            </span>
          </div>
        )}

        {/* Floating Favorite / Heart Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFav ? "Remove from favorites" : "Save to favorites"}
          className={`absolute z-30 rounded-full bg-white/95 backdrop-blur-xs shadow-md border border-slate-100/80 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer ${
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

        {/* Cutout Mask Divider */}
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

        {/* Rating Badge */}
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
      {/* 2. CONTENT AREA (BOTTOM HALF)                        */}
      {/* ---------------------------------------------------- */}
      <div
        className={`flex-1 flex flex-col bg-white ${
          isCompact ? 'p-3 sm:p-3.5 pt-2' : 'p-4 sm:p-5 pt-3'
        }`}
      >
        {/* Category & Badges */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span
            className={`font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 rounded-md ${
              isCompact ? 'text-[9px] px-2 py-0.5' : 'text-[10px] sm:text-xs px-2.5 py-0.5'
            }`}
          >
            {categoryLabel}
          </span>

          {isEnrolled ? (
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <span>✓ Enrolled</span>
            </span>
          ) : isFree && !isComingSoon ? (
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Free Course
            </span>
          ) : null}
        </div>

        {/* Title */}
        <h3
          className={`font-black text-slate-900 leading-snug tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1 ${
            isCompact
              ? 'text-sm sm:text-base'
              : 'text-base sm:text-lg'
          }`}
        >
          {course.title}
        </h3>

        {/* Subtitle / Level */}
        <p
          className={`font-semibold text-slate-400 line-clamp-1 ${
            isCompact ? 'text-[10px] mt-0.5' : 'text-xs mt-0.5'
          }`}
        >
          {displayLevel}
        </p>

        {/* Description */}
        <p
          className={`text-slate-500 font-medium leading-relaxed line-clamp-2 ${
            isCompact
              ? 'text-[11px] mt-1'
              : 'text-xs sm:text-sm mt-1.5'
          }`}
        >
          {course.description}
        </p>

        {/* ---------------------------------------------------- */}
        {/* 3. FOOTER / CALL TO ACTION                           */}
        {/* ---------------------------------------------------- */}
        <div
          className={`flex items-center justify-between border-t border-slate-100 ${
            isCompact
              ? 'mt-auto pt-2.5 gap-2'
              : 'mt-auto pt-3 gap-2.5'
          }`}
        >
          {/* Price / Status */}
          <div className="flex flex-col">
            {!isCompact && (
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                {isComingSoon ? 'Status' : 'Tuition'}
              </span>
            )}
            <span
              className={`font-black tracking-tight leading-none ${
                isCompact ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'
              } ${isEnrolled ? 'text-emerald-600' : isComingSoon ? 'text-amber-600 text-sm sm:text-base' : isFree ? 'text-emerald-600' : 'text-slate-900'}`}
            >
              {resolvedPrice}
            </span>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleEnrollClick}
            className={`inline-flex items-center justify-center gap-1.5 font-bold transition-all active:scale-95 cursor-pointer shrink-0 rounded-full ${
              isComingSoon
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                : isEnrolled
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md shadow-emerald-200 hover:shadow-lg'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300'
            } ${
              isCompact
                ? 'py-1.5 px-3 text-xs'
                : 'py-2 px-3.5 text-xs sm:text-sm'
            }`}
          >
            <span>{resolvedCtaText}</span>
            {isComingSoon ? (
              <Clock size={isCompact ? 12 : 14} />
            ) : useExternalIcon ? (
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
