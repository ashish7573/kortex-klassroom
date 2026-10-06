const fs = require('fs');
let code = fs.readFileSync('kortex_users/kortex_admin/SystemConfig.tsx', 'utf8');

// Fix needsUpdate logic
code = code.replace(
  /const needsUpdate = [\s\S]*?\(live\.video_url \|\| ''\) !== \(item\.video_url \|\| ''\);/,
  `const needsUpdate = 
                  live.grade !== item.grade ||
                  live.subject !== item.subject ||
                  live.title !== item.title ||
                  live.content_type !== item.content_type ||
                  (live.chapter_name || live.chapter || '') !== item.chapter_name ||
                  (live.content_url || live.video_url || '') !== item.video_url ||
                  (live.gameCode || '') !== item.gameCode ||
                  (live.quizCode || '') !== item.quizCode;`
);

// Map fields properly before pushing to toUpdate/toAdd
code = code.replace(
  /if \(needsUpdate\) toUpdate\.push\(item\);\n             \} else \{\n                toAdd\.push\(item\);\n             \}/,
  `
                // Ensure correct database field names are written
                const mappedItem = {
                  ...item,
                  content_url: item.video_url,
                  chapter_name: item.chapter_name
                };
                delete mappedItem.video_url; // Use content_url universally

                if (needsUpdate) toUpdate.push(mappedItem);
             } else {
                const mappedItem = {
                  ...item,
                  content_url: item.video_url,
                  chapter_name: item.chapter_name
                };
                delete mappedItem.video_url;
                toAdd.push(mappedItem);
             }
  `
);

fs.writeFileSync('kortex_users/kortex_admin/SystemConfig.tsx', code);
console.log("Fixed CSV mapping.");
