// lib/HindiWordDictionary.ts

export const HINDI_WORDS: any = {
  // ==========================================
  // 2-LETTER WORDS (दो अक्षर वाले शब्द)
  // ==========================================
  'जल': { english: 'Water', emoji: '💧', file: 'Jal' },
  'नल': { english: 'Tap', emoji: '🚰', file: 'Nal' },
  'फल': { english: 'Fruit', emoji: '🍎', file: 'Phal' },
  'घर': { english: 'House', emoji: '🏠', file: 'Ghar' },
  'रथ': { english: 'Chariot', emoji: '🦼', file: 'Rath' },
  'बस': { english: 'Bus', emoji: '🚌', file: 'Bus' },
  'धन': { english: 'Money', emoji: '💰', file: 'Dhan' },
  'वन': { english: 'Forest', emoji: '🌲', file: 'Vun' },
  'खत': { english: 'Letter', emoji: '✉️', file: 'Khat' },
  'टब': { english: 'Tub', emoji: '🛁', file: 'Tub' },
  'मग': { english: 'Mug', emoji: '☕', file: 'Mug' },
  'जग': { english: 'Jug', emoji: '🫙', file: 'Jug' },
  'छत': { english: 'Roof', emoji: '🛖', file: 'Chhat' },
  'पथ': { english: 'Path', emoji: '🛣️', file: 'Path' },
  'गज': { english: 'Elephant', emoji: '🐘', file: 'Guj' },
  'हल': { english: 'Plough', emoji: '🚜', file: 'Hull' },
  'कप': { english: 'Cup', emoji: '🍵', file: 'Cup' },
  'जड़': { english: 'Root', emoji: '🪴', file: 'Jadd' },
  'नथ': { english: 'Nose Ring', emoji: '🪝', file: 'Nath' },
  'दस': { english: 'Ten', emoji: '🔟', file: 'Dus' },

  // ==========================================
  // 3-LETTER WORDS (तीन अक्षर वाले शब्द)
  // ==========================================
  'कमल': { english: 'Lotus', emoji: '🪷', file: 'Kamal' },
  'मटर': { english: 'Peas', emoji: '🟢', file: 'Matar' },
  'बतख': { english: 'Duck', emoji: '🦆', file: 'Batakh' },
  'सड़क': { english: 'Road', emoji: '🛣️', file: 'Sadak' },
  'कलम': { english: 'Pen', emoji: '🖊️', file: 'Kalam' },
  'नयन': { english: 'Eye', emoji: '👁️', file: 'Nayan' },
  'भवन': { english: 'Building', emoji: '🏢', file: 'Bhawan' },
  'शहद': { english: 'Honey', emoji: '🍯', file: 'Shehad' },
  'कलश': { english: 'Urn', emoji: '🏺', file: 'Kalash' },
  'बटन': { english: 'Button', emoji: '🔘', file: 'Button' },
  'रबड़': { english: 'Eraser', emoji: '✏️', file: 'Rabad' },
  'नमक': { english: 'Salt', emoji: '🧂', file: 'Namak' },
  'मगर': { english: 'Crocodile', emoji: '🐊', file: 'Magar' },
  'लहर': { english: 'Wave', emoji: '🌊', file: 'Lehar' },
  'महल': { english: 'Palace', emoji: '🕌', file: 'Mehal' },
  'शहर': { english: 'City', emoji: '🏙️', file: 'Shehar' },
  'डगर': { english: 'Path', emoji: '🛤️', file: 'Dagar' },
  'गगन': { english: 'Sky', emoji: '☁️', file: 'Gagan' },
  'नहर': { english: 'Canal', emoji: '🏞️', file: 'Nehar' },
  'नखत': { english: 'Nails/Star', emoji: '💅', file: 'Nakhat' },

  // ==========================================
  // 4-LETTER WORDS (चार अक्षर वाले शब्द)
  // ==========================================
  'बरगद': { english: 'Banyan Tree', emoji: '🌳', file: 'Bargad' },
  'थरमस': { english: 'Thermos', emoji: '🍶', file: 'Tharmos' },
  'शलजम': { english: 'Turnip', emoji: '🧅', file: 'Shalgam' },
  'कसरत': { english: 'Exercise', emoji: '🏋️', file: 'Kasrat' },
  'खटमल': { english: 'Bedbug', emoji: '🐛', file: 'Khatmal' },
  'बरतन': { english: 'Utensils', emoji: '🥣', file: 'Bartan' },
  'पनघट': { english: 'Well/Waterfront', emoji: '🚰', file: 'Panghat' },
  'अचकन': { english: 'Long Coat', emoji: '🧥', file: 'Achkan' },
  'दमकल': { english: 'Fire Engine', emoji: '🚒', file: 'Damkal' },
  'अदरक': { english: 'Ginger', emoji: '🫚', file: 'Adrak' },
  'अजगर': { english: 'Python', emoji: '🐍', file: 'Ajgar' },
  'बचपन': { english: 'Childhood', emoji: '🧒', file: 'Bachpan' }
};

// ==========================================
// THE SUBTOPIC ROUTER (Maps CSV IDs to Words)
// ==========================================
export const WORD_SUBTOPIC_MAP: any = {
  'word-builder-2': [
    'जल', 'नल', 'फल', 'घर', 'रथ', 'बस', 'धन', 'वन', 'खत', 'टब',
    'मग', 'जग', 'छत', 'पथ', 'गज', 'हल', 'कप', 'जड़', 'नथ', 'दस'
  ],
  'word-builder-3': [
    'कमल', 'मटर', 'बतख', 'सड़क', 'कलम', 'नयन', 'भवन', 'शहद', 'कलश', 'बटन',
    'रबड़', 'नमक', 'मगर', 'लहर', 'महल', 'शहर', 'डगर', 'गगन', 'नहर', 'नखत'
  ],
  'word-builder-4': [
    'बरगद', 'थरमस', 'शलजम', 'कसरत', 'खटमल', 'बरतन', 'पनघट', 'अचकन', 'दमकल', 'अदरक',
    'अजगर', 'बचपन'
  ]
};

// ==========================================
// HELPER FUNCTIONS 
// ==========================================
export const getWordData = (word: string) => {
  const data = HINDI_WORDS[word];
  if (!data) return null;

  return {
    word: word,
    english: data.english,
    emoji: data.emoji,
    length: word.length,
    category: 'amatrik', 
    
    // Auto-generates the paths using your exact English file names!
    audioUrl: `/assets/hindi/words/audio/${data.file}.m4a`,
    imageUrl: `/assets/hindi/words/images/${data.file}.png`
  };
};

export const getWordsForSubtopic = (subtopicId: string) => {
  const words = WORD_SUBTOPIC_MAP[subtopicId] || [];
  return words.map((w: string) => getWordData(w)).filter(Boolean);
};