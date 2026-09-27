const fs = require('fs');

let content = fs.readFileSync('app/page.tsx', 'utf8');

// Ensure Eye, EyeOff are imported in page.tsx
if (!content.includes('Eye,')) {
    content = content.replace(
      "import { Search, ChevronDown, CheckCircle, Plus, Edit3, Trash2, Clock, Play, BookOpen, Star, Sparkles, Book, Info, AlertTriangle, XCircle, ArrowRight, Building2, KeyRound, Heart, LogOut, CheckCircle2, UserCheck, ShieldAlert, MonitorPlay, FileText, Send, User, Lock, Mail, Users, Settings, Database, Code, UploadCloud, DownloadCloud } from 'lucide-react';",
      "import { Search, ChevronDown, CheckCircle, Plus, Edit3, Trash2, Clock, Play, BookOpen, Star, Sparkles, Book, Info, AlertTriangle, XCircle, ArrowRight, Building2, KeyRound, Heart, LogOut, CheckCircle2, UserCheck, ShieldAlert, MonitorPlay, FileText, Send, User, Lock, Mail, Users, Settings, Database, Code, UploadCloud, DownloadCloud, Eye, EyeOff } from 'lucide-react';"
    );
}

// Add state
content = content.replace(
  "const [password, setPassword] = useState('');",
  "const [password, setPassword] = useState('');\n  const [showPassword, setShowPassword] = useState(false);"
);

// Modify input
const oldInput = `<input type="password" placeholder="Password" required value={password} onChange={(e: any) => setPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-slate-400" />`;
const newInput = `<div className="relative">
            <input type={showPassword ? "text" : "password"} placeholder="Password" required value={password} onChange={(e: any) => setPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 pr-10 py-3 font-bold text-slate-700 outline-none focus:border-slate-400" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>`;

content = content.replace(oldInput, newInput);

fs.writeFileSync('app/page.tsx', content);
console.log('Fixed Krew login');
