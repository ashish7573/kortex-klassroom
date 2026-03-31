// hindiRegistry.js

const colors = [
  'bg-rose-500', 'bg-amber-500', 'bg-sky-500', 'bg-emerald-500', 
  'bg-purple-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500', 
  'bg-pink-500', 'bg-blue-500', 'bg-lime-500', 'bg-cyan-500'
];

export const HINDI_ASSETS = {
  swar: {
    'अ': {
      letterAudio: '/assets/hindi/swar/audio/a.mp3', themeColor: colors[0],
      examples: [
        { word: 'अनार', english: 'Pomegranate', image: '/assets/hindi/swar/images/anar.png' },
        { word: 'अदरक', english: 'Ginger', image: '/assets/hindi/swar/images/adrak.png' },
        { word: 'अनाज', english: 'Grain', image: '/assets/hindi/swar/images/anaaj.png' },
        { word: 'अचार', english: 'Pickle', image: '/assets/hindi/swar/images/achaar.png' }
      ]
    },
    'आ': {
      letterAudio: '/assets/hindi/swar/audio/aa.mp3', themeColor: colors[1],
      examples: [
        { word: 'आम', english: 'Mango', image: '/assets/hindi/swar/images/aam.png' },
        { word: 'आठ', english: 'Eight', image: '/assets/hindi/swar/images/aath.png' },
        { word: 'आग', english: 'Fire', image: '/assets/hindi/swar/images/aag.png' },
        { word: 'आलू', english: 'Potato', image: '/assets/hindi/swar/images/aaloo.png' }
      ]
    },
    'इ': {
      letterAudio: '/assets/hindi/swar/audio/i.mp3', themeColor: colors[2],
      examples: [
        { word: 'इंद्रधनुष', english: 'Rainbow', image: '/assets/hindi/swar/images/indradhanush.png' },
        { word: 'इंसान', english: 'Human', image: '/assets/hindi/swar/images/insaan.png' },
        { word: 'इंजन', english: 'Engine', image: '/assets/hindi/swar/images/engine.png' },
        { word: 'इमली', english: 'Tamarind', image: '/assets/hindi/swar/images/imli.png' }
      ]
    },
    'ई': {
      letterAudio: '/assets/hindi/swar/audio/ee.mp3', themeColor: colors[3],
      examples: [
        { word: 'ईंख', english: 'Sugarcane', image: '/assets/hindi/swar/images/eenkh.png' },
        { word: 'ईंट', english: 'Brick', image: '/assets/hindi/swar/images/eent.png' },
        { word: 'ईंधन', english: 'Fuel', image: '/assets/hindi/swar/images/eendhan.png' },
        { word: 'ईमानदार', english: 'Honest', image: '/assets/hindi/swar/images/eemaandaar.png' }
      ]
    },
    'उ': {
      letterAudio: '/assets/hindi/swar/audio/u.mp3', themeColor: colors[4],
      examples: [
        { word: 'उपहार', english: 'Gift', image: '/assets/hindi/swar/images/uphaar.png' },
        { word: 'उल्लू', english: 'Owl', image: '/assets/hindi/swar/images/ullu.png' },
        { word: 'उल्टा', english: 'Upside down', image: '/assets/hindi/swar/images/ulta.png' },
        { word: 'उत्सव', english: 'Festival', image: '/assets/hindi/swar/images/utsav.png' }
      ]
    },
    'ऊ': {
      letterAudio: '/assets/hindi/swar/audio/oo.mp3', themeColor: colors[5],
      examples: [
        { word: 'ऊँचा', english: 'High', image: '/assets/hindi/swar/images/ooncha.png' },
        { word: 'ऊंट', english: 'Camel', image: '/assets/hindi/swar/images/oont.png' },
        { word: 'ऊन', english: 'Wool', image: '/assets/hindi/swar/images/oon.png' },
        { word: 'ऊपर', english: 'Up', image: '/assets/hindi/swar/images/oopar.png' }
      ]
    },
    'ऋ': {
      letterAudio: '/assets/hindi/swar/audio/ri.mp3', themeColor: colors[6],
      examples: [
        { word: 'ऋषि', english: 'Sage', image: '/assets/hindi/swar/images/rishi.png' },
        { word: 'ऋतु', english: 'Season', image: '/assets/hindi/swar/images/ritu.png' }
      ]
    },
    'ए': {
      letterAudio: '/assets/hindi/swar/audio/e.mp3', themeColor: colors[7],
      examples: [
        { word: 'एड़ी', english: 'Heel', image: '/assets/hindi/swar/images/edi.png' },
        { word: 'एक', english: 'One', image: '/assets/hindi/swar/images/ek.png' },
        { word: 'एकतारा', english: 'Ektara', image: '/assets/hindi/swar/images/ektara.png' },
        { word: 'एकता', english: 'Unity', image: '/assets/hindi/swar/images/ekta.png' }
      ]
    },
    'ऐ': {
      letterAudio: '/assets/hindi/swar/audio/ai.mp3', themeColor: colors[8],
      examples: [
        { word: 'ऐनक', english: 'Spectacles', image: '/assets/hindi/swar/images/ainak.png' },
        { word: 'एसिड', english: 'Acid', image: '/assets/hindi/swar/images/acid.png' },
        { word: 'ऐतिहासिक', english: 'Historical', image: '/assets/hindi/swar/images/aitihasik.png' },
        { word: 'एटम', english: 'Atom', image: '/assets/hindi/swar/images/atom.png' }
      ]
    },
    'ओ': {
      letterAudio: '/assets/hindi/swar/audio/o.mp3', themeColor: colors[9],
      examples: [
        { word: 'ओखली', english: 'Mortar', image: '/assets/hindi/swar/images/okhali.png' },
        { word: 'ओस', english: 'Dew', image: '/assets/hindi/swar/images/oss.png' },
        { word: 'ओम', english: 'Om', image: '/assets/hindi/swar/images/om.png' },
        { word: 'ओढ़नी', english: 'Scarf', image: '/assets/hindi/swar/images/odhani.png' }
      ]
    },
    'औ': {
      letterAudio: '/assets/hindi/swar/audio/au.mp3', themeColor: colors[10],
      examples: [
        { word: 'औजार', english: 'Tools', image: '/assets/hindi/swar/images/aujar.png' },
        { word: 'औरत', english: 'Woman', image: '/assets/hindi/swar/images/aurat.png' },
        { word: 'औद्योगिक', english: 'Industrial', image: '/assets/hindi/swar/images/audyogik.png' },
        { word: 'औषधि', english: 'Medicine', image: '/assets/hindi/swar/images/aushadhi.png' }
      ]
    },
    'अं': {
      letterAudio: '/assets/hindi/swar/audio/ang.mp3', themeColor: colors[11],
      examples: [
        { word: 'अंग', english: 'Body Part', image: '/assets/hindi/swar/images/ang.png' },
        { word: 'अंगूर', english: 'Grapes', image: '/assets/hindi/swar/images/angoor.png' },
        { word: 'अंकुर', english: 'Sprout', image: '/assets/hindi/swar/images/ankur.png' },
        { word: 'अंक', english: 'Number', image: '/assets/hindi/swar/images/ank.png' }
      ]
    },
    'अः': {
      letterAudio: '/assets/hindi/swar/audio/aha.mp3', themeColor: colors[0],
      examples: [] // No words
    }
  },

  vyanjan: {
    // === THE 'K' ROW ===
    'क': {
      letterAudio: '/assets/hindi/vyanjan/audio/ka.mp3', themeColor: colors[1],
      examples: [
        { word: 'कमल', english: 'Lotus', image: '/assets/hindi/vyanjan/images/kamal.png' },
        { word: 'कलश', english: 'Urn', image: '/assets/hindi/vyanjan/images/kalash.png' },
        { word: 'कछुआ', english: 'Tortoise', image: '/assets/hindi/vyanjan/images/kachua.png' },
        { word: 'कटोरी', english: 'Bowl', image: '/assets/hindi/vyanjan/images/katori.png' }
      ]
    },
    'ख': {
      letterAudio: '/assets/hindi/vyanjan/audio/kha.mp3', themeColor: colors[2],
      examples: [
        { word: 'खरगोश', english: 'Rabbit', image: '/assets/hindi/vyanjan/images/khargosh.png' },
        { word: 'खाना', english: 'Food', image: '/assets/hindi/vyanjan/images/khana.png' },
        { word: 'खत', english: 'Letter', image: '/assets/hindi/vyanjan/images/khat.png' },
        { word: 'खजाना', english: 'Treasure', image: '/assets/hindi/vyanjan/images/khazaana.png' }
      ]
    },
    'ग': {
      letterAudio: '/assets/hindi/vyanjan/audio/ga.mp3', themeColor: colors[3],
      examples: [
        { word: 'गाड़ी', english: 'Vehicle', image: '/assets/hindi/vyanjan/images/gaadi.png' },
        { word: 'गधा', english: 'Donkey', image: '/assets/hindi/vyanjan/images/gadha.png' },
        { word: 'गमला', english: 'Flowerpot', image: '/assets/hindi/vyanjan/images/gamla.png' },
        { word: 'गाजर', english: 'Carrot', image: '/assets/hindi/vyanjan/images/gajar.png' }
      ]
    },
    'घ': {
      letterAudio: '/assets/hindi/vyanjan/audio/gha.mp3', themeColor: colors[4],
      examples: [
        { word: 'घड़ी', english: 'Watch', image: '/assets/hindi/vyanjan/images/ghadi.png' },
        { word: 'घर', english: 'House', image: '/assets/hindi/vyanjan/images/ghar.png' },
        { word: 'घोड़ा', english: 'Horse', image: '/assets/hindi/vyanjan/images/ghoda.png' },
        { word: 'घास', english: 'Grass', image: '/assets/hindi/vyanjan/images/ghas.png' }
      ]
    },
    'ङ': { letterAudio: '/assets/hindi/vyanjan/audio/nga.mp3', themeColor: colors[5], examples: [] },

    // === THE 'CH' ROW ===
    'च': {
      letterAudio: '/assets/hindi/vyanjan/audio/cha.mp3', themeColor: colors[6],
      examples: [
        { word: 'चम्मच', english: 'Spoon', image: '/assets/hindi/vyanjan/images/chammach.png' },
        { word: 'चोर', english: 'Thief', image: '/assets/hindi/vyanjan/images/chor.png' },
        { word: 'चेहरा', english: 'Face', image: '/assets/hindi/vyanjan/images/chehra.png' },
        { word: 'चांदी', english: 'Silver', image: '/assets/hindi/vyanjan/images/chaandi.png' }
      ]
    },
    'छ': {
      letterAudio: '/assets/hindi/vyanjan/audio/chha.mp3', themeColor: colors[7],
      examples: [
        { word: 'छाता', english: 'Umbrella', image: '/assets/hindi/vyanjan/images/chhata.png' },
        { word: 'छह', english: 'Six', image: '/assets/hindi/vyanjan/images/cheh.png' },
        { word: 'छत', english: 'Roof', image: '/assets/hindi/vyanjan/images/chhat.png' },
        { word: 'छात्र', english: 'Student', image: '/assets/hindi/vyanjan/images/chhatra.png' }
      ]
    },
    'ज': {
      letterAudio: '/assets/hindi/vyanjan/audio/ja.mp3', themeColor: colors[8],
      examples: [
        { word: 'जग', english: 'Jug', image: '/assets/hindi/vyanjan/images/jug.png' },
        { word: 'जोकर', english: 'Joker', image: '/assets/hindi/vyanjan/images/jokar.png' },
        { word: 'जाम', english: 'Jam', image: '/assets/hindi/vyanjan/images/jam.png' },
        { word: 'जल', english: 'Water', image: '/assets/hindi/vyanjan/images/jal.png' }
      ]
    },
    'झ': {
      letterAudio: '/assets/hindi/vyanjan/audio/jha.mp3', themeColor: colors[9],
      examples: [
        { word: 'झंडा', english: 'Flag', image: '/assets/hindi/vyanjan/images/jhanda.png' },
        { word: 'झाड़ू', english: 'Broom', image: '/assets/hindi/vyanjan/images/jhadu.png' },
        { word: 'झील', english: 'Lake', image: '/assets/hindi/vyanjan/images/jheel.png' },
        { word: 'झोपड़ी', english: 'Hut', image: '/assets/hindi/vyanjan/images/jhopadi.png' }
      ]
    },
    'ञ': { letterAudio: '/assets/hindi/vyanjan/audio/nya.mp3', themeColor: colors[10], examples: [] },

    // === THE 'T' ROW (Retroflex) ===
    'ट': {
      letterAudio: '/assets/hindi/vyanjan/audio/tta.mp3', themeColor: colors[11],
      examples: [
        { word: 'टमाटर', english: 'Tomato', image: '/assets/hindi/vyanjan/images/tamatar.png' },
        { word: 'टूटना', english: 'Break', image: '/assets/hindi/vyanjan/images/tootana.png' },
        { word: 'टोपी', english: 'Hat', image: '/assets/hindi/vyanjan/images/topi.png' },
        { word: 'टोकरी', english: 'Basket', image: '/assets/hindi/vyanjan/images/tokari.png' }
      ]
    },
    'ठ': {
      letterAudio: '/assets/hindi/vyanjan/audio/ttha.mp3', themeColor: colors[0],
      examples: [
        { word: 'ठंडा', english: 'Cold', image: '/assets/hindi/vyanjan/images/thanda.png' },
        { word: 'ठठेरा', english: 'Coppersmith', image: '/assets/hindi/vyanjan/images/thathera.png' },
        { word: 'ठप्पा', english: 'Stamp', image: '/assets/hindi/vyanjan/images/thappa.png' },
        { word: 'ठेला', english: 'Cart', image: '/assets/hindi/vyanjan/images/thela.png' }
      ]
    },
    'ड': {
      letterAudio: '/assets/hindi/vyanjan/audio/dda.mp3', themeColor: colors[1],
      examples: [
        { word: 'डमरू', english: 'Drum', image: '/assets/hindi/vyanjan/images/damroo.png' },
        { word: 'डोसा', english: 'Dosa', image: '/assets/hindi/vyanjan/images/dosa.png' },
        { word: 'डाल', english: 'Branch', image: '/assets/hindi/vyanjan/images/daal.png' },
        { word: 'डाकघर', english: 'Post Office', image: '/assets/hindi/vyanjan/images/dakghar.png' }
      ]
    },
    'ढ': {
      letterAudio: '/assets/hindi/vyanjan/audio/ddha.mp3', themeColor: colors[2],
      examples: [
        { word: 'ढोलक', english: 'Dholak', image: '/assets/hindi/vyanjan/images/dholak.png' },
        { word: 'ढूंढना', english: 'Search', image: '/assets/hindi/vyanjan/images/dhoondhana.png' },
        { word: 'ढाल', english: 'Shield', image: '/assets/hindi/vyanjan/images/dhaal.png' },
        { word: 'ढक्कन', english: 'Lid', image: '/assets/hindi/vyanjan/images/dhakkan.png' }
      ]
    },
    'ण': { letterAudio: '/assets/hindi/vyanjan/audio/nna.mp3', themeColor: colors[3], examples: [] },

    // === THE 'T' ROW (Dental) ===
    'त': {
      letterAudio: '/assets/hindi/vyanjan/audio/ta.mp3', themeColor: colors[4],
      examples: [
        { word: 'तलवार', english: 'Sword', image: '/assets/hindi/vyanjan/images/talvaar.png' },
        { word: 'ताला', english: 'Lock', image: '/assets/hindi/vyanjan/images/taala.png' },
        { word: 'तरबूज', english: 'Watermelon', image: '/assets/hindi/vyanjan/images/tarbooj.png' },
        { word: 'तोता', english: 'Parrot', image: '/assets/hindi/vyanjan/images/tota.png' }
      ]
    },
    'थ': {
      letterAudio: '/assets/hindi/vyanjan/audio/tha.mp3', themeColor: colors[5],
      examples: [
        { word: 'थाली', english: 'Plate', image: '/assets/hindi/vyanjan/images/thaali.png' },
        { word: 'थाना', english: 'Police Station', image: '/assets/hindi/vyanjan/images/thaana.png' },
        { word: 'थर्मस', english: 'Thermos', image: '/assets/hindi/vyanjan/images/thermos.png' },
        { word: 'थैला', english: 'Bag', image: '/assets/hindi/vyanjan/images/thaela.png' }
      ]
    },
    'द': {
      letterAudio: '/assets/hindi/vyanjan/audio/da.mp3', themeColor: colors[6],
      examples: [
        { word: 'दरवाजा', english: 'Door', image: '/assets/hindi/vyanjan/images/darvaja.png' },
        { word: 'दो', english: 'Two', image: '/assets/hindi/vyanjan/images/do.png' },
        { word: 'दिल', english: 'Heart', image: '/assets/hindi/vyanjan/images/dil.png' },
        { word: 'दवात', english: 'Inkpot', image: '/assets/hindi/vyanjan/images/dawaat.png' }
      ]
    },
    'ध': {
      letterAudio: '/assets/hindi/vyanjan/audio/dha.mp3', themeColor: colors[7],
      examples: [
        { word: 'धन', english: 'Wealth', image: '/assets/hindi/vyanjan/images/dhan.png' },
        { word: 'धागा', english: 'Thread', image: '/assets/hindi/vyanjan/images/dhaga.png' },
        { word: 'धनुष', english: 'Bow', image: '/assets/hindi/vyanjan/images/dhanush.png' },
        { word: 'धरती', english: 'Earth', image: '/assets/hindi/vyanjan/images/dharti.png' }
      ]
    },
    'न': {
      letterAudio: '/assets/hindi/vyanjan/audio/na.mp3', themeColor: colors[8],
      examples: [
        { word: 'नाव', english: 'Boat', image: '/assets/hindi/vyanjan/images/naav.png' },
        { word: 'नल', english: 'Tap', image: '/assets/hindi/vyanjan/images/nal.png' },
        { word: 'नौ', english: 'Nine', image: '/assets/hindi/vyanjan/images/nau.png' },
        { word: 'नाखून', english: 'Nail', image: '/assets/hindi/vyanjan/images/nakhoon.png' }
      ]
    },

    // === THE 'P' ROW ===
    'प': {
      letterAudio: '/assets/hindi/vyanjan/audio/pa.mp3', themeColor: colors[9],
      examples: [
        { word: 'पुस्तक', english: 'Book', image: '/assets/hindi/vyanjan/images/pustak.png' },
        { word: 'पतंग', english: 'Kite', image: '/assets/hindi/vyanjan/images/patang.png' },
        { word: 'पीला', english: 'Yellow', image: '/assets/hindi/vyanjan/images/peela.png' },
        { word: 'पंख', english: 'Fan/Feather', image: '/assets/hindi/vyanjan/images/pankha.png' }
      ]
    },
    'फ': {
      letterAudio: '/assets/hindi/vyanjan/audio/pha.mp3', themeColor: colors[10],
      examples: [
        { word: 'फूल', english: 'Flower', image: '/assets/hindi/vyanjan/images/phool.png' },
        { word: 'फल', english: 'Fruit', image: '/assets/hindi/vyanjan/images/phal.png' },
        { word: 'फाटक', english: 'Gate', image: '/assets/hindi/vyanjan/images/fatak.png' },
        { word: 'फौजी', english: 'Soldier', image: '/assets/hindi/vyanjan/images/fauji.png' }
      ]
    },
    'ब': {
      letterAudio: '/assets/hindi/vyanjan/audio/ba.mp3', themeColor: colors[11],
      examples: [
        { word: 'बच्चा', english: 'Child', image: '/assets/hindi/vyanjan/images/bacha.png' },
        { word: 'बकरी', english: 'Goat', image: '/assets/hindi/vyanjan/images/bakri.png' },
        { word: 'बतख', english: 'Duck', image: '/assets/hindi/vyanjan/images/batakh.png' },
        { word: 'बाज', english: 'Hawk', image: '/assets/hindi/vyanjan/images/baaj.png' }
      ]
    },
    'भ': {
      letterAudio: '/assets/hindi/vyanjan/audio/bha.mp3', themeColor: colors[0],
      examples: [
        { word: 'भालू', english: 'Bear', image: '/assets/hindi/vyanjan/images/bhaloo.png' },
        { word: 'भुट्टा', english: 'Corn', image: '/assets/hindi/vyanjan/images/bhutta.png' },
        { word: 'भारत', english: 'India', image: '/assets/hindi/vyanjan/images/bharat.png' },
        { word: 'भीम', english: 'Bheem', image: '/assets/hindi/vyanjan/images/bheem.png' }
      ]
    },
    'म': {
      letterAudio: '/assets/hindi/vyanjan/audio/ma.mp3', themeColor: colors[1],
      examples: [
        { word: 'मछली', english: 'Fish', image: '/assets/hindi/vyanjan/images/machli.png' },
        { word: 'मगर', english: 'Crocodile', image: '/assets/hindi/vyanjan/images/magar.png' },
        { word: 'महल', english: 'Palace', image: '/assets/hindi/vyanjan/images/mahal.png' },
        { word: 'मजदूर', english: 'Worker', image: '/assets/hindi/vyanjan/images/majdoor.png' }
      ]
    },

    // === THE 'Y' ROW ===
    'य': {
      letterAudio: '/assets/hindi/vyanjan/audio/ya.mp3', themeColor: colors[2],
      examples: [
        { word: 'यज्ञ', english: 'Yajna', image: '/assets/hindi/vyanjan/images/yag.png' },
        { word: 'युद्ध', english: 'War', image: '/assets/hindi/vyanjan/images/yudh.png' },
        { word: 'युवराज', english: 'Prince', image: '/assets/hindi/vyanjan/images/yuvraj.png' },
        { word: 'योग', english: 'Yoga', image: '/assets/hindi/vyanjan/images/yog.png' }
      ]
    },
    'र': {
      letterAudio: '/assets/hindi/vyanjan/audio/ra.mp3', themeColor: colors[3],
      examples: [
        { word: 'रथ', english: 'Chariot', image: '/assets/hindi/vyanjan/images/rath.png' },
        { word: 'रस्सी', english: 'Rope', image: '/assets/hindi/vyanjan/images/rassi.png' },
        { word: 'राजा', english: 'King', image: '/assets/hindi/vyanjan/images/raja.png' },
        { word: 'रंगोली', english: 'Rangoli', image: '/assets/hindi/vyanjan/images/rangoli.png' }
      ]
    },
    'ल': {
      letterAudio: '/assets/hindi/vyanjan/audio/la.mp3', themeColor: colors[4],
      examples: [
        { word: 'लड्डू', english: 'Sweet', image: '/assets/hindi/vyanjan/images/laddoo.png' },
        { word: 'लकड़ी', english: 'Wood', image: '/assets/hindi/vyanjan/images/lakadi.png' },
        { word: 'लड़का', english: 'Boy', image: '/assets/hindi/vyanjan/images/ladka.png' },
        { word: 'लौकी', english: 'Bottle Gourd', image: '/assets/hindi/vyanjan/images/lauki.png' }
      ]
    },
    'व': {
      letterAudio: '/assets/hindi/vyanjan/audio/va.mp3', themeColor: colors[5],
      examples: [
        { word: 'वन', english: 'Forest', image: '/assets/hindi/vyanjan/images/van.png' },
        { word: 'वर्षा', english: 'Rain', image: '/assets/hindi/vyanjan/images/varsha.png' },
        { word: 'विवाह', english: 'Marriage', image: '/assets/hindi/vyanjan/images/vivah.png' },
        { word: 'वक', english: 'Crane', image: '/assets/hindi/vyanjan/images/vak.png' }
      ]
    },

    // === THE 'S' ROW ===
    'श': {
      letterAudio: '/assets/hindi/vyanjan/audio/sha.mp3', themeColor: colors[6],
      examples: [
        { word: 'शेर', english: 'Lion', image: '/assets/hindi/vyanjan/images/sher.png' },
        { word: 'शर्बत', english: 'Juice', image: '/assets/hindi/vyanjan/images/sharbat.png' },
        { word: 'शहतूत', english: 'Mulberry', image: '/assets/hindi/vyanjan/images/shetoot.png' },
        { word: 'शिक्षक', english: 'Teacher', image: '/assets/hindi/vyanjan/images/shikshak.png' }
      ]
    },
    'ष': {
      letterAudio: '/assets/hindi/vyanjan/audio/ssha.mp3', themeColor: colors[7],
      examples: [
        { word: 'षट्कोण', english: 'Hexagon', image: '/assets/hindi/vyanjan/images/shatkon.png' }
      ]
    },
    'स': {
      letterAudio: '/assets/hindi/vyanjan/audio/sa.mp3', themeColor: colors[8],
      examples: [
        { word: 'साबुन', english: 'Soap', image: '/assets/hindi/vyanjan/images/sabun.png' },
        { word: 'सेब', english: 'Apple', image: '/assets/hindi/vyanjan/images/seb.png' },
        { word: 'सांप', english: 'Snake', image: '/assets/hindi/vyanjan/images/saanp.png' },
        { word: 'सैनिक', english: 'Soldier', image: '/assets/hindi/vyanjan/images/sainik.png' }
      ]
    },
    'ह': {
      letterAudio: '/assets/hindi/vyanjan/audio/ha.mp3', themeColor: colors[9],
      examples: [
        { word: 'हाथी', english: 'Elephant', image: '/assets/hindi/vyanjan/images/haathi.png' },
        { word: 'हाथ', english: 'Hand', image: '/assets/hindi/vyanjan/images/haath.png' },
        { word: 'हीरा', english: 'Diamond', image: '/assets/hindi/vyanjan/images/heera.png' },
        { word: 'हल', english: 'Plough', image: '/assets/hindi/vyanjan/images/hal.png' }
      ]
    },

    // === SANYUKT & EXTRA ===
    'क्ष': {
      letterAudio: '/assets/hindi/vyanjan/audio/ksha.mp3', themeColor: colors[10],
      examples: [
        { word: 'क्षत्रिय', english: 'Warrior', image: '/assets/hindi/vyanjan/images/kshatriya.png' },
        { word: 'क्षमा', english: 'Forgiveness', image: '/assets/hindi/vyanjan/images/kshma.png' }
      ]
    },
    'त्र': {
      letterAudio: '/assets/hindi/vyanjan/audio/tra.mp3', themeColor: colors[11],
      examples: [
        { word: 'त्रिकोण', english: 'Triangle', image: '/assets/hindi/vyanjan/images/trikon.png' }
      ]
    },
    'ज्ञ': {
      letterAudio: '/assets/hindi/vyanjan/audio/gya.mp3', themeColor: colors[0],
      examples: [
        { word: 'ज्ञानी', english: 'Scholar', image: '/assets/hindi/vyanjan/images/gyaani.png' }
      ]
    },
    'श्र': { letterAudio: '/assets/hindi/vyanjan/audio/shra.mp3', themeColor: colors[1], examples: [] },
    'ड़': { letterAudio: '/assets/hindi/vyanjan/audio/ada.mp3', themeColor: colors[2], examples: [] },
    'ढ़': { letterAudio: '/assets/hindi/vyanjan/audio/adha.mp3', themeColor: colors[3], examples: [] }
  }
};