export function serializeFirebaseData(obj: any): any {
  if (obj === null || obj === undefined) return null; // Next.js hates undefined
  if (typeof obj !== 'object') return obj;

  // Handle Firebase Timestamps safely
  if (typeof obj.toDate === 'function') {
    return obj.toDate().toISOString();
  }

  // FAILSAFE: Handle Firebase DocumentReferences and Snapshots to prevent infinite recursion
  // DocumentReference
  if (typeof obj.path === 'string' && typeof obj.collection === 'function' && typeof obj.isEqual === 'function') {
    return obj.path;
  }
  // DocumentSnapshot
  if (typeof obj.data === 'function' && typeof obj.ref === 'object') {
    return serializeFirebaseData({ id: obj.id, ...obj.data() });
  }

  // Handle Arrays recursively
  if (Array.isArray(obj)) {
    return obj.map(serializeFirebaseData);
  }

  // Handle nested objects safely
  const serialized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Drop undefined values entirely to keep Next.js boundary happy
    if (value !== undefined) {
      serialized[key] = serializeFirebaseData(value);
    }
  }
  return serialized;
}
