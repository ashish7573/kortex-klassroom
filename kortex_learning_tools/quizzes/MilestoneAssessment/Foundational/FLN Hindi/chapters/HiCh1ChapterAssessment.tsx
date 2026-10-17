"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch1-major-quiz',
  subject: 'Hindi',
  chapterNumber: 1,
  chapterName: 'Ch 1: स्वर (Swar)',
  isMajorMilestone: true,
  milestoneLevel: 3,
  title: '🏆 संपूर्ण स्वर महा-मूल्यांकन (Chapter 1 Assessment)',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "चित्र देखकर पहला स्वर पहचानें: 🍎 (अनार)",
        "mode": "mcq_image_to_item",
        "target": "opt_a",
        "options": [
            {
                "id": "opt_a",
                "text": "अ"
            },
            {
                "id": "opt_aa",
                "text": "आ"
            },
            {
                "id": "opt_i",
                "text": "इ"
            },
            {
                "id": "opt_u",
                "text": "उ"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "अक्षर \"आ\" से कौन-सा शब्द बनता है?",
        "mode": "mcq_text",
        "target": "opt_aam",
        "options": [
            {
                "id": "opt_aam",
                "text": "आम 🥭"
            },
            {
                "id": "opt_imrat",
                "text": "इमारत 🏢"
            },
            {
                "id": "opt_kalam",
                "text": "कलम ✏️"
            },
            {
                "id": "opt_ghar",
                "text": "घर 🏠"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "स्वर \"इ\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_imli",
        "options": [
            {
                "id": "opt_imli",
                "text": "इमली"
            },
            {
                "id": "opt_eekh",
                "text": "ईख"
            },
            {
                "id": "opt_oon",
                "text": "ऊन"
            },
            {
                "id": "opt_rishi",
                "text": "ऋषि"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "स्वर \"ई\" से क्या बनता है?",
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
                "id": "opt_edhi",
                "text": "एड़ी"
            },
            {
                "id": "opt_anar",
                "text": "अनार"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "स्वर \"उ\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_ullu",
        "options": [
            {
                "id": "opt_ullu",
                "text": "उल्लू 🦉"
            },
            {
                "id": "opt_oon",
                "text": "ऊन 🧶"
            },
            {
                "id": "opt_aam",
                "text": "आम 🥭"
            },
            {
                "id": "opt_seb",
                "text": "सेब 🍎"
            }
        ]
    },
    {
        "id": "q6",
        "prompt": "स्वर \"ऊ\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_oon",
        "options": [
            {
                "id": "opt_oon",
                "text": "ऊन 🧶"
            },
            {
                "id": "opt_rishi",
                "text": "ऋषि 🧘"
            },
            {
                "id": "opt_ainak",
                "text": "ऐनक 👓"
            },
            {
                "id": "opt_kela",
                "text": "केला 🍌"
            }
        ]
    },
    {
        "id": "q7",
        "prompt": "स्वर \"ऋ\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_rishi",
        "options": [
            {
                "id": "opt_rishi",
                "text": "ऋषि 🧘"
            },
            {
                "id": "opt_edhi",
                "text": "एड़ी 🦶"
            },
            {
                "id": "opt_aam",
                "text": "आम 🥭"
            },
            {
                "id": "opt_anar",
                "text": "अनार 🍎"
            }
        ]
    },
    {
        "id": "q8",
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
                "id": "opt_aurat",
                "text": "औरत 👩"
            },
            {
                "id": "opt_angur",
                "text": "अंगूर 🍇"
            }
        ]
    },
    {
        "id": "q9",
        "prompt": "स्वर \"ओ\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_okhli",
        "options": [
            {
                "id": "opt_okhli",
                "text": "ओखली 🥣"
            },
            {
                "id": "opt_aurat",
                "text": "औरत 👩"
            },
            {
                "id": "opt_aam",
                "text": "आम 🥭"
            },
            {
                "id": "opt_anar",
                "text": "अनार 🍎"
            }
        ]
    },
    {
        "id": "q10",
        "prompt": "स्वर \"अं\" से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_angur",
        "options": [
            {
                "id": "opt_angur",
                "text": "अंगूर 🍇"
            },
            {
                "id": "opt_anar",
                "text": "अनार 🍎"
            },
            {
                "id": "opt_oon",
                "text": "ऊन 🧶"
            },
            {
                "id": "opt_edhi",
                "text": "एड़ी 🦶"
            }
        ]
    }
]
};

export default function HiCh1ChapterAssessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
