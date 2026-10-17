"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch4-major-quiz',
  subject: 'Hindi',
  chapterNumber: 4,
  chapterName: 'Ch 4: मात्रा (Matraa)',
  isMajorMilestone: true,
  milestoneLevel: 31,
  title: '🏆 संपूर्ण मात्रा महा-मूल्यांकन (Chapter 4 Assessment)',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "\"आ\" (ा) की मात्रा वाला शब्द कौन-सा है?",
        "mode": "mcq_text",
        "target": "opt_aam",
        "options": [
            {
                "id": "opt_aam",
                "text": "राजा 👑"
            },
            {
                "id": "opt_din",
                "text": "दिन ☀️"
            },
            {
                "id": "opt_khel",
                "text": "खेल"
            },
            {
                "id": "opt_phool",
                "text": "फूल 🌸"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "छोटी \"इ\" (ि) की मात्रा वाला शब्द पहचानें:",
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
                "id": "opt_sher",
                "text": "शेर 🦁"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "बड़ी \"ई\" (ी) की मात्रा वाला शब्द पहचानें:",
        "mode": "mcq_text",
        "target": "opt_machhli",
        "options": [
            {
                "id": "opt_machhli",
                "text": "मछली 🐟"
            },
            {
                "id": "opt_kavi",
                "text": "कवि ✍️"
            },
            {
                "id": "opt_dhan",
                "text": "धन 💰"
            },
            {
                "id": "opt_pul",
                "text": "पुल 🌉"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "क + ो = कौन-सा अक्षर बनेगा?",
        "mode": "mcq_text",
        "target": "opt_ko",
        "options": [
            {
                "id": "opt_ko",
                "text": "को"
            },
            {
                "id": "opt_ke",
                "text": "के"
            },
            {
                "id": "opt_kai",
                "text": "कै"
            },
            {
                "id": "opt_kau",
                "text": "कौ"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "शब्द \"सूरज\" में कौन-सी मात्रा लगी है?",
        "mode": "mcq_text",
        "target": "opt_oo",
        "options": [
            {
                "id": "opt_oo",
                "text": "बड़े \"ऊ\" की मात्रा (ू)"
            },
            {
                "id": "opt_u",
                "text": "छोटे \"उ\" की मात्रा (ु)"
            },
            {
                "id": "opt_aa",
                "text": "\"आ\" की मात्रा (ा)"
            },
            {
                "id": "opt_o",
                "text": "\"ओ\" की मात्रा (ो)"
            }
        ]
    }
]
};

export default function HiCh4ChapterAssessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
