"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch4-sub11-quiz',
  subject: 'Hindi',
  chapterNumber: 4,
  chapterName: 'Ch 4: मात्रा (Matraa)',
  subtopicOrder: 11,
  subtopicName: 'अ: की मात्रा',
  isMajorMilestone: false,
  milestoneLevel: 30,
  title: 'अ: की मात्रा उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "विसर्ग / \"अः\" की मात्रा (ः) वाला शब्द पहचानें:",
        "mode": "mcq_text",
        "target": "opt_namah",
        "options": [
            {
                "id": "opt_namah",
                "text": "नमः 🙏"
            },
            {
                "id": "opt_anar",
                "text": "अनार 🍎"
            },
            {
                "id": "opt_aam",
                "text": "आम 🥭"
            },
            {
                "id": "opt_angur",
                "text": "अंगूर 🍇"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "प + ्र + ा + त + ः = क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_pratah",
        "options": [
            {
                "id": "opt_pratah",
                "text": "प्रातः (सुबह) 🌅"
            },
            {
                "id": "opt_namah",
                "text": "नमः 🙏"
            },
            {
                "id": "opt_punah",
                "text": "पुनः"
            },
            {
                "id": "opt_falatah",
                "text": "फलतः"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "प + ु + न + ः = क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_punah",
        "options": [
            {
                "id": "opt_punah",
                "text": "पुनः (फिर से)"
            },
            {
                "id": "opt_pratah",
                "text": "प्रातः 🌅"
            },
            {
                "id": "opt_namah",
                "text": "नमः 🙏"
            },
            {
                "id": "opt_antatah",
                "text": "अंततः"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "विसर्ग (ः) का उच्चारण किस ध्वनि जैसा होता है?",
        "mode": "mcq_text",
        "target": "opt_ha",
        "options": [
            {
                "id": "opt_ha",
                "text": "\"ह\" जैसा"
            },
            {
                "id": "opt_ma",
                "text": "\"म\" जैसा"
            },
            {
                "id": "opt_na",
                "text": "\"न\" जैसा"
            },
            {
                "id": "opt_ka",
                "text": "\"क\" जैसा"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "विसर्ग (ः) वर्ण के किस तरफ लगाया जाता है?",
        "mode": "mcq_text",
        "target": "opt_right",
        "options": [
            {
                "id": "opt_right",
                "text": "वर्ण के दाईं ओर दो बिंदुओं के रूप में"
            },
            {
                "id": "opt_left",
                "text": "वर्ण के बाईं ओर"
            },
            {
                "id": "opt_top",
                "text": "वर्ण के ऊपर"
            },
            {
                "id": "opt_bottom",
                "text": "वर्ण के नीचे"
            }
        ]
    }
]
};

export default function HiCh4Sub11Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
