"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch2-sub1-quiz',
  subject: 'Hindi',
  chapterNumber: 2,
  chapterName: 'Ch 2: व्यंजन (VYANJAN)',
  subtopicOrder: 1,
  subtopicName: 'क वर्ग',
  isMajorMilestone: false,
  milestoneLevel: 4,
  title: 'क वर्ग उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "क-वर्ग का पहला अक्षर क्या है?",
        "mode": "mcq_text",
        "target": "opt_ka",
        "options": [
            {
                "id": "opt_ka",
                "text": "क"
            },
            {
                "id": "opt_kha",
                "text": "ख"
            },
            {
                "id": "opt_ga",
                "text": "ग"
            },
            {
                "id": "opt_gha",
                "text": "घ"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "अक्षर \"क\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_kamal",
        "options": [
            {
                "id": "opt_kamal",
                "text": "कमल 🪷"
            },
            {
                "id": "opt_kharghosh",
                "text": "खरगोश 🐇"
            },
            {
                "id": "opt_gamla",
                "text": "गमला 🪴"
            },
            {
                "id": "opt_ghar",
                "text": "घर 🏠"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "\"क\" के बाद कौन-सा अक्षर आता है?",
        "mode": "mcq_text",
        "target": "opt_kha",
        "options": [
            {
                "id": "opt_kha",
                "text": "ख"
            },
            {
                "id": "opt_ga",
                "text": "ग"
            },
            {
                "id": "opt_cha",
                "text": "च"
            },
            {
                "id": "opt_ta",
                "text": "ट"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "अक्षर \"ग\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_gamla",
        "options": [
            {
                "id": "opt_gamla",
                "text": "गमला 🪴"
            },
            {
                "id": "opt_ghar",
                "text": "घर 🏠"
            },
            {
                "id": "opt_kamal",
                "text": "कमल 🪷"
            },
            {
                "id": "opt_kela",
                "text": "केला 🍌"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "क-वर्ग में कुल कितने अक्षर होते हैं?",
        "mode": "mcq_text",
        "target": "opt_5",
        "options": [
            {
                "id": "opt_5",
                "text": "5 (क, ख, ग, घ, ङ)"
            },
            {
                "id": "opt_4",
                "text": "4"
            },
            {
                "id": "opt_6",
                "text": "6"
            },
            {
                "id": "opt_3",
                "text": "3"
            }
        ]
    }
]
};

export default function HiCh2Sub1Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
