"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch1-sub1-quiz',
  subject: 'Hindi',
  chapterNumber: 1,
  chapterName: 'Ch 1: स्वर (Swar)',
  subtopicOrder: 1,
  subtopicName: 'स्वर वर्ण - अ से ऊ',
  isMajorMilestone: false,
  milestoneLevel: 1,
  title: 'स्वर वर्ण - अ से ऊ उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "चित्र देखकर पहला अक्षर पहचानें: 🍎 (अनार)",
        "mode": "mcq_image_to_item",
        "target": "opt_a",
        "options": [
            {
                "id": "opt_a",
                "text": "अ"
            },
            {
                "id": "opt_b",
                "text": "आ"
            },
            {
                "id": "opt_c",
                "text": "इ"
            },
            {
                "id": "opt_d",
                "text": "ई"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "अक्षर \"आ\" से कौन-सा फल शुरू होता है?",
        "mode": "mcq_text",
        "target": "opt_aam",
        "options": [
            {
                "id": "opt_aam",
                "text": "आम 🥭"
            },
            {
                "id": "opt_seb",
                "text": "सेब 🍎"
            },
            {
                "id": "opt_kela",
                "text": "केला 🍌"
            },
            {
                "id": "opt_angur",
                "text": "अंगूर 🍇"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "चित्र देखकर सही स्वर चुनें: 🍯 (इमली)",
        "mode": "mcq_text",
        "target": "opt_i",
        "options": [
            {
                "id": "opt_i",
                "text": "इ"
            },
            {
                "id": "opt_ee",
                "text": "ई"
            },
            {
                "id": "opt_u",
                "text": "उ"
            },
            {
                "id": "opt_oo",
                "text": "ऊ"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "स्वर \"ई\" से शुरू होने वाला शब्द कौन-सा है?",
        "mode": "mcq_text",
        "target": "opt_eekh",
        "options": [
            {
                "id": "opt_eekh",
                "text": "ईख (गन्ना)"
            },
            {
                "id": "opt_ullu",
                "text": "उल्लू"
            },
            {
                "id": "opt_aam",
                "text": "आम"
            },
            {
                "id": "opt_anar",
                "text": "अनार"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "स्वर \"ऊ\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_oon",
        "options": [
            {
                "id": "opt_oon",
                "text": "ऊन 🧶"
            },
            {
                "id": "opt_imrat",
                "text": "इमारत 🏢"
            },
            {
                "id": "opt_kela",
                "text": "केला 🍌"
            },
            {
                "id": "opt_anar",
                "text": "अनार 🍎"
            }
        ]
    }
]
};

export default function HiCh1Sub1Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
