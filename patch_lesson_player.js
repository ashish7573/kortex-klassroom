const fs = require('fs');
let code = fs.readFileSync('kortex_landing_page/LessonPlayer.tsx', 'utf8');

const oldGuestScreen = `                        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">Great Job!</h1>
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
                        </div>`;

const newGuestScreen = `                        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">Loved it?</h1>
                        <p className="text-base md:text-lg text-slate-400 font-medium mb-8 max-w-2xl mx-auto">
                            Try considering Signing up for more such Smart Learning Tools for your Child.
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
                                Sign Up
                            </button>
                            
                            <div className="relative py-4">
                               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
                               <div className="relative flex justify-center"><span className="bg-slate-900 px-4 text-sm text-slate-500 font-bold uppercase tracking-wider">Are you an Educator or Institution ?</span></div>
                            </div>
                            
                            <button 
                                onClick={() => {
                                    onClose(); 
                                    const event = new CustomEvent('open-quote-modal');
                                    window.dispatchEvent(event);
                                }}
                                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black py-4 rounded-xl text-lg shadow-lg hover:-translate-y-1 transition-all"
                            >
                                Get Quote
                            </button>

                            <button 
                                onClick={onClose}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-md transition-colors mt-2"
                            >
                                Close
                            </button>
                        </div>`;

code = code.replace(oldGuestScreen, newGuestScreen);
fs.writeFileSync('kortex_landing_page/LessonPlayer.tsx', code);
