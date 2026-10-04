const fs = require('fs');
let code = fs.readFileSync('kortex_users/teacher/AssignmentBuilderModal.tsx', 'utf8');

// 1. We replace Object.keys(hierarchy) mapping with sorted mapping
const oldChapterList = `                                 {Object.keys(hierarchy).map(chapter => (
                                    <div 
                                      key={chapter} `;

const newChapterList = `                                 {Object.keys(hierarchy).sort((a, b) => {
                                    const aTool = Object.values(hierarchy[a])[0]?.[0] || {};
                                    const bTool = Object.values(hierarchy[b])[0]?.[0] || {};
                                    return (Number(aTool.chapter_number) || 999) - (Number(bTool.chapter_number) || 999);
                                 }).map(chapter => (
                                    <div 
                                      key={chapter} `;

code = code.replace(oldChapterList, newChapterList);

// 2. We replace Object.keys(hierarchy[navChapter]) mapping for subtopics
const oldSubtopicList = `                                 {Object.keys(hierarchy[navChapter] || {}).map(subtopic => (
                                    <div 
                                      key={subtopic} `;

const newSubtopicList = `                                 {Object.keys(hierarchy[navChapter] || {}).sort((a, b) => {
                                    const aTool = hierarchy[navChapter][a]?.[0] || {};
                                    const bTool = hierarchy[navChapter][b]?.[0] || {};
                                    return (Number(aTool.subtopic_order) || 999) - (Number(bTool.subtopic_order) || 999);
                                 }).map(subtopic => (
                                    <div 
                                      key={subtopic} `;

code = code.replace(oldSubtopicList, newSubtopicList);

// 3. We replace tools mapping
const oldToolList = `                                 {hierarchy[navChapter][navSubtopic].map((tool: any) => (
                                    <div 
                                      key={tool.id} `;

const newToolList = `                                 {[...hierarchy[navChapter][navSubtopic]].sort((a: any, b: any) => {
                                    return (Number(a.content_order || a.orderIndex) || 999) - (Number(b.content_order || b.orderIndex) || 999);
                                 }).map((tool: any) => (
                                    <div 
                                      key={tool.id} `;

code = code.replace(oldToolList, newToolList);

// Also fix the tool.subtopic fallback in the grouping
const oldGrouping = `        // Group by Chapter -> Subtopic for UI
        const grouped = matched.reduce((acc: any, tool: any) => {
          const ch = tool.chapter_name || 'General';
          const sub = tool.subtopic_name || 'General Subtopic';`;
          
const newGrouping = `        // Group by Chapter -> Subtopic for UI
        const grouped = matched.reduce((acc: any, tool: any) => {
          const ch = tool.chapter_name || tool.chapter || 'General';
          const sub = tool.subtopic_name || tool.subtopic || 'General Subtopic';`;

code = code.replace(oldGrouping, newGrouping);

fs.writeFileSync('kortex_users/teacher/AssignmentBuilderModal.tsx', code);
