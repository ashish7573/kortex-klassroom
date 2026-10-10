"use server";
import { adminDb, adminAuth } from '../../backend_configurations/firebase-admin';

export async function submitUserFeedback(payload: {
  userId?: string;
  userRole?: string;
  userName?: string;
  userEmail?: string;
  feedbackType: string;
  message: string;
}) {
  try {
    const feedbackRef = adminDb.collection('user_feedbacks').doc();
    
    await feedbackRef.set({
      user_id: payload.userId || 'guest',
      user_role: payload.userRole || 'guest',
      user_name: payload.userName || 'Guest User',
      user_email: payload.userEmail || '',
      feedback_type: payload.feedbackType,
      message: payload.message,
      status: 'unread',
      is_testimonial: false,
      created_at: new Date().toISOString()
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to submit feedback:", error);
    return { success: false, error: error.message };
  }
}

export async function markAsTestimonial(idToken: string, feedbackId: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const adminUid = decodedToken.uid;
    
    const adminDoc = await adminDb.collection('users').doc(adminUid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'super_admin') {
      throw new Error("Unauthorized: Only super admins can manage feedback.");
    }

    const feedbackRef = adminDb.collection('user_feedbacks').doc(feedbackId);
    await feedbackRef.update({
      is_testimonial: true,
      updated_at: new Date().toISOString()
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to mark testimonial:", error);
    return { success: false, error: error.message };
  }
}

