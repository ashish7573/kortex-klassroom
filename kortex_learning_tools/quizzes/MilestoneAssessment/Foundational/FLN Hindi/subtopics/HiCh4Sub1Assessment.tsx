"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch4-sub1-quiz',
  subject: 'Hindi',
  chapterNumber: 4,
  chapterName: 'Ch 4: मात्रा (Matraa)',
  subtopicOrder: 1,
  subtopicName: 'आ की मात्रा',
  isMajorMilestone: false,
  milestoneLevel: 20,
  title: 'आ की मात्रा उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "\"आ\" की मात्रा (ा) वाला शब्द कौन-सा है?",
        "mode": "mcq_text",
        "target": "opt_aam",
        "options": [
            {
                "id": "opt_aam",
                "text": "आम 🥭"
            },
            {
                "id": "opt_kalam",
                "text": "कलम ✏️"
            },
            {
                "id": "opt_ghar",
                "text": "घर 🏠"
            },
            {
                "id": "opt_din",
                "text": "दिन ☀️"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "र + ा + ज + ा = कौन-सा शब्द बनता है?",
        "mode": "mcq_text",
        "target": "opt_raja",
        "options": [
            {
                "id": "opt_raja",
                "text": "राजा 👑"
            },
            {
                "id": "opt_rani",
                "text": "रानी 👸"
            },
            {
                "id": "opt_baja",
                "text": "बाजा 🎺"
            },
            {
                "id": "opt_tala",
                "text": "ताला 🔒"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "क पर \"ा\" की मात्रा लगाने से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_kaa",
        "options": [
            {
                "id": "opt_kaa",
                "text": "का"
            },
            {
                "id": "opt_ki",
                "text": "कि"
            },
            {
                "id": "opt_kee",
                "text": "की"
            },
            {
                "id": "opt_ku",
                "text": "कु"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "चित्र देखकर शब्द चुनें: 🔒 (ताला)",
        "mode": "mcq_text",
        "target": "opt_tala",
        "options": [
            {
                "id": "opt_tala",
                "text": "ताला 🔒"
            },
            {
                "id": "opt_mala",
                "text": "माला 📿"
            },
            {
                "id": "opt_kala",
                "text": "काला"
            },
            {
                "id": "opt_baja",
                "text": "बाजा 🎺"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "वाक्य पूरा करें: \"राधा _____ खा।\"",
        "mode": "mcq_text",
        "target": "opt_aam",
        "options": [
            {
                "id": "opt_aam",
                "text": "आम"
            },
            {
                "id": "opt_kalam",
                "text": "कलम"
            },
            {
                "id": "opt_ghar",
                "text": "घर"
            },
            {
                "id": "opt_tala",
                "text": "ताला"
            }
        ]
    }
]
};

export default function HiCh4Sub1Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
