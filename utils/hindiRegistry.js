// hindiRegistry.js

const colors = [
  'bg-rose-500', 'bg-amber-500', 'bg-sky-500', 'bg-emerald-500', 
  'bg-purple-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500', 
  'bg-pink-500', 'bg-blue-500', 'bg-lime-500', 'bg-cyan-500'
];

export const HINDI_ASSETS = {
  swar: {
    'अ': {
      letterAudio: '/assets/hindi/audio/a.mp3', themeColor: colors[0],
      examples: [
        { word: 'अनार', english: 'Pomegranate', image: '/assets/hindi/images/anar.png' },
        { word: 'अदरक', english: 'Ginger', image: '/assets/hindi/images/adrak.png' },
        { word: 'अनाज', english: 'Grain', image: '/assets/hindi/images/anaaj.png' },
        { word: 'अचार', english: 'Pickle', image: '/assets/hindi/images/achaar.png' }
      ]
    },
    'आ': {
      letterAudio: '/assets/hindi/audio/aa.mp3', themeColor: colors[1],
      examples: [
        { word: 'आम', english: 'Mango', image: '/assets/hindi/images/aam.png' },
        { word: 'आठ', english: 'Eight', image: '/assets/hindi/images/aath.png' },
        { word: 'आग', english: 'Fire', image: '/assets/hindi/images/aag.png' },
        { word: 'आलू', english: 'Potato', image: '/assets/hindi/images/aaloo.png' }
      ]
    },
    'इ': {
      letterAudio: '/assets/hindi/audio/i.mp3', themeColor: colors[2],
      examples: [
        { word: 'इंद्रधनुष', english: 'Rainbow', image: '/assets/hindi/images/indradhanush.png' },
        { word: 'इंसान', english: 'Human', image: '/assets/hindi/images/insaan.png' },
        { word: 'इंजन', english: 'Engine', image: '/assets/hindi/images/engine.png' },
        { word: 'इमली', english: 'Tamarind', image: '/assets/hindi/images/imli.png' }
      ]
    },
    'ई': {
      letterAudio: '/assets/hindi/audio/ee.mp3', themeColor: colors[3],
      examples: [
        { word: 'ईंख', english: 'Sugarcane', image: '/assets/hindi/images/eenkh.png' },
        { word: 'ईंट', english: 'Brick', image: '/assets/hindi/images/eent.png' },
        { word: 'ईंधन', english: 'Fuel', image: '/assets/hindi/images/eendhan.png' },
        { word: 'ईमानदार', english: 'Honest', image: '/assets/hindi/images/eemaandaar.png' }
      ]
    },
    'उ': {
      letterAudio: '/assets/hindi/audio/u.mp3', themeColor: colors[4],
      examples: [
        { word: 'उपहार', english: 'Gift', image: '/assets/hindi/images/uphaar.png' },
        { word: 'उल्लू', english: 'Owl', image: '/assets/hindi/images/ullu.png' },
        { word: 'उल्टा', english: 'Upside down', image: '/assets/hindi/images/ulta.png' },
        { word: 'उत्सव', english: 'Festival', image: '/assets/hindi/images/utsav.png' }
      ]
    },
    'ऊ': {
      letterAudio: '/assets/hindi/audio/oo.mp3', themeColor: colors[5],
      examples: [
        { word: 'ऊँचा', english: 'High', image: '/assets/hindi/images/ooncha.png' },
        { word: 'ऊंट', english: 'Camel', image: '/assets/hindi/images/oont.png' },
        { word: 'ऊन', english: 'Wool', image: '/assets/hindi/images/oon.png' },
        { word: 'ऊपर', english: 'Up', image: '/assets/hindi/images/oopar.png' }
      ]
    },
    'ऋ': {
      letterAudio: '/assets/hindi/audio/ri.mp3', themeColor: colors[6],
      examples: [
        { word: 'ऋषि', english: 'Sage', image: '/assets/hindi/images/rishi.png' },
        { word: 'ऋतु', english: 'Season', image: '/assets/hindi/images/ritu.png' }
      ]
    },
    'ए': {
      letterAudio: '/assets/hindi/audio/e.mp3', themeColor: colors[7],
      examples: [
        { word: 'एड़ी', english: 'Heel', image: '/assets/hindi/images/edi.png' },
        { word: 'एक', english: 'One', image: '/assets/hindi/images/ek.png' },
        { word: 'एकतारा', english: 'Ektara', image: '/assets/hindi/images/ektara.png' },
        { word: 'एकता', english: 'Unity', image: '/assets/hindi/images/ekta.png' }
      ]
    },
    'ऐ': {
      letterAudio: '/assets/hindi/audio/ai.mp3', themeColor: colors[8],
      examples: [
        { word: 'ऐनक', english: 'Spectacles', image: '/assets/hindi/images/ainak.png' },
        { word: 'एसिड', english: 'Acid', image: '/assets/hindi/images/acid.png' },
        { word: 'ऐतिहासिक', english: 'Historical', image: '/assets/hindi/images/aitihasik.png' },
        { word: 'एटम', english: 'Atom', image: '/assets/hindi/images/atom.png' }
      ]
    },
    'ओ': {
      letterAudio: '/assets/hindi/audio/o.mp3', themeColor: colors[9],
      examples: [
        { word: 'ओखली', english: 'Mortar', image: '/assets/hindi/images/okhali.png' },
        { word: 'ओस', english: 'Dew', image: '/assets/hindi/images/oss.png' },
        { word: 'ओम', english: 'Om', image: '/assets/hindi/images/om.png' },
        { word: 'ओढ़नी', english: 'Scarf', image: '/assets/hindi/images/odhani.png' }
      ]
    },
    'औ': {
      letterAudio: '/assets/hindi/audio/au.mp3', themeColor: colors[10],
      examples: [
        { word: 'औजार', english: 'Tools', image: '/assets/hindi/images/aujar.png' },
        { word: 'औरत', english: 'Woman', image: '/assets/hindi/images/aurat.png' },
        { word: 'औद्योगिक', english: 'Industrial', image: '/assets/hindi/images/audyogik.png' },
        { word: 'औषधि', english: 'Medicine', image: '/assets/hindi/images/aushadhi.png' }
      ]
    },
    'अं': {
      letterAudio: '/assets/hindi/audio/ang.mp3', themeColor: colors[11],
      examples: [
        { word: 'अंग', english: 'Body Part', image: '/assets/hindi/images/ang.png' },
        { word: 'अंगूर', english: 'Grapes', image: '/assets/hindi/images/angoor.png' },
        { word: 'अंकुर', english: 'Sprout', image: '/assets/hindi/images/ankur.png' },
        { word: 'अंक', english: 'Number', image: '/assets/hindi/images/ank.png' }
      ]
    },
    'अः': {
      letterAudio: '/assets/hindi/audio/aha.mp3', themeColor: colors[0],
      examples: [] // No words
    }
  },

  vyanjan: {
    // === THE 'K' ROW ===
    'क': {
      letterAudio: '/assets/hindi/audio/ka.mp3', themeColor: colors[1],
      examples: [
        { word: 'कमल', english: 'Lotus', image: '/assets/hindi/images/kamal.png' },
        { word: 'कलश', english: 'Urn', image: '/assets/hindi/images/kalash.png' },
        { word: 'कछुआ', english: 'Tortoise', image: '/assets/hindi/images/kachua.png' },
        { word: 'कटोरी', english: 'Bowl', image: '/assets/hindi/images/katori.png' }
      ]
    },
    'ख': {
      letterAudio: '/assets/hindi/audio/kha.mp3', themeColor: colors[2],
      examples: [
        { word: 'खरगोश', english: 'Rabbit', image: '/assets/hindi/images/khargosh.png' },
        { word: 'खाना', english: 'Food', image: '/assets/hindi/images/khana.png' },
        { word: 'खत', english: 'Letter', image: '/assets/hindi/images/khat.png' },
        { word: 'खजाना', english: 'Treasure', image: '/assets/hindi/images/khazaana.png' }
      ]
    },
    'ग': {
      letterAudio: '/assets/hindi/audio/ga.mp3', themeColor: colors[3],
      examples: [
        { word: 'गाड़ी', english: 'Vehicle', image: '/assets/hindi/images/gaadi.png' },
        { word: 'गधा', english: 'Donkey', image: '/assets/hindi/images/gadha.png' },
        { word: 'गमला', english: 'Flowerpot', image: '/assets/hindi/images/gamla.png' },
        { word: 'गाजर', english: 'Carrot', image: '/assets/hindi/images/gajar.png' }
      ]
    },
    'घ': {
      letterAudio: '/assets/hindi/audio/gha.mp3', themeColor: colors[4],
      examples: [
        { word: 'घड़ी', english: 'Watch', image: '/assets/hindi/images/ghadi.png' },
        { word: 'घर', english: 'House', image: '/assets/hindi/images/ghar.png' },
        { word: 'घोड़ा', english: 'Horse', image: '/assets/hindi/images/ghoda.png' },
        { word: 'घास', english: 'Grass', image: '/assets/hindi/images/ghas.png' }
      ]
    },
    'ङ': { letterAudio: '/assets/hindi/audio/nga.mp3', themeColor: colors[5], examples: [] },

    // === THE 'CH' ROW ===
    'च': {
      letterAudio: '/assets/hindi/audio/cha.mp3', themeColor: colors[6],
      examples: [
        { word: 'चम्मच', english: 'Spoon', image: '/assets/hindi/images/chammach.png' },
        { word: 'चोर', english: 'Thief', image: '/assets/hindi/images/chor.png' },
        { word: 'चेहरा', english: 'Face', image: '/assets/hindi/images/chehra.png' },
        { word: 'चांदी', english: 'Silver', image: '/assets/hindi/images/chaandi.png' }
      ]
    },
    'छ': {
      letterAudio: '/assets/hindi/audio/chha.mp3', themeColor: colors[7],
      examples: [
        { word: 'छाता', english: 'Umbrella', image: '/assets/hindi/images/chhata.png' },
        { word: 'छह', english: 'Six', image: '/assets/hindi/images/cheh.png' },
        { word: 'छत', english: 'Roof', image: '/assets/hindi/images/chhat.png' },
        { word: 'छात्र', english: 'Student', image: '/assets/hindi/images/chhatra.png' }
      ]
    },
    'ज': {
      letterAudio: '/assets/hindi/audio/ja.mp3', themeColor: colors[8],
      examples: [
        { word: 'जग', english: 'Jug', image: '/assets/hindi/images/jug.png' },
        { word: 'जोकर', english: 'Joker', image: '/assets/hindi/images/jokar.png' },
        { word: 'जाम', english: 'Jam', image: '/assets/hindi/images/jam.png' },
        { word: 'जल', english: 'Water', image: '/assets/hindi/images/jal.png' }
      ]
    },
    'झ': {
      letterAudio: '/assets/hindi/audio/jha.mp3', themeColor: colors[9],
      examples: [
        { word: 'झंडा', english: 'Flag', image: '/assets/hindi/images/jhanda.png' },
        { word: 'झाड़ू', english: 'Broom', image: '/assets/hindi/images/jhadu.png' },
        { word: 'झील', english: 'Lake', image: '/assets/hindi/images/jheel.png' },
        { word: 'झोपड़ी', english: 'Hut', image: '/assets/hindi/images/jhopadi.png' }
      ]
    },
    'ञ': { letterAudio: '/assets/hindi/audio/nya.mp3', themeColor: colors[10], examples: [] },

    // === THE 'T' ROW (Retroflex) ===
    'ट': {
      letterAudio: '/assets/hindi/audio/tta.mp3', themeColor: colors[11],
      examples: [
        { word: 'टमाटर', english: 'Tomato', image: '/assets/hindi/images/tamatar.png' },
        { word: 'टूटना', english: 'Break', image: '/assets/hindi/images/tootana.png' },
        { word: 'टोपी', english: 'Hat', image: '/assets/hindi/images/topi.png' },
        { word: 'टोकरी', english: 'Basket', image: '/assets/hindi/images/tokari.png' }
      ]
    },
    'ठ': {
      letterAudio: '/assets/hindi/audio/ttha.mp3', themeColor: colors[0],
      examples: [
        { word: 'ठंडा', english: 'Cold', image: '/assets/hindi/images/thanda.png' },
        { word: 'ठठेरा', english: 'Coppersmith', image: '/assets/hindi/images/thathera.png' },
        { word: 'ठप्पा', english: 'Stamp', image: '/assets/hindi/images/thappa.png' },
        { word: 'ठेला', english: 'Cart', image: '/assets/hindi/images/thela.png' }
      ]
    },
    'ड': {
      letterAudio: '/assets/hindi/audio/dda.mp3', themeColor: colors[1],
      examples: [
        { word: 'डमरू', english: 'Drum', image: '/assets/hindi/images/damroo.png' },
        { word: 'डोसा', english: 'Dosa', image: '/assets/hindi/images/dosa.png' },
        { word: 'डाल', english: 'Branch', image: '/assets/hindi/images/daal.png' },
        { word: 'डाकघर', english: 'Post Office', image: '/assets/hindi/images/dakghar.png' }
      ]
    },
    'ढ': {
      letterAudio: '/assets/hindi/audio/ddha.mp3', themeColor: colors[2],
      examples: [
        { word: 'ढोलक', english: 'Dholak', image: '/assets/hindi/images/dholak.png' },
        { word: 'ढूंढना', english: 'Search', image: '/assets/hindi/images/dhoondhana.png' },
        { word: 'ढाल', english: 'Shield', image: '/assets/hindi/images/dhaal.png' },
        { word: 'ढक्कन', english: 'Lid', image: '/assets/hindi/images/dhakkan.png' }
      ]
    },
    'ण': { letterAudio: '/assets/hindi/audio/nna.mp3', themeColor: colors[3], examples: [] },

    // === THE 'T' ROW (Dental) ===
    'त': {
      letterAudio: '/assets/hindi/audio/ta.mp3', themeColor: colors[4],
      examples: [
        { word: 'तलवार', english: 'Sword', image: '/assets/hindi/images/talvaar.png' },
        { word: 'ताला', english: 'Lock', image: '/assets/hindi/images/taala.png' },
        { word: 'तरबूज', english: 'Watermelon', image: '/assets/hindi/images/tarbooj.png' },
        { word: 'तोता', english: 'Parrot', image: '/assets/hindi/images/tota.png' }
      ]
    },
    'थ': {
      letterAudio: '/assets/hindi/audio/tha.mp3', themeColor: colors[5],
      examples: [
        { word: 'थाली', english: 'Plate', image: '/assets/hindi/images/thaali.png' },
        { word: 'थाना', english: 'Police Station', image: '/assets/hindi/images/thaana.png' },
        { word: 'थर्मस', english: 'Thermos', image: '/assets/hindi/images/thermos.png' },
        { word: 'थैला', english: 'Bag', image: '/assets/hindi/images/thaela.png' }
      ]
    },
    'द': {
      letterAudio: '/assets/hindi/audio/da.mp3', themeColor: colors[6],
      examples: [
        { word: 'दरवाजा', english: 'Door', image: '/assets/hindi/images/darvaja.png' },
        { word: 'दो', english: 'Two', image: '/assets/hindi/images/do.png' },
        { word: 'दिल', english: 'Heart', image: '/assets/hindi/images/dil.png' },
        { word: 'दवात', english: 'Inkpot', image: '/assets/hindi/images/dawaat.png' }
      ]
    },
    'ध': {
      letterAudio: '/assets/hindi/audio/dha.mp3', themeColor: colors[7],
      examples: [
        { word: 'धन', english: 'Wealth', image: '/assets/hindi/images/dhan.png' },
        { word: 'धागा', english: 'Thread', image: '/assets/hindi/images/dhaga.png' },
        { word: 'धनुष', english: 'Bow', image: '/assets/hindi/images/dhanush.png' },
        { word: 'धरती', english: 'Earth', image: '/assets/hindi/images/dharti.png' }
      ]
    },
    'न': {
      letterAudio: '/assets/hindi/audio/na.mp3', themeColor: colors[8],
      examples: [
        { word: 'नाव', english: 'Boat', image: '/assets/hindi/images/naav.png' },
        { word: 'नल', english: 'Tap', image: '/assets/hindi/images/nal.png' },
        { word: 'नौ', english: 'Nine', image: '/assets/hindi/images/nau.png' },
        { word: 'नाखून', english: 'Nail', image: '/assets/hindi/images/nakhoon.png' }
      ]
    },

    // === THE 'P' ROW ===
    'प': {
      letterAudio: '/assets/hindi/audio/pa.mp3', themeColor: colors[9],
      examples: [
        { word: 'पुस्तक', english: 'Book', image: '/assets/hindi/images/pustak.png' },
        { word: 'पतंग', english: 'Kite', image: '/assets/hindi/images/patang.png' },
        { word: 'पीला', english: 'Yellow', image: '/assets/hindi/images/peela.png' },
        { word: 'पंख', english: 'Fan/Feather', image: '/assets/hindi/images/pankha.png' }
      ]
    },
    'फ': {
      letterAudio: '/assets/hindi/audio/pha.mp3', themeColor: colors[10],
      examples: [
        { word: 'फूल', english: 'Flower', image: '/assets/hindi/images/phool.png' },
        { word: 'फल', english: 'Fruit', image: '/assets/hindi/images/phal.png' },
        { word: 'फाटक', english: 'Gate', image: '/assets/hindi/images/fatak.png' },
        { word: 'फौजी', english: 'Soldier', image: '/assets/hindi/images/fauji.png' }
      ]
    },
    'ब': {
      letterAudio: '/assets/hindi/audio/ba.mp3', themeColor: colors[11],
      examples: [
        { word: 'बच्चा', english: 'Child', image: '/assets/hindi/images/bacha.png' },
        { word: 'बकरी', english: 'Goat', image: '/assets/hindi/images/bakri.png' },
        { word: 'बतख', english: 'Duck', image: '/assets/hindi/images/batakh.png' },
        { word: 'बाज', english: 'Hawk', image: '/assets/hindi/images/baaj.png' }
      ]
    },
    'भ': {
      letterAudio: '/assets/hindi/audio/bha.mp3', themeColor: colors[0],
      examples: [
        { word: 'भालू', english: 'Bear', image: '/assets/hindi/images/bhaloo.png' },
        { word: 'भुट्टा', english: 'Corn', image: '/assets/hindi/images/bhutta.png' },
        { word: 'भारत', english: 'India', image: '/assets/hindi/images/bharat.png' },
        { word: 'भीम', english: 'Bheem', image: '/assets/hindi/images/bheem.png' }
      ]
    },
    'म': {
      letterAudio: '/assets/hindi/audio/ma.mp3', themeColor: colors[1],
      examples: [
        { word: 'मछली', english: 'Fish', image: '/assets/hindi/images/machli.png' },
        { word: 'मगर', english: 'Crocodile', image: '/assets/hindi/images/magar.png' },
        { word: 'महल', english: 'Palace', image: '/assets/hindi/images/mahal.png' },
        { word: 'मजदूर', english: 'Worker', image: '/assets/hindi/images/majdoor.png' }
      ]
    },

    // === THE 'Y' ROW ===
    'य': {
      letterAudio: '/assets/hindi/audio/ya.mp3', themeColor: colors[2],
      examples: [
        { word: 'यज्ञ', english: 'Yajna', image: '/assets/hindi/images/yag.png' },
        { word: 'युद्ध', english: 'War', image: '/assets/hindi/images/yudh.png' },
        { word: 'युवराज', english: 'Prince', image: '/assets/hindi/images/yuvraj.png' },
        { word: 'योग', english: 'Yoga', image: '/assets/hindi/images/yog.png' }
      ]
    },
    'र': {
      letterAudio: '/assets/hindi/audio/ra.mp3', themeColor: colors[3],
      examples: [
        { word: 'रथ', english: 'Chariot', image: '/assets/hindi/images/rath.png' },
        { word: 'रस्सी', english: 'Rope', image: '/assets/hindi/images/rassi.png' },
        { word: 'राजा', english: 'King', image: '/assets/hindi/images/raja.png' },
        { word: 'रंगोली', english: 'Rangoli', image: '/assets/hindi/images/rangoli.png' }
      ]
    },
    'ल': {
      letterAudio: '/assets/hindi/audio/la.mp3', themeColor: colors[4],
      examples: [
        { word: 'लड्डू', english: 'Sweet', image: '/assets/hindi/images/laddoo.png' },
        { word: 'लकड़ी', english: 'Wood', image: '/assets/hindi/images/lakadi.png' },
        { word: 'लड़का', english: 'Boy', image: '/assets/hindi/images/ladka.png' },
        { word: 'लौकी', english: 'Bottle Gourd', image: '/assets/hindi/images/lauki.png' }
      ]
    },
    'व': {
      letterAudio: '/assets/hindi/audio/va.mp3', themeColor: colors[5],
      examples: [
        { word: 'वन', english: 'Forest', image: '/assets/hindi/images/van.png' },
        { word: 'वर्षा', english: 'Rain', image: '/assets/hindi/images/varsha.png' },
        { word: 'विवाह', english: 'Marriage', image: '/assets/hindi/images/vivah.png' },
        { word: 'वक', english: 'Crane', image: '/assets/hindi/images/vak.png' }
      ]
    },

    // === THE 'S' ROW ===
    'श': {
      letterAudio: '/assets/hindi/audio/sha.mp3', themeColor: colors[6],
      examples: [
        { word: 'शेर', english: 'Lion', image: '/assets/hindi/images/sher.png' },
        { word: 'शर्बत', english: 'Juice', image: '/assets/hindi/images/sharbat.png' },
        { word: 'शहतूत', english: 'Mulberry', image: '/assets/hindi/images/shetoot.png' },
        { word: 'शिक्षक', english: 'Teacher', image: '/assets/hindi/images/shikshak.png' }
      ]
    },
    'ष': {
      letterAudio: '/assets/hindi/audio/ssha.mp3', themeColor: colors[7],
      examples: [
        { word: 'षट्कोण', english: 'Hexagon', image: '/assets/hindi/images/shatkon.png' }
      ]
    },
    'स': {
      letterAudio: '/assets/hindi/audio/sa.mp3', themeColor: colors[8],
      examples: [
        { word: 'साबुन', english: 'Soap', image: '/assets/hindi/images/sabun.png' },
        { word: 'सेब', english: 'Apple', image: '/assets/hindi/images/seb.png' },
        { word: 'सांप', english: 'Snake', image: '/assets/hindi/images/saanp.png' },
        { word: 'सैनिक', english: 'Soldier', image: '/assets/hindi/images/sainik.png' }
      ]
    },
    'ह': {
      letterAudio: '/assets/hindi/audio/ha.mp3', themeColor: colors[9],
      examples: [
        { word: 'हाथी', english: 'Elephant', image: '/assets/hindi/images/haathi.png' },
        { word: 'हाथ', english: 'Hand', image: '/assets/hindi/images/haath.png' },
        { word: 'हीरा', english: 'Diamond', image: '/assets/hindi/images/heera.png' },
        { word: 'हल', english: 'Plough', image: '/assets/hindi/images/hal.png' }
      ]
    },

    // === SANYUKT & EXTRA ===
    'क्ष': {
      letterAudio: '/assets/hindi/audio/ksha.mp3', themeColor: colors[10],
      examples: [
        { word: 'क्षत्रिय', english: 'Warrior', image: '/assets/hindi/images/kshatriya.png' },
        { word: 'क्षमा', english: 'Forgiveness', image: '/assets/hindi/images/kshma.png' }
      ]
    },
    'त्र': {
      letterAudio: '/assets/hindi/audio/tra.mp3', themeColor: colors[11],
      examples: [
        { word: 'त्रिकोण', english: 'Triangle', image: '/assets/hindi/images/trikon.png' }
      ]
    },
    'ज्ञ': {
      letterAudio: '/assets/hindi/audio/gya.mp3', themeColor: colors[0],
      examples: [
        { word: 'ज्ञानी', english: 'Scholar', image: '/assets/hindi/images/gyaani.png' }
      ]
    },
    'श्र': { letterAudio: '/assets/hindi/audio/shra.mp3', themeColor: colors[1], examples: [] },
    'ड़': { letterAudio: '/assets/hindi/audio/ada.mp3', themeColor: colors[2], examples: [] },
    'ढ़': { letterAudio: '/assets/hindi/audio/adha.mp3', themeColor: colors[3], examples: [] }
  }
};