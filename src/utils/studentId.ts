/**
 * Unique Student Identification Generator & Helper
 * Generates and validates unique Ethiopian university student IDs (e.g., WKU/2026/4821)
 */

export function generateUniqueStudentId(profile?: { 
  id?: string; 
  email?: string; 
  phone?: string; 
  university?: string;
  studentId?: string;
} | null): string {
  if (profile?.studentId && profile.studentId.trim().length > 4) {
    return profile.studentId.trim();
  }

  const rawSeed = (profile?.email || profile?.phone || profile?.id || `stu_${Date.now()}`).toLowerCase();
  let hash = 0;
  for (let i = 0; i < rawSeed.length; i++) {
    hash = (hash << 5) - hash + rawSeed.charCodeAt(i);
    hash |= 0;
  }
  const codeNum = Math.abs(hash) % 9000 + 1000;
  
  let uniPrefix = 'WKU';
  const uni = (profile?.university || '').toLowerCase();
  if (uni.includes('addis') || uni.includes('aau')) uniPrefix = 'AAU';
  else if (uni.includes('hawassa')) uniPrefix = 'HWU';
  else if (uni.includes('jimma')) uniPrefix = 'JU';
  else if (uni.includes('arba')) uniPrefix = 'AMU';
  else if (uni.includes('bahir')) uniPrefix = 'BDU';

  return `${uniPrefix}/2026/${codeNum}`;
}
