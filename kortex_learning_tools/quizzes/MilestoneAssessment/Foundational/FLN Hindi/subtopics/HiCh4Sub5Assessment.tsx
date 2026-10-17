"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch4-sub5-quiz',
  subject: 'Hindi',
  chapterNumber: 4,
  chapterName: 'Ch 4: मात्रा (Matraa)',
  subtopicOrder: 5,
  subtopicName: 'ऊ की मात्रा',
  isMajorMilestone: false,
  milestoneLevel: 24,
  title: 'ऊ की मात्रा उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "बड़े \"ऊ\" की मात्रा (ू) वाला शब्द पहचानें:",
        "mode": "mcq_text",
        "target": "opt_suraj",
        "options": [
            {
                "id": "opt_suraj",
                "text": "सूरज ☀️"
            },
            {
                "id": "opt_pul",
                "text": "पुल 🌉"
            },
            {
                "id": "opt_gulab",
                "text": "गुलाब 🌹"
            },
            {
                "id": "opt_kisan",
                "text": "किसान 👨‍🌾"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "भ + ा + ल + ू = क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_bhalu",
        "options": [
            {
                "id": "opt_bhalu",
                "text": "भालू 🐻"
            },
            {
                "id": "opt_aalu",
                "text": "आलू 🥔"
            },
            {
                "id": "opt_chalu",
                "text": "चालू"
            },
            {
                "id": "opt_kaju",
                "text": "काजू 🥜"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "फ + ू + ल = कौन-सा शब्द बनता है?",
        "mode": "mcq_text",
        "target": "opt_phool",
        "options": [
            {
                "id": "opt_phool",
                "text": "फूल 🌸"
            },
            {
                "id": "opt_dhool",
                "text": "धूल"
            },
            {
                "id": "opt_mool",
                "text": "मूल"
            },
            {
                "id": "opt_fal",
                "text": "फल"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "चित्र देखकर शब्द पहचानें: 🥔 (आलू)",
        "mode": "mcq_text",
        "target": "opt_aalu",
        "options": [
            {
                "id": "opt_aalu",
                "text": "आलू 🥔"
            },
            {
                "id": "opt_bhalu",
                "text": "भालू 🐻"
            },
            {
                "id": "opt_chaku",
                "text": "चाकू 🔪"
            },
            {
                "id": "opt_damru",
                "text": "डमरू 🪘"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "च + ा + क + ू = क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_chaku",
        "options": [
            {
                "id": "opt_chaku",
                "text": "चाकू 🔪"
            },
            {
                "id": "opt_kaju",
                "text": "काजू 🥜"
            },
            {
                "id": "opt_bhalu",
                "text": "भालू 🐻"
            },
            {
                "id": "opt_aalu",
                "text": "आलू 🥔"
            }
        ]
    }
]
};

export default function HiCh4Sub5Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
