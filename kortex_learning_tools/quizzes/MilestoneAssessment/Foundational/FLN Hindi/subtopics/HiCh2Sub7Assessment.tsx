"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch2-sub7-quiz',
  subject: 'Hindi',
  chapterNumber: 2,
  chapterName: 'Ch 2: व्यंजन (VYANJAN)',
  subtopicOrder: 7,
  subtopicName: 'ऊष्म व्यंजन वर्ण - श, ष, स, ह',
  isMajorMilestone: false,
  milestoneLevel: 10,
  title: 'ऊष्म व्यंजन वर्ण - श, ष, स, ह उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "ऊष्म व्यंजन कौन-से हैं?",
        "mode": "mcq_text",
        "target": "opt_ushma",
        "options": [
            {
                "id": "opt_ushma",
                "text": "श, ष, स, ह"
            },
            {
                "id": "opt_antastha",
                "text": "य, र, ल, व"
            },
            {
                "id": "opt_sanyukt",
                "text": "क्ष, त्र, ज्ञ, श्र"
            },
            {
                "id": "opt_pa",
                "text": "प, फ, ब, भ"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "अक्षर \"श\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_shalgam",
        "options": [
            {
                "id": "opt_shalgam",
                "text": "शलजम 🥗"
            },
            {
                "id": "opt_seb",
                "text": "सेब 🍎"
            },
            {
                "id": "opt_hathi",
                "text": "हाथी 🐘"
            },
            {
                "id": "opt_kamal",
                "text": "कमल 🪷"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "अक्षर \"ष\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_shatkon",
        "options": [
            {
                "id": "opt_shatkon",
                "text": "षट्कोण ⬡"
            },
            {
                "id": "opt_sarauta",
                "text": "सरोता"
            },
            {
                "id": "opt_hathi",
                "text": "हाथी 🐘"
            },
            {
                "id": "opt_rath",
                "text": "रथ 🛒"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "अक्षर \"स\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_seb",
        "options": [
            {
                "id": "opt_seb",
                "text": "सेब 🍎"
            },
            {
                "id": "opt_hathi",
                "text": "हाथी 🐘"
            },
            {
                "id": "opt_shalgam",
                "text": "शलजम 🥗"
            },
            {
                "id": "opt_patang",
                "text": "पतंग 🪁"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "अक्षर \"ह\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_hathi",
        "options": [
            {
                "id": "opt_hathi",
                "text": "हाथी 🐘"
            },
            {
                "id": "opt_ghoda",
                "text": "घोड़ा 🐎"
            },
            {
                "id": "opt_sher",
                "text": "शेर 🦁"
            },
            {
                "id": "opt_kutta",
                "text": "कुत्ता 🐕"
            }
        ]
    }
]
};

export default function HiCh2Sub7Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
