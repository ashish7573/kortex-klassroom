"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch2-sub6-quiz',
  subject: 'Hindi',
  chapterNumber: 2,
  chapterName: 'Ch 2: व्यंजन (VYANJAN)',
  subtopicOrder: 6,
  subtopicName: 'अंतस्थ व्यंजन वर्ण - य, र, ल, व',
  isMajorMilestone: false,
  milestoneLevel: 9,
  title: 'अंतस्थ व्यंजन वर्ण - य, र, ल, व उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "अंतस्थ व्यंजन कौन-से हैं?",
        "mode": "mcq_text",
        "target": "opt_antastha",
        "options": [
            {
                "id": "opt_antastha",
                "text": "य, र, ल, व"
            },
            {
                "id": "opt_ushma",
                "text": "श, ष, स, ह"
            },
            {
                "id": "opt_sanyukt",
                "text": "क्ष, त्र, ज्ञ, श्र"
            },
            {
                "id": "opt_vyanjan",
                "text": "क, ख, ग, घ"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "अक्षर \"य\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_yagya",
        "options": [
            {
                "id": "opt_yagya",
                "text": "यज्ञ 🧘"
            },
            {
                "id": "opt_rath",
                "text": "रथ 🛒"
            },
            {
                "id": "opt_laddoo",
                "text": "लड्डू 🟡"
            },
            {
                "id": "opt_vak",
                "text": "वक 🦢"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "अक्षर \"र\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_rath",
        "options": [
            {
                "id": "opt_rath",
                "text": "रथ 🛒"
            },
            {
                "id": "opt_laddoo",
                "text": "लड्डू 🟡"
            },
            {
                "id": "opt_vak",
                "text": "वक 🦢"
            },
            {
                "id": "opt_yagya",
                "text": "यज्ञ 🧘"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "अक्षर \"ल\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_laddoo",
        "options": [
            {
                "id": "opt_laddoo",
                "text": "लड्डू / लट्टू 🪀"
            },
            {
                "id": "opt_vak",
                "text": "वक 🦢"
            },
            {
                "id": "opt_rath",
                "text": "रथ 🛒"
            },
            {
                "id": "opt_ghar",
                "text": "घर 🏠"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "अक्षर \"व\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_vak",
        "options": [
            {
                "id": "opt_vak",
                "text": "वक (बगुला) 🦢"
            },
            {
                "id": "opt_kamal",
                "text": "कमल 🪷"
            },
            {
                "id": "opt_anar",
                "text": "अनार 🍎"
            },
            {
                "id": "opt_seb",
                "text": "सेब 🍎"
            }
        ]
    }
]
};

export default function HiCh2Sub6Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
