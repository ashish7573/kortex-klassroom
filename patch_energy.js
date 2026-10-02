const fs = require('fs');
const file = 'app/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Update ensureEnergy signature and logic
const oldEnsureEnergy = `  const ensureEnergy = async () => {
    if (role === 'student' && !isPro && authProfile) {
        try {
            const token = await auth.currentUser?.getIdToken();`;

const newEnsureEnergy = `  const ensureEnergy = async (toolSubject?: string) => {
    if (role === 'student' && !isPro && authProfile) {
        // --- B2B / B2C BYPASS CHECK ---
        if (toolSubject) {
            let isOwned = false;
            const matchStr = toolSubject.toLowerCase();
            
            // 1. If they belong to an organization, they get unlimited access to their school subjects
            // For simplicity, we bypass energy if they are in an org, as the org pays a bulk license.
            if (authProfile.org_ids && authProfile.org_ids.length > 0) {
                isOwned = true;
            }
            
            // 2. Check B2C licenses
            if (!isOwned && authProfile.active_b2c_licenses) {
                isOwned = authProfile.active_b2c_licenses.some((c: string) => c.toLowerCase().includes(matchStr));
            }
            
            if (isOwned) return true;
        }

        try {
            const token = await auth.currentUser?.getIdToken();`;

code = code.replace(oldEnsureEnergy, newEnsureEnergy);

// 2. Update handleStartLesson to pass the subject
const oldHandleStartLesson = `  const handleStartLesson = async (lesson: any, stepIndex = 0) => {
    // 🎯 TRACKING: Interaction Point
    trackEvent('lesson_started', { chapter: lesson.chapter });
    const hasEnergy = await ensureEnergy();
    if (hasEnergy) {
       setPlayingLesson(lesson);
       setPlayingStep(stepIndex);
    }
  };`;

const newHandleStartLesson = `  const handleStartLesson = async (lesson: any, stepIndex = 0) => {
    // 🎯 TRACKING: Interaction Point
    trackEvent('lesson_started', { chapter: lesson.chapter });
    const toolSubject = lesson.subject || (lesson.flow && lesson.flow[stepIndex]?.subject) || 'unknown';
    const hasEnergy = await ensureEnergy(toolSubject);
    if (hasEnergy) {
       setPlayingLesson(lesson);
       setPlayingStep(stepIndex);
    }
  };`;

code = code.replace(oldHandleStartLesson, newHandleStartLesson);

// 3. Update handleOpenFeatured in TierLibraryView
const oldOpenFeatured = `  const handleOpenFeatured = async (tool: any) => {
    trackEvent('tool_opened', { title: tool.title });
    const hasEnergy = await ensureEnergy();
    if (hasEnergy) {
       setPlayingLesson(tool);
       setPlayingStep(0);
    }
  };`;

const newOpenFeatured = `  const handleOpenFeatured = async (tool: any) => {
    trackEvent('tool_opened', { title: tool.title });
    const hasEnergy = await ensureEnergy(tool.subject);
    if (hasEnergy) {
       setPlayingLesson(tool);
       setPlayingStep(0);
    }
  };`;
  
code = code.replace(oldOpenFeatured, newOpenFeatured);

fs.writeFileSync(file, code);
