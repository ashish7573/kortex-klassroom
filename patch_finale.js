const fs = require('fs');
const file = 'kortex_landing_page/LessonPlayer.tsx';
let code = fs.readFileSync(file, 'utf8');

const newFinale = `  if (showFinale) {
    if (!isLoggedIn) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center animate-fade-in font-sans px-4">
                <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
    
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-sky-500/30">
                            <Star className="text-white w-10 h-10 fill-white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">Great Job!</h1>
                        <p className="text-base md:text-lg text-slate-400 font-medium mb-8 max-w-2xl mx-auto">
                            You've completed this interactive module. Create a free account to unlock your progress report, save your score, and explore the entire Kortex library!
                        </p>
    
                        <div className="flex flex-col gap-4">
                            <button 
                                onClick={() => {
                                    onClose(); 
                                    const event = new CustomEvent('open-auth-modal', { detail: 'signup' });
                                    window.dispatchEvent(event);
                                }}
                                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-black py-4 rounded-xl text-lg shadow-lg hover:-translate-y-1 transition-all"
                            >
                                Create Free Account
                            </button>
                            <button 
                                onClick={onClose}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-xl text-md transition-colors"
                            >
                                Close and Return
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const exploreOptions = [`;

code = code.replace(`  if (showFinale) {\n    const exploreOptions = [`, newFinale);

fs.writeFileSync(file, code);
