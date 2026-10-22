"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../backend_configurations/firebase';
import { 
  CheckCircle, Plus, Edit3, Trash2, Clock, XCircle, Search, Filter, 
  ArrowUpDown, ArrowUp, ArrowDown, Users, Heart, Sparkles, BookOpen, 
  Layers, RefreshCw, Check, X, AlertCircle, ChevronDown, ChevronUp, Eye
} from 'lucide-react';
import { ALL_CATALOG_COURSES, CatalogCourse, MasterCategory, CourseStatus } from '../../kortex_landing_page/courseCatalogConfig';
import { getAdminCoursesData, updateCourseStatusAndPricing } from '../../app/actions/admin';

export default function ContentApprovals() {
  // Course Management State
  const [courses, setCourses] = useState<CatalogCourse[]>(ALL_CATALOG_COURSES);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [savingCourseId, setSavingCourseId] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<CatalogCourse | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pricingFilter, setPricingFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof CatalogCourse>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Edit Modal Form State
  const [formTitle, setFormTitle] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formStatus, setFormStatus] = useState<CourseStatus>('coming_soon');
  const [formIsFree, setFormIsFree] = useState(true);
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formDescription, setFormDescription] = useState('');

  // Legacy Krew Queue State
  const [showKrewQueue, setShowKrewQueue] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [requestHistory, setRequestHistory] = useState<any[]>([]);
  const [loadingKrew, setLoadingKrew] = useState(false);

  // Fetch live courses data with overrides & registration counts
  const loadCoursesData = async () => {
    setLoadingCourses(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        setCourses(ALL_CATALOG_COURSES);
        return;
      }
      const res = await getAdminCoursesData(idToken);
      if (res.success && res.courses) {
        setCourses(res.courses);
      } else {
        console.warn("Could not load admin courses data:", res.error);
        setCourses(ALL_CATALOG_COURSES);
      }
    } catch (err: any) {
      console.error("Error loading courses:", err);
      setCourses(ALL_CATALOG_COURSES);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Fetch Krew content requests
  const fetchKrewRequests = async () => {
    setLoadingKrew(true);
    try {
      const q = query(collection(db, 'content_requests'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const allReqs = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as { 
        id: string; status: string; [key: string]: any; 
      }));
      setPendingRequests(allReqs.filter(req => req.status === 'pending'));
      setRequestHistory(allReqs.filter(req => req.status !== 'pending'));
    } catch (error: any) { 
      console.error("Firebase admin requests error:", error); 
    } finally { 
      setLoadingKrew(false); 
    }
  };

  useEffect(() => {
    loadCoursesData();
    fetchKrewRequests();
  }, []);

  // Show temporary toast notification
  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Open Edit Modal
  const handleOpenEdit = (course: CatalogCourse) => {
    setEditingCourse(course);
    setFormTitle(course.title || '');
    setFormTagline(course.tagline || '');
    setFormStatus(course.status || 'coming_soon');
    setFormIsFree(course.isFree !== undefined ? course.isFree : true);
    setFormPrice(course.price || 0);
    setFormDescription(course.description || '');
  };

  // Save Modal Edits
  const handleSaveEdit = async () => {
    if (!editingCourse) return;
    setSavingCourseId(editingCourse.id);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Authentication required.");

      const updates = {
        title: formTitle.trim(),
        tagline: formTagline.trim(),
        status: formStatus,
        isFree: formIsFree,
        price: formIsFree ? 0 : Number(formPrice) || 0,
        description: formDescription.trim()
      };

      const res = await updateCourseStatusAndPricing(idToken, editingCourse.id, updates);
      if (!res.success) throw new Error(res.error || "Failed to update course.");

      // Update local state immediately
      setCourses(prev => prev.map(c => {
        if (c.id === editingCourse.id) {
          return {
            ...c,
            ...updates,
            updatedAt: new Date().toISOString()
          };
        }
        return c;
      }));

      notify('success', `Course "${formTitle}" updated successfully!`);
      setEditingCourse(null);
    } catch (err: any) {
      notify('error', err.message || "Failed to save course.");
    } finally {
      setSavingCourseId(null);
    }
  };

  // Quick Toggle Status between 'active' and 'coming_soon'
  const handleQuickToggleStatus = async (course: CatalogCourse) => {
    const nextStatus: CourseStatus = course.status === 'active' ? 'coming_soon' : 'active';
    const actionLabel = nextStatus === 'active' ? 'publish LIVE' : 'set to COMING SOON';
    
    if (!window.confirm(`Are you sure you want to ${actionLabel} "${course.title}"?`)) {
      return;
    }

    setSavingCourseId(course.id);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Authentication required.");

      const res = await updateCourseStatusAndPricing(idToken, course.id, {
        status: nextStatus
      });

      if (!res.success) throw new Error(res.error || "Failed to toggle status.");

      setCourses(prev => prev.map(c => {
        if (c.id === course.id) {
          return { ...c, status: nextStatus, updatedAt: new Date().toISOString() };
        }
        return c;
      }));

      notify('success', `"${course.title}" is now ${nextStatus === 'active' ? 'LIVE 🚀' : 'COMING SOON ⏳'}`);
    } catch (err: any) {
      notify('error', err.message || "Failed to update status.");
    } finally {
      setSavingCourseId(null);
    }
  };

  // Handle Legacy Krew Request Actions
  const handleKrewRequestAction = async (request: any, actionStatus: string) => {
    const isApproved = actionStatus === 'APPROVED';
    if (!window.confirm(`Are you sure you want to ${isApproved ? 'APPROVE' : 'REJECT'} this request?`)) return;
    
    try {
      const adminEmail = auth.currentUser?.email || 'Admin';
      const requestRef = doc(db, 'content_requests', request.id);
      
      const getMatchedDoc = async (g: string, s: string, c: string) => {
         const snap = await getDocs(collection(db, 'learning_tools'));
         return snap.docs.find(d => {
            const data = d.data();
            const dGrade = data.grade?.toLowerCase().trim() || '';
            const dSubj = data.subject?.toLowerCase().trim() === 'mathematics' ? 'maths' : (data.subject?.toLowerCase().trim() || '');
            const dChap = data.chapter?.toLowerCase().trim() || '';
            const fGrade = g?.toLowerCase().trim() || '';
            const fSubj = s?.toLowerCase().trim() === 'mathematics' ? 'maths' : (s?.toLowerCase().trim() || '');
            const fChap = c?.toLowerCase().trim() || '';
            return dGrade === fGrade && dSubj === fSubj && dChap === fChap;
         });
      };

      if (isApproved) {
         if (request.action_type === 'FULL_TIER_ADD') {
            const newDocRef = doc(collection(db, 'learning_tools'));
            await setDoc(newDocRef, {
               ...request.payload.tool,
               created_at: new Date().toISOString(),
               updated_at: new Date().toISOString()
            });
         } else if (request.action_type === 'FULL_TIER_EDIT') {
            const matchedDoc = await getMatchedDoc(request.originalData.grade, request.originalData.subject, request.originalData.chapter);
            if (!matchedDoc) throw new Error("Could not find the original document to edit.");
            await setDoc(doc(db, 'learning_tools', matchedDoc.id), {
               ...request.payload.tool,
               updated_at: new Date().toISOString()
            }, { merge: true });
         } else if (request.action_type === 'FULL_TIER_REMOVE') {
            const matchedDoc = await getMatchedDoc(request.originalData.grade, request.originalData.subject, request.originalData.chapter);
            if (!matchedDoc) throw new Error("Could not find the original document to remove.");
            await deleteDoc(doc(db, 'learning_tools', matchedDoc.id));
         }
      }
      
      await setDoc(requestRef, { status: actionStatus, reviewed_by: adminEmail, reviewed_at: new Date().toISOString() }, { merge: true });
      
      setPendingRequests(prev => prev.filter(r => r.id !== request.id));
      setRequestHistory(prev => [{...request, status: actionStatus}, ...prev]);
      notify('success', `Request ${actionStatus} successfully!`);
    } catch (error: any) {
      console.error(error);
      notify('error', `Error processing request: ${error.message}`);
    }
  };

  // KPIs
  const totalCourses = courses.length;
  const liveCoursesCount = courses.filter(c => c.status === 'active').length;
  const comingSoonCount = courses.filter(c => c.status === 'coming_soon').length;
  const totalRegistrations = courses.reduce((sum, c) => sum + (c.registeredCount || 0), 0);
  const totalWishlists = courses.reduce((sum, c) => sum + (c.wishlistCount || 0), 0);

  // Sorting Handler
  const handleSort = (field: keyof CatalogCourse) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered & Sorted Courses
  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => 
        c.title.toLowerCase().includes(q) ||
        (c.tagline && c.tagline.toLowerCase().includes(q)) ||
        (c.grade && c.grade.toLowerCase().includes(q)) ||
        (c.subject && c.subject.toLowerCase().includes(q)) ||
        c.masterCategory.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(c => c.masterCategory === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }

    // Pricing filter
    if (pricingFilter === 'free') {
      result = result.filter(c => c.isFree);
    } else if (pricingFilter === 'paid') {
      result = result.filter(c => !c.isFree);
    }

    // Sort
    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      valA = valA.toString().toLowerCase();
      valB = valB.toString().toLowerCase();
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [courses, searchQuery, categoryFilter, statusFilter, pricingFilter, sortField, sortDirection]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {notification.type === 'success' ? <Check className="text-emerald-600" size={20} /> : <AlertCircle className="text-rose-600" size={20} />}
          <span className="text-sm font-bold">{notification.message}</span>
        </div>
      )}

      {/* Header & KPI Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
              Admin Course Control Center
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            Courses &amp; Content Manager
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-0.5">
            Manage course availability, publish status, pricing tiers, and monitor live user engagement across all categories.
          </p>
        </div>

        <button
          onClick={loadCoursesData}
          disabled={loadingCourses}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-200 hover:border-indigo-300 text-slate-700 rounded-xl font-bold text-sm shadow-xs transition-colors self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw size={16} className={loadingCourses ? "animate-spin text-indigo-600" : ""} />
          {loadingCourses ? "Syncing..." : "Sync Catalog"}
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen size={14} className="text-indigo-500" /> Total Courses
          </div>
          <div className="text-2xl font-black text-slate-800">{totalCourses}</div>
        </div>

        <div className="bg-emerald-50/60 border-2 border-emerald-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Live Active
          </div>
          <div className="text-2xl font-black text-emerald-700">{liveCoursesCount}</div>
        </div>

        <div className="bg-amber-50/60 border-2 border-amber-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Clock size={14} className="text-amber-500" /> Coming Soon
          </div>
          <div className="text-2xl font-black text-amber-700">{comingSoonCount}</div>
        </div>

        <div className="bg-indigo-50/60 border-2 border-indigo-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Users size={14} className="text-indigo-500" /> Registrations
          </div>
          <div className="text-2xl font-black text-indigo-700">{totalRegistrations}</div>
        </div>

        <div className="bg-rose-50/60 border-2 border-rose-100 rounded-2xl p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Heart size={14} className="text-rose-500" /> Wishlists
          </div>
          <div className="text-2xl font-black text-rose-700">{totalWishlists}</div>
        </div>
      </div>

      {/* Toolbar: Search, Filters, Stats */}
      <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by course title, grade, subject, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-hidden text-sm font-semibold text-slate-800 placeholder-slate-400 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="all">All Categories</option>
              <option value="Foundational">Foundational</option>
              <option value="Core">Core Academic</option>
              <option value="Co-Curricular & Skills">Co-Curricular &amp; Skills</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="active">Live (Active)</option>
              <option value="coming_soon">Coming Soon</option>
            </select>

            {/* Pricing Filter */}
            <select
              value={pricingFilter}
              onChange={(e) => setPricingFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="all">All Pricing</option>
              <option value="free">Free Courses</option>
              <option value="paid">Paid Courses</option>
            </select>

            {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || pricingFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setPricingFilter('all');
                }}
                className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Showing Count */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-2 border-t border-slate-100">
          <span>Showing {filteredCourses.length} of {totalCourses} courses</span>
          <span className="text-slate-400">Click table headers to sort</span>
        </div>
      </div>

      {/* Main Courses Table */}
      <div className="bg-white border-2 border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        {loadingCourses ? (
          <div className="py-24 text-center">
            <RefreshCw className="mx-auto text-indigo-500 animate-spin mb-3" size={32} />
            <h4 className="text-base font-bold text-slate-700">Loading course control center...</h4>
            <p className="text-xs text-slate-400 mt-1">Aggregating live student registrations and catalog overrides.</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-16 text-center">
            <BookOpen className="mx-auto text-slate-300 mb-3" size={40} />
            <h4 className="text-base font-bold text-slate-700">No courses match your filter</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Try adjusting your search terms or clearing the active filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100 bg-slate-50/70 text-slate-600 text-xs font-black uppercase tracking-wider">
                  <th 
                    onClick={() => handleSort('title')}
                    className="py-4 px-6 cursor-pointer hover:text-indigo-600 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      Course &amp; Category
                      {sortField === 'title' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} className="text-indigo-600" /> : <ArrowDown size={14} className="text-indigo-600" />
                      ) : <ArrowUpDown size={14} className="opacity-40" />}
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('grade')}
                    className="py-4 px-4 cursor-pointer hover:text-indigo-600 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      Audience / Grade
                      {sortField === 'grade' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} className="text-indigo-600" /> : <ArrowDown size={14} className="text-indigo-600" />
                      ) : <ArrowUpDown size={14} className="opacity-40" />}
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('status')}
                    className="py-4 px-4 cursor-pointer hover:text-indigo-600 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      Status
                      {sortField === 'status' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} className="text-indigo-600" /> : <ArrowDown size={14} className="text-indigo-600" />
                      ) : <ArrowUpDown size={14} className="opacity-40" />}
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('isFree')}
                    className="py-4 px-4 cursor-pointer hover:text-indigo-600 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      Pricing
                      {sortField === 'isFree' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} className="text-indigo-600" /> : <ArrowDown size={14} className="text-indigo-600" />
                      ) : <ArrowUpDown size={14} className="opacity-40" />}
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('registeredCount')}
                    className="py-4 px-4 text-center cursor-pointer hover:text-indigo-600 transition-colors select-none"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      Registered
                      {sortField === 'registeredCount' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} className="text-indigo-600" /> : <ArrowDown size={14} className="text-indigo-600" />
                      ) : <ArrowUpDown size={14} className="opacity-40" />}
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('wishlistCount')}
                    className="py-4 px-4 text-center cursor-pointer hover:text-indigo-600 transition-colors select-none"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      Wishlist
                      {sortField === 'wishlistCount' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} className="text-indigo-600" /> : <ArrowDown size={14} className="text-indigo-600" />
                      ) : <ArrowUpDown size={14} className="opacity-40" />}
                    </div>
                  </th>

                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCourses.map((course) => {
                  const isLive = course.status === 'active';
                  const isSaving = savingCourseId === course.id;

                  return (
                    <tr 
                      key={course.id} 
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Course Title & Category */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shrink-0">
                            {course.icon || '📚'}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-800 truncate max-w-xs block">
                                {course.title}
                              </span>
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                                course.masterCategory === 'Foundational' 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : course.masterCategory === 'Core'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {course.masterCategory}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 truncate max-w-sm mt-0.5">
                              {course.tagline || course.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Grade / Audience */}
                      <td className="py-4 px-4 font-bold text-xs text-slate-600 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{course.grade || 'Universal'}</span>
                          {course.ageBand && (
                            <span className="text-[11px] font-medium text-slate-400">{course.ageBand}</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 uppercase tracking-wider border border-amber-200">
                            Coming Soon
                          </span>
                        )}
                      </td>

                      {/* Pricing */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {course.isFree ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Free
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {course.price ? `₹${course.price}` : 'Paid'}
                          </span>
                        )}
                      </td>

                      {/* Registered Users */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 font-black text-slate-700 text-xs px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200">
                          <Users size={13} className="text-indigo-500" />
                          <span>{course.registeredCount || 0}</span>
                        </div>
                      </td>

                      {/* Wishlisted Users */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 font-black text-slate-700 text-xs px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200">
                          <Heart size={13} className="text-rose-500" />
                          <span>{course.wishlistCount || 0}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Quick Toggle Status */}
                          <button
                            onClick={() => handleQuickToggleStatus(course)}
                            disabled={isSaving}
                            title={isLive ? "Change status to Coming Soon" : "Publish Live immediately"}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                              isLive 
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' 
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            } disabled:opacity-50`}
                          >
                            {isSaving ? "Updating..." : (isLive ? "Set Coming Soon" : "Make Live")}
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => handleOpenEdit(course)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-transparent hover:border-indigo-100"
                            title="Edit Course Details &amp; Pricing"
                          >
                            <Edit3 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Course Modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-2xl max-w-xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-black">
                  {editingCourse.icon || '📚'}
                </span>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Edit Course Settings</h3>
                  <p className="text-xs font-semibold text-slate-400">ID: {editingCourse.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCourse(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                  Course Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 font-bold text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                  Tagline / Catchphrase
                </label>
                <input
                  type="text"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 font-semibold text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Status Radio */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                  Publication Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormStatus('active')}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-black text-sm transition-all ${
                      formStatus === 'active' 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Live (Active)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStatus('coming_soon')}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-black text-sm transition-all ${
                      formStatus === 'coming_soon' 
                        ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-xs' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Clock size={16} className="text-amber-500" />
                    Coming Soon
                  </button>
                </div>
              </div>

              {/* Pricing Tier */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                  Pricing Tier
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => { setFormIsFree(true); setFormPrice(0); }}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-black text-sm transition-all ${
                      formIsFree 
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-800 shadow-xs' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    100% Free Course
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormIsFree(false)}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-black text-sm transition-all ${
                      !formIsFree 
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-800 shadow-xs' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Paid Course (₹)
                  </button>
                </div>

                {!formIsFree && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                      Course Fee (₹ INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={formPrice}
                        onChange={(e) => setFormPrice(Math.max(0, Number(e.target.value)))}
                        placeholder="e.g. 999"
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border-2 border-slate-200 font-bold text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                  Course Description &amp; Overview
                </label>
                <textarea
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 font-medium text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingCourseId === editingCourse.id}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {savingCourseId === editingCourse.id ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Course Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Krew Curriculum Queue Section */}
      <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-sm transition-all">
        <div 
          onClick={() => setShowKrewQueue(!showKrewQueue)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
              <Layers size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-800">Community Curriculum Approval Queue</h3>
                {pendingRequests.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white animate-pulse">
                    {pendingRequests.length} Pending
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-400">
                Review interactive tools submitted by Krew members before merging into curriculum tools.
              </p>
            </div>
          </div>

          <button 
            type="button"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50"
          >
            {showKrewQueue ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {/* Expanded Krew Queue Content */}
        {showKrewQueue && (
          <div className="mt-6 pt-6 border-t-2 border-slate-100 space-y-4 animate-fade-in">
            {loadingKrew ? (
              <div className="py-12 text-center text-indigo-500 font-bold animate-pulse text-sm">
                Loading community submission queue...
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
                <CheckCircle size={32} className="mx-auto text-emerald-500 mb-2" />
                <h4 className="text-sm font-bold text-slate-700">All Submissions Reviewed!</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  There are no pending tool creation or edit requests from Krew members.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((req: any) => {
                  const isAdd = req.action_type === 'FULL_TIER_ADD';
                  const isEdit = req.action_type === 'FULL_TIER_EDIT' || req.action_type === 'EDIT';
                  return (
                    <div 
                      key={req.id} 
                      className="bg-white border-2 border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex gap-4 items-start w-full md:w-auto">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          isAdd ? 'bg-emerald-100 text-emerald-600' : isEdit ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                        }`}>
                          {isAdd ? <Plus size={24} /> : isEdit ? <Edit3 size={24}/> : <Trash2 size={24} />}
                        </div>
                        <div className="w-full">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {req.target_type}
                            </span>
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                              <Clock size={12}/> {new Date(req.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-800 leading-tight mb-1">
                            <span className={isAdd ? 'text-emerald-600' : isEdit ? 'text-amber-600' : 'text-rose-600'}>
                              {isEdit ? 'Edit:' : isAdd ? 'Add:' : 'Remove:'}
                            </span>{' '}
                            {isEdit 
                              ? (req.action_type === 'EDIT' ? `'${req.payload?.oldTitle}' → '${req.payload?.newTitle}'` : `'${req.originalData?.toolTitle}' → '${req.payload?.title}'`) 
                              : (req.payload?.title || 'Unknown Item')
                            }
                          </h4>
                          <p className="text-xs font-bold text-slate-500">
                            Requested by: <span className="text-indigo-600">{req.krew_member_email}</span>
                          </p>
                          
                          {(isAdd || isEdit) && req.payload?.tool?.gameCode && (
                            <div className="mt-3 w-full bg-slate-900 rounded-xl p-3 relative border-l-4 border-amber-500">
                              <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Submitted Game Code</div>
                              <pre className="text-emerald-400 text-xs font-mono overflow-x-auto max-h-28">{req.payload.tool.gameCode}</pre>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 w-full md:w-auto mt-3 md:mt-0 pt-3 md:pt-0 border-t-2 border-slate-100 md:border-t-0 shrink-0">
                        <button 
                          onClick={() => handleKrewRequestAction(req, 'REJECTED')} 
                          className="flex-1 md:flex-none bg-white border-2 border-rose-200 text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <XCircle size={15}/> Reject
                        </button>
                        <button 
                          onClick={() => handleKrewRequestAction(req, 'APPROVED')} 
                          className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle size={15}/> Approve
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}