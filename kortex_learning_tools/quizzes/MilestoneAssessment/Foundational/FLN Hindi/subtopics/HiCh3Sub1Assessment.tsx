"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch3-sub1-quiz',
  subject: 'Hindi',
  chapterNumber: 3,
  chapterName: 'Ch 3: 2/3/4 अक्षर के शब्द (Word Formation)',
  subtopicOrder: 1,
  subtopicName: '2 अक्षर के शब्द',
  isMajorMilestone: false,
  milestoneLevel: 13,
  title: '2 अक्षर के शब्द उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "अक्षरों को जोड़कर शब्द पहचानें: घ + र = ?",
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
        "prompt": "चित्र देखकर शब्द चुनें: 🍎 (फल)",
        "mode": "mcq_text",
        "target": "opt_fal",
        "options": [
            {
                "id": "opt_fal",
                "text": "फल"
            },
            {
                "id": "opt_nal",
                "text": "नल"
            },
            {
                "id": "opt_jal",
                "text": "जल"
            },
            {
                "id": "opt_hal",
                "text": "हल"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "अक्षरों को जोड़कर शब्द पहचानें: न + ल = ?",
        "mode": "mcq_text",
        "target": "opt_nal",
        "options": [
            {
                "id": "opt_nal",
                "text": "नल 🚰"
            },
            {
                "id": "opt_fal",
                "text": "फल 🍎"
            },
            {
                "id": "opt_dal",
                "text": "दल"
            },
            {
                "id": "opt_bal",
                "text": "बल"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "2 अक्षर का अमात्रिक शब्द कौन-सा है?",
        "mode": "mcq_text",
        "target": "opt_bas",
        "options": [
            {
                "id": "opt_bas",
                "text": "बस 🚌"
            },
            {
                "id": "opt_kamal",
                "text": "कमल 🪷"
            },
            {
                "id": "opt_adrak",
                "text": "अदरक"
            },
            {
                "id": "opt_tamatar",
                "text": "टमाटर 🍅"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "ज + ल = कौन-सा शब्द बनता है?",
        "mode": "mcq_text",
        "target": "opt_jal",
        "options": [
            {
                "id": "opt_jal",
                "text": "जल 💧"
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
                "id": "opt_chal",
                "text": "चल"
            }
        ]
    }
]
};

export default function HiCh3Sub1Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
