import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle, Trophy, ArrowRight, Check } from 'lucide-react';

// --- VISUAL ASSETS (Adjusted for button sizes) ---
const PomegranateSVG = ({ className = "w-[80px] h-[80px]" }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-md`}>
    <circle cx="50" cy="55" r="40" fill="#ef4444" />
    <path d="M35 25 L45 5 L50 15 L55 5 L65 25 Z" fill="#ef4444" />
    <circle cx="40" cy="45" r="4" fill="#fca5a5" />
    <circle cx="60" cy="50" r="5" fill="#fca5a5" />
    <circle cx="50" cy="70" r="4" fill="#fca5a5" />
  </svg>
);

const TamarindSVG = ({ className = "w-[80px] h-[80px]" }) => (
  <svg viewBox="0 0 100 100" className={`${className} drop-shadow-md transform -rotate-12`}>
    <circle cx="25" cy="50" r="18" fill="#78350f" />
    <circle cx="50" cy="50" r="16" fill="#78350f" />
    <circle cx="75" cy="50" r="18" fill="#78350f" />
    <rect x="25" y="34" width="50" height="32" fill="#78350f" />
  </svg>
);

const Emoji = ({ symbol, className = "text-[80px]" }) => (
  <span className={`${className} leading-none drop-shadow-md select-none`}>{symbol}</span>
);

// Map the correct letter to its visual component
const VISUAL_MAP = {
  "अ": () => <PomegranateSVG />,
  "आ": () => <Emoji symbol="🥭" />,
  "इ": () => <TamarindSVG />,
  "ई": () => <Emoji symbol="🎋" />,
  "उ": () => <Emoji symbol="🦉" />,
  "ऊ": () => <Emoji symbol="🧶" />
};

// --- QUIZ DATA ---
const QUIZ_DATA = [
  {
    id: 1,
    text: "अक्षर पहचानें और सही चित्र चुनें:",
    letter: "अ",
    options: ["आ", "अ", "इ", "उ"],
    correctAnswer: "अ",
    explanation: "'अ' से अनार (Pomegranate)।"
  },
  {
    id: 2,
    text: "अक्षर पहचानें और सही चित्र चुनें:",
    letter: "आ",
    options: ["इ", "ऊ", "आ", "अ"],
    correctAnswer: "आ",
    explanation: "'आ' से आम (Mango)।"
  },
  {
    id: 3,
    text: "अक्षर पहचानें और सही चित्र चुनें:",
    letter: "इ",
    options: ["ई", "इ", "उ", "अ"],
    correctAnswer: "इ",
    explanation: "'इ' से इमली (Tamarind)।"
  },
  {
    id: 4,
    text: "अक्षर पहचानें और सही चित्र चुनें:",
    letter: "ई",
    options: ["उ", "अ", "आ", "ई"],
    correctAnswer: "ई",
    explanation: "'ई' से ईख (Sugarcane)।"
  },
  {
    id: 5,
    text: "अक्षर पहचानें और सही चित्र चुनें:",
    letter: "उ",
    options: ["ऊ", "उ", "इ", "आ"],
    correctAnswer: "उ",
    explanation: "'उ' से उल्लू (Owl)।"
  },
  {
    id: 6,
    text: "अक्षर पहचानें और सही चित्र चुनें:",
    letter: "ऊ",
    options: ["अ", "उ", "ऊ", "ई"],
    correctAnswer: "ऊ",
    explanation: "'ऊ' से ऊन (Wool)।"
  },
  {
    id: 7,
    text: "अक्षर पहचानें और सही चित्र चुनें:",
    letter: "आ",
    options: ["आ", "इ", "ऊ", "अ"],
    correctAnswer: "आ",
    explanation: "याद है? 'आ' से आम!"
  },
  {
    id: 8,
    text: "अक्षर पहचानें और सही चित्र चुनें:",
    letter: "अ",
    options: ["उ", "अ", "आ", "ई"],
    correctAnswer: "अ",
    explanation: "फिर से! 'अ' से अनार।"
  },
  {
    id: 9,
    text: "अक्षर पहचानें और सही चित्र चुनें:",
    letter: "ई",
    options: ["उ", "ऊ", "ई", "अ"],
    correctAnswer: "ई",
    explanation: "याद है? 'ई' से ईख!"
  },
  {
    id: 10,
    text: "अक्षर पहचानें और सही चित्र चुनें:",
    letter: "ऊ",
    options: ["ऊ", "आ", "ई", "इ"],
    correctAnswer: "ऊ",
    explanation: "बहुत बढ़िया! 'ऊ' से ऊन।"
  }
];

export default function AlphabetImageQuiz({ onComplete = (result: { score: number; stars: number }) => {} }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    // Shuffle the questions array on mount for randomization
    const shuffled = [...QUIZ_DATA].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
  }, []);

  // Calculate stars when quiz completes
  useEffect(() => {
    if (quizComplete && questions.length > 0) {
      let earnedStars = 1;
      if (score === questions.length) earnedStars = 3;
      else if (score >= questions.length * 0.7) earnedStars = 2;
      setStars(earnedStars);
    }
  }, [quizComplete, score, questions.length]);

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
      setQuizComplete(true);
    }
  };

  const handleFinish = () => {
    onComplete({ score, stars });
  };

  // --- RENDERING HELPERS ---
  const getOptionStyles = (option) => {
    if (!isAnswerSubmitted) {
      return "border-slate-100 bg-white hover:border-sky-500 hover:bg-sky-50 hover:shadow-sm";
    }

    if (option === question.correctAnswer) {
      return "border-lime-500 bg-lime-100 z-10 shadow-sm";
    }

    if (option === selectedAnswer && option !== question.correctAnswer) {
      return "border-rose-500 bg-rose-100 z-10 shadow-sm";
    }

    // Unselected wrong options after submission
    return "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed";
  };

  // --- RESULTS SCREEN ---
  if (quizComplete) {
    return (
      <div className="w-full max-w-4xl mx-auto min-h-[500px] bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-8 flex flex-col items-center justify-center text-center">
        <div className="bg-sky-50 p-6 rounded-full mb-6 border-4 border-sky-100">
          <Trophy className="w-20 h-20 text-sky-500" />
        </div>
        
        <h2 className="text-4xl font-black text-slate-800 mb-2">Quiz Complete!</h2>
        <p className="text-xl font-bold text-slate-500 mb-8">
          You scored {score} out of {questions.length}
        </p>

        <div className="flex space-x-4 mb-10">
          {[1, 2, 3].map((starIndex) => (
            <Star
              key={starIndex}
              className={`w-16 h-16 transition-all duration-500 transform ${
                starIndex <= stars 
                  ? 'text-yellow-400 fill-yellow-400 scale-110 drop-shadow-md' 
                  : 'text-slate-200 fill-slate-100 scale-100'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleFinish}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xl py-4 px-12 rounded-2xl transition-colors shadow-sm flex items-center space-x-2"
        >
          <span>Finish & Save</span>
          <Check className="w-6 h-6" />
        </button>
      </div>
    );
  }

  // --- ACTIVE QUIZ SCREEN ---
  return (
    <div className="w-full h-full max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border-2 border-slate-100 flex flex-col overflow-hidden">
      
      {/* Header & Progress */}
      <div className="px-8 pt-8 pb-4">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800">
              Grade KG - व्यंजन से चित्र पहचानो <span className="text-slate-400 text-lg font-bold ml-2">(अ से ऊ)</span>
            </h1>
          </div>
          <div className="text-lg font-bold text-sky-500 bg-sky-50 px-4 py-1.5 rounded-xl border border-sky-100">
            {currentQuestion + 1} / {questions.length}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
          <div 
            className="bg-sky-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 px-4 md:px-8 py-2 md:py-6 flex flex-col md:flex-row gap-3 md:gap-8 items-center justify-center">
        
        {/* Left: Alphabet Display */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-slate-50 rounded-[2rem] border-2 border-slate-100 py-4 md:py-12 px-4 md:px-6 flex-shrink-0 md:flex-shrink">
          <h2 className="text-base md:text-xl font-bold text-slate-500 mb-2 md:mb-6 text-center">{question.text}</h2>
          <div className="text-[80px] md:text-[120px] leading-none font-black text-slate-800 drop-shadow-md select-none transform transition-transform hover:scale-105">
            {question.letter}
          </div>
        </div>

        {/* Right: Image Options */}
        <div className="w-full md:w-1/2 flex flex-col space-y-4">
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                disabled={isAnswerSubmitted}
                className={`
                  relative py-3 md:py-8 rounded-xl md:rounded-2xl border-2 md:border-4 transition-all duration-200 
                  flex items-center justify-center min-h-[80px] md:min-h-[140px]
                  ${getOptionStyles(option)}
                `}
              >
                {/* Render the Visual inside the button */}
                <div className="transform transition-transform group-hover:scale-110 scale-[0.6] md:scale-100">
                  {VISUAL_MAP[option]()}
                </div>
                
                {/* Result Icons on the Option */}
                {isAnswerSubmitted && option === question.correctAnswer && (
                  <CheckCircle className="absolute top-3 right-3 w-8 h-8 text-lime-600 bg-white rounded-full z-20" />
                )}
                {isAnswerSubmitted && selectedAnswer === option && option !== question.correctAnswer && (
                  <XCircle className="absolute top-3 right-3 w-8 h-8 text-rose-600 bg-white rounded-full z-20" />
                )}
              </button>
            ))}
          </div>

          {/* Feedback & Next Button Area */}
          <div className={`mt-2 md:mt-6 min-h-[60px] md:min-h-[100px] flex flex-col justify-end transition-opacity duration-300 ${isAnswerSubmitted ? 'opacity-100' : 'opacity-0'}`}>
            {isAnswerSubmitted && (
              <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl border-2 mb-2 md:mb-4 font-bold flex items-start space-x-2 md:space-x-3 ${
                selectedAnswer === question.correctAnswer 
                  ? 'bg-lime-50 border-lime-200 text-lime-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div className="mt-0.5 shrink-0">
                  {selectedAnswer === question.correctAnswer 
                    ? <CheckCircle className="w-6 h-6 text-lime-600" /> 
                    : <XCircle className="w-6 h-6 text-rose-600" />}
                </div>
                <div>
                  <span className="block text-lg mb-1">
                    {selectedAnswer === question.correctAnswer ? 'बिल्कुल सही! (Correct!)' : 'गलत उत्तर (Wrong!)'}
                  </span>
                  <span className="text-slate-600 text-sm">{question.explanation}</span>
                </div>
              </div>
            )}

            {isAnswerSubmitted && (
              <button
                onClick={handleNextQuestion}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg py-4 px-6 rounded-2xl transition-colors shadow-sm flex items-center justify-center space-x-2"
              >
                <span>{currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}