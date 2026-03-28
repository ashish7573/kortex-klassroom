import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle, Trophy, ArrowRight, Check, Play } from 'lucide-react';

const PomegranateSVG = () => (
  <svg viewBox="0 0 100 100" className="w-[120px] h-[120px] drop-shadow-md">
    <circle cx="50" cy="55" r="40" fill="#ef4444" />
    <path d="M35 25 L45 5 L50 15 L55 5 L65 25 Z" fill="#ef4444" />
    <circle cx="40" cy="45" r="4" fill="#fca5a5" />
    <circle cx="60" cy="50" r="5" fill="#fca5a5" />
    <circle cx="50" cy="70" r="4" fill="#fca5a5" />
  </svg>
);

const TamarindSVG = () => (
  <svg viewBox="0 0 100 100" className="w-[120px] h-[120px] drop-shadow-md transform -rotate-12">
    <circle cx="25" cy="50" r="18" fill="#78350f" />
    <circle cx="50" cy="50" r="16" fill="#78350f" />
    <circle cx="75" cy="50" r="18" fill="#78350f" />
    <rect x="25" y="34" width="50" height="32" fill="#78350f" />
  </svg>
);

const Emoji = ({ symbol }) => (
  <span className="text-[120px] leading-none drop-shadow-md select-none">{symbol}</span>
);

const QUIZ_DATA = [
  { id: 1, text: "चित्र पहचानें और सही अक्षर चुनें:", renderVisual: () => <PomegranateSVG />, options: ["आ", "अ", "इ", "उ"], correctAnswer: "अ", explanation: "'अ' से अनार (Pomegranate)।" },
  { id: 2, text: "चित्र पहचानें और सही अक्षर चुनें:", renderVisual: () => <Emoji symbol="🥭" />, options: ["इ", "ऊ", "आ", "अ"], correctAnswer: "आ", explanation: "'आ' से आम (Mango)।" },
  { id: 3, text: "चित्र पहचानें और सही अक्षर चुनें:", renderVisual: () => <TamarindSVG />, options: ["ई", "इ", "उ", "अ"], correctAnswer: "इ", explanation: "'इ' से इमली (Tamarind)।" },
  { id: 4, text: "चित्र पहचानें और सही अक्षर चुनें:", renderVisual: () => <Emoji symbol="🎋" />, options: ["उ", "अ", "आ", "ई"], correctAnswer: "ई", explanation: "'ई' से ईख (Sugarcane)।" },
  { id: 5, text: "चित्र पहचानें और सही अक्षर चुनें:", renderVisual: () => <Emoji symbol="🦉" />, options: ["ऊ", "उ", "इ", "आ"], correctAnswer: "उ", explanation: "'उ' से उल्लू (Owl)।" },
  { id: 6, text: "चित्र पहचानें और सही अक्षर चुनें:", renderVisual: () => <Emoji symbol="🧶" />, options: ["अ", "उ", "ऊ", "ई"], correctAnswer: "ऊ", explanation: "'ऊ' से ऊन (Wool)।" },
  { id: 7, text: "चित्र पहचानें और सही अक्षर चुनें:", renderVisual: () => <Emoji symbol="🥭" />, options: ["आ", "इ", "ऊ", "अ"], correctAnswer: "आ", explanation: "याद है? 'आ' से आम!" },
  { id: 8, text: "चित्र पहचानें और सही अक्षर चुनें:", renderVisual: () => <PomegranateSVG />, options: ["उ", "अ", "आ", "ई"], correctAnswer: "अ", explanation: "फिर से! 'अ' से अनार।" },
  { id: 9, text: "चित्र पहचानें और सही अक्षर चुनें:", renderVisual: () => <Emoji symbol="🦉" />, options: ["उ", "ऊ", "इ", "अ"], correctAnswer: "उ", explanation: "शाबाश! 'उ' से उल्लू।" },
  { id: 10, text: "चित्र पहचानें और सही अक्षर चुनें:", renderVisual: () => <Emoji symbol="🧶" />, options: ["ऊ", "आ", "ई", "इ"], correctAnswer: "ऊ", explanation: "बहुत बढ़िया! 'ऊ' से ऊन।" }
];

