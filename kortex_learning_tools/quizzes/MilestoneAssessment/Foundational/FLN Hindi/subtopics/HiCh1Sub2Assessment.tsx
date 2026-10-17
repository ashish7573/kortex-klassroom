"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch1-sub2-quiz',
  subject: 'Hindi',
  chapterNumber: 1,
  chapterName: 'Ch 1: स्वर (Swar)',
  subtopicOrder: 2,
  subtopicName: 'स्वर वर्ण - ऋ से अ:',
  isMajorMilestone: false,
  milestoneLevel: 2,
  title: 'स्वर वर्ण - ऋ से अ: उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "स्वर \"ऋ\" से कौन-सा शब्द बनता है?",
        "mode": "mcq_text",
        "target": "opt_rishi",
        "options": [
            {
                "id": "opt_rishi",
                "text": "ऋषि 🧘"
            },
            {
                "id": "opt_aam",
                "text": "आम 🥭"
            },
            {
                "id": "opt_edhi",
                "text": "एड़ी 🦶"
            },
            {
                "id": "opt_oon",
                "text": "ऊन 🧶"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "स्वर \"ए\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_edhi",
        "options": [
            {
                "id": "opt_edhi",
                "text": "एड़ी 🦶"
            },
            {
                "id": "opt_ainak",
                "text": "ऐनक 👓"
            },
            {
                "id": "opt_okhli",
                "text": "ओखली 🥣"
            },
            {
                "id": "opt_anar",
                "text": "अनार 🍎"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "स्वर \"ओ\" से शुरू होने वाला शब्द चुनें:",
        "mode": "mcq_text",
        "target": "opt_okhli",
        "options": [
            {
                "id": "opt_okhli",
                "text": "ओखली"
            },
            {
                "id": "opt_aurat",
                "text": "औरत"
            },
            {
                "id": "opt_angur",
                "text": "अंगूर"
            },
            {
                "id": "opt_aam",
                "text": "आम"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "स्वर \"अं\" से क्या बनता है?",
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
                "id": "opt_kela",
                "text": "केला 🍌"
            },
            {
                "id": "opt_aam",
                "text": "आम 🥭"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "स्वर वर्णमाला का अंतिम स्वर कौन-सा है?",
        "mode": "mcq_text",
        "target": "opt_ah",
        "options": [
            {
                "id": "opt_ah",
                "text": "अः"
            },
            {
                "id": "opt_am",
                "text": "अं"
            },
            {
                "id": "opt_au",
                "text": "औ"
            },
            {
                "id": "opt_o",
                "text": "ओ"
            }
        ]
    }
]
};

export default function HiCh1Sub2Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
