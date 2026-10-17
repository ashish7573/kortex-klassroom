"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch5-major-quiz',
  subject: 'Hindi',
  chapterNumber: 5,
  chapterName: 'Ch 5: बारहखड़ी (Barahkhadi)',
  isMajorMilestone: true,
  milestoneLevel: 33,
  title: '🏆 बारहखड़ी महा-मूल्यांकन (Chapter 5 Assessment)',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "बारहखड़ी में \"क\" पर औ की मात्रा लगाने से क्या बनता है?",
        "mode": "mcq_text",
        "target": "opt_kau",
        "options": [
            {
                "id": "opt_kau",
                "text": "कौ"
            },
            {
                "id": "opt_ko",
                "text": "को"
            },
            {
                "id": "opt_kang",
                "text": "कं"
            },
            {
                "id": "opt_kah",
                "text": "कः"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "\"च\" की बारहखड़ी में \"ची\" के बाद क्या आता है?",
        "mode": "mcq_text",
        "target": "opt_chu",
        "options": [
            {
                "id": "opt_chu",
                "text": "चु"
            },
            {
                "id": "opt_choo",
                "text": "चू"
            },
            {
                "id": "opt_che",
                "text": "चे"
            },
            {
                "id": "opt_chai",
                "text": "चै"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "अं की मात्रा लगाने पर \"त\" क्या बन जाता है?",
        "mode": "mcq_text",
        "target": "opt_tang",
        "options": [
            {
                "id": "opt_tang",
                "text": "तं"
            },
            {
                "id": "opt_tah",
                "text": "तः"
            },
            {
                "id": "opt_tau",
                "text": "तौ"
            },
            {
                "id": "opt_to",
                "text": "तो"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "बारहखड़ी में \"प\" का सही क्रम क्या है?",
        "mode": "mcq_text",
        "target": "opt_p_seq",
        "options": [
            {
                "id": "opt_p_seq",
                "text": "प, पा, पि, पी, पु, पू, पे, पै, पो, पौ, पं, पः"
            },
            {
                "id": "opt_p_seq2",
                "text": "पा, प, पी, पि, पू, पु, पे, पै, पो, पौ, पं, पः"
            },
            {
                "id": "opt_p_seq3",
                "text": "प, पि, पा, पी, पे, पै, पु, पू, पो, पौ, पं, पः"
            },
            {
                "id": "opt_p_seq4",
                "text": "प, पा, पु, पू, पि, पी, पे, पै, पो, पौ, पं, पः"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "बारहखड़ी किसी भी व्यंजन वर्ण को _____ के साथ बोलना सिखाती है।",
        "mode": "mcq_text",
        "target": "opt_swar_matra",
        "options": [
            {
                "id": "opt_swar_matra",
                "text": "सभी स्वरों की मात्राओं"
            },
            {
                "id": "opt_numbers",
                "text": "गिनती"
            },
            {
                "id": "opt_english",
                "text": "अंग्रेजी अक्षरों"
            },
            {
                "id": "opt_sounds",
                "text": "केवल संगीत"
            }
        ]
    }
]
};

export default function HiCh5ChapterAssessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