export default function QuizComponent({ onComplete = (result: { score: number; stars: number }) => {} }) {
  // NEW: 3-State Architecture
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'completed'
  
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
      setGameState('completed'); // TRIGGERS RESULTS SCREEN
    }
  };

  const handleFinish = () => {
    onComplete({ score, stars });
  };

  const getOptionStyles = (option) => {
    if (!isAnswerSubmitted) return "border-slate-100 text-slate-700 bg-white hover:border-sky-500 hover:bg-sky-50 hover:shadow-sm";
    if (option === question.correctAnswer) return "border-lime-500 bg-lime-100 text-lime-800 z-10 shadow-sm";
    if (option === selectedAnswer && option !== question.correctAnswer) return "border-rose-500 bg-rose-100 text-rose-800 z-10 shadow-sm";
    return "border-slate-100 text-slate-400 bg-slate-50 opacity-50 cursor-not-allowed";
  };

  // --- STATE 1: START SCREEN ---
  if (gameState === 'start') {
    return (
      <div className="w-full h-full max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-6 md:p-12 flex flex-col items-center justify-center text-center">
        <div className="bg-sky-100 w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center mb-6 md:mb-8 shadow-inner">
          <Emoji symbol="🥭" className="text-[50px] md:text-[70px]" />
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-4">चित्र से व्यंजन पहचानो</h2>
        <p className="text-base md:text-xl font-bold text-slate-500 mb-8 max-w-lg">
          Look at the picture on the left, and choose the correct starting letter!
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

  // --- STATE 3: RESULTS SCREEN ---
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
          onClick={handleFinish}
          className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg md:text-xl py-4 px-12 rounded-xl md:rounded-2xl transition-colors shadow-sm flex items-center justify-center space-x-2"
        >
          <span>Finish & Save</span><Check className="w-6 h-6" />
        </button>
      </div>
    );
  }

  // --- STATE 2: ACTIVE QUIZ SCREEN ---
  return (
    <div className="w-full h-full max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border-2 border-slate-100 flex flex-col overflow-hidden">
      
      {/* MINIMALIST HEADER & PROGRESS */}
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

      {/* MAIN PLAY CANVAS */}
      <div className="flex-1 min-h-0 px-4 md:px-8 py-2 md:py-6 flex flex-col md:flex-row gap-3 md:gap-8 items-center justify-center">
        
        {/* Left: Image/Emoji Display */}
        <div className="w-full md:w-1/2 md:h-full flex flex-col items-center justify-center bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] border-2 border-slate-100 py-6 md:py-4 lg:py-8 px-4 md:px-6 flex-shrink-0 md:flex-shrink">
          <div className="flex justify-center items-center transform transition-transform hover:scale-105 scale-[0.6] md:scale-[0.8] lg:scale-100 -my-6 md:my-0 origin-center">
            {question.renderVisual()}
          </div>
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
                  relative py-3 md:py-3 lg:py-4 rounded-xl md:rounded-2xl border-2 md:border-4 text-2xl md:text-4xl lg:text-5xl font-black transition-all duration-200 
                  flex items-center justify-center min-h-[80px] md:min-h-[90px] lg:min-h-[110px]
                  ${getOptionStyles(option)}
                `}
              >
                {option}
                
                {/* Result Icons */}
                {isAnswerSubmitted && option === question.correctAnswer && <CheckCircle className="absolute top-2 right-2 md:top-3 md:right-3 w-6 h-6 md:w-8 md:h-8 text-lime-600 bg-white rounded-full z-20 shadow-sm" />}
                {isAnswerSubmitted && selectedAnswer === option && option !== question.correctAnswer && <XCircle className="absolute top-2 right-2 md:top-3 md:right-3 w-6 h-6 md:w-8 md:h-8 text-rose-600 bg-white rounded-full z-20 shadow-sm" />}
              </button>
            ))}
          </div>

          {/* Feedback & Next Button */}
          <div className={`mt-1 md:mt-1 lg:mt-2 min-h-[50px] md:min-h-[60px] lg:min-h-[75px] flex flex-col justify-end transition-opacity duration-300 ${isAnswerSubmitted ? 'opacity-100' : 'opacity-0'}`}>
            {isAnswerSubmitted && (
              <div className={`p-2 md:p-2 lg:p-3 rounded-xl md:rounded-2xl border-2 mb-2 lg:mb-2 font-bold flex items-center md:items-start space-x-2 md:space-x-3 ${selectedAnswer === question.correctAnswer ? 'bg-lime-50 border-lime-200 text-lime-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                <div className="shrink-0">{selectedAnswer === question.correctAnswer ? <CheckCircle className="w-5 h-5 md:w-5 md:h-6 text-lime-600" /> : <XCircle className="w-5 h-5 md:w-5 md:h-6 text-rose-600" />}</div>
                <div>
                  <span className="block text-sm md:text-sm lg:text-base mb-0">{selectedAnswer === question.correctAnswer ? 'बिल्कुल सही! (Correct!)' : 'गलत उत्तर (Wrong!)'}</span>
                  {/* Explanation hidden on mobile to save vertical space */}
                  <span className="hidden md:block text-slate-600 text-xs lg:text-sm">{question.explanation}</span>
                </div>
              </div>
            )}

            {isAnswerSubmitted && (
              <button onClick={handleNextQuestion} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm md:text-base lg:text-lg py-3 md:py-2 lg:py-3 px-4 md:px-6 rounded-xl md:rounded-2xl transition-colors shadow-sm flex items-center justify-center space-x-2">
                <span>{currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}</span><ArrowRight className="w-5 h-5 md:w-5 md:h-6" />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}