"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch2-major-quiz',
  subject: 'Hindi',
  chapterNumber: 2,
  chapterName: 'Ch 2: व्यंजन (VYANJAN)',
  isMajorMilestone: true,
  milestoneLevel: 12,
  title: '🏆 संपूर्ण व्यंजन महा-मूल्यांकन (Chapter 2 Assessment)',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "क-वर्ग का पहला अक्षर क्या है?",
        "mode": "mcq_text",
        "target": "opt_ka",
        "options": [
            {
                "id": "opt_ka",
                "text": "क"
            },
            {
                "id": "opt_cha",
                "text": "च"
            },
            {
                "id": "opt_ta",
                "text": "त"
            },
            {
                "id": "opt_pa",
                "text": "प"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "च-वर्ग से शुरू होने वाला शब्द कौन-सा है?",
        "mode": "mcq_text",
        "target": "opt_chammach",
        "options": [
            {
                "id": "opt_chammach",
                "text": "चम्मच 🥄"
            },
            {
                "id": "opt_tamatar",
                "text": "टमाटर 🍅"
            },
            {
                "id": "opt_kamal",
                "text": "कमल 🪷"
            },
            {
                "id": "opt_patang",
                "text": "पतंग 🪁"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "ट-वर्ग में \"ट\" के बाद कौन-सा अक्षर आता है?",
        "mode": "mcq_text",
        "target": "opt_ttha",
        "options": [
            {
                "id": "opt_ttha",
                "text": "ठ"
            },
            {
                "id": "opt_da",
                "text": "ड"
            },
            {
                "id": "opt_dha",
                "text": "ढ"
            },
            {
                "id": "opt_na",
                "text": "ण"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "त-वर्ग से \"त\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_tarbuj",
        "options": [
            {
                "id": "opt_tarbuj",
                "text": "तरबूज 🍉"
            },
            {
                "id": "opt_patang",
                "text": "पतंग 🪁"
            },
            {
                "id": "opt_kamal",
                "text": "कमल 🪷"
            },
            {
                "id": "opt_ghar",
                "text": "घर 🏠"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "प-वर्ग का पहला अक्षर क्या है?",
        "mode": "mcq_text",
        "target": "opt_pa",
        "options": [
            {
                "id": "opt_pa",
                "text": "प"
            },
            {
                "id": "opt_pha",
                "text": "फ"
            },
            {
                "id": "opt_ba",
                "text": "ब"
            },
            {
                "id": "opt_bha",
                "text": "भ"
            }
        ]
    },
    {
        "id": "q6",
        "prompt": "अक्षर \"य\" किस वर्ग में आता है?",
        "mode": "mcq_text",
        "target": "opt_ya",
        "options": [
            {
                "id": "opt_ya",
                "text": "अंतस्थ व्यंजन (य, र, ल, व)"
            },
            {
                "id": "opt_ka",
                "text": "क-वर्ग"
            },
            {
                "id": "opt_cha",
                "text": "च-वर्ग"
            },
            {
                "id": "opt_pa",
                "text": "प-वर्ग"
            }
        ]
    },
    {
        "id": "q7",
        "prompt": "संयुक्त व्यंजन कौन-से हैं?",
        "mode": "mcq_text",
        "target": "opt_sanyukt",
        "options": [
            {
                "id": "opt_sanyukt",
                "text": "क्ष, त्र, ज्ञ, श्र"
            },
            {
                "id": "opt_swar",
                "text": "अ, आ, इ, ई"
            },
            {
                "id": "opt_vyanjan",
                "text": "क, ख, ग, घ"
            },
            {
                "id": "opt_other",
                "text": "य, र, ल, व"
            }
        ]
    },
    {
        "id": "q8",
        "prompt": "अक्षर \"श\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_shalgam",
        "options": [
            {
                "id": "opt_shalgam",
                "text": "शलजम 🥗"
            },
            {
                "id": "opt_kamal",
                "text": "कमल 🪷"
            },
            {
                "id": "opt_patang",
                "text": "पतंग 🪁"
            },
            {
                "id": "opt_tarbuj",
                "text": "तरबूज 🍉"
            }
        ]
    },
    {
        "id": "q9",
        "prompt": "अक्षर \"ह\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_hathi",
        "options": [
            {
                "id": "opt_hathi",
                "text": "हाथी 🐘"
            },
            {
                "id": "opt_ghoda",
                "text": "घोड़ा 🐎"
            },
            {
                "id": "opt_sher",
                "text": "शेर 🦁"
            },
            {
                "id": "opt_mor",
                "text": "मोर 🦚"
            }
        ]
    },
    {
        "id": "q10",
        "prompt": "अक्षर \"ज्ञ\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_gyani",
        "options": [
            {
                "id": "opt_gyani",
                "text": "ज्ञानी 🧙"
            },
            {
                "id": "opt_kisan",
                "text": "किसान 👨‍🌾"
            },
            {
                "id": "opt_raja",
                "text": "राजा 👑"
            },
            {
                "id": "opt_mitra",
                "text": "मित्र 🤝"
            }
        ]
    }
]
};

export default function HiCh2ChapterAssessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
