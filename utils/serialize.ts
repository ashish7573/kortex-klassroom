export function serializeFirebaseData(obj: any): any {
  if (obj === null || obj === undefined) return null; // Next.js hates undefined
  if (typeof obj !== 'object') return obj;

  // Handle Firebase Timestamps
  if (typeof obj.toDate === 'function') {
    return obj.toDate().toISOString();
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map(serializeFirebaseData);
  }

  // Handle nested objects
  const serialized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Drop undefined values entirely to keep Next.js happy
    if (value !== undefined) {
      serialized[key] = serializeFirebaseData(value);
    }
  }
  return serialized;
}
