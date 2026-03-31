import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle, Trophy, ArrowRight, Check, Play, Volume2 } from 'lucide-react';
import { HINDI_ASSETS } from '../../utils/hindiRegistry'; // Make sure this path points to your registry file!

// --- NEW DYNAMIC IMAGE COMPONENT ---
const RegistryVisual = ({ letter, exampleIndex = 0 }) => {
  const data = HINDI_ASSETS.swar[letter];
  
  if (!data || !data.examples[exampleIndex]) {
    return <div className="text-slate-400 font-bold p-8 border-2 border-dashed rounded-3xl">Asset Missing</div>;
  }

  const example = data.examples[exampleIndex];

  const playSound = () => {
    if (data.letterAudio) {
      const audio = new Audio(data.letterAudio);
      audio.play().catch(e => console.error("Audio play failed:", e));
    }
  };

  return (
    <div 
      onClick={playSound}
      className="relative flex flex-col items-center justify-center cursor-pointer group"
    >
      <img 
        src={example.image} 
        alt={example.english} 
        className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-xl transition-transform group-hover:scale-105"
        onError={(e) => { e.target.src = '/assets/placeholder.png'; }}
      />
      
      <button className="absolute -bottom-4 bg-white px-4 py-2 rounded-full shadow-md flex items-center gap-2 border-2 border-sky-100 text-sky-500 font-bold text-xs uppercase tracking-wider group-hover:bg-sky-50 transition-colors">
        <Volume2 size={16} /> Tap to Hear
      </button>
    </div>
  );
};

// --- UPDATED QUIZ DATA ---
const QUIZ_DATA = [
  { id: 1, text: "चित्र पहचानें और सही अक्षर चुनें:", renderVisual: () => <RegistryVisual letter="अ" exampleIndex={0} />, options: ["आ", "अ", "इ", "उ"], correctAnswer: "अ", explanation: "'अ' से अनार (Pomegranate)।" },
  { id: 2, text: "चित्र पहचानें और सही अक्षर चुनें:", renderVisual: () => <RegistryVisual letter="आ" exampleIndex={0} />, options: ["इ", "ऊ", "आ", "अ"], correctAnswer: "आ", explanation: "'आ' से आम (Mango)।" },
  { id: 3, text: "चित्र पहचानें और सही अक्षर चुनें:", renderVisual: () => <RegistryVisual letter="इ" exampleIndex={3} />, options: ["ई", "इ", "उ", "अ"], correctAnswer: "इ", explanation: "'इ' से इमली (Tamarind)।" },
  { id: 4, text: "चित्र पहचानें और सही अक्षर चुनें:", renderVisual: () => <RegistryVisual letter="ई" exampleIndex={0} />, options: ["उ", "अ", "आ", "ई"], correctAnswer: "ई", explanation: "'ई' से ईंख (Sugarcane)।" },
  { id: 5, text: "चित्र पहचानें और सही अक्षर चुनें:", renderVisual: () => <RegistryVisual letter="उ" exampleIndex={1} />, options: ["ऊ", "उ", "इ", "आ"], correctAnswer: "उ", explanation: "'उ' से उल्लू (Owl)।" },
  { id: 6, text: "चित्र पहचानें और सही अक्षर चुनें:", renderVisual: () => <RegistryVisual letter="ऊ" exampleIndex={2} />, options: ["अ", "उ", "ऊ", "ई"], correctAnswer: "ऊ", explanation: "'ऊ' से ऊन (Wool)।" },
  { id: 7, text: "चित्र पहचानें और सही अक्षर चुनें:", renderVisual: () => <RegistryVisual letter="आ" exampleIndex={2} />, options: ["आ", "इ", "ऊ", "अ"], correctAnswer: "आ", explanation: "याद है? 'आ' से आग (Fire)!" },
  { id: 8, text: "चित्र पहचानें और सही अक्षर चुनें:", renderVisual: () => <RegistryVisual letter="अ" exampleIndex={1} />, options: ["उ", "अ", "आ", "ई"], correctAnswer: "अ", explanation: "फिर से! 'अ' से अदरक (Ginger)।" },
  { id: 9, text: "चित्र पहचानें और सही अक्षर चुनें:", renderVisual: () => <RegistryVisual letter="उ" exampleIndex={0} />, options: ["उ", "ऊ", "इ", "अ"], correctAnswer: "उ", explanation: "शाबाश! 'उ' से उपहार (Gift)।" },
  { id: 10, text: "चित्र पहचानें और सही अक्षर चुनें:", renderVisual: () => <RegistryVisual letter="ऊ" exampleIndex={1} />, options: ["ऊ", "आ", "ई", "इ"], correctAnswer: "ऊ", explanation: "बहुत बढ़िया! 'ऊ' से ऊंट (Camel)।" }
];

