"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch2-sub5-quiz',
  subject: 'Hindi',
  chapterNumber: 2,
  chapterName: 'Ch 2: व्यंजन (VYANJAN)',
  subtopicOrder: 5,
  subtopicName: 'प वर्ग',
  isMajorMilestone: false,
  milestoneLevel: 8,
  title: 'प वर्ग उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "प-वर्ग का पहला अक्षर क्या है?",
        "mode": "mcq_text",
        "target": "opt_pa",
        "options": [
            {
                "id": "opt_pa",
                "text": "प"
            },
            {
                "id": "opt_pha",
                "text": "फ"
            },
            {
                "id": "opt_ba",
                "text": "ब"
            },
            {
                "id": "opt_bha",
                "text": "भ"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "अक्षर \"प\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_patang",
        "options": [
            {
                "id": "opt_patang",
                "text": "पतंग 🪁"
            },
            {
                "id": "opt_fal",
                "text": "फल 🍎"
            },
            {
                "id": "opt_bakri",
                "text": "बकरी 🐐"
            },
            {
                "id": "opt_bhalu",
                "text": "भालू 🐻"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "अक्षर \"फ\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_fal",
        "options": [
            {
                "id": "opt_fal",
                "text": "फल 🍎"
            },
            {
                "id": "opt_patang",
                "text": "पतंग 🪁"
            },
            {
                "id": "opt_kamal",
                "text": "कमल 🪷"
            },
            {
                "id": "opt_ghar",
                "text": "घर 🏠"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "अक्षर \"म\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_machhli",
        "options": [
            {
                "id": "opt_machhli",
                "text": "मछली 🐟"
            },
            {
                "id": "opt_bakri",
                "text": "बकरी 🐐"
            },
            {
                "id": "opt_bhalu",
                "text": "भालू 🐻"
            },
            {
                "id": "opt_patang",
                "text": "पतंग 🪁"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "प-वर्ग के सभी वर्ण सही क्रम में कौन-से हैं?",
        "mode": "mcq_text",
        "target": "opt_p_all",
        "options": [
            {
                "id": "opt_p_all",
                "text": "प, फ, ब, भ, म"
            },
            {
                "id": "opt_p2",
                "text": "प, ब, फ, म, भ"
            },
            {
                "id": "opt_p3",
                "text": "त, थ, द, ध, न"
            },
            {
                "id": "opt_p4",
                "text": "क, ख, ग, घ, ङ"
            }
        ]
    }
]
};

export default function HiCh2Sub5Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
