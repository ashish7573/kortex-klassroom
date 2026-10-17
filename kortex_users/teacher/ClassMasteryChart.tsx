"use client";
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  BarChart3, Trophy, Award, Download, Printer, ArrowUpDown, 
  CheckCircle2, AlertTriangle, Users, BookOpen, Sparkles, 
  ChevronRight, ChevronDown, ChevronsUpDown, Info, X, Star, Flame, Loader2,
  SlidersHorizontal, ChevronUp
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../backend_configurations/firebase';
import ModalPortal from '../../components/ModalPortal';
import { ClassStudentData, TeacherComboData } from '@/types/user';
import { buildCurriculumFromTools } from './curriculum_mastery/curriculumBuilder';
import { getCurriculumForSubject } from './curriculum_mastery/masteryRegistry';
import { updateStudentMasteryLevel } from '../../app/actions/teacher';
import { 
  calculateStudentMastery, 
  sortStudentsByMastery, 
  exportMasteryToCSV 
} from './curriculum_mastery/masteryCalculator';
import { MasterySortOption, StudentMasterySummary, MilestoneDefinition } from './curriculum_mastery/types';

interface ClassMasteryChartProps {
  roster: ClassStudentData[];
  combo: TeacherComboData;
  initialTools?: any[];
  onUpdateRoster?: (updatedRoster: ClassStudentData[]) => void;
}

const ROW_HEIGHT_PX = 36; // Pixel height per row for touch targets & 1:1 grid alignment

type VisibleRowItem = 
  | {
      id: string;
      type: 'chapter';
      chapterNumber: number;
      chapterName: string;
      color: string;
      badgeBg: string;
      badgeText: string;
      borderColor: string;
      isCollapsed: boolean;
      subtopicCount: number;
    }
  | {
      id: string;
      type: 'milestone';
      milestone: MilestoneDefinition;
      level: number;
      chapterNumber: number;
      chapterName: string;
      subtopicName: string;
      color: string;
      badgeBg: string;
      badgeText: string;
      borderColor: string;
      isMajor: boolean;
    };