export default function QuizComponent({ onComplete = (result) => {} }) {
  const [gameState, setGameState] = useState('start'); 
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    const shuffled = [...QUIZ_DATA].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
  }, []);

  useEffect(() => {
    if (gameState === 'completed' && questions.length > 0) {
      let earnedStars = 1;
      if (score === questions.length) earnedStars = 3;
      else if (score >= questions.length * 0.7) earnedStars = 2;
      setStars(earnedStars);
    }
  }, [gameState, score, questions.length]);

  if (questions.length === 0) return null;

  const question = questions[currentQuestion];
  const progressPercentage = ((currentQuestion) / questions.length) * 100;

  const handleOptionClick = (option) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(option);
    setIsAnswerSubmitted(true);
    if (option === question.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      setGameState('completed');
    }
  };

  const getOptionStyles = (option) => {
    if (!isAnswerSubmitted) return "border-slate-100 text-slate-700 bg-white hover:border-sky-500 hover:bg-sky-50 hover:shadow-sm";
    if (option === question.correctAnswer) return "border-lime-500 bg-lime-100 text-lime-800 z-10 shadow-sm";
    if (option === selectedAnswer && option !== question.correctAnswer) return "border-rose-500 bg-rose-100 text-rose-800 z-10 shadow-sm";
    return "border-slate-100 text-slate-400 bg-slate-50 opacity-50 cursor-not-allowed";
  };

  if (gameState === 'start') {
    return (
      <div className="w-full h-full max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-6 md:p-12 flex flex-col items-center justify-center text-center">
        <div className="bg-sky-100 w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-inner overflow-hidden border-4 border-sky-50">
          <img src={HINDI_ASSETS.swar['आ'].examples[0].image} alt="Welcome" className="w-20 h-20 object-contain drop-shadow-md" />
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-4">चित्र से अक्षर पहचानो</h2>
        <p className="text-base md:text-xl font-bold text-slate-500 mb-8 max-w-lg">
          Look at the picture, tap it to hear the sound, and choose the correct starting letter!
        </p>
        <button
          onClick={() => setGameState('playing')}
          className="w-full md:w-auto bg-gradient-to-b from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white font-bold text-xl md:text-2xl py-4 px-12 rounded-2xl shadow-lg shadow-sky-200 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Play className="fill-white w-6 h-6" /> Start Quiz
        </button>
      </div>
    );
  }

  if (gameState === 'completed') {
    return (
      <div className="w-full h-full max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-6 md:p-12 flex flex-col items-center justify-center text-center overflow-y-auto">
        <div className="bg-sky-50 p-6 rounded-full mb-6 border-4 border-sky-100">
          <Trophy className="w-16 h-16 md:w-20 md:h-20 text-sky-500" />
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">Quiz Complete!</h2>
        <p className="text-lg md:text-xl font-bold text-slate-500 mb-8">
          You scored {score} out of {questions.length}
        </p>
        <div className="flex space-x-2 md:space-x-4 mb-10">
          {[1, 2, 3].map((starIndex) => (
            <Star
              key={starIndex}
              className={`w-12 h-12 md:w-16 md:h-16 transition-all duration-500 transform ${
                starIndex <= stars ? 'text-yellow-400 fill-yellow-400 scale-110 drop-shadow-md' : 'text-slate-200 fill-slate-100 scale-100'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => onComplete({ score, stars })}
          className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg md:text-xl py-4 px-12 rounded-xl md:rounded-2xl transition-colors shadow-sm flex items-center justify-center space-x-2"
        >
          <span>Finish & Save</span><Check className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border-2 border-slate-100 flex flex-col overflow-hidden">
      
      <div className="px-4 md:px-8 pt-4 md:pt-6 pb-2 md:pb-4 flex-shrink-0">
        <div className="flex justify-between items-center mb-2 md:mb-3">
          <span className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-wider">{question.text}</span>
          <span className="text-xs md:text-sm font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-lg border border-sky-100 shrink-0">
            {currentQuestion + 1} / {questions.length}
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2 md:h-3 rounded-full overflow-hidden">
          <div className="bg-sky-500 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercentage}%` }} />
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 md:px-8 py-2 md:py-6 flex flex-col md:flex-row gap-3 md:gap-8 items-center justify-center">
        
        {/* Left: Dynamic Registry Image */}
        <div className="w-full md:w-1/2 md:h-full flex flex-col items-center justify-center bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] border-2 border-slate-100 py-10 px-4 flex-shrink-0 md:flex-shrink">
          {question.renderVisual()}
        </div>

        {/* Right: Text Options */}
        <div className="w-full md:w-1/2 flex flex-col space-y-4 md:space-y-2 lg:space-y-3">
          <div className="grid grid-cols-2 gap-2 md:gap-3 lg:gap-4">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                disabled={isAnswerSubmitted}
                className={`
                  relative py-3 lg:py-4 rounded-xl md:rounded-2xl border-2 md:border-4 text-3xl md:text-4xl lg:text-5xl font-black transition-all duration-200 
                  flex items-center justify-center min-h-[80px] md:min-h-[100px]
                  ${getOptionStyles(option)}
                `}
              >
                {option}
                {isAnswerSubmitted && option === question.correctAnswer && <CheckCircle className="absolute top-2 right-2 md:top-3 md:right-3 w-6 h-6 md:w-8 md:h-8 text-lime-600 bg-white rounded-full z-20 shadow-sm" />}
                {isAnswerSubmitted && selectedAnswer === option && option !== question.correctAnswer && <XCircle className="absolute top-2 right-2 md:top-3 md:right-3 w-6 h-6 md:w-8 md:h-8 text-rose-600 bg-white rounded-full z-20 shadow-sm" />}
              </button>
            ))}
          </div>

          <div className={`mt-2 min-h-[60px] lg:min-h-[75px] flex flex-col justify-end transition-opacity duration-300 ${isAnswerSubmitted ? 'opacity-100' : 'opacity-0'}`}>
            {isAnswerSubmitted && (
              <div className={`p-3 rounded-xl md:rounded-2xl border-2 mb-2 font-bold flex items-center md:items-start space-x-3 ${selectedAnswer === question.correctAnswer ? 'bg-lime-50 border-lime-200 text-lime-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                <div className="shrink-0">{selectedAnswer === question.correctAnswer ? <CheckCircle className="w-5 h-6 text-lime-600" /> : <XCircle className="w-5 h-6 text-rose-600" />}</div>
                <div>
                  <span className="block text-sm lg:text-base mb-0">{selectedAnswer === question.correctAnswer ? 'बिल्कुल सही! (Correct!)' : 'गलत उत्तर (Wrong!)'}</span>
                  <span className="hidden md:block text-slate-600 text-xs lg:text-sm">{question.explanation}</span>
                </div>
              </div>
            )}

            {isAnswerSubmitted && (
              <button onClick={handleNextQuestion} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-base lg:text-lg py-3 px-6 rounded-xl md:rounded-2xl transition-colors shadow-sm flex items-center justify-center space-x-2">
                <span>{currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}</span><ArrowRight className="w-5 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}