"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch6-major-quiz',
  subject: 'Hindi',
  chapterNumber: 6,
  chapterName: 'Ch 6: कहानियाँ (Stories)',
  isMajorMilestone: true,
  milestoneLevel: 36,
  title: '🌟 संपूर्ण कहानियाँ व FLN महा-मूल्यांकन (Chapter 6 Assessment)',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "वाक्य पूरा करें: \"रोहन ने बागीचे में सुंदर _____ देखा।\"",
        "mode": "mcq_text",
        "target": "opt_phool",
        "options": [
            {
                "id": "opt_phool",
                "text": "फूल 🌸"
            },
            {
                "id": "opt_katori",
                "text": "कटोरी"
            },
            {
                "id": "opt_sarak",
                "text": "सड़क"
            },
            {
                "id": "opt_chammach",
                "text": "चम्मच"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "सही वाक्य पहचानें:",
        "mode": "mcq_text",
        "target": "opt_v1",
        "options": [
            {
                "id": "opt_v1",
                "text": "बच्चे मैदान में खेल रहे हैं।"
            },
            {
                "id": "opt_v2",
                "text": "मैदान है खेल बच्चे में।"
            },
            {
                "id": "opt_v3",
                "text": "खेल मैदान में है बच्चे।"
            },
            {
                "id": "opt_v4",
                "text": "है मैदान बच्चे खेल रहे।"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "\"शेर और चूहा\" कहानी में चूहे ने क्या काटकर शेर को बचाया था?",
        "mode": "mcq_text",
        "target": "opt_jaal",
        "options": [
            {
                "id": "opt_jaal",
                "text": "जाल (Net) 🕸️"
            },
            {
                "id": "opt_ped",
                "text": "पेड़ 🌳"
            },
            {
                "id": "opt_pathar",
                "text": "पत्थर 🪨"
            },
            {
                "id": "opt_dhanush",
                "text": "धनुष 🏹"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "स्वतंत्र पठन: \"सूरज निकला, चिड़िया चहकी।\" इस वाक्य में कौन निकला?",
        "mode": "mcq_text",
        "target": "opt_suraj",
        "options": [
            {
                "id": "opt_suraj",
                "text": "सूरज ☀️"
            },
            {
                "id": "opt_chanda",
                "text": "चांद 🌙"
            },
            {
                "id": "opt_tara",
                "text": "तारा ⭐"
            },
            {
                "id": "opt_badal",
                "text": "बादल ☁️"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "\"मेहनत\" शब्द का क्या अर्थ है?",
        "mode": "mcq_text",
        "target": "opt_parishram",
        "options": [
            {
                "id": "opt_parishram",
                "text": "परिश्रम (काम)"
            },
            {
                "id": "opt_aalsi",
                "text": "आलस"
            },
            {
                "id": "opt_khel",
                "text": "खेलना"
            },
            {
                "id": "opt_sona",
                "text": "सोना"
            }
        ]
    }
]
};

export default function HiCh6ChapterAssessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