export default function ClassMasteryChart({ roster, combo, initialTools = [], onUpdateRoster }: ClassMasteryChartProps) {
  const [sortBy, setSortBy] = useState<MasterySortOption>('roll');
  const [selectedStudent, setSelectedStudent] = useState<StudentMasterySummary | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [liveTools, setLiveTools] = useState<any[]>(initialTools || []);
  const [loadingTools, setLoadingTools] = useState(false);
  const [collapsedChapters, setCollapsedChapters] = useState<Record<number, boolean>>({});

  // Teacher level override states
  const [targetLevel, setTargetLevel] = useState<number>(0);
  const [isUpdatingLevel, setIsUpdatingLevel] = useState(false);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState<string | null>(null);
  const [updateErrorMsg, setUpdateErrorMsg] = useState<string | null>(null);

  // Sync targetLevel whenever selectedStudent opens or changes
  useEffect(() => {
    if (selectedStudent) {
      setTargetLevel(selectedStudent.currentLevel);
      setUpdateSuccessMsg(null);
      setUpdateErrorMsg(null);
    }
  }, [selectedStudent?.uid]);

  // Synchronize liveTools from initialTools, or fallback to client fetch if empty
  useEffect(() => {
    if (initialTools && initialTools.length > 0) {
      setLiveTools(initialTools);
      return;
    }

    let isMounted = true;
    async function fetchToolsClient() {
      try {
        setLoadingTools(true);
        const cleanSubj = (combo.subjectStr || '').trim().toLowerCase();
        const subjectFilters = [combo.subjectStr, combo.subjectStr.toLowerCase()];
        if (cleanSubj.includes('math') || cleanSubj === 'mathematics') {
          subjectFilters.push('FLN Maths', 'fln maths', 'Maths', 'maths', 'Mathematics', 'mathematics');
        } else if (cleanSubj.includes('hindi')) {
          subjectFilters.push('FLN Hindi', 'fln hindi', 'Hindi', 'hindi');
        } else if (cleanSubj.includes('eng')) {
          subjectFilters.push('FLN English', 'fln english', 'English', 'english');
        }

        const q = query(collection(db, 'learning_tools'), where('subject', 'in', Array.from(new Set(subjectFilters))));
        const snap = await getDocs(q).catch(() => ({ docs: [] }));
        if (!isMounted) return;

        const matched: any[] = [];
        snap.docs.forEach((doc: any) => {
          const data = doc.data();
          const g = (data.grade || '').trim().toLowerCase();
          const s = (data.subject || '').trim().toLowerCase();
          
          const tg = combo.gradeStr.trim().toLowerCase();
          const isGradeMatch = !g || g === 'all grades' || g === 'all' || g === tg ||
            (tg.includes('fln') && g.includes('fln')) ||
            (Boolean(tg.match(/\d+/)?.[0] && g.match(/\d+/)?.[0] && tg.match(/\d+/)?.[0] === g.match(/\d+/)?.[0]));
          
          const isSubjMatch = s === combo.subjectStr.toLowerCase() || 
            (cleanSubj.includes('math') && (s.includes('math') || s === 'mathematics')) ||
            (cleanSubj.includes('hindi') && s.includes('hindi')) ||
            (cleanSubj.includes('eng') && s.includes('eng'));

          if (isGradeMatch && isSubjMatch) {
            matched.push({
              id: doc.id,
              title: data.title || '',
              chapter_name: data.chapter_name || data.chapter || '',
              chapter: data.chapter || data.chapter_name || '',
              chapter_number: data.chapter_number !== undefined ? Number(data.chapter_number) : 1,
              subtopic: data.subtopic || data.subtopic_name || '',
              subtopic_name: data.subtopic_name || data.subtopic || '',
              subtopic_order: data.subtopic_order !== undefined ? Number(data.subtopic_order) : 1,
              subtopicId: data.subtopicId || data.subtopic_id || '',
              content_type: data.content_type || data.type || ''
            });
          }
        });

        if (matched.length > 0) {
          setLiveTools(matched);
        }
      } catch (err) {
        console.error('Error fetching live learning tools:', err);
      } finally {
        if (isMounted) setLoadingTools(false);
      }
    }

    fetchToolsClient();
    return () => { isMounted = false; };
  }, [initialTools, combo.subjectStr, combo.gradeStr]);

  // 1. Resolve Curriculum for Classroom Subject & Grade
  // STRICT RULE: Build strictly and purely from LIVE database tools.
  // Never introduce any dummy or hardcoded content.
  const curriculum = useMemo(() => {
    if (liveTools && liveTools.length > 0) {
      return buildCurriculumFromTools(liveTools, combo.subjectStr);
    }
    return getCurriculumForSubject(combo.subjectStr, combo.gradeStr);
  }, [liveTools, combo.subjectStr, combo.gradeStr]);

  // Toggle single chapter collapse/extend
  const toggleChapter = (chapterNum: number) => {
    setCollapsedChapters(prev => ({
      ...prev,
      [chapterNum]: !prev[chapterNum]
    }));
  };

  // Check if all chapters are collapsed
  const areAllCollapsed = useMemo(() => {
    if (!curriculum || curriculum.chapters.length === 0) return false;
    return curriculum.chapters.every(c => collapsedChapters[c.chapterNumber]);
  }, [curriculum, collapsedChapters]);

  // Toggle collapse all / expand all
  const toggleCollapseAll = () => {
    if (!curriculum) return;
    if (areAllCollapsed) {
      setCollapsedChapters({});
    } else {
      const all: Record<number, boolean> = {};
      curriculum.chapters.forEach(c => {
        all[c.chapterNumber] = true;
      });
      setCollapsedChapters(all);
    }
  };

  // Construct visible rows from top to bottom (Highest chapter & milestone at top, Chapter 1 at bottom)
  const visibleRows = useMemo<VisibleRowItem[]>(() => {
    if (!curriculum) return [];

    const rows: VisibleRowItem[] = [];
    // Chapters in descending order (highest chapter number on top)
    const reversedChapters = [...curriculum.chapters].reverse();

    reversedChapters.forEach(ch => {
      const isCollapsed = Boolean(collapsedChapters[ch.chapterNumber]);
      const chapterMilestones = curriculum.milestones.filter(m => m.chapterNumber === ch.chapterNumber);

      // 1. Chapter Header Row (Clickable to collapse / extend)
      rows.push({
        id: `chap-${ch.chapterNumber}`,
        type: 'chapter',
        chapterNumber: ch.chapterNumber,
        chapterName: ch.chapterName,
        color: ch.color,
        badgeBg: ch.badgeBg,
        badgeText: ch.badgeText,
        borderColor: ch.borderColor,
        isCollapsed,
        subtopicCount: chapterMilestones.length
      });

      // 2. Subtopic rows when extended (highest level on top)
      if (!isCollapsed) {
        const revMilestones = [...chapterMilestones].reverse();
        revMilestones.forEach(m => {
          rows.push({
            id: `milestone-${m.level}`,
            type: 'milestone',
            milestone: m,
            level: m.level,
            chapterNumber: ch.chapterNumber,
            chapterName: ch.chapterName,
            subtopicName: m.subtopicName,
            color: ch.color,
            badgeBg: ch.badgeBg,
            badgeText: ch.badgeText,
            borderColor: ch.borderColor,
            isMajor: m.isMajorMilestone
          });
        });
      }
    });

    return rows;
  }, [curriculum, collapsedChapters]);

  const totalChartHeight = visibleRows.length * ROW_HEIGHT_PX;

  // 2. Compute mastery summaries for each student
  const studentSummaries = useMemo(() => {
    if (!curriculum) return [];
    return roster.map(s => calculateStudentMastery(s, curriculum));
  }, [roster, curriculum]);

  // 3. Sort students according to active sorting option
  const sortedStudents = useMemo(() => {
    return sortStudentsByMastery(studentSummaries, sortBy);
  }, [studentSummaries, sortBy]);

  // 4. Compute Classroom Aggregate Metrics
  const metrics = useMemo(() => {
    const total = sortedStudents.length;
    if (total === 0 || !curriculum) return { avgLevel: '0', masteryRate: '0%', strugglingCount: 0, topLevel: 0 };

    const sumLevels = sortedStudents.reduce((acc, s) => acc + s.currentLevel, 0);
    const avgLevel = (sumLevels / total).toFixed(1);
    const mastered = sortedStudents.filter(s => s.isMastered).length;
    const masteryRate = Math.round((mastered / total) * 100) + '%';
    const strugglingCount = sortedStudents.filter(s => s.hasStrugglingAttempt).length;
    const topLevel = Math.max(...sortedStudents.map(s => s.currentLevel), 0);

    return { avgLevel, masteryRate, masteredCount: mastered, strugglingCount, topLevel };
  }, [sortedStudents, curriculum]);

  // Calculate pixel height of each student's bar matching visible rows exactly
  const getStudentBarHeight = (student: StudentMasterySummary): number => {
    if (student.currentLevel === 0) return 8; // Minimal baseline cap

    // 1. If student's exact milestone row is visible
    const milestoneIdx = visibleRows.findIndex(
      r => r.type === 'milestone' && r.level === student.currentLevel
    );
    if (milestoneIdx !== -1) {
      const rowsFromBottom = visibleRows.length - milestoneIdx;
      return rowsFromBottom * ROW_HEIGHT_PX;
    }

    // 2. If student's milestone is inside a collapsed chapter
    const chapIdx = visibleRows.findIndex(
      r => r.type === 'chapter' && r.chapterNumber === student.currentChapterNumber
    );
    if (chapIdx !== -1) {
      const rowsFromBottom = visibleRows.length - chapIdx;
      return rowsFromBottom * ROW_HEIGHT_PX;
    }

    // 3. Fallback proportional
    if (curriculum && curriculum.totalLevels > 0) {
      return Math.max(Math.round((student.currentLevel / curriculum.totalLevels) * totalChartHeight), 8);
    }

    return 8;
  };

  // Handler for Teacher Level Override (Promote or Demote student)
  const handleSaveLevelChange = async () => {
    if (!selectedStudent || !curriculum) return;
    if (targetLevel === selectedStudent.currentLevel) return;

    try {
      setIsUpdatingLevel(true);
      setUpdateErrorMsg(null);
      setUpdateSuccessMsg(null);

      const user = auth.currentUser;
      if (!user) throw new Error("You must be logged in to update student levels.");
      const token = await user.getIdToken();

      const res = await updateStudentMasteryLevel(
        token,
        selectedStudent.uid,
        combo.comboId,
        combo.gradeStr,
        combo.subjectStr,
        targetLevel,
        curriculum.milestones.map(m => ({
          level: m.level,
          chapterNumber: m.chapterNumber,
          chapterName: m.chapterName,
          subtopicName: m.subtopicName,
          toolIds: m.toolIds,
          id: m.id
        }))
      );

      if (!res.success) {
        throw new Error(res.error || "Failed to update student level.");
      }

      // Update local roster
      const updatedCompletedTools = res.updatedCompletedTools || {};
      const updatedRoster = roster.map(s => {
        if (s.uid === selectedStudent.uid) {
          return {
            ...s,
            completedTools: updatedCompletedTools,
            completedToolsCount: Object.keys(updatedCompletedTools).length,
            progressPercentage: curriculum.totalLevels > 0
              ? Math.min(100, Math.round((targetLevel / curriculum.totalLevels) * 100))
              : s.progressPercentage
          };
        }
        return s;
      });

      if (onUpdateRoster) {
        onUpdateRoster(updatedRoster);
      }

      // Re-calculate updated summary for selectedStudent
      const updatedStudentData = updatedRoster.find(s => s.uid === selectedStudent.uid)!;
      const newSummary = calculateStudentMastery(updatedStudentData, curriculum);
      setSelectedStudent(newSummary);
      setTargetLevel(newSummary.currentLevel);

      const isPromote = targetLevel > selectedStudent.currentLevel;
      setUpdateSuccessMsg(
        isPromote 
          ? `Promoted to Level ${targetLevel} successfully!`
          : `Adjusted to Level ${targetLevel} successfully!`
      );
    } catch (err: any) {
      console.error("Error saving student level:", err);
      setUpdateErrorMsg(err.message || "An error occurred while updating the student level.");
    } finally {
      setIsUpdatingLevel(false);
    }
  };

  // Handler for Export CSV
  const handleExportCSV = () => {
    exportMasteryToCSV(sortedStudents, combo.comboLabel, combo.subjectStr, {
      avgLevel: metrics.avgLevel,
      masteryRate: metrics.masteryRate,
      masteredCount: metrics.masteredCount,
      strugglingCount: metrics.strugglingCount,
      totalLevels: curriculum.totalLevels,
    });
  };

  // Handler for Print
  const handlePrint = () => {
    window.print();
  };

  // Loading State Guard
  if (loadingTools && !curriculum) {
    return (
      <div className="bg-white rounded-3xl p-12 border-2 border-slate-100 text-center shadow-sm flex flex-col items-center justify-center gap-3 animate-fade-in">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        <p className="text-sm font-bold text-slate-500">Loading live curriculum data from database...</p>
      </div>
    );
  }

  // Live Database Content Guard: Strict adherence to live content (no dummy data)
  if (!curriculum) {
    return (
      <div className="bg-white rounded-3xl p-12 border-2 border-dashed border-slate-200 text-center shadow-sm animate-fade-in">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <BookOpen size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">No Live Curriculum Content Found</h3>
        <p className="text-slate-500 font-semibold max-w-md mx-auto text-sm">
          No learning tools with chapter and subtopic details were found in the database for <span className="font-bold text-slate-800">{combo.subjectStr} ({combo.gradeStr || 'All Grades'})</span>.
          Content in this overview is strictly populated from actual tools in the database.
        </p>
      </div>
    );
  }

  return (
    <div id="mastery-chart-print-section" className="space-y-6">
      
      {/* ========================================================= */}
      {/* HEADER & CONTROLS BAR (Screen & Print Summary)            */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-100 shadow-sm space-y-6 print:p-4 print:border-slate-200 print:shadow-none print:rounded-2xl">
        
        {/* Top Action Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <BarChart3 size={24} />
              </span>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  Class Mastery Overview
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {combo.comboLabel} • {combo.subjectStr} • Live Progression Ladder • Passing Threshold: ≥ 90%
                </p>
              </div>
            </div>
          </div>

          {/* Export & Print Buttons (Hidden during Print) */}
          <div className="flex items-center gap-2.5 print:hidden">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors shadow-xs"
              title="Download Student Mastery Report CSV"
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-sm"
              title="Print Classroom Mastery Ladder"
            >
              <Printer size={15} />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Aggregate Metrics Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Class Avg Level</span>
            <div className="text-2xl font-black text-slate-800 mt-0.5 flex items-baseline gap-1">
              <span>L{metrics.avgLevel}</span>
              <span className="text-xs text-slate-400 font-bold">/ {curriculum.totalLevels}</span>
            </div>
          </div>

          <div className="bg-emerald-50/70 rounded-2xl p-3.5 border border-emerald-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Full Mastery Rate</span>
            <div className="text-2xl font-black text-emerald-700 mt-0.5 flex items-center gap-1.5">
              <span>{metrics.masteryRate}</span>
              <span className="text-xs font-bold text-emerald-600">({metrics.masteredCount} of {sortedStudents.length})</span>
            </div>
          </div>

          <div className="bg-amber-50/70 rounded-2xl p-3.5 border border-amber-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Needs Support</span>
            <div className="text-2xl font-black text-amber-700 mt-0.5 flex items-center gap-1.5">
              <span>{metrics.strugglingCount}</span>
              <span className="text-xs font-bold text-amber-600">(&lt; 90% score)</span>
            </div>
          </div>

          <div className="bg-sky-50/70 rounded-2xl p-3.5 border border-sky-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-700">Total Students</span>
            <div className="text-2xl font-black text-sky-700 mt-0.5">
              {sortedStudents.length}
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* THE MASTER BAR CHART: FIXED Y-AXIS + HORIZONTAL SCROLL    */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-sm overflow-hidden print:border-slate-300 print:shadow-none print:overflow-visible print:rounded-2xl">
        
        {/* Top Dark Controls Bar: Sort By, Expand/Collapse & Swipe Hint (Hidden during Print) */}
        <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold border-b border-slate-800 print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ArrowUpDown size={13} className="text-indigo-400" /> Sort By:
              </span>
              <div className="flex bg-slate-800/90 p-1 rounded-xl gap-1 text-xs font-bold border border-slate-700/80">
                <button
                  onClick={() => setSortBy('roll')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    sortBy === 'roll'
                      ? 'bg-indigo-600 text-white shadow-sm font-black'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                  title="Sort by student roll number"
                >
                  Roll No 🔢
                </button>
                <button
                  onClick={() => setSortBy('alpha')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    sortBy === 'alpha'
                      ? 'bg-indigo-600 text-white shadow-sm font-black'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                  title="Sort alphabetically by student name"
                >
                  Name (A-Z) 🔤
                </button>
                <button
                  onClick={() => setSortBy('level-asc')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    sortBy === 'level-asc'
                      ? 'bg-indigo-600 text-white shadow-sm font-black'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                  title="Lowest mastery level on left (spot students needing intervention)"
                >
                  Ascending 📈
                </button>
                <button
                  onClick={() => setSortBy('level-desc')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    sortBy === 'level-desc'
                      ? 'bg-indigo-600 text-white shadow-sm font-black'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                  title="Highest mastery level on left"
                >
                  Descending 📉
                </button>
              </div>
            </div>

            {/* Collapse / Expand All Chapters Toggle */}
            <button
              onClick={toggleCollapseAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 shadow-xs cursor-pointer"
              title={areAllCollapsed ? 'Expand all chapter subtopics' : 'Collapse all chapters to summary view'}
            >
              <ChevronsUpDown size={14} className="text-indigo-400" />
              <span>{areAllCollapsed ? 'Expand All Chapters' : 'Collapse All Chapters'}</span>
            </button>
          </div>

          {/* Right: Swipe Hint */}
          <div className="text-xs font-bold text-slate-400 italic">
            👉 Swipe left & right to view all {sortedStudents.length} student bars
          </div>
        </div>

        {/* Two-Column Layout: Left Sticky Y-Axis + Right Scrollable Bars */}
        <div className="flex relative">
          
          {/* ========================================== */}
          {/* FIXED / PINNED Y-AXIS (LEFT COLUMN)        */}
          {/* ========================================== */}
          <div className="w-68 sm:w-76 md:w-84 shrink-0 bg-slate-50 border-r-2 border-slate-200 z-20 flex flex-col justify-end select-none shadow-[3px_0_10px_rgba(0,0,0,0.03)]">
            
            {/* Header Box on Top of Y-Axis */}
            <div className="h-10 border-b border-slate-200 px-3 flex items-center justify-between bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-wider shrink-0">
              <span>Chapter & Subtopics</span>
              <span>Level</span>
            </div>

            {/* Stacked Visible Rows (Top = Highest Chapter & Milestone, Bottom = Level 1) */}
            <div style={{ height: `${totalChartHeight}px` }} className="flex flex-col justify-between">
              {visibleRows.map((row) => {
                // 1. CHAPTER HEADER ROW (Collapsible / Extendable)
                if (row.type === 'chapter') {
                  return (
                    <div 
                      key={row.id} 
                      onClick={() => toggleChapter(row.chapterNumber)}
                      style={{ 
                        height: `${ROW_HEIGHT_PX}px`,
                        backgroundColor: row.color 
                      }}
                      className="flex items-center justify-between px-3 text-white cursor-pointer select-none border-b border-black/10 hover:brightness-110 active:scale-[0.99] transition-all shadow-xs group"
                      title={`Click to ${row.isCollapsed ? 'extend and show subtopics' : 'collapse and hide subtopics'}`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        {row.isCollapsed ? (
                          <ChevronRight size={15} className="shrink-0 text-white group-hover:scale-125 transition-transform" />
                        ) : (
                          <ChevronDown size={15} className="shrink-0 text-white group-hover:scale-125 transition-transform" />
                        )}
                        <span className="font-black text-xs truncate tracking-tight text-white drop-shadow-xs">
                          Ch {row.chapterNumber}: {row.chapterName}
                        </span>
                      </div>

                      <span className="text-[10px] font-black bg-black/25 text-white px-2 py-0.5 rounded-full shrink-0">
                        {row.subtopicCount} {row.isCollapsed ? '▶' : '▼'}
                      </span>
                    </div>
                  );
                }

                // 2. SUBTOPIC ROW (Entire row colored with chapter color, NO DOT!)
                const isMajor = row.isMajor;
                return (
                  <div 
                    key={row.id} 
                    style={{ 
                      height: `${ROW_HEIGHT_PX}px`,
                      backgroundColor: `${row.color}${isMajor ? '30' : '18'}`, // Full row colored with chapter color!
                      borderLeft: `4px solid ${row.color}`,
                      borderBottom: `1px solid ${row.color}35`,
                    }}
                    className={`flex items-center justify-between px-3 text-xs transition-colors hover:brightness-95 ${
                      isMajor ? 'font-black' : 'font-semibold'
                    }`}
                  >
                    {/* Subtopic Name (NO DOT!) */}
                    <div className="flex items-center gap-2 min-w-0 pr-2 pl-3">
                      {isMajor ? (
                        <div className="flex items-center gap-1.5 truncate">
                          <Trophy size={14} className="text-amber-600 shrink-0" />
                          <span className="truncate font-black text-[11px] text-slate-900" title={row.subtopicName}>
                            {row.subtopicName.replace(/^[🏆🌟]\s*/, '')}
                          </span>
                        </div>
                      ) : (
                        <span className="truncate text-[11px] text-slate-800" title={row.subtopicName}>
                          {row.subtopicName}
                        </span>
                      )}
                    </div>

                    {/* Level Badge with Chapter Color Tint */}
                    <span 
                      style={{ 
                        backgroundColor: isMajor ? '#fbbf24' : `${row.color}35`,
                        color: isMajor ? '#78350f' : '#0f172a'
                      }}
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-md font-mono shrink-0 ${
                        isMajor ? 'ring-1 ring-amber-400 font-black shadow-xs' : ''
                      }`}
                    >
                      L{row.level}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Spacer matching Student Header Row */}
            <div className="h-28 border-t-2 border-slate-200 px-3 flex flex-col justify-center bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-wider shrink-0">
              <span>Student Details</span>
              <span className="text-[9px] font-bold text-slate-400 lowercase">avatar • roll # • name</span>
            </div>
          </div>

          {/* ========================================== */}
          {/* HORIZONTALLY SCROLLABLE BARS (RIGHT COLUMN)*/}
          {/* ========================================== */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto touch-pan-x bg-white relative flex flex-col print:overflow-visible"
          >
            {/* Top Grid Alignment Header */}
            <div className="h-10 border-b border-slate-200 flex items-center bg-slate-50/50 text-[10px] font-bold text-slate-400 px-4 min-w-max">
              <span>{sortedStudents.length} Students in Classroom</span>
            </div>

            {/* Chart Area with Background Grid Lines */}
            <div 
              style={{ height: `${totalChartHeight}px` }} 
              className="relative min-w-max flex items-end px-6 pt-0"
            >
              {/* Horizontal Background Benchmark Lines */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
                {visibleRows.map((row) => {
                  if (row.type === 'chapter') {
                    return (
                      <div 
                        key={`grid-${row.id}`}
                        style={{ 
                          height: `${ROW_HEIGHT_PX}px`,
                          backgroundColor: `${row.color}15`,
                          borderBottom: `2px solid ${row.color}50`
                        }}
                        className="w-full flex items-center justify-end pr-3"
                      >
                        <span 
                          style={{ color: row.color }} 
                          className="text-[10px] font-black uppercase tracking-wider opacity-75"
                        >
                          Ch {row.chapterNumber}: {row.chapterName} {row.isCollapsed ? '(Collapsed)' : ''}
                        </span>
                      </div>
                    );
                  }

                  // Subtopic Row in Grid
                  return (
                    <div 
                      key={`grid-${row.id}`}
                      style={{ 
                        height: `${ROW_HEIGHT_PX}px`,
                        backgroundColor: `${row.color}${row.isMajor ? '12' : '06'}`,
                        borderBottom: `1px dashed ${row.color}30`
                      }}
                      className="w-full flex items-center justify-end pr-3"
                    >
                      {row.isMajor && (
                        <span className="text-[10px] font-bold text-amber-700/80 flex items-center gap-1 opacity-75">
                          <Trophy size={11} className="text-amber-500" /> Major Assessment
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Individual Student Bars */}
              <div className="flex items-end gap-3 sm:gap-4 md:gap-5 relative z-10">
                {sortedStudents.map((student) => {
                  const barHeightPx = getStudentBarHeight(student);
                  const isZeroLevel = student.currentLevel === 0;
                  const isSelected = selectedStudent?.uid === student.uid;
                  const passedMajorAssessment = curriculum.milestones.some(
                    m => m.isMajorMilestone && m.level === student.currentLevel
                  );

                  return (
                    <div 
                      key={student.uid}
                      onClick={() => setSelectedStudent(isSelected ? null : student)}
                      className="w-14 sm:w-16 md:w-18 flex flex-col items-center justify-end group cursor-pointer relative"
                    >
                      {/* Warning Pill if student failed next milestone */}
                      {student.hasStrugglingAttempt && (
                        <div 
                          className="absolute -top-7 left-1/2 -translate-x-1/2 bg-rose-500 text-white rounded-full p-1 shadow-md animate-bounce z-20"
                          title="Attempted next milestone with score < 90%"
                        >
                          <AlertTriangle size={12} />
                        </div>
                      )}

                      {/* Level Pill on Top of Bar */}
                      {!isZeroLevel && (
                        <div 
                          style={{
                            backgroundColor: passedMajorAssessment ? '#fbbf24' : student.currentChapterColor,
                            color: passedMajorAssessment ? '#78350f' : '#ffffff'
                          }}
                          className={`mb-1 text-[10px] font-black font-mono px-1.5 py-0.5 rounded-full shadow-sm transition-transform group-hover:scale-110 ${
                            passedMajorAssessment 
                              ? 'ring-2 ring-amber-300' 
                              : ''
                          }`}
                        >
                          {passedMajorAssessment ? '🏆' : `L${student.currentLevel}`}
                        </div>
                      )}

                      {/* The Bar Itself */}
                      <div 
                        style={{ 
                          height: `${barHeightPx}px`,
                          backgroundColor: isZeroLevel ? '#cbd5e1' : undefined
                        }}
                        className={`w-10 sm:w-12 md:w-13 rounded-t-xl transition-all duration-500 ease-out relative shadow-sm group-hover:brightness-110 ${
                          isSelected ? 'ring-4 ring-indigo-500 ring-offset-2' : ''
                        } ${
                          !isZeroLevel 
                            ? 'bg-gradient-to-t ' + (curriculum.chapters.find(c => c.chapterNumber === student.currentChapterNumber)?.barGradient || 'from-sky-500 to-blue-600')
                            : ''
                        }`}
                      >
                        {/* Shimmer effect for top achievers */}
                        {student.isMastered && (
                          <div className="absolute inset-0 bg-white/20 rounded-t-xl animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Axis: Student Avatars, Names, Roll Numbers */}
            <div className="h-28 border-t-2 border-slate-200 flex items-center px-6 min-w-max bg-slate-50/50">
              <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
                {sortedStudents.map((student) => {
                  const isSelected = selectedStudent?.uid === student.uid;
                  const firstName = (student.fullName || 'Student').split(' ')[0];

                  return (
                    <div 
                      key={`footer-${student.uid}`}
                      onClick={() => setSelectedStudent(isSelected ? null : student)}
                      className={`w-14 sm:w-16 md:w-18 flex flex-col items-center text-center cursor-pointer p-1 rounded-xl transition-all ${
                        isSelected ? 'bg-indigo-50 ring-2 ring-indigo-400' : 'hover:bg-slate-100'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-xs text-slate-600 overflow-hidden mb-1">
                        {student.avatar ? (
                          <img src={student.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          firstName.charAt(0)
                        )}
                      </div>

                      {/* First Name */}
                      <span 
                        className="text-[11px] font-bold text-slate-800 truncate w-full"
                        title={student.fullName}
                      >
                        {firstName}
                      </span>

                      {/* Roll Number Pill */}
                      <span className="text-[9px] font-black text-slate-400 font-mono bg-white border border-slate-200 px-1.5 py-0.2 rounded-md mt-0.5">
                        {student.rollNo ? `#${student.rollNo}` : '-'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* INTERACTIVE STUDENT DETAIL MODAL / DRAWER                 */}
      {/* ========================================================= */}
      {selectedStudent && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in print:hidden">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-slate-200 relative animate-scale-up max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Student Header */}
            <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center font-black text-base text-slate-600 shadow-sm overflow-hidden">
                {selectedStudent.avatar ? (
                  <img src={selectedStudent.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  selectedStudent.fullName.charAt(0)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-800 truncate">{selectedStudent.fullName}</h3>
                  {selectedStudent.isMastered && <span title="Full Subject Mastery Achieved">🏆</span>}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-0.5">
                  <span>Roll: {selectedStudent.rollNo ? `#${selectedStudent.rollNo}` : 'N/A'}</span>
                  <span>•</span>
                  <span>ID: {selectedStudent.kortexId || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Level Card */}
            <div 
              className="rounded-2xl p-4 mb-4 border flex items-center justify-between"
              style={{ 
                backgroundColor: `${selectedStudent.currentChapterColor}15`, 
                borderColor: `${selectedStudent.currentChapterColor}40` 
              }}
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Current Standing</span>
                <div className="text-2xl font-black mt-0.5" style={{ color: selectedStudent.currentChapterColor }}>
                  Level {selectedStudent.currentLevel} <span className="text-sm font-bold text-slate-500">/ {selectedStudent.maxLevel}</span>
                </div>
                <p className="text-xs font-bold text-slate-600 mt-0.5">
                  {selectedStudent.currentChapterName} • {selectedStudent.currentSubtopicName}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Curriculum Cleared</span>
                <div className="text-xl font-black text-slate-800 mt-0.5 font-mono">
                  {selectedStudent.percentageProgress}%
                </div>
              </div>
            </div>

            {/* Teacher Level Adjustment Control */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal size={14} className="text-indigo-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Teacher Level Override
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  Authority Control
                </span>
              </div>

              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                Bring this student up or down across the curriculum ladder. The change immediately updates their milestones, mastery standing, and class overview bar.
              </p>

              {/* Quick Steppers & Dropdown */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={targetLevel <= 0 || isUpdatingLevel}
                  onClick={() => setTargetLevel(prev => Math.max(0, prev - 1))}
                  className="px-3 py-2 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-black text-xs rounded-xl border border-slate-200 shadow-xs transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                  title="Demote by 1 level"
                >
                  <ChevronDown size={14} />
                  <span>-1 Level</span>
                </button>

                <div className="flex-1 relative">
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(Number(e.target.value))}
                    disabled={isUpdatingLevel}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer pr-8"
                  >
                    <option value={0}>Level 0 • Not Started</option>
                    {curriculum.milestones.map((m) => (
                      <option key={`opt-lvl-${m.level}`} value={m.level}>
                        Level {m.level} {m.isMajorMilestone ? '🏆' : '•'} Ch {m.chapterNumber}: {m.subtopicName}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronsUpDown size={14} />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={targetLevel >= curriculum.totalLevels || isUpdatingLevel}
                  onClick={() => setTargetLevel(prev => Math.min(curriculum.totalLevels, prev + 1))}
                  className="px-3 py-2 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-indigo-700 font-black text-xs rounded-xl border border-indigo-200 shadow-xs transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                  title="Promote by 1 level"
                >
                  <span>+1 Level</span>
                  <ChevronUp size={14} />
                </button>
              </div>

              {/* Status Comparison Preview */}
              {targetLevel !== selectedStudent.currentLevel && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2.5 text-xs text-indigo-950 font-bold flex items-center justify-between animate-fade-in">
                  <span className="text-[11px]">
                    {targetLevel > selectedStudent.currentLevel ? '🚀 Promoting from' : '🔻 Demoting from'}{' '}
                    <span className="font-mono text-slate-700">L{selectedStudent.currentLevel}</span> to{' '}
                    <span className="font-mono text-indigo-700 font-black">L{targetLevel}</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-600 text-white font-black">
                    {targetLevel > selectedStudent.currentLevel ? 'Advance' : 'Revisit'}
                  </span>
                </div>
              )}

              {/* Success Notification */}
              {updateSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-2.5 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>{updateSuccessMsg}</span>
                </div>
              )}

              {/* Error Notification */}
              {updateErrorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-2.5 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                  <span>{updateErrorMsg}</span>
                </div>
              )}

              {/* Save / Apply Button */}
              <button
                type="button"
                disabled={targetLevel === selectedStudent.currentLevel || isUpdatingLevel}
                onClick={handleSaveLevelChange}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isUpdatingLevel ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Updating Level in Database...</span>
                  </>
                ) : targetLevel === selectedStudent.currentLevel ? (
                  <span>Level Current • No Changes</span>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Save Level {targetLevel} for {selectedStudent.fullName.split(' ')[0]}</span>
                  </>
                )}
              </button>
            </div>

            {/* Last Passed Milestone & Score */}
            <div className="space-y-3 mb-6">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Last Passed Milestone</span>
                  <div className="font-bold text-slate-800">{selectedStudent.lastPassedMilestoneTitle}</div>
                </div>
                {selectedStudent.lastMilestoneScore > 0 && (
                  <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 font-black text-xs">
                    {selectedStudent.lastMilestoneScore}% Score
                  </span>
                )}
              </div>

              {/* Next Milestone / Warning */}
              {selectedStudent.hasStrugglingAttempt ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Intervention Recommended:</span> Student attempted next milestone with score &lt; 90%. Target topic: <span className="font-bold underline">{selectedStudent.nextMilestoneName}</span>.
                  </div>
                </div>
              ) : !selectedStudent.isMastered ? (
                <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 flex items-start gap-2.5 text-xs text-sky-800">
                  <Sparkles size={16} className="text-sky-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Up Next:</span> Work towards <span className="font-bold underline">{selectedStudent.nextMilestoneName}</span> (Target: ≥ 90%).
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
                  <Award size={16} className="text-emerald-600 shrink-0" />
                  <span>Curriculum Completed! Full subject mastery achieved.</span>
                </div>
              )}
            </div>

            {/* Close Action */}
            <button
              onClick={() => setSelectedStudent(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ========================================================= */}
      {/* PRINT-ONLY CSS RULES: Isolates Bar Chart & Landscape Mode */}
      {/* ========================================================= */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: landscape;
            margin: 8mm;
          }
          body {
            visibility: hidden !important;
            background: #ffffff !important;
          }
          #mastery-chart-print-section,
          #mastery-chart-print-section * {
            visibility: visible !important;
          }
          #mastery-chart-print-section {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          #mastery-chart-print-section .print\\:hidden,
          .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />

    </div>
  );
}
