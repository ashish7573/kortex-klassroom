"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch4-sub8-quiz',
  subject: 'Hindi',
  chapterNumber: 4,
  chapterName: 'Ch 4: मात्रा (Matraa)',
  subtopicOrder: 8,
  subtopicName: 'ओ की मात्रा',
  isMajorMilestone: false,
  milestoneLevel: 27,
  title: 'ओ की मात्रा उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "\"ओ\" की मात्रा (ो) वाला शब्द पहचानें:",
        "mode": "mcq_text",
        "target": "opt_mor",
        "options": [
            {
                "id": "opt_mor",
                "text": "मोर 🦚"
            },
            {
                "id": "opt_aurat",
                "text": "औरत 👩"
            },
            {
                "id": "opt_seb",
                "text": "सेब 🍎"
            },
            {
                "id": "opt_paisa",
                "text": "पैसा 💰"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "त + ो + त + ा = कौन-सा पक्षी बनता है?",
        "mode": "mcq_text",
        "target": "opt_tota",
        "options": [
            {
                "id": "opt_tota",
                "text": "तोता 🦜"
            },
            {
                "id": "opt_mor",
                "text": "मोर 🦚"
            },
            {
                "id": "opt_maina",
                "text": "मैना 🐦"
            },
            {
                "id": "opt_koel",
                "text": "कोयल"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "घ + ो + ड़ + ा = कौन-सा जानवर बनता है?",
        "mode": "mcq_text",
        "target": "opt_ghoda",
        "options": [
            {
                "id": "opt_ghoda",
                "text": "घोड़ा 🐎"
            },
            {
                "id": "opt_hathi",
                "text": "हाथी 🐘"
            },
            {
                "id": "opt_sher",
                "text": "शेर 🦁"
            },
            {
                "id": "opt_bhalu",
                "text": "भालू 🐻"
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
        "prompt": "चित्र देखकर शब्द पहचानें: 🦚 (मोर)",
        "mode": "mcq_text",
        "target": "opt_mor",
        "options": [
            {
                "id": "opt_mor",
                "text": "मोर 🦚"
            },
            {
                "id": "opt_tota",
                "text": "तोता 🦜"
            },
            {
                "id": "opt_koyal",
                "text": "कोयल"
            },
            {
                "id": "opt_kabutar",
                "text": "कबूतर 🕊️"
            }
        ]
    }
]
};

export default function HiCh4Sub8Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
