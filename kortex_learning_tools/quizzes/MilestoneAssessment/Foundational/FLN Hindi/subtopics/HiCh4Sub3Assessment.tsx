"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch4-sub3-quiz',
  subject: 'Hindi',
  chapterNumber: 4,
  chapterName: 'Ch 4: मात्रा (Matraa)',
  subtopicOrder: 3,
  subtopicName: 'ई की मात्रा',
  isMajorMilestone: false,
  milestoneLevel: 22,
  title: 'ई की मात्रा उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "बड़ी \"ई\" की मात्रा (ी) वाला शब्द पहचानें:",
        "mode": "mcq_text",
        "target": "opt_machhli",
        "options": [
            {
                "id": "opt_machhli",
                "text": "मछली 🐟"
            },
            {
                "id": "opt_din",
                "text": "दिन ☀️"
            },
            {
                "id": "opt_kavi",
                "text": "कवि ✍️"
            },
            {
                "id": "opt_ravi",
                "text": "रवि"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "ह + ा + थ + ी = क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_hathi",
        "options": [
            {
                "id": "opt_hathi",
                "text": "हाथी 🐘"
            },
            {
                "id": "opt_sathi",
                "text": "साथी 🤝"
            },
            {
                "id": "opt_rani",
                "text": "रानी 👸"
            },
            {
                "id": "opt_pani",
                "text": "पानी 💧"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "प + ा + न + ी = क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_pani",
        "options": [
            {
                "id": "opt_pani",
                "text": "पानी 💧"
            },
            {
                "id": "opt_nani",
                "text": "नानी"
            },
            {
                "id": "opt_dadi",
                "text": "दादी"
            },
            {
                "id": "opt_rani",
                "text": "रानी"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "बड़ी \"ई\" की मात्रा वर्ण के किस तरफ लगती है?",
        "mode": "mcq_text",
        "target": "opt_right",
        "options": [
            {
                "id": "opt_right",
                "text": "वर्ण के दाईं ओर (Right) ➡️"
            },
            {
                "id": "opt_left",
                "text": "वर्ण के बाईं ओर (Left) ⬅️"
            },
            {
                "id": "opt_up",
                "text": "वर्ण के ऊपर ⬆️"
            },
            {
                "id": "opt_down",
                "text": "वर्ण के नीचे ⬇️"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "चित्र देखकर शब्द चुनें: 👸 (रानी)",
        "mode": "mcq_text",
        "target": "opt_rani",
        "options": [
            {
                "id": "opt_rani",
                "text": "रानी 👸"
            },
            {
                "id": "opt_raja",
                "text": "राजा 👑"
            },
            {
                "id": "opt_pari",
                "text": "परी 🧚"
            },
            {
                "id": "opt_nani",
                "text": "नानी"
            }
        ]
    }
]
};

export default function HiCh4Sub3Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
