const fs = require('fs');
let code = fs.readFileSync('kortex_landing_page/TierLibraryView.tsx', 'utf8');

// Need to add query, where to imports if not there.
if (!code.includes('query')) {
    code = code.replace(
        `import { collection, getDocs } from 'firebase/firestore';`,
        `import { collection, getDocs, query, where } from 'firebase/firestore';`
    );
}

const oldCode = `        const snapshot = await getDocs(collection(db, 'learning_tools'));
        let extractedItems: any[] = [];
        
        snapshot.docs.forEach(doc => {
          const item: any = { id: doc.id, ...doc.data() };
          const type = item.content_type?.toLowerCase() || '';
          
          let belongsToTier = false;
          if (activeTier.id === 'conceptualiser' && type === 'conceptualiser') belongsToTier = true;
          else if (activeTier.id === 'theatre' && type === 'video') belongsToTier = true;
          else if (activeTier.id === 'dojo' && type === 'quiz') belongsToTier = true;
          else if (activeTier.id === 'Notebook' && type === 'pdf') belongsToTier = true;
          else if (activeTier.id === 'arcade' && type === 'game') belongsToTier = true;`;

const newCode = `        let contentTypeMap: Record<string, string> = {
           'conceptualiser': 'conceptualiser',
           'theatre': 'video',
           'dojo': 'quiz',
           'Notebook': 'pdf',
           'arcade': 'game'
        };
        const targetType = contentTypeMap[activeTier.id];
        
        const toolsQuery = targetType ? query(collection(db, 'learning_tools'), where('content_type', '==', targetType)) : query(collection(db, 'learning_tools'));
        const snapshot = await getDocs(toolsQuery).catch(() => ({ docs: [] }));
        
        let extractedItems: any[] = [];
        
        snapshot.docs.forEach((doc: any) => {
          const item: any = { id: doc.id, ...doc.data() };
          const type = item.content_type?.toLowerCase() || '';
          
          let belongsToTier = false;
          if (activeTier.id === 'conceptualiser' && type === 'conceptualiser') belongsToTier = true;
          else if (activeTier.id === 'theatre' && type === 'video') belongsToTier = true;
          else if (activeTier.id === 'dojo' && type === 'quiz') belongsToTier = true;
          else if (activeTier.id === 'Notebook' && type === 'pdf') belongsToTier = true;
          else if (activeTier.id === 'arcade' && type === 'game') belongsToTier = true;`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('kortex_landing_page/TierLibraryView.tsx', code);
