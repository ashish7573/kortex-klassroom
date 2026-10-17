"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch4-sub9-quiz',
  subject: 'Hindi',
  chapterNumber: 4,
  chapterName: 'Ch 4: मात्रा (Matraa)',
  subtopicOrder: 9,
  subtopicName: 'औ की मात्रा',
  isMajorMilestone: false,
  milestoneLevel: 28,
  title: 'औ की मात्रा उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "\"औ\" की मात्रा (ौ) वाला शब्द पहचानें:",
        "mode": "mcq_text",
        "target": "opt_paudha",
        "options": [
            {
                "id": "opt_paudha",
                "text": "पौधा 🌱"
            },
            {
                "id": "opt_mor",
                "text": "मोर 🦚"
            },
            {
                "id": "opt_kela",
                "text": "केला 🍌"
            },
            {
                "id": "opt_seb",
                "text": "सेब 🍎"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "औ + र + त = क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_aurat",
        "options": [
            {
                "id": "opt_aurat",
                "text": "औरत 👩"
            },
            {
                "id": "opt_raja",
                "text": "राजा 👑"
            },
            {
                "id": "opt_sainik",
                "text": "सैनिक 🪖"
            },
            {
                "id": "opt_kisan",
                "text": "किसान 👨‍🌾"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "न + ौ + क + ा = क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_nauka",
        "options": [
            {
                "id": "opt_nauka",
                "text": "नौका (नाव) ⛵"
            },
            {
                "id": "opt_mor",
                "text": "मोर 🦚"
            },
            {
                "id": "opt_hathi",
                "text": "हाथी 🐘"
            },
            {
                "id": "opt_rel",
                "text": "रेल 🚆"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "ख + ि + ल + ौ + न + ा = क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_khilona",
        "options": [
            {
                "id": "opt_khilona",
                "text": "खिलौना 🧸"
            },
            {
                "id": "opt_bichhauna",
                "text": "बिछौना"
            },
            {
                "id": "opt_pakoda",
                "text": "पकोड़ा 🥟"
            },
            {
                "id": "opt_hathoda",
                "text": "हथौड़ा 🔨"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "क पर \"ौ\" की मात्रा लगाने से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_kau",
        "options": [
            {
                "id": "opt_kau",
                "text": "कौ"
            },
            {
                "id": "opt_ko",
                "text": "को"
            },
            {
                "id": "opt_kai",
                "text": "कै"
            },
            {
                "id": "opt_ke",
                "text": "के"
            }
        ]
    }
]
};

export default function HiCh4Sub9Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
