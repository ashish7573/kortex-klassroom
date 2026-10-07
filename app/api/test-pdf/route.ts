import { NextResponse } from 'next/server';
import { adminDb } from '@/backend_configurations/firebase-admin';

export async function GET() {
  try {
    const snap = await adminDb.collection('learning_tools').where('content_type', '==', 'pdf').limit(5).get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
