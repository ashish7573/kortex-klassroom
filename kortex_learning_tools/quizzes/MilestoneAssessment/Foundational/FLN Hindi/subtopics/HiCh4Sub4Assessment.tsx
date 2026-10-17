"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch4-sub4-quiz',
  subject: 'Hindi',
  chapterNumber: 4,
  chapterName: 'Ch 4: मात्रा (Matraa)',
  subtopicOrder: 4,
  subtopicName: 'उ की मात्रा',
  isMajorMilestone: false,
  milestoneLevel: 23,
  title: 'उ की मात्रा उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "छोटे \"उ\" की मात्रा (ु) वाला शब्द पहचानें:",
        "mode": "mcq_text",
        "target": "opt_gulab",
        "options": [
            {
                "id": "opt_gulab",
                "text": "गुलाब 🌹"
            },
            {
                "id": "opt_phool",
                "text": "फूल 🌸"
            },
            {
                "id": "opt_bhalu",
                "text": "भालू 🐻"
            },
            {
                "id": "opt_suraj",
                "text": "सूरज ☀️"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "प + ु + ल = कौन-सा शब्द बनता है?",
        "mode": "mcq_text",
        "target": "opt_pul",
        "options": [
            {
                "id": "opt_pul",
                "text": "पुल 🌉"
            },
            {
                "id": "opt_kul",
                "text": "कुल"
            },
            {
                "id": "opt_pal",
                "text": "पल"
            },
            {
                "id": "opt_fal",
                "text": "फल"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "ग + ु + ड़ + ़ि + य + ा = क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_gudiya",
        "options": [
            {
                "id": "opt_gudiya",
                "text": "गुड़िया 🪆"
            },
            {
                "id": "opt_chidiya",
                "text": "चिड़िया 🐦"
            },
            {
                "id": "opt_pudiya",
                "text": "पुड़िया"
            },
            {
                "id": "opt_kutiya",
                "text": "कुटिया 🛖"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "क पर \"ु\" की मात्रा लगाने से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_ku",
        "options": [
            {
                "id": "opt_ku",
                "text": "कु"
            },
            {
                "id": "opt_koo",
                "text": "कू"
            },
            {
                "id": "opt_ko",
                "text": "को"
            },
            {
                "id": "opt_ke",
                "text": "के"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "चित्र देखकर शब्द पहचानें: 🪆 (गुड़िया)",
        "mode": "mcq_text",
        "target": "opt_gudiya",
        "options": [
            {
                "id": "opt_gudiya",
                "text": "गुड़िया 🪆"
            },
            {
                "id": "opt_chidiya",
                "text": "चिड़िया 🐦"
            },
            {
                "id": "opt_hathi",
                "text": "हाथी 🐘"
            },
            {
                "id": "opt_titli",
                "text": "तितली 🦋"
            }
        ]
    }
]
};

export default function HiCh4Sub4Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
