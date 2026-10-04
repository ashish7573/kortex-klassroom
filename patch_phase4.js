const fs = require('fs');
let code = fs.readFileSync('app/actions/teacher_assignments.ts', 'utf8');

const oldCode = `    // Construct the assignment document
    const assignmentRef = adminDb.collection('assignments').doc();
    const assignmentData = {
       id: assignmentRef.id,
       org_id: payload.orgId,
       teacher_uid: teacherUid,
       combo_id: payload.comboId,
       tool_id: payload.toolId,
       tool_type: payload.toolType || 'unknown',
       chapter_name: payload.chapterName || 'Unknown Chapter',
       title: payload.toolTitle || 'Untitled Task',
       due_date: payload.dueDate,
       assigned_to: payload.assignedStudentIds,
       instructions: payload.instructions || '',
       external_link: payload.externalLink || '',
       created_at: new Date().toISOString(),
       status: 'active'
    };`;

const newCode = `    // Construct the assignment document
    const assignmentRef = adminDb.collection('assignments').doc();

    let safeExternalLink = payload.externalLink?.trim() || '';
    if (safeExternalLink) {
        const lowerLink = safeExternalLink.toLowerCase();
        if (!lowerLink.startsWith('http://') && !lowerLink.startsWith('https://')) {
            safeExternalLink = 'https://' + safeExternalLink;
        }
        if (safeExternalLink.toLowerCase().includes('javascript:')) {
            throw new Error("Invalid URL: JavaScript protocols are blocked for security.");
        }
    }

    const assignmentData = {
       id: assignmentRef.id,
       org_id: payload.orgId,
       teacher_uid: teacherUid,
       combo_id: payload.comboId,
       tool_id: payload.toolId,
       tool_type: payload.toolType || 'unknown',
       chapter_name: payload.chapterName || 'Unknown Chapter',
       title: payload.toolTitle || 'Untitled Task',
       due_date: payload.dueDate,
       assigned_to: payload.assignedStudentIds,
       instructions: payload.instructions || '',
       external_link: safeExternalLink,
       created_at: new Date().toISOString(),
       status: 'active'
    };`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('app/actions/teacher_assignments.ts', code);
