"use client";
import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../../types/user';
import { auth } from '../../backend_configurations/firebase';
import { checkAndResetDailyHearts, grantHeart, getStudentOrgProfiles, markAssignmentAsDone, getCurriculumTotals } from '../../app/actions/student';
import PlaceholderAd from '../../kortex_landing_page/components/PlaceholderAd';
import { 
  Sparkles, Trophy, Flame, Play, BookOpen, Lightbulb, Gamepad2, 
  Target, Heart, BatteryCharging, X, Star, Award, Book, 
  ClipboardList, CheckCircle2, CircleDashed, Calendar, ExternalLink,
  Building2, ChevronDown, ChevronUp, Bell, ArrowRight,
  Check, Rocket, ArrowUpRight
} from 'lucide-react';
import { collection, onSnapshot, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../backend_configurations/firebase';
import { useStudentAssignments, AssignmentStatus, MergedAssignment } from '../../hooks/useStudentAssignments';
import { generateComboId } from '../org_admin/utils/comboParsers';
import ModalPortal from '../../components/ModalPortal';
import { KORTEX_COURSES, KortexCourse } from '../../kortex_landing_page/koursesData';


interface StudentDashboardProps {
  profile: StudentProfile;
  onExploreTier?: (tierId: string) => void;
}

interface DisplayCombo {
  id: string;
  label: string;
  subject: string;
  orgId: string;
  orgName: string;
}

export default function StudentDashboard({ profile, onExploreTier }: StudentDashboardProps) {
  // Stamina & Energy
  const [hearts, setHearts] = useState(profile.hearts_remaining ?? 5);
  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const [showHeartAd, setShowHeartAd] = useState(false);
  const [isResetting, setIsResetting] = useState(true);

  // Gamification & Progress
  const [progressData, setProgressData] = useState<any[]>([]);
  const [subjectTotals, setSubjectTotals] = useState<Record<string, number>>({});
  const [leaderboardTool, setLeaderboardTool] = useState<{ id: string, name: string } | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Organizations & Combos
  const [orgProfiles, setOrgProfiles] = useState<Record<string, any>>({});
  const [allDisplayCombos, setAllDisplayCombos] = useState<DisplayCombo[]>([]);

  // Accordion state for organization cards (collapsed by default)
  const [expandedOrgs, setExpandedOrgs] = useState<Record<string, boolean>>({});

  // Assignments & Modals
  const { assignments, refreshAssignments } = useStudentAssignments(profile.uid);
  const [orgAssignmentFilters, setOrgAssignmentFilters] = useState<Record<string, AssignmentStatus>>({});
  const [selectedAssignmentForModal, setSelectedAssignmentForModal] = useState<MergedAssignment | null>(null);

  // Accordion state for graded assignments grouped by subject
  const [expandedGradedSubjects, setExpandedGradedSubjects] = useState<Record<string, boolean>>({});

  // Course Preview Modal (Kortex Kourses)
  const [selectedProgramModal, setSelectedProgramModal] = useState<KortexCourse | null>(null);
  const [notifiedProgramIds, setNotifiedProgramIds] = useState<Record<string, boolean>>({});

  const isPro = profile.is_pro || (profile.org_ids && profile.org_ids.length > 0) || false;
  const proStatusText = profile.is_pro ? 'Parent Pro' : (profile.org_ids && profile.org_ids.length > 0 ? 'Organisation Pro' : null);

  // Sync Daily Energy
  useEffect(() => {
    async function initHearts() {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken(true);
        const result = await checkAndResetDailyHearts(token, profile.uid);
        if (result.success && result.hearts !== undefined) {
          setHearts(result.hearts);
        }
      } catch (e) {
        console.error("Failed to sync hearts:", e);
      } finally {
        setIsResetting(false);
      }
    }
    initHearts();
  }, [profile.uid]);

  // Load Organization Profiles & Assigned Combos
  useEffect(() => {
    async function loadOrgs() {
      if (!profile.org_ids || profile.org_ids.length === 0) {
        const b2c: DisplayCombo[] = (profile.active_b2c_licenses || []).map(comboStr => ({
          id: comboStr,
          label: comboStr,
          subject: comboStr.split('-').pop()?.trim().toUpperCase() || 'SUBJECT',
          orgId: 'independent',
          orgName: 'Independent'
        }));
        setAllDisplayCombos(b2c);
        return;
      }

      let orgData: Record<string, any> = {};
      const displayCombos: DisplayCombo[] = [];

      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const result = await getStudentOrgProfiles(token, profile.org_ids);
        if (result.success && result.orgProfiles) {
          orgData = result.orgProfiles;
        }
      } catch (e) {
        console.error("Failed to fetch org profiles", e);
      }

      for (const orgId of profile.org_ids) {
        try {
          const data = orgData[orgId];
          if (data) {
            const link = profile.org_links?.[orgId];
            if (link && link.status === 'approved') {
              const orgName = data.full_name || 'School';
              const allOrgCombos: string[] = data.approved_grade_subject_combos || [];
              
              const grade = link.grade || profile.grade;
              const section = link.section || profile.section;
              const defaultPrefix = `${grade} - Section ${section}`;
              const defaultCombos = allOrgCombos.filter(c => c.startsWith(defaultPrefix));
              const orgKortexId = data.kortex_id || '';

              // Defaults
              defaultCombos.forEach(comboStr => {
                const comboId = generateComboId(orgKortexId, comboStr);
                if (!displayCombos.some(c => c.id === comboId)) {
                  displayCombos.push({
                    id: comboId,
                    label: comboStr,
                    subject: comboStr.split('-').pop()?.trim().toUpperCase() || 'SUBJECT',
                    orgId: orgId,
                    orgName: orgName
                  });
                }
              });

              // Assigned Extras
              const extraIds = link.assigned_combos || [];
              extraIds.forEach((extId: string) => {
                if (!displayCombos.some(c => c.id === extId)) {
                  const foundStr = allOrgCombos.find(c => generateComboId(orgKortexId, c) === extId);
                  if (foundStr) {
                    displayCombos.push({
                      id: extId,
                      label: foundStr,
                      subject: foundStr.split('-').pop()?.trim().toUpperCase() || 'SUBJECT',
                      orgId: orgId,
                      orgName: orgName
                    });
                  }
                }
              });
            }
          }
        } catch (e) {
          console.error("Error parsing combos for org:", e);
        }
      }

      // Add B2C licenses
      (profile.active_b2c_licenses || []).forEach(comboStr => {
        if (!displayCombos.some(c => c.id === comboStr)) {
          displayCombos.push({
            id: comboStr,
            label: comboStr,
            subject: comboStr.split('-').pop()?.trim().toUpperCase() || 'SUBJECT',
            orgId: 'independent',
            orgName: 'Independent'
          });
        }
      });

      // Deduplicate
      const uniqueCombos: DisplayCombo[] = [];
      const seenComboIds = new Set<string>();
      for (const c of displayCombos) {
        if (!seenComboIds.has(c.id)) {
          seenComboIds.add(c.id);
          uniqueCombos.push(c);
        }
      }

      setOrgProfiles(orgData);
      setAllDisplayCombos(uniqueCombos);
    }

    loadOrgs();
  }, [profile]);

  // Load Curriculum Tool Totals
  useEffect(() => {
    async function loadTotals() {
      if (allDisplayCombos.length === 0) return;
      try {
        const res = await getCurriculumTotals();
        if (res.success && res.totals) {
          setSubjectTotals(res.totals);
        }
      } catch (e) {
        console.error("Error loading curriculum totals:", e);
      }
    }
    loadTotals();
  }, [allDisplayCombos]);

  // Real-time Progress Tracking
  useEffect(() => {
    if (!profile.uid) return;
    const unsubscribe = onSnapshot(collection(db, 'users', profile.uid, 'progress'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProgressData(data);
    });
    return () => unsubscribe();
  }, [profile.uid]);

  // Helpers
  const handleAdComplete = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await grantHeart(token, profile.uid);
      if (res.success) {
        setHearts(prev => Math.min(5, prev + 1));
      }
    } catch (e) {
      console.error("Failed to grant heart", e);
    } finally {
      setShowHeartAd(false);
      setShowEnergyModal(false);
    }
  };

  const handleActionClick = (tierId: string) => {
    if (!isPro && hearts <= 0) {
      setShowEnergyModal(true);
      return;
    }
    onExploreTier?.(tierId);
  };

  const handleMarkAsDone = async (assignmentId: string, orgId?: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await markAssignmentAsDone(token, assignmentId);
      if (res.success) {
        refreshAssignments();
        if (orgId) {
          setOrgAssignmentFilters(prev => ({ ...prev, [orgId]: 'submitted' }));
        }
      } else {
        alert("Failed to mark as done: " + res.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const toggleOrg = (orgId: string) => {
    setExpandedOrgs(prev => ({ ...prev, [orgId]: !prev[orgId] }));
  };

  const toggleGradedSubject = (key: string) => {
    setExpandedGradedSubjects(prev => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key]
    }));
  };

  const getSubjectColor = (combo: string) => {
    if (combo.includes('math')) return 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 hover:border-sky-300';
    if (combo.includes('eng')) return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300';
    if (combo.includes('sci')) return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300';
    return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:border-purple-300';
  };

  const formatSubjectName = (subj: string) => {
    if (!subj) return 'General';
    const clean = subj.trim();
    const up = clean.toUpperCase();
    if (up === 'MATH' || up === 'MATHEMATICS' || up === 'MATHS') return 'Mathematics';
    if (up === 'SCI' || up === 'SCIENCE') return 'Science';
    if (up === 'ENG' || up === 'ENGLISH') return 'English';
    if (up === 'HIN' || up === 'HINDI') return 'Hindi';
    if (up === 'SST' || up === 'SOCIAL') return 'Social Studies';
    if (up === 'COMP' || up === 'COMPUTER' || up === 'CODING') return 'Computer Science';
    return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  };

  const getTaskSubject = (task: MergedAssignment, combos: DisplayCombo[]): string => {
    // 1. Direct combo ID or label match with student's allotted combos
    if (task.comboId) {
      const match = combos.find(c => c.id === task.comboId || c.label === task.comboId);
      if (match) return match.subject;
    }

    // 2. Substring match on combo ID
    if (task.comboId) {
      const match = combos.find(c => task.comboId?.includes(c.id) || c.id.includes(task.comboId!));
      if (match) return match.subject;
    }

    // 3. If comboId has a dash, e.g. "Class 3-Math", "Grade 2 - Science"
    if (task.comboId && task.comboId.includes('-')) {
      const parsedSubj = task.comboId.split('-').pop()?.trim();
      if (parsedSubj) {
        const match = combos.find(c => c.subject.toLowerCase() === parsedSubj.toLowerCase());
        if (match) return match.subject;
        return parsedSubj;
      }
    }

    // 4. Keyword scan against task fields (title, link/toolId, chapterName, instructions)
    const searchCorpus = `${task.title || ''} ${task.link || ''} ${task.chapterName || ''} ${task.subject || ''} ${task.comboId || ''}`.toLowerCase();
    
    for (const c of combos) {
      const sName = c.subject.toLowerCase();
      if (searchCorpus.includes(sName)) {
        return c.subject;
      }
    }

    // Domain keyword checks mapped back to allotted combos
    if (searchCorpus.includes('math') || searchCorpus.includes('ganit') || searchCorpus.includes('add') || searchCorpus.includes('subtr') || searchCorpus.includes('mult') || searchCorpus.includes('div') || searchCorpus.includes('fraction') || searchCorpus.includes('geometry') || searchCorpus.includes('algebra') || searchCorpus.includes('number') || searchCorpus.includes('count')) {
      const mathCombo = combos.find(c => c.subject.toLowerCase().includes('math'));
      if (mathCombo) return mathCombo.subject;
      return 'MATH';
    }

    if (searchCorpus.includes('sci') || searchCorpus.includes('science') || searchCorpus.includes('evs') || searchCorpus.includes('plant') || searchCorpus.includes('animal') || searchCorpus.includes('solar') || searchCorpus.includes('space') || searchCorpus.includes('earth') || searchCorpus.includes('energy')) {
      const sciCombo = combos.find(c => c.subject.toLowerCase().includes('sci') || c.subject.toLowerCase().includes('evs'));
      if (sciCombo) return sciCombo.subject;
      return 'SCIENCE';
    }

    if (searchCorpus.includes('eng') || searchCorpus.includes('english') || searchCorpus.includes('phon') || searchCorpus.includes('read') || searchCorpus.includes('gram') || searchCorpus.includes('story') || searchCorpus.includes('vocab')) {
      const engCombo = combos.find(c => c.subject.toLowerCase().includes('eng'));
      if (engCombo) return engCombo.subject;
      return 'ENGLISH';
    }

    if (searchCorpus.includes('hindi')) {
      const hinCombo = combos.find(c => c.subject.toLowerCase().includes('hindi'));
      if (hinCombo) return hinCombo.subject;
      return 'HINDI';
    }

    // 5. If organization only has 1 allotted subject, assign all tasks to it
    if (combos.length === 1) {
      return combos[0].subject;
    }

    // 6. Check allDisplayCombos across other orgs or B2C
    if (task.comboId) {
      const globalMatch = allDisplayCombos.find(c => c.id === task.comboId || c.label === task.comboId);
      if (globalMatch) return globalMatch.subject;
    }

    // Fallback: If student has combos, default to first combo or 'General'
    return combos[0]?.subject || 'General';
  };

  // Scoped Assignment Filter for a given organization
  const getOrgAssignments = (orgId: string, kortexId?: string) => {
    return assignments.filter(a => {
      if (a.orgId && a.orgId === orgId) return true;
      if (kortexId && a.comboId && a.comboId.startsWith(kortexId)) return true;
      return false;
    });
  };

  const activeOrgs = (profile.org_ids || []).filter(orgId => {
    const link = profile.org_links?.[orgId];
    return link && link.status === 'approved';
  });

  // Dynamically resolve student grade (org grade > profile grade > fallback)
  const resolvedGrade = (() => {
    for (const orgId of activeOrgs) {
      const orgGrade = profile.org_links?.[orgId]?.grade;
      if (orgGrade && orgGrade !== 'Unassigned') {
        const section = profile.org_links?.[orgId]?.section;
        return section ? `${orgGrade} (${section})` : orgGrade;
      }
    }
    if (profile.grade && profile.grade !== 'Unassigned') {
      return profile.section ? `${profile.grade} (${profile.section})` : profile.grade;
    }
    return 'Independent Learner';
  })();

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8 animate-fade-in relative">
      
      {/* ---------------------------------------------------- */}
      {/* 1. COMPACT MOBILE-FIRST GAMIFIED HERO BANNER         */}
      {/* ---------------------------------------------------- */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Greeting & Identity */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-black uppercase tracking-wider mb-1.5">
              <Sparkles size={13} className="text-yellow-300" />
              <span>Student Realm · {resolvedGrade}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Hello, {profile.full_name}! 👋
            </h1>
            <p className="text-purple-100 text-xs sm:text-sm font-medium mt-0.5">
              Ready to explore lessons, complete homework, and level up today?
            </p>
          </div>

          {/* Gamified Stat Bar (4 Touch-Friendly Pills) */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5">
            
            {/* Stamina / Hearts */}
            <button 
              type="button"
              onClick={() => {
                if (!isPro && hearts < 5) setShowEnergyModal(true);
              }}
              className="flex items-center gap-2 bg-black/25 hover:bg-black/35 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10 transition-all text-left"
            >
              <Heart size={18} className={isPro ? "text-yellow-300 fill-yellow-300" : "text-rose-400 fill-rose-400"} />
              <div>
                <div className="text-[10px] text-purple-200 font-extrabold uppercase leading-none">Energy</div>
                <div className="font-black text-sm text-white leading-tight mt-0.5">
                  {proStatusText ? 'Unlimited' : `${hearts}/5`}
                </div>
              </div>
            </button>

            {/* Streak */}
            <div className="flex items-center gap-2 bg-black/25 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
              <Flame size={18} className="text-amber-400 fill-amber-400" />
              <div>
                <div className="text-[10px] text-purple-200 font-extrabold uppercase leading-none">Streak</div>
                <div className="font-black text-sm text-white leading-tight mt-0.5">
                  {profile.current_streak_days || 0} Days
                </div>
              </div>
            </div>

            {/* Total XP */}
            <div className="flex items-center gap-2 bg-black/25 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
              <Star size={18} className="text-sky-300 fill-sky-300" />
              <div>
                <div className="text-[10px] text-purple-200 font-extrabold uppercase leading-none">Total XP</div>
                <div className="font-black text-sm text-white leading-tight mt-0.5">
                  {profile.total_xp || 0} XP
                </div>
              </div>
            </div>

            {/* Badges Earned */}
            <div className="flex items-center gap-2 bg-black/25 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
              <Trophy size={18} className="text-yellow-300 fill-yellow-300" />
              <div>
                <div className="text-[10px] text-purple-200 font-extrabold uppercase leading-none">Badges</div>
                <div className="font-black text-sm text-white leading-tight mt-0.5">
                  {profile.achievements?.length || 0} Badges
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. ORGANIZATION-SCOPED SECTIONS (COLLAPSIBLE)        */}
      {/* ---------------------------------------------------- */}
      {activeOrgs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2">
              <Building2 className="text-indigo-600" size={20} />
              My School & Institutions
            </h2>
            <span className="text-xs font-bold text-slate-400">
              {activeOrgs.length} {activeOrgs.length === 1 ? 'School Linked' : 'Schools Linked'}
            </span>
          </div>

          <div className="space-y-4">
            {activeOrgs.map(orgId => {
              const orgData = orgProfiles[orgId] || {};
              const orgName = orgData.full_name || 'School';
              const orgAddress = orgData.address ? `, ${orgData.address}` : '';
              const fullHeaderTitle = `${orgName}${orgAddress}`;
              const isExpanded = !!expandedOrgs[orgId];

              // Scoped assignments for this org
              const orgAssignments = getOrgAssignments(orgId, orgData.kortex_id);
              const pendingAssignments = orgAssignments.filter(a => a.status === 'pending');
              const pendingCount = pendingAssignments.length;
              const submittedCount = orgAssignments.filter(a => a.status === 'submitted').length;
              const gradedCount = orgAssignments.filter(a => a.status === 'graded').length;

              // Current tab filter for this org (default: pending)
              const currentFilter = orgAssignmentFilters[orgId] || 'pending';
              const filteredList = orgAssignments.filter(a => a.status === currentFilter);

              // Scoped subjects for this org
              const orgCombos = allDisplayCombos.filter(c => c.orgId === orgId);
              const link = profile.org_links?.[orgId];
              const studentGrade = link?.grade || profile.grade || 'N/A';
              const studentSection = link?.section || profile.section || 'N/A';
              const studentRollNo = link?.roll_no || 'N/A';

              return (
                <div 
                  key={orgId} 
                  className="bg-white border-2 border-slate-100 hover:border-slate-200 rounded-3xl shadow-xs transition-all overflow-hidden"
                >
                  {/* Collapsible Accordion Header */}
                  <button
                    type="button"
                    onClick={() => toggleOrg(orgId)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left transition-colors hover:bg-slate-50/80 rounded-3xl"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
                        <Building2 size={22} className="sm:w-6 sm:h-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-800 text-base sm:text-lg leading-snug truncate sm:whitespace-normal">
                          {fullHeaderTitle}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mt-0.5">
                          <span>Grade: <strong className="text-slate-700">{studentGrade}</strong></span>
                          <span>•</span>
                          <span>Sec: <strong className="text-slate-700">{studentSection}</strong></span>
                          {studentRollNo !== 'N/A' && (
                            <>
                              <span>•</span>
                              <span>Roll No: <strong className="text-slate-700">{studentRollNo}</strong></span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 ml-2">
                      {/* Notification circle badge for pending assignments */}
                      {pendingCount > 0 && (
                        <div 
                          title={`${pendingCount} pending assignment${pendingCount > 1 ? 's' : ''}`}
                          className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-500 text-white font-black text-xs shadow-md shadow-rose-200 animate-pulse shrink-0"
                        >
                          {pendingCount}
                        </div>
                      )}
                      
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center transition-transform">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Accordion Body */}
                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-100 space-y-6 animate-in slide-in-from-top-2">
                      
                      {/* 1. Scoped Assignments */}
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                          <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <ClipboardList size={18} className="text-indigo-600" />
                            Assignments ({orgAssignments.length})
                          </h4>

                          {/* Filter Tabs */}
                          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                            {(['pending', 'submitted', 'graded'] as AssignmentStatus[]).map(status => {
                              const count = status === 'pending' ? pendingCount : status === 'submitted' ? submittedCount : gradedCount;
                              const isActive = currentFilter === status;
                              return (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => setOrgAssignmentFilters(prev => ({ ...prev, [orgId]: status }))}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all flex items-center gap-1.5 ${
                                    isActive ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                                  }`}
                                >
                                  <span>{status}</span>
                                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                    isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {currentFilter === 'graded' ? (
                          filteredList.length > 0 ? (
                            <div className="space-y-3">
                              {(() => {
                                // 1. Group all graded tasks into their allotted subjects using getTaskSubject
                                const tasksBySubjectMap: Record<string, MergedAssignment[]> = {};
                                
                                // Initialize allotted subjects
                                orgCombos.forEach(c => {
                                  if (!tasksBySubjectMap[c.subject]) {
                                    tasksBySubjectMap[c.subject] = [];
                                  }
                                });

                                // Distribute each task to its resolved subject
                                filteredList.forEach(task => {
                                  const resolvedSubj = getTaskSubject(task, orgCombos);
                                  if (!tasksBySubjectMap[resolvedSubj]) {
                                    tasksBySubjectMap[resolvedSubj] = [];
                                  }
                                  tasksBySubjectMap[resolvedSubj].push(task);
                                });

                                // Sort so subjects with graded tasks appear first
                                const subjectKeys = Object.keys(tasksBySubjectMap).sort((a, b) => {
                                  const countDiff = tasksBySubjectMap[b].length - tasksBySubjectMap[a].length;
                                  if (countDiff !== 0) return countDiff;
                                  return a.localeCompare(b);
                                });

                                return subjectKeys.map(subj => {
                                  const subjectTasks = tasksBySubjectMap[subj];
                                  const displayTitle = formatSubjectName(subj);
                                  const subjectKey = `${orgId}_${subj}`;
                                  // Default open if there are tasks and user hasn't explicitly collapsed
                                  const isExpanded = expandedGradedSubjects[subjectKey] !== false;

                                  return (
                                    <div 
                                      key={subjectKey}
                                      className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-2xs transition-all"
                                    >
                                      {/* Subject Accordion Header */}
                                      <div
                                        onClick={() => toggleGradedSubject(subjectKey)}
                                        className="p-3.5 sm:p-4 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between cursor-pointer transition-colors"
                                      >
                                        <div className="flex items-center gap-2.5">
                                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                                            <BookOpen size={16} />
                                          </div>
                                          <div>
                                            <span className="font-extrabold text-sm text-slate-900">{displayTitle}</span>
                                            <div className="text-[11px] font-semibold text-slate-400">
                                              {subjectTasks.length} {subjectTasks.length === 1 ? 'task' : 'tasks'} evaluated
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                                            subjectTasks.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                          }`}>
                                            {subjectTasks.length} Graded
                                          </span>
                                          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-2xs">
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Subject Graded Task Rows */}
                                      {isExpanded && (
                                        <div className="p-3 sm:p-4 bg-slate-50/30 border-t border-slate-100">
                                          {subjectTasks.length > 0 ? (
                                            <div className="space-y-2">
                                              {subjectTasks.map(task => (
                                                <div
                                                  key={task.id}
                                                  onClick={() => setSelectedAssignmentForModal(task)}
                                                  className="p-3 sm:p-4 bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-indigo-300 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group shadow-2xs"
                                                >
                                                  <div className="flex items-start sm:items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                                                      <Award size={18} />
                                                    </div>
                                                    <div>
                                                      <h6 className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                        {task.title}
                                                      </h6>
                                                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-semibold mt-0.5">
                                                        <span>Due: {task.dueDate}</span>
                                                        {task.submittedDate && (
                                                          <>
                                                            <span>•</span>
                                                            <span className="text-slate-500 font-bold">Completed: {task.submittedDate}</span>
                                                          </>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>

                                                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                                                    {/* Score Badge */}
                                                    <div className="bg-emerald-50 border border-emerald-200/80 text-emerald-800 font-black text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                                      <span className="opacity-75 text-[10px] uppercase">Score:</span>
                                                      <span className="text-sm font-black text-emerald-600">
                                                        {task.score !== undefined && task.score !== null ? `${task.score}/${task.totalPoints || 100}` : (task.grade || 'Graded')}
                                                      </span>
                                                    </div>

                                                    {/* Action Button */}
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedAssignmentForModal(task);
                                                      }}
                                                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                                    >
                                                      <span>Review & Practice</span>
                                                      <ArrowRight size={12} />
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="text-xs font-semibold text-slate-400 text-center py-3">
                                              No graded assignments in {displayTitle} yet.
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          ) : (
                            <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                              <p className="text-xs sm:text-sm font-bold text-slate-500">
                                No graded assignments yet from {orgName}.
                              </p>
                            </div>
                          )
                        ) : (
                          /* Pending & Submitted Card Grid */
                          filteredList.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {filteredList.map(task => (
                                <div
                                  key={task.id}
                                  onClick={() => setSelectedAssignmentForModal(task)}
                                  className="bg-white border-2 border-slate-100 hover:border-indigo-200 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between cursor-pointer group"
                                >
                                  <div>
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-black rounded-md text-[10px] uppercase tracking-wider">
                                        {formatSubjectName(getTaskSubject(task, orgCombos))}
                                      </span>
                                      {task.status === 'pending' && (
                                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                                          <CircleDashed size={13} /> Due: {task.dueDate}
                                        </span>
                                      )}
                                    </div>
                                    <h5 className="font-extrabold text-slate-800 text-base leading-snug mb-1.5 group-hover:text-indigo-600 transition-colors">
                                      {task.title}
                                    </h5>
                                    {task.instructions && (
                                      <p className="text-xs text-slate-500 font-semibold line-clamp-2 mb-3">
                                        {task.instructions}
                                      </p>
                                    )}
                                  </div>

                                  <div className="mt-3 border-t border-slate-100 pt-3 flex items-center justify-between">
                                    <span className="text-xs font-black text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                                      View Task →
                                    </span>
                                    {task.status === 'submitted' && (
                                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                                        <CheckCircle2 size={13} /> Submitted
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                              <p className="text-xs sm:text-sm font-bold text-slate-500">
                                {currentFilter === 'pending'
                                  ? `🎉 Awesome! No pending homework from ${orgName}.`
                                  : `No ${currentFilter} assignments to show.`}
                              </p>
                            </div>
                          )
                        )}
                      </div>

                      {/* 2. Scoped Subjects for this Org */}
                      <div>
                        <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-3">
                          <Book size={18} className="text-sky-600" />
                          My Subjects ({orgCombos.length})
                        </h4>

                        {orgCombos.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {orgCombos.map((comboObj, idx) => {
                              const subjectName = comboObj.subject;
                              const colorClasses = getSubjectColor(comboObj.label.toLowerCase());

                              const parts = comboObj.label.split('-');
                              const cGrade = parts.length > 0 ? parts[0].trim().toLowerCase() : 'unknown_grade';
                              const cSubj = comboObj.subject.toLowerCase();
                              const cKey = `${cGrade}_${cSubj}`;

                              const subjProgress = progressData.find(p => {
                                if (!p.id) return false;
                                const pId = p.id.toLowerCase();
                                return pId === cKey || pId === cSubj || pId === `all grades_${cSubj}`;
                              });
                              const completedCount = subjProgress?.completed_tools ? Object.keys(subjProgress.completed_tools).length : 0;
                              const totalTools = subjectTotals[cKey] || subjectTotals[`all grades_${cSubj}`] || 0;
                              const progressPct = totalTools > 0 ? Math.min(100, Math.round((completedCount / totalTools) * 100)) : 0;

                              return (
                                <div
                                  key={`${comboObj.id}_${idx}`}
                                  onClick={() => handleActionClick(`lessons:${comboObj.label}`)}
                                  className={`border-2 rounded-2xl p-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between ${colorClasses}`}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div>
                                      <h5 className="text-lg font-black tracking-tight">{subjectName}</h5>
                                      <p className="text-[10px] font-bold opacity-75 uppercase tracking-wider">{comboObj.label}</p>
                                    </div>
                                    <div className="w-9 h-9 bg-white/60 rounded-xl flex items-center justify-center backdrop-blur-xs">
                                      <BookOpen size={18} />
                                    </div>
                                  </div>

                                  <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider opacity-80">
                                      <span>{completedCount} / {totalTools} Tools</span>
                                      <span>{progressPct}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
                                      <div className="h-full bg-current rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                            <p className="text-xs font-bold text-slate-500">
                              No subjects assigned yet by this school.
                            </p>
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. KORTEX KOURSES (SPECIALIZED PROGRAMS CAROUSEL)    */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white/80 backdrop-blur-xs border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 border border-amber-200/70 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-800 mb-1">
              <Sparkles size={12} className="text-amber-500" />
              <span>Specialized Skill Tracks</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <Rocket className="text-indigo-600" size={20} />
              Kortex Kourses
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Cross-grade mastery in Coding, Robotics, Vedic Math, Space & Olympiad logic
            </p>
          </div>

          {/* Explore All Button */}
          <button
            type="button"
            onClick={() => onExploreTier?.('kourses')}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-colors shrink-0 w-fit cursor-pointer shadow-2xs"
          >
            <span>Explore All Kourses</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Horizontal Sliding Program Carousel */}
        <div className="flex gap-4 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory scroll-smooth -mx-3 px-3 sm:mx-0 sm:px-0">
          {KORTEX_COURSES.map(course => (
            <div
              key={course.id}
              onClick={() => setSelectedProgramModal(course)}
              className="snap-start shrink-0 w-[275px] sm:w-[295px] bg-white border-2 border-slate-100 hover:border-indigo-300 rounded-3xl overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              {/* Visual Header Banner */}
              <div className={`h-24 w-full bg-gradient-to-br ${course.color} p-3.5 flex flex-col justify-between relative overflow-hidden`}>
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/95 text-slate-800 backdrop-blur-xs shadow-2xs">
                    {course.category}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-black/30 text-white backdrop-blur-xs border border-white/20">
                    {course.gradeGroup}
                  </span>
                </div>
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform">
                    {course.icon}
                  </span>
                  <span className="text-[10px] font-extrabold text-white/90 bg-black/25 px-2 py-0.5 rounded-md backdrop-blur-xs">
                    {course.estimatedWeeks} WEEKS
                  </span>
                </div>
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/15 rounded-full blur-sm pointer-events-none" />
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors mb-1">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold line-clamp-2 mb-3">
                    {course.tagline}
                  </p>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Preview Kourse <ArrowUpRight size={14} />
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. GLOBAL EXPLORATION HUB (4 CLASSIC BUTTONS)        */}
      {/* ---------------------------------------------------- */}
      <div className={isResetting ? "opacity-50 pointer-events-none" : ""}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2">
            <Play className="text-rose-500" size={20} />
            Jump Into Learning & Games
          </h2>
          <span className="text-xs font-bold text-slate-400">Interactive Arena</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Card 1: All Lessons */}
          <div 
            onClick={() => handleActionClick('lessons')}
            className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all cursor-pointer group ${
              !isPro && hearts <= 0 
                ? 'bg-slate-50 border-slate-200 opacity-70 grayscale' 
                : 'bg-sky-50 hover:bg-sky-100 border-sky-200 hover:-translate-y-1 hover:shadow-md text-sky-900'
            }`}
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform ${
              !isPro && hearts <= 0 ? 'bg-slate-300 text-slate-500' : 'bg-sky-500 text-white group-hover:scale-105'
            }`}>
              <BookOpen size={22} />
            </div>
            <h3 className="font-black text-base sm:text-lg mb-0.5 leading-tight">All Lessons</h3>
            <p className="text-[11px] sm:text-xs font-semibold opacity-75">Browse full curriculum catalog</p>
          </div>

          {/* Card 2: Sandbox */}
          <div 
            onClick={() => handleActionClick('conceptualiser')}
            className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all cursor-pointer group ${
              !isPro && hearts <= 0 
                ? 'bg-slate-50 border-slate-200 opacity-70 grayscale' 
                : 'bg-purple-50 hover:bg-purple-100 border-purple-200 hover:-translate-y-1 hover:shadow-md text-purple-900'
            }`}
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform ${
              !isPro && hearts <= 0 ? 'bg-slate-300 text-slate-500' : 'bg-purple-500 text-white group-hover:scale-105'
            }`}>
              <Lightbulb size={22} />
            </div>
            <h3 className="font-black text-base sm:text-lg mb-0.5 leading-tight">Interactive Sandbox</h3>
            <p className="text-[11px] sm:text-xs font-semibold opacity-75">Virtual models & math machines</p>
          </div>

          {/* Card 3: The Dojo */}
          <div 
            onClick={() => handleActionClick('dojo')}
            className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all cursor-pointer group ${
              !isPro && hearts <= 0 
                ? 'bg-slate-50 border-slate-200 opacity-70 grayscale' 
                : 'bg-orange-50 hover:bg-orange-100 border-orange-200 hover:-translate-y-1 hover:shadow-md text-orange-900'
            }`}
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform ${
              !isPro && hearts <= 0 ? 'bg-slate-300 text-slate-500' : 'bg-orange-500 text-white group-hover:scale-105'
            }`}>
              <Target size={22} />
            </div>
            <h3 className="font-black text-base sm:text-lg mb-0.5 leading-tight">The Dojo</h3>
            <p className="text-[11px] sm:text-xs font-semibold opacity-75">Speed quiz sprints & skill tests</p>
          </div>

          {/* Card 4: Arcade */}
          <div 
            onClick={() => handleActionClick('arcade')}
            className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all cursor-pointer group ${
              !isPro && hearts <= 0 
                ? 'bg-slate-50 border-slate-200 opacity-70 grayscale' 
                : 'bg-lime-50 hover:bg-lime-100 border-lime-200 hover:-translate-y-1 hover:shadow-md text-lime-900'
            }`}
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform ${
              !isPro && hearts <= 0 ? 'bg-slate-300 text-slate-500' : 'bg-lime-500 text-white group-hover:scale-105'
            }`}>
              <Gamepad2 size={22} />
            </div>
            <h3 className="font-black text-base sm:text-lg mb-0.5 leading-tight">Kortex Arcade</h3>
            <p className="text-[11px] sm:text-xs font-semibold opacity-75">Gamified learning mini-challenges</p>
          </div>

        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 5. MODALS & POP-UPS                                  */}
      {/* ---------------------------------------------------- */}

      {/* ASSIGNMENT INSTRUCTION MODAL */}
      {selectedAssignmentForModal && (
      <ModalPortal>
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col relative max-h-[90vh] overflow-y-auto">
            <button 
              type="button"
              onClick={() => setSelectedAssignmentForModal(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold rounded-full text-xs uppercase tracking-wider">
                {formatSubjectName(getTaskSubject(selectedAssignmentForModal, allDisplayCombos))}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                selectedAssignmentForModal.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                selectedAssignmentForModal.status === 'submitted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                'bg-purple-50 text-purple-700 border border-purple-200'
              }`}>
                {selectedAssignmentForModal.status}
              </span>
            </div>

            <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2 pr-6">
              {selectedAssignmentForModal.title}
            </h3>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-6 pb-4 border-b border-slate-100">
              <Calendar size={14} className="text-slate-400" />
              <span>Due: <strong className="text-slate-700">{selectedAssignmentForModal.dueDate}</strong></span>
              {selectedAssignmentForModal.totalPoints && (
                <span className="ml-auto text-indigo-600 font-black">
                  Total Points: {selectedAssignmentForModal.totalPoints}
                </span>
              )}
            </div>

            <div className="mb-6">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <ClipboardList size={16} className="text-indigo-500" /> Instructions from Teacher
              </h4>
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 text-slate-700 text-sm font-semibold leading-relaxed whitespace-pre-line">
                {selectedAssignmentForModal.instructions && selectedAssignmentForModal.instructions.trim().length > 0
                  ? selectedAssignmentForModal.instructions
                  : "Please review the learning material and complete the assignment carefully."}
              </div>
            </div>

            {selectedAssignmentForModal.status === 'graded' && (
              <div className="mb-6 space-y-3">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Teacher Grade</span>
                    <div className="text-lg font-black text-emerald-900">{selectedAssignmentForModal.grade || 'Completed'}</div>
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    {selectedAssignmentForModal.score}/{selectedAssignmentForModal.totalPoints}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-600 font-semibold leading-relaxed">
                  <Sparkles size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Practice Mode:</strong> You can practice this assignment again at any time to revise and earn XP. Because this assignment has already been evaluated by your teacher, your graded score is permanent and will not change.
                  </span>
                </div>
              </div>
            )}

            <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              {selectedAssignmentForModal.status === 'pending' ? (
                <>
                  {selectedAssignmentForModal.externalLink ? (
                    <>
                      <button
                        type="button"
                        onClick={() => window.open(selectedAssignmentForModal.externalLink, '_blank')}
                        className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <ExternalLink size={16} /> Open Activity Link
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const task = selectedAssignmentForModal;
                          setSelectedAssignmentForModal(null);
                          await handleMarkAsDone(task.id, task.orgId);
                        }}
                        className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 size={16} /> Mark Done
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const task = selectedAssignmentForModal;
                        setSelectedAssignmentForModal(null);
                        if (onExploreTier) {
                          onExploreTier(`play_tool:${task.link}`);
                        }
                      }}
                      className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Play size={18} fill="currentColor" /> Start Learning Now
                    </button>
                  )}
                </>
              ) : (
                <>
                  {selectedAssignmentForModal.externalLink ? (
                    <button
                      type="button"
                      onClick={() => window.open(selectedAssignmentForModal.externalLink, '_blank')}
                      className="flex-1 py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ExternalLink size={16} /> View Activity Link
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const task = selectedAssignmentForModal;
                        setSelectedAssignmentForModal(null);
                        if (onExploreTier) {
                          onExploreTier(`play_tool:${task.link}`);
                        }
                      }}
                      className="flex-1 py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play size={16} fill="currentColor" /> Practice Again
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedAssignmentForModal(null)}
                    className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm rounded-xl transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* COURSE PREVIEW & COMING SOON MODAL */}
      {selectedProgramModal && (
      <ModalPortal>
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button 
              type="button"
              onClick={() => setSelectedProgramModal(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl p-2 bg-slate-50 rounded-2xl border border-slate-100 shadow-2xs">
                {selectedProgramModal.icon}
              </span>
              <div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${selectedProgramModal.badgeColor}`}>
                  {selectedProgramModal.gradeGroup}
                </span>
                <h3 className="text-xl font-black text-slate-900 leading-snug mt-1">
                  {selectedProgramModal.title}
                </h3>
              </div>
            </div>

            <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
              {selectedProgramModal.description}
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5">
                Key Learning Outcomes
              </h4>
              <ul className="space-y-2">
                {selectedProgramModal.learningOutcomes.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs font-bold text-slate-700">
                    <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {selectedProgramModal.capstoneProject && (
              <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3.5 mb-5">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-800 mb-1 flex items-center gap-1.5">
                  <Trophy size={13} className="text-amber-600" />
                  <span>Capstone Project: {selectedProgramModal.capstoneProject.title}</span>
                </div>
                <p className="text-xs font-semibold text-amber-900/80 leading-relaxed">
                  {selectedProgramModal.capstoneProject.description}
                </p>
              </div>
            )}

            {notifiedProgramIds[selectedProgramModal.id] ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-black text-sm">
                  <CheckCircle2 size={18} /> Request Sent!
                </div>
                <p className="text-xs text-emerald-600 font-semibold">
                  We have registered your interest. Your parent will be notified once this course is ready!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedProgramModal.id;
                    setNotifiedProgramIds(prev => ({ ...prev, [id]: true }));
                  }}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Bell size={16} /> Notify My Parent / Request Access
                </button>
                <p className="text-[11px] text-center text-slate-400 font-semibold">
                  This specialized course is launching soon on Kortex Klassroom.
                </p>
              </div>
            )}
          </div>
        </div>
      </ModalPortal>
      )}

      {/* OUT OF ENERGY MODAL */}
      {showEnergyModal && (
      <ModalPortal>
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center px-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] max-w-md w-full shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="bg-slate-50 border-b border-slate-100 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <button onClick={() => setShowEnergyModal(false)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm">
                  <X size={18} />
                </button>
              </div>
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                <BatteryCharging size={36} className="text-slate-400" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Out of Energy!</h2>
              <p className="text-slate-500 font-bold">You've practiced a lot today! You need time to recharge your brain.</p>
            </div>
            <div className="p-8 text-center space-y-4">
              <p className="text-sm font-semibold text-slate-600">
                Come back tomorrow for more Free Energy, or ask your parents to unlock <span className="font-black text-sky-600">Unlimited Play</span>!
              </p>
              <button 
                onClick={() => setShowHeartAd(true)}
                className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 mb-3 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Heart size={20} className="fill-white" />
                Watch ad for 1 Heart
              </button>
              <button 
                onClick={() => setShowEnergyModal(false)}
                className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                Okay, I'll take a break!
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* REWARDED AD */}
      {showHeartAd && (
        <PlaceholderAd 
          type="rewarded"
          onComplete={handleAdComplete} 
          onSkip={handleAdComplete} 
        />
      )}

      {/* LEADERBOARD MODAL */}
      {leaderboardTool && (
      <ModalPortal>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-sky-500 p-6 flex items-center justify-between text-white shrink-0">
              <div>
                <h3 className="text-xl font-black flex items-center gap-2"><Trophy size={20}/> Leaderboard</h3>
                <p className="text-sky-100 text-xs font-bold mt-1">{leaderboardTool.name}</p>
              </div>
              <button onClick={() => setLeaderboardTool(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh] bg-slate-50">
              {loadingLeaderboard ? (
                <div className="text-center py-10 text-slate-400 font-bold animate-pulse">Loading scores...</div>
              ) : leaderboardData.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-bold">No scores yet! Be the first!</div>
              ) : (
                <div className="space-y-3">
                  {leaderboardData.map((entry, index) => (
                    <div key={entry.id} className={`flex items-center justify-between p-4 rounded-2xl border-2 ${entry.id === profile.uid ? 'bg-sky-50 border-sky-200' : 'bg-white border-slate-100'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-600' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                          {index + 1}
                        </div>
                        <p className={`font-bold ${entry.id === profile.uid ? 'text-sky-700' : 'text-slate-700'}`}>
                          {entry.id === profile.uid ? 'You' : entry.student_name}
                        </p>
                      </div>
                      <div className="font-black text-lg text-emerald-600">{entry.score}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </ModalPortal>
      )}

    </div>
  );
}
