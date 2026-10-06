/**
 * comboParsers.ts
 * Utilities for parsing and generating structured IDs for Grade-Subject Combinations.
 */

export function generateComboId(orgKortexId: string, comboString: string): string {
  // 1. Extract Org Abbreviation (e.g., "ORG_RTV" -> "RTV")
  const orgAbbrev = orgKortexId.startsWith("ORG_") 
    ? orgKortexId.replace("ORG_", "") 
    : orgKortexId;

  // 2. Parse the Combo String
  // Expected formats: 
  // "Grade 1 - Section A - English"
  // "FLN - Section A - English"
  // "Balvatika 1 - Section A - English"
  const parts = comboString.split('-');
  const rawGrade = parts.length > 0 ? parts[0].trim() : "";
  const rawSection = parts.length > 1 ? parts[1].trim() : "";
  const rawSubject = parts.length > 2 ? parts[parts.length - 1].trim() : "SUBJ";

  // 3. Process Grade
  let gradePart = "X";
  const upperGrade = rawGrade.toUpperCase();
  
  if (upperGrade.includes('FLN')) {
    gradePart = "FLN";
  } else if (upperGrade.includes('BALVATIKA')) {
    // Extract number from Balvatika 1 -> "BV1"
    const match = rawGrade.match(/\d+/);
    gradePart = match ? `BV${match[0]}` : "BV";
  } else {
    // Extract number/K/PK from Grade 1, Pre-K, etc.
    const match = rawGrade.match(/([0-9]+|K|PK|PRE-K)/i);
    if (match) {
      gradePart = match[1].toUpperCase() === "PRE-K" ? "PK" : match[1].toUpperCase();
    }
  }

  // 4. Process Section
  const sectionMatch = rawSection.match(/Section\s+([A-Z0-9]+)/i);
  const sectionPart = sectionMatch ? sectionMatch[1].toUpperCase() : "X";

  // 5. Process Subject (First 3 alphabetical characters)
  let subjectPart = rawSubject.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();

  // Smart overrides to prevent collisions for FLN and multi-word subjects
  const upperRaw = rawSubject.toUpperCase().trim();
  if (upperRaw.startsWith('FLN ')) {
     const parts = upperRaw.split(' ');
     if (parts.length >= 2) {
       // "FLN MATHS" -> "FLN" + "M" -> "FLNM"
       subjectPart = "FLN" + parts[1].replace(/[^A-Z]/g, '').substring(0, 1);
     }
  } else if (upperRaw.startsWith('CO CURRICULAR') || upperRaw.startsWith('CO-CURRICULAR')) {
     subjectPart = 'COC';
  }

  // 6. Combine
  return `${orgAbbrev}_${gradePart}${sectionPart}${subjectPart}`;
}

export function getOrgAbbreviation(orgKortexId: string): string {
  return orgKortexId.startsWith("ORG_") 
    ? orgKortexId.replace("ORG_", "") 
    : orgKortexId;
}
