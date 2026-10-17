"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch3-sub2-quiz',
  subject: 'Hindi',
  chapterNumber: 3,
  chapterName: 'Ch 3: 2/3/4 अक्षर के शब्द (Word Formation)',
  subtopicOrder: 2,
  subtopicName: 'कहानी : 2 अक्षर',
  isMajorMilestone: false,
  milestoneLevel: 14,
  title: 'कहानी : 2 अक्षर उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "वाक्य पूरा करें: \"यश _____ पर चढ़।\"",
        "mode": "mcq_text",
        "target": "opt_bas",
        "options": [
            {
                "id": "opt_bas",
                "text": "बस"
            },
            {
                "id": "opt_kamal",
                "text": "कमल"
            },
            {
                "id": "opt_fal",
                "text": "फल"
            },
            {
                "id": "opt_jal",
                "text": "जल"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "वाक्य पूरा करें: \"जय _____ भर।\"",
        "mode": "mcq_text",
        "target": "opt_jal",
        "options": [
            {
                "id": "opt_jal",
                "text": "जल"
            },
            {
                "id": "opt_ghar",
                "text": "घर"
            },
            {
                "id": "opt_khat",
                "text": "खत"
            },
            {
                "id": "opt_rath",
                "text": "रथ"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "2 अक्षर के शब्दों से बना सही वाक्य पहचानें:",
        "mode": "mcq_text",
        "target": "opt_s1",
        "options": [
            {
                "id": "opt_s1",
                "text": "घर चल कर फल चख।"
            },
            {
                "id": "opt_s2",
                "text": "घर फल चल कर चख।"
            },
            {
                "id": "opt_s3",
                "text": "फल चख घर कर चल।"
            },
            {
                "id": "opt_s4",
                "text": "कर चल फल घर चख।"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "\"खत पढ़ कर रख।\" में क्या पढ़ने को कहा गया है?",
        "mode": "mcq_text",
        "target": "opt_khat",
        "options": [
            {
                "id": "opt_khat",
                "text": "खत ✉️"
            },
            {
                "id": "opt_fal",
                "text": "फल 🍎"
            },
            {
                "id": "opt_jal",
                "text": "जल 💧"
            },
            {
                "id": "opt_rath",
                "text": "रथ 🛒"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "\"डर मत, सच कह।\" का क्या अर्थ है?",
        "mode": "mcq_text",
        "target": "opt_meaning",
        "options": [
            {
                "id": "opt_meaning",
                "text": "बिना डरे सच बोलना"
            },
            {
                "id": "opt_run",
                "text": "भाग जाना"
            },
            {
                "id": "opt_sleep",
                "text": "सो जाना"
            },
            {
                "id": "opt_eat",
                "text": "खाना खाना"
            }
        ]
    }
]
};

export default function HiCh3Sub2Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
