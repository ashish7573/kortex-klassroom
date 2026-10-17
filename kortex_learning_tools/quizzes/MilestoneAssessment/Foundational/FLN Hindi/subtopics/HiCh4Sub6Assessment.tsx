"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch4-sub6-quiz',
  subject: 'Hindi',
  chapterNumber: 4,
  chapterName: 'Ch 4: मात्रा (Matraa)',
  subtopicOrder: 6,
  subtopicName: 'ए की मात्रा',
  isMajorMilestone: false,
  milestoneLevel: 25,
  title: 'ए की मात्रा उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "\"ए\" की मात्रा (े) वाला शब्द पहचानें:",
        "mode": "mcq_text",
        "target": "opt_seb",
        "options": [
            {
                "id": "opt_seb",
                "text": "सेब 🍎"
            },
            {
                "id": "opt_paisa",
                "text": "पैसा 💰"
            },
            {
                "id": "opt_aam",
                "text": "आम 🥭"
            },
            {
                "id": "opt_phool",
                "text": "फूल 🌸"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "क + े + ल + ा = कौन-सा फल बनता है?",
        "mode": "mcq_text",
        "target": "opt_kela",
        "options": [
            {
                "id": "opt_kela",
                "text": "केला 🍌"
            },
            {
                "id": "opt_seb",
                "text": "सेब 🍎"
            },
            {
                "id": "opt_ber",
                "text": "बेर"
            },
            {
                "id": "opt_peda",
                "text": "पेड़ा"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "श + े + र = कौन-सा जानवर बनता है?",
        "mode": "mcq_text",
        "target": "opt_sher",
        "options": [
            {
                "id": "opt_sher",
                "text": "शेर 🦁"
            },
            {
                "id": "opt_bhed",
                "text": "भेड़ 🐑"
            },
            {
                "id": "opt_bhalu",
                "text": "भालू 🐻"
            },
            {
                "id": "opt_hathi",
                "text": "हाथी 🐘"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "प + े + ड़ = क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_ped",
        "options": [
            {
                "id": "opt_ped",
                "text": "पेड़ 🌳"
            },
            {
                "id": "opt_khet",
                "text": "खेत 🌾"
            },
            {
                "id": "opt_seb",
                "text": "सेब 🍎"
            },
            {
                "id": "opt_kela",
                "text": "केला 🍌"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "चित्र देखकर शब्द पहचानें: 🚆 (रेलगाड़ी)",
        "mode": "mcq_text",
        "target": "opt_rel",
        "options": [
            {
                "id": "opt_rel",
                "text": "रेल 🚆"
            },
            {
                "id": "opt_khel",
                "text": "खेल"
            },
            {
                "id": "opt_tel",
                "text": "तेल"
            },
            {
                "id": "opt_bel",
                "text": "बेल"
            }
        ]
    }
]
};

export default function HiCh4Sub6Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
