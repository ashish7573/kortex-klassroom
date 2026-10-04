const fs = require('fs');
let code = fs.readFileSync('kortex_landing_page/all_lessons_page.tsx', 'utf8');

const oldDeps = `      } finally { 
        setIsLoading(false); 
      }
    }
    
    fetchLessons();
  }, []);`;

const newDeps = `      } finally { 
        setIsLoading(false); 
      }
    }
    
    fetchLessons();
  }, [selectedClass, selectedSubject]);`;

code = code.replace(oldDeps, newDeps);

fs.writeFileSync('kortex_landing_page/all_lessons_page.tsx', code);
