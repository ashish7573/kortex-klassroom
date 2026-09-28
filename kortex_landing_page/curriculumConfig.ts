import { 
  Type, FileText, Calculator, Leaf, Globe, Brain, Activity, 
  Star, Palette, Music, Monitor, Lightbulb, Video, Target, Gamepad2 
} from 'lucide-react';

export const GRADES = [
  'FLN', 'Balvatika 1', 'Balvatika 2', 'Balvatika 3', 
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 
  'Grade 6', 'Grade 7', 'Grade 8'
];

export const SUBJECTS = [
  'English', 'Hindi', 'Maths', 'EVS', 'SST', 
  'Mental Training', 'Physical Training and Sports', 
  'Theatre', 'Art and Craft Forms', 'Music and Dance Forms', 
  'Computers and AI'
];

export const SUBJECT_ICONS: Record<string, { icon: any; color: string }> = {
  'English': { icon: Type, color: 'text-blue-500' },
  'Hindi': { icon: FileText, color: 'text-orange-500' },
  'Maths': { icon: Calculator, color: 'text-rose-500' },
  'EVS': { icon: Leaf, color: 'text-lime-500' },
  'SST': { icon: Globe, color: 'text-emerald-500' },
  'Mental Training': { icon: Brain, color: 'text-purple-500' },
  'Physical Training and Sports': { icon: Activity, color: 'text-red-500' },
  'Theatre': { icon: Star, color: 'text-amber-500' },
  'Art and Craft Forms': { icon: Palette, color: 'text-pink-500' },
  'Music and Dance Forms': { icon: Music, color: 'text-indigo-500' },
  'Computers and AI': { icon: Monitor, color: 'text-cyan-500' }
};

// Beautiful subject-specific fallbacks if CSV doesn't provide an image
export const SUBJECT_IMAGES: Record<string, string> = {
  'English': '/thumbnails/english-cover.webp',
  'Hindi': '/thumbnails/hindi-cover.webp',
  'Maths': '/thumbnails/maths-cover.webp',
  'EVS': '/thumbnails/evs-cover.webp',
  'SST': '/thumbnails/sst-cover.webp',
  'Mental Training': '/thumbnails/mental-training-cover.webp',
  'Physical Training and Sports': '/thumbnails/sports-cover.webp',
  'Computers and AI': '/thumbnails/computers-cover.webp',
  'DEFAULT': '/thumbnails/default-cover.webp'
};

export const getSubjectFallbackImage = (subjectStr: any) => {
  const cleanSubj = subjectStr?.toLowerCase().trim() === 'mathematics' ? 'Maths' : subjectStr?.trim();
  return (SUBJECT_IMAGES as any)[cleanSubj] || SUBJECT_IMAGES['DEFAULT'];
};

export const getYouTubeThumbnail = (url: any) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
};

// Global 5-Tier Configuration
export const FIVE_TIERS = [
  { 
    id: 'conceptualiser', label: 'Conceptualiser', desc: 'Interactive Sandbox', 
    mainColor: 'bg-purple-500', lightColor: 'bg-purple-50', borderColor: 'border-purple-500', textColor: 'text-purple-500', 
    icon: Lightbulb, actionText: 'View All Conceptualisers'
  },
  { 
    id: 'theatre', label: 'Kortex Theatre', desc: 'Video Lessons', 
    mainColor: 'bg-pink-500', lightColor: 'bg-pink-50', borderColor: 'border-pink-500', textColor: 'text-pink-500', 
    icon: Video, actionText: 'View All Videos'
  },
  { 
    id: 'dojo', label: 'The Dojo', desc: 'Digital Quizzes', 
    mainColor: 'bg-orange-500', lightColor: 'bg-orange-50', borderColor: 'border-orange-500', textColor: 'text-orange-500', 
    icon: Target, actionText: 'View All Quizzes'
  },
  { 
    id: 'Notebook', label: 'The Notebook', desc: 'PDFs & Guides', 
    mainColor: 'bg-sky-500', lightColor: 'bg-sky-50', borderColor: 'border-sky-500', textColor: 'text-sky-500', 
    icon: FileText, actionText: 'View All Worksheets'
  },
  { 
    id: 'arcade', label: 'Kortex Arcade', desc: 'Conceptual Games', 
    mainColor: 'bg-lime-500', lightColor: 'bg-lime-50', borderColor: 'border-lime-500', textColor: 'text-lime-600', 
    icon: Gamepad2, actionText: 'View All Games'
  }
];

export const TRANSLATIONS: Record<string, any> = {
  en: { app_name: "Kortex Klassroom", select_role: "Select Your Role", student: "Student", teacher: "Teacher", parent: "Parent" },
  hi: { app_name: "कॉर्टेक्स क्लासरूम", select_role: "अपनी भूमिका चुनें", student: "छात्र", teacher: "शिक्षक", parent: "अभिभावक" }
};

export const TESTIMONIALS = [
  { name: "Priya Sharma", role: "Parent of Grade 4 Student", text: "Kortex Klassroom has completely transformed how my son learns. The gamified approach keeps him engaged, and I love tracking his holistic growth!", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=ffdfbf" },
  { name: "Rahul Verma", role: "Middle School Teacher", text: "The lesson plans and auto-generated analytics are a lifesaver. It aligns perfectly with the NCF and saves me hours of planning every single week.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul&backgroundColor=b6e3f4" },
  { name: "Anita Desai", role: "School Principal", text: "A truly complete platform. The focus on both academic competencies and mental wellbeing makes this the gold standard for NEP 2020 implementation.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anita&backgroundColor=c0aede" }
];
