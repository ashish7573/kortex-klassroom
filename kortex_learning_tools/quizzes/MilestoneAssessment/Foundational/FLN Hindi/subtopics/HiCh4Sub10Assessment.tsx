"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch4-sub10-quiz',
  subject: 'Hindi',
  chapterNumber: 4,
  chapterName: 'Ch 4: मात्रा (Matraa)',
  subtopicOrder: 10,
  subtopicName: 'अं की मात्रा',
  isMajorMilestone: false,
  milestoneLevel: 29,
  title: 'अं की मात्रा उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "अनुस्वार / \"अं\" की मात्रा (ं) वाला शब्द पहचानें:",
        "mode": "mcq_text",
        "target": "opt_angur",
        "options": [
            {
                "id": "opt_angur",
                "text": "अंगूर 🍇"
            },
            {
                "id": "opt_seb",
                "text": "सेब 🍎"
            },
            {
                "id": "opt_aam",
                "text": "आम 🥭"
            },
            {
                "id": "opt_kela",
                "text": "केला 🍌"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "प + ं + त + ं + ग = क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_patang",
        "options": [
            {
                "id": "opt_patang",
                "text": "पतंग 🪁"
            },
            {
                "id": "opt_bandar",
                "text": "बंदर 🐒"
            },
            {
                "id": "opt_jhanda",
                "text": "झंडा 🇮🇳"
            },
            {
                "id": "opt_shankh",
                "text": "शंख 🐚"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "ब + ं + द + र = कौन-सा जानवर बनता है?",
        "mode": "mcq_text",
        "target": "opt_bandar",
        "options": [
            {
                "id": "opt_bandar",
                "text": "बंदर 🐒"
            },
            {
                "id": "opt_hathi",
                "text": "हाथी 🐘"
            },
            {
                "id": "opt_sher",
                "text": "शेर 🦁"
            },
            {
                "id": "opt_bhalu",
                "text": "भालू 🐻"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "झ + ं + ड + ा = क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_jhanda",
        "options": [
            {
                "id": "opt_jhanda",
                "text": "झंडा 🇮🇳"
            },
            {
                "id": "opt_patang",
                "text": "पतंग 🪁"
            },
            {
                "id": "opt_ghanta",
                "text": "घंटा 🔔"
            },
            {
                "id": "opt_danda",
                "text": "डंडा"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "अं की मात्रा (बिंदी) वर्ण के कहाँ लगाई जाती है?",
        "mode": "mcq_text",
        "target": "opt_top",
        "options": [
            {
                "id": "opt_top",
                "text": "वर्ण के ऊपर सिरोरेखा पर ⬆️"
            },
            {
                "id": "opt_bottom",
                "text": "वर्ण के नीचे ⬇️"
            },
            {
                "id": "opt_left",
                "text": "वर्ण के बाईं ओर ⬅️"
            },
            {
                "id": "opt_right",
                "text": "वर्ण के दाईं ओर ➡️"
            }
        ]
    }
]
};

export default function HiCh4Sub10Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
