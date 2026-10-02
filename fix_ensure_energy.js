const fs = require('fs');
const file = 'app/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldHandleOpenFeatured = `  const handleOpenFeatured = async (item: any) => {
      const hasEnergy = await ensureEnergy();`;
const newHandleOpenFeatured = `  const handleOpenFeatured = async (item: any) => {
      const hasEnergy = await ensureEnergy(item.subject);`;

code = code.replace(oldHandleOpenFeatured, newHandleOpenFeatured);

const oldHandleStartLesson = `  const handleStartLesson = async (lesson: any, stepIndex: any) => {
       const hasEnergy = await ensureEnergy();`;
const newHandleStartLesson = `  const handleStartLesson = async (lesson: any, stepIndex: any) => {
       const toolSubject = lesson.subject || (lesson.flow && lesson.flow[stepIndex]?.subject) || 'unknown';
       const hasEnergy = await ensureEnergy(toolSubject);`;

code = code.replace(oldHandleStartLesson, newHandleStartLesson);

fs.writeFileSync(file, code);
