"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch3-sub3-quiz',
  subject: 'Hindi',
  chapterNumber: 3,
  chapterName: 'Ch 3: 2/3/4 अक्षर के शब्द (Word Formation)',
  subtopicOrder: 3,
  subtopicName: '3 अक्षर के शब्द',
  isMajorMilestone: false,
  milestoneLevel: 15,
  title: '3 अक्षर के शब्द उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "अक्षरों को जोड़कर शब्द पहचानें: क + ल + म = ?",
        "mode": "mcq_text",
        "target": "opt_kalam",
        "options": [
            {
                "id": "opt_kalam",
                "text": "कलम ✏️"
            },
            {
                "id": "opt_kamal",
                "text": "कमल 🪷"
            },
            {
                "id": "opt_mahal",
                "text": "महल 🏰"
            },
            {
                "id": "opt_shahar",
                "text": "शहर 🏙️"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "चित्र देखकर 3 अक्षर का शब्द चुनें: 🪷 (कमल)",
        "mode": "mcq_text",
        "target": "opt_kamal",
        "options": [
            {
                "id": "opt_kamal",
                "text": "कमल"
            },
            {
                "id": "opt_kalam",
                "text": "कलम"
            },
            {
                "id": "opt_magar",
                "text": "मगर"
            },
            {
                "id": "opt_matar",
                "text": "मटर"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "म + ट + र = कौन-सा शब्द बनता है?",
        "mode": "mcq_text",
        "target": "opt_matar",
        "options": [
            {
                "id": "opt_matar",
                "text": "मटर 🫛"
            },
            {
                "id": "opt_magar",
                "text": "मगर 🐊"
            },
            {
                "id": "opt_mahal",
                "text": "महल 🏰"
            },
            {
                "id": "opt_sadak",
                "text": "सड़क 🛣️"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "3 अक्षर वाला अमात्रिक शब्द कौन-सा है?",
        "mode": "mcq_text",
        "target": "opt_sadak",
        "options": [
            {
                "id": "opt_sadak",
                "text": "सड़क 🛣️"
            },
            {
                "id": "opt_ghar",
                "text": "घर 🏠"
            },
            {
                "id": "opt_adrak",
                "text": "अदरक"
            },
            {
                "id": "opt_tarbuj",
                "text": "तरबूज 🍉"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "ब + त + ख = कौन-सा पक्षी बनता है?",
        "mode": "mcq_text",
        "target": "opt_batakh",
        "options": [
            {
                "id": "opt_batakh",
                "text": "बतख 🦆"
            },
            {
                "id": "opt_mor",
                "text": "मोर 🦚"
            },
            {
                "id": "opt_chil",
                "text": "चील"
            },
            {
                "id": "opt_tota",
                "text": "तोता 🦜"
            }
        ]
    }
]
};

export default function HiCh3Sub3Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
