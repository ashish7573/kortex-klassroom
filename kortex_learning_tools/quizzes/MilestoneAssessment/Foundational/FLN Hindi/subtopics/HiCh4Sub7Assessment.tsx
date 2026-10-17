"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch4-sub7-quiz',
  subject: 'Hindi',
  chapterNumber: 4,
  chapterName: 'Ch 4: मात्रा (Matraa)',
  subtopicOrder: 7,
  subtopicName: 'ऐ की मात्रा',
  isMajorMilestone: false,
  milestoneLevel: 26,
  title: 'ऐ की मात्रा उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "\"ऐ\" की मात्रा (ै) वाला शब्द पहचानें:",
        "mode": "mcq_text",
        "target": "opt_paisa",
        "options": [
            {
                "id": "opt_paisa",
                "text": "पैसा 💰"
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
                "id": "opt_mora",
                "text": "मोर 🦚"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "प + ै + र = क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_pair",
        "options": [
            {
                "id": "opt_pair",
                "text": "पैर 🦶"
            },
            {
                "id": "opt_sair",
                "text": "सैर 🚶"
            },
            {
                "id": "opt_bair",
                "text": "बैर"
            },
            {
                "id": "opt_tair",
                "text": "तैर 🏊"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "म + ै + न + ा = कौन-सा पक्षी बनता है?",
        "mode": "mcq_text",
        "target": "opt_maina",
        "options": [
            {
                "id": "opt_maina",
                "text": "मैना 🐦"
            },
            {
                "id": "opt_tota",
                "text": "तोता 🦜"
            },
            {
                "id": "opt_mor",
                "text": "मोर 🦚"
            },
            {
                "id": "opt_cheel",
                "text": "चील"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "ब + ै + ल = कौन-सा जानवर बनता है?",
        "mode": "mcq_text",
        "target": "opt_bail",
        "options": [
            {
                "id": "opt_bail",
                "text": "बैल 🐂"
            },
            {
                "id": "opt_sher",
                "text": "शेर 🦁"
            },
            {
                "id": "opt_bhalu",
                "text": "भालू 🐻"
            },
            {
                "id": "opt_hathi",
                "text": "हाथी 🐘"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "स + ै + न + िक = कौन बनता है?",
        "mode": "mcq_text",
        "target": "opt_sainik",
        "options": [
            {
                "id": "opt_sainik",
                "text": "सैनिक 🪖"
            },
            {
                "id": "opt_kisan",
                "text": "किसान 👨‍🌾"
            },
            {
                "id": "opt_raja",
                "text": "राजा 👑"
            },
            {
                "id": "opt_kavi",
                "text": "कवि ✍️"
            }
        ]
    }
]
};

export default function HiCh4Sub7Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
