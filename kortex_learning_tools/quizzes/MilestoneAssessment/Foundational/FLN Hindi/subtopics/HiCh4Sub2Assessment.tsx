"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch4-sub2-quiz',
  subject: 'Hindi',
  chapterNumber: 4,
  chapterName: 'Ch 4: मात्रा (Matraa)',
  subtopicOrder: 2,
  subtopicName: 'इ की मात्रा',
  isMajorMilestone: false,
  milestoneLevel: 21,
  title: 'इ की मात्रा उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "छोटी \"इ\" की मात्रा (ि) वाला शब्द पहचानें:",
        "mode": "mcq_text",
        "target": "opt_kisan",
        "options": [
            {
                "id": "opt_kisan",
                "text": "किसान 👨‍🌾"
            },
            {
                "id": "opt_keel",
                "text": "कील"
            },
            {
                "id": "opt_pani",
                "text": "पानी 💧"
            },
            {
                "id": "opt_rani",
                "text": "रानी 👸"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "क + ि + त + ा + ब = क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_kitab",
        "options": [
            {
                "id": "opt_kitab",
                "text": "किताब 📖"
            },
            {
                "id": "opt_kisan",
                "text": "किसान 👨‍🌾"
            },
            {
                "id": "opt_gitar",
                "text": "गिटार 🎸"
            },
            {
                "id": "opt_shikar",
                "text": "शिकार"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "द + ि + न = क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_din",
        "options": [
            {
                "id": "opt_din",
                "text": "दिन ☀️"
            },
            {
                "id": "opt_deen",
                "text": "दीन"
            },
            {
                "id": "opt_daan",
                "text": "दान"
            },
            {
                "id": "opt_dhan",
                "text": "धन"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "चित्र देखकर शब्द पहचानें: 🎸 (गिटार)",
        "mode": "mcq_text",
        "target": "opt_gitar",
        "options": [
            {
                "id": "opt_gitar",
                "text": "गिटार 🎸"
            },
            {
                "id": "opt_sitar",
                "text": "सितार"
            },
            {
                "id": "opt_chidiya",
                "text": "चिड़िया 🐦"
            },
            {
                "id": "opt_takiya",
                "text": "तकिया 🛏️"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "छोटी \"इ\" की मात्रा वर्ण के किस तरफ लगती है?",
        "mode": "mcq_text",
        "target": "opt_left",
        "options": [
            {
                "id": "opt_left",
                "text": "वर्ण के बाईं ओर (Left) ⬅️"
            },
            {
                "id": "opt_right",
                "text": "वर्ण के दाईं ओर (Right) ➡️"
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
    }
]
};

export default function HiCh4Sub2Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
