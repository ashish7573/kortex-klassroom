"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch2-sub2-quiz',
  subject: 'Hindi',
  chapterNumber: 2,
  chapterName: 'Ch 2: व्यंजन (VYANJAN)',
  subtopicOrder: 2,
  subtopicName: 'च वर्ग',
  isMajorMilestone: false,
  milestoneLevel: 5,
  title: 'च वर्ग उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "च-वर्ग का पहला अक्षर क्या है?",
        "mode": "mcq_text",
        "target": "opt_cha",
        "options": [
            {
                "id": "opt_cha",
                "text": "च"
            },
            {
                "id": "opt_chha",
                "text": "छ"
            },
            {
                "id": "opt_ja",
                "text": "ज"
            },
            {
                "id": "opt_jha",
                "text": "झ"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "अक्षर \"च\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_chammach",
        "options": [
            {
                "id": "opt_chammach",
                "text": "चम्मच 🥄"
            },
            {
                "id": "opt_chhatri",
                "text": "छतरी ☂️"
            },
            {
                "id": "opt_jahaj",
                "text": "जहाज 🚢"
            },
            {
                "id": "opt_jhanda",
                "text": "झंडा 🇮🇳"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "अक्षर \"छ\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_chhatri",
        "options": [
            {
                "id": "opt_chhatri",
                "text": "छतरी ☂️"
            },
            {
                "id": "opt_chammach",
                "text": "चम्मच 🥄"
            },
            {
                "id": "opt_jahaj",
                "text": "जहाज 🚢"
            },
            {
                "id": "opt_ghar",
                "text": "घर 🏠"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "अक्षर \"ज\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_jahaj",
        "options": [
            {
                "id": "opt_jahaj",
                "text": "जहाज 🚢"
            },
            {
                "id": "opt_kamal",
                "text": "कमल 🪷"
            },
            {
                "id": "opt_patang",
                "text": "पतंग 🪁"
            },
            {
                "id": "opt_machhli",
                "text": "मछली 🐟"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "च-वर्ग का क्रम सही पहचानें:",
        "mode": "mcq_text",
        "target": "opt_c1",
        "options": [
            {
                "id": "opt_c1",
                "text": "च, छ, ज, झ, ञ"
            },
            {
                "id": "opt_c2",
                "text": "च, ज, छ, झ, ञ"
            },
            {
                "id": "opt_c3",
                "text": "क, ख, ग, घ, ङ"
            },
            {
                "id": "opt_c4",
                "text": "ट, ठ, ड, ढ, ण"
            }
        ]
    }
]
};

export default function HiCh2Sub2Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
