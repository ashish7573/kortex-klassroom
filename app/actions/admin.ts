"use server";
import { adminDb, adminAuth } from '../../backend_configurations/firebase-admin';
import { ALL_CATALOG_COURSES, CatalogCourse } from '../../kortex_landing_page/courseCatalogConfig';

export async function syncCurriculumTotals(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const adminUid = decodedToken.uid;
    
    // Verify admin role
    const docSnap = await adminDb.collection('users').doc(adminUid).get();
    const data = docSnap.data();
    if (data?.role !== 'admin') {
      throw new Error("Unauthorized: Only admins can sync curriculum totals.");
    }
    
    // Fetch all tools
    const snap = await adminDb.collection('learning_tools').get();
    const totals: Record<string, number> = {};
    
    snap.docs.forEach(doc => {
       const tool = doc.data();
       const grade = (tool.grade || 'unknown').trim().toLowerCase();
       let dbSubj = (tool.subject || 'unknown').trim().toLowerCase();
       if (dbSubj === 'mathematics' || dbSubj === 'maths') dbSubj = 'maths';
       const key = `${grade}_${dbSubj}`;
       totals[key] = (totals[key] || 0) + 1;

       // Universal subject totals (including FLN bridges)
       totals[dbSubj] = (totals[dbSubj] || 0) + 1;
       if (dbSubj === 'fln hindi') {
         totals['hindi'] = (totals['hindi'] || 0) + 1;
       }
       if (dbSubj === 'fln maths') {
         totals['maths'] = (totals['maths'] || 0) + 1;
       }
       if (dbSubj === 'fln english') {
         totals['english'] = (totals['english'] || 0) + 1;
       }
    });
    
    await adminDb.collection('metadata').doc('curriculum_totals').set(totals);
    
    return { success: true, message: "Curriculum totals synced successfully." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createOrganization(idToken: string, orgData: any) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const adminUid = decodedToken.uid;
    
    // Verify admin role
    const docSnap = await adminDb.collection('users').doc(adminUid).get();
    const data = docSnap.data();
    if (data?.role !== 'admin') {
      throw new Error("Unauthorized: Only admins can create organizations.");
    }
    
    // Create Auth User
    const newAuthUser = await adminAuth.createUser({
      email: orgData.email,
      displayName: orgData.organization_name,
      // No phone required. No password provided here.
    });

    // Generate Password Reset Link
    const resetLink = await adminAuth.generatePasswordResetLink(orgData.email);
    // TODO: Dispatch resetLink to orgData.email via email provider

    // Create Firestore Document
    await adminDb.collection('users').doc(newAuthUser.uid).set({
      uid: newAuthUser.uid,
      role: 'org_admin',
      email: orgData.email,
      full_name: orgData.organization_name,
      organization_name: orgData.organization_name,
      created_at: new Date().toISOString(),
      status: 'active',
      phone: null,
      phoneVerified: false, 
      onboardingStatus: 'ACTIVE',
      ...orgData
    });

    return { success: true, uid: newAuthUser.uid, message: "Organization created." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Fetch all catalog courses merged with live Firestore overrides, registration counts, and wishlist counts.
 * Requires Admin privileges.
 */
export async function getAdminCoursesData(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const adminUid = decodedToken.uid;
    
    // Verify admin role
    const docSnap = await adminDb.collection('users').doc(adminUid).get();
    const data = docSnap.data();
    if (data?.role !== 'admin') {
      throw new Error("Unauthorized: Only admins can access course control data.");
    }

    // 1. Fetch overrides from Firestore 'courses' collection
    const coursesSnap = await adminDb.collection('courses').get();
    const overrides: Record<string, any> = {};
    coursesSnap.forEach(doc => {
      overrides[doc.id] = doc.data();
    });

    // 2. Aggregate registration counts from students in 'users'
    const regCounts: Record<string, number> = {};
    const studentsSnap = await adminDb.collection('users').where('role', '==', 'student').get();
    studentsSnap.forEach(doc => {
      const student = doc.data();
      const licenses: string[] = student.active_b2c_licenses || [];
      licenses.forEach(lic => {
        if (!lic) return;
        const key = lic.trim().toLowerCase();
        regCounts[key] = (regCounts[key] || 0) + 1;
      });

      if (student.org_links && typeof student.org_links === 'object') {
        Object.values(student.org_links).forEach((link: any) => {
          if (Array.isArray(link?.assigned_combos)) {
            link.assigned_combos.forEach((c: string) => {
              if (!c) return;
              const key = c.trim().toLowerCase();
              regCounts[key] = (regCounts[key] || 0) + 1;
            });
          }
        });
      }
    });

    // 3. Aggregate wishlist/interest counts from 'course_interests'
    const wishlistCounts: Record<string, number> = {};
    try {
      const interestsSnap = await adminDb.collection('course_interests').get();
      interestsSnap.forEach(doc => {
        const item = doc.data();
        const pId = (item.program_id || item.course_id || '').trim().toLowerCase();
        const pTitle = (item.program_title || '').trim().toLowerCase();
        if (pId) wishlistCounts[pId] = (wishlistCounts[pId] || 0) + 1;
        if (pTitle && pTitle !== pId) wishlistCounts[pTitle] = (wishlistCounts[pTitle] || 0) + 1;
      });
    } catch (e) {
      console.warn("Could not fetch course_interests:", e);
    }

    // 4. Merge static master catalog with Firestore overrides and analytics
    const mergedCourses = ALL_CATALOG_COURSES.map(course => {
      const override = overrides[course.id] || {};
      const courseIdLower = course.id.toLowerCase();
      const courseTitleLower = course.title.toLowerCase();
      const courseSubjectLower = (course.subject || '').toLowerCase();
      const gradeSubjLower = course.grade && course.subject ? `${course.grade.toLowerCase()}-${course.subject.toLowerCase()}` : '';
      const gradeSubjSpaceLower = course.grade && course.subject ? `${course.grade.toLowerCase()} ${course.subject.toLowerCase()}` : '';

      // Count registered students by matching known identity keys
      let registered = 0;
      const matchedKeys = new Set<string>();
      [courseIdLower, courseTitleLower, courseSubjectLower, gradeSubjLower, gradeSubjSpaceLower].forEach(k => {
        if (k && regCounts[k] && !matchedKeys.has(k)) {
          registered += regCounts[k];
          matchedKeys.add(k);
        }
      });

      // Count wishlisted students
      let wishlist = 0;
      const matchedWishlist = new Set<string>();
      [courseIdLower, courseTitleLower].forEach(k => {
        if (k && wishlistCounts[k] && !matchedWishlist.has(k)) {
          wishlist += wishlistCounts[k];
          matchedWishlist.add(k);
        }
      });

      return {
        ...course,
        status: (override.status || course.status) as 'active' | 'coming_soon',
        isFree: override.isFree !== undefined ? override.isFree : course.isFree,
        price: override.price !== undefined ? override.price : (course.price || 0),
        title: override.title || course.title,
        tagline: override.tagline || course.tagline,
        description: override.description || course.description,
        registeredCount: registered,
        wishlistCount: wishlist,
        updatedAt: override.updated_at || null,
        updatedBy: override.updated_by || null
      };
    });

    return { success: true, courses: mergedCourses };
  } catch (error: any) {
    console.error("Error in getAdminCoursesData:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update course status (Live vs Coming Soon), pricing, and details in Firestore.
 * Requires Admin privileges.
 */
export async function updateCourseStatusAndPricing(
  idToken: string,
  courseId: string,
  updates: {
    status?: 'active' | 'coming_soon';
    isFree?: boolean;
    price?: number;
    title?: string;
    tagline?: string;
    description?: string;
  }
) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const adminUid = decodedToken.uid;
    
    // Verify admin role
    const docSnap = await adminDb.collection('users').doc(adminUid).get();
    const data = docSnap.data();
    if (data?.role !== 'admin') {
      throw new Error("Unauthorized: Only admins can modify courses.");
    }

    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: data.email || decodedToken.email || 'Admin'
    };

    // 1. Update individual document in 'courses' collection
    await adminDb.collection('courses').doc(courseId).set(payload, { merge: true });

    // 2. Mirror into 'metadata/courses_catalog' so clients can read real-time overrides
    await adminDb.collection('metadata').doc('courses_catalog').set({
      [courseId]: payload,
      last_updated: new Date().toISOString()
    }, { merge: true });

    return { success: true, message: `Course "${courseId}" updated successfully.` };
  } catch (error: any) {
    console.error("Error in updateCourseStatusAndPricing:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Public/Client helper to fetch real-time catalog overrides.
 */
export async function getPublicCourseCatalogOverrides() {
  try {
    const docSnap = await adminDb.collection('metadata').doc('courses_catalog').get();
    if (!docSnap.exists) {
      return { success: true, overrides: {} };
    }
    return { success: true, overrides: docSnap.data() || {} };
  } catch (error: any) {
    console.warn("Error fetching public course overrides:", error);
    return { success: false, overrides: {} };
  }
}
