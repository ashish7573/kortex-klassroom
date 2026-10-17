"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch2-sub4-quiz',
  subject: 'Hindi',
  chapterNumber: 2,
  chapterName: 'Ch 2: व्यंजन (VYANJAN)',
  subtopicOrder: 4,
  subtopicName: 'त वर्ग',
  isMajorMilestone: false,
  milestoneLevel: 7,
  title: 'त वर्ग उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "त-वर्ग का पहला अक्षर क्या है?",
        "mode": "mcq_text",
        "target": "opt_ta",
        "options": [
            {
                "id": "opt_ta",
                "text": "त"
            },
            {
                "id": "opt_tha",
                "text": "थ"
            },
            {
                "id": "opt_da",
                "text": "द"
            },
            {
                "id": "opt_dha",
                "text": "ध"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "अक्षर \"त\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_tarbuj",
        "options": [
            {
                "id": "opt_tarbuj",
                "text": "तरबूज 🍉"
            },
            {
                "id": "opt_tharmas",
                "text": "थर्मस"
            },
            {
                "id": "opt_dawat",
                "text": "दवात"
            },
            {
                "id": "opt_dhanush",
                "text": "धनुष 🏹"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "अक्षर \"द\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_dawat",
        "options": [
            {
                "id": "opt_dawat",
                "text": "दवात / दरवाजा 🚪"
            },
            {
                "id": "opt_tarbuj",
                "text": "तरबूज 🍉"
            },
            {
                "id": "opt_kamal",
                "text": "कमल 🪷"
            },
            {
                "id": "opt_patang",
                "text": "पतंग 🪁"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "अक्षर \"ध\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_dhanush",
        "options": [
            {
                "id": "opt_dhanush",
                "text": "धनुष 🏹"
            },
            {
                "id": "opt_nal",
                "text": "नल 🚰"
            },
            {
                "id": "opt_tarbuj",
                "text": "तरबूज 🍉"
            },
            {
                "id": "opt_ghar",
                "text": "घर 🏠"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "त-वर्ग का अंतिम वर्ण कौन-सा है?",
        "mode": "mcq_text",
        "target": "opt_na",
        "options": [
            {
                "id": "opt_na",
                "text": "न"
            },
            {
                "id": "opt_m",
                "text": "म"
            },
            {
                "id": "opt_nna",
                "text": "ण"
            },
            {
                "id": "opt_dha",
                "text": "ध"
            }
        ]
    }
]
};

export default function HiCh2Sub4Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
