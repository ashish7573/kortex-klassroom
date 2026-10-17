"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch2-sub8-quiz',
  subject: 'Hindi',
  chapterNumber: 2,
  chapterName: 'Ch 2: व्यंजन (VYANJAN)',
  subtopicOrder: 8,
  subtopicName: 'संयुक्त व्यंजन वर्ण - क्ष, त्र, ज्ञ',
  isMajorMilestone: false,
  milestoneLevel: 11,
  title: 'संयुक्त व्यंजन वर्ण - क्ष, त्र, ज्ञ उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "संयुक्त व्यंजन वर्ण कौन-से हैं?",
        "mode": "mcq_text",
        "target": "opt_sanyukt",
        "options": [
            {
                "id": "opt_sanyukt",
                "text": "क्ष, त्र, ज्ञ, श्र"
            },
            {
                "id": "opt_ushma",
                "text": "श, ष, स, ह"
            },
            {
                "id": "opt_antastha",
                "text": "य, र, ल, व"
            },
            {
                "id": "opt_vyanjan",
                "text": "क, ख, ग, घ"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "अक्षर \"क्ष\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_kshatriya",
        "options": [
            {
                "id": "opt_kshatriya",
                "text": "क्षत्रिय ⚔️"
            },
            {
                "id": "opt_trishul",
                "text": "त्रिशूल 🔱"
            },
            {
                "id": "opt_gyani",
                "text": "ज्ञानी 🧙"
            },
            {
                "id": "opt_kamal",
                "text": "कमल 🪷"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "अक्षर \"त्र\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_trishul",
        "options": [
            {
                "id": "opt_trishul",
                "text": "त्रिशूल 🔱"
            },
            {
                "id": "opt_gyani",
                "text": "ज्ञानी 🧙"
            },
            {
                "id": "opt_kshatriya",
                "text": "क्षत्रिय ⚔️"
            },
            {
                "id": "opt_rath",
                "text": "रथ 🛒"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "अक्षर \"ज्ञ\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_gyani",
        "options": [
            {
                "id": "opt_gyani",
                "text": "ज्ञानी 🧙"
            },
            {
                "id": "opt_kisan",
                "text": "किसान 👨‍🌾"
            },
            {
                "id": "opt_mitra",
                "text": "मित्र 🤝"
            },
            {
                "id": "opt_raja",
                "text": "राजा 👑"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "\"क्ष\" किन दो वर्णों के मेल से बनता है?",
        "mode": "mcq_text",
        "target": "opt_k_sha",
        "options": [
            {
                "id": "opt_k_sha",
                "text": "क् + ष"
            },
            {
                "id": "opt_k_sa",
                "text": "क् + स"
            },
            {
                "id": "opt_t_ra",
                "text": "त् + र"
            },
            {
                "id": "opt_j_nya",
                "text": "ज् + ञ"
            }
        ]
    }
]
};

export default function HiCh2Sub8Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
