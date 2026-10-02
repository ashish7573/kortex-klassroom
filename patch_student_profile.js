const fs = require('fs');
const file = 'types/user.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `  is_pro?: boolean;
}`,
  `  is_pro?: boolean;

  // Gamification & Progress
  current_streak_days?: number;
  last_active_date?: string;
  total_xp?: number;
  achievements?: string[];
}

export interface SubjectProgress {
  subject_id: string;              
  xp: number;                      
  total_time_spent_seconds: number;
  completed_tools: {
    [toolId: string]: {
      chapter_name: string;
      last_played_at: string;
      times_completed: number;
      best_score?: number;         
    }
  };
  last_played_at: string;
}`
);

fs.writeFileSync(file, code);
