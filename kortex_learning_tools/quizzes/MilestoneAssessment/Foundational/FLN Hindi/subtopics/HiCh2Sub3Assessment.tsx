"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch2-sub3-quiz',
  subject: 'Hindi',
  chapterNumber: 2,
  chapterName: 'Ch 2: व्यंजन (VYANJAN)',
  subtopicOrder: 3,
  subtopicName: 'ट वर्ग',
  isMajorMilestone: false,
  milestoneLevel: 6,
  title: 'ट वर्ग उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "ट-वर्ग का पहला अक्षर क्या है?",
        "mode": "mcq_text",
        "target": "opt_ta",
        "options": [
            {
                "id": "opt_ta",
                "text": "ट"
            },
            {
                "id": "opt_ttha",
                "text": "ठ"
            },
            {
                "id": "opt_da",
                "text": "ड"
            },
            {
                "id": "opt_dha",
                "text": "ढ"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "अक्षर \"ट\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_tamatar",
        "options": [
            {
                "id": "opt_tamatar",
                "text": "टमाटर 🍅"
            },
            {
                "id": "opt_thathera",
                "text": "ठठेरा"
            },
            {
                "id": "opt_damru",
                "text": "डमरू 🪘"
            },
            {
                "id": "opt_dhakkan",
                "text": "ढक्कन"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "अक्षर \"ड\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_damru",
        "options": [
            {
                "id": "opt_damru",
                "text": "डमरू 🪘"
            },
            {
                "id": "opt_tamatar",
                "text": "टमाटर 🍅"
            },
            {
                "id": "opt_kalam",
                "text": "कलम ✏️"
            },
            {
                "id": "opt_ghar",
                "text": "घर 🏠"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "ट-वर्ग में \"ट\" के बाद क्या आता है?",
        "mode": "mcq_text",
        "target": "opt_ttha",
        "options": [
            {
                "id": "opt_ttha",
                "text": "ठ"
            },
            {
                "id": "opt_da",
                "text": "ड"
            },
            {
                "id": "opt_dha",
                "text": "ढ"
            },
            {
                "id": "opt_na",
                "text": "ण"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "ट-वर्ग का पंचम वर्ण कौन-सा है?",
        "mode": "mcq_text",
        "target": "opt_na",
        "options": [
            {
                "id": "opt_na",
                "text": "ण"
            },
            {
                "id": "opt_n",
                "text": "न"
            },
            {
                "id": "opt_m",
                "text": "म"
            },
            {
                "id": "opt_nga",
                "text": "ङ"
            }
        ]
    }
]
};

export default function HiCh2Sub3Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
