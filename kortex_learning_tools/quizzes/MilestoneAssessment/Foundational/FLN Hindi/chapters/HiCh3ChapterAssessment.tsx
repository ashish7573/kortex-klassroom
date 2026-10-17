"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch3-major-quiz',
  subject: 'Hindi',
  chapterNumber: 3,
  chapterName: 'Ch 3: 2/3/4 अक्षर के शब्द (Word Formation)',
  isMajorMilestone: true,
  milestoneLevel: 19,
  title: '🏆 अमात्रिक शब्द महा-मूल्यांकन (Chapter 3 Assessment)',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "अक्षरों को जोड़कर शब्द पहचानें: ग + र = ?",
        "mode": "mcq_text",
        "target": "opt_ghar",
        "options": [
            {
                "id": "opt_ghar",
                "text": "घर"
            },
            {
                "id": "opt_kal",
                "text": "कल"
            },
            {
                "id": "opt_fal",
                "text": "फल"
            },
            {
                "id": "opt_jal",
                "text": "जल"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "अक्षरों को जोड़कर शब्द पहचानें: क + ल + म = ?",
        "mode": "mcq_text",
        "target": "opt_kalam",
        "options": [
            {
                "id": "opt_kalam",
                "text": "कलम"
            },
            {
                "id": "opt_kamal",
                "text": "कमल"
            },
            {
                "id": "opt_mahal",
                "text": "महल"
            },
            {
                "id": "opt_shahar",
                "text": "शहर"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "4-अक्षर वाला अमात्रिक शब्द कौन-सा है?",
        "mode": "mcq_text",
        "target": "opt_adrak",
        "options": [
            {
                "id": "opt_adrak",
                "text": "अदरक"
            },
            {
                "id": "opt_kamal",
                "text": "कमल"
            },
            {
                "id": "opt_ghar",
                "text": "घर"
            },
            {
                "id": "opt_kalam",
                "text": "कलम"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "ब + र + ग + द को मिलाकर क्या बनेगा?",
        "mode": "mcq_text",
        "target": "opt_bargad",
        "options": [
            {
                "id": "opt_bargad",
                "text": "बरगद 🌳"
            },
            {
                "id": "opt_shalgam",
                "text": "शलजम 🥗"
            },
            {
                "id": "opt_bartan",
                "text": "बर्तन 🥣"
            },
            {
                "id": "opt_kasrat",
                "text": "कसरत 🏋️"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "चित्र देखकर शब्द चुनें: 🦆 (बतख)",
        "mode": "mcq_text",
        "target": "opt_batakh",
        "options": [
            {
                "id": "opt_batakh",
                "text": "बतख"
            },
            {
                "id": "opt_magar",
                "text": "मगर"
            },
            {
                "id": "opt_matar",
                "text": "मटर"
            },
            {
                "id": "opt_kamal",
                "text": "कमल"
            }
        ]
    }
]
};

export default function HiCh3ChapterAssessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
