"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch6-sub2-quiz',
  subject: 'Hindi',
  chapterNumber: 6,
  chapterName: 'Ch 6: कहानियाँ (Stories)',
  subtopicOrder: 2,
  subtopicName: 'FLN Assessment',
  isMajorMilestone: false,
  milestoneLevel: 35,
  title: 'FLN Assessment उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "वाक्य पठन: \"रोहन रोज़ सुबह पाठशाला जाता है।\" रोहन सुबह कहाँ जाता है?",
        "mode": "mcq_text",
        "target": "opt_school",
        "options": [
            {
                "id": "opt_school",
                "text": "पाठशाला (स्कूल) 🏫"
            },
            {
                "id": "opt_bajar",
                "text": "बाज़ार 🛒"
            },
            {
                "id": "opt_bagicha",
                "text": "बागीचा 🌳"
            },
            {
                "id": "opt_nadi",
                "text": "नदी 🌊"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "सही वर्तनी (Spelling) वाला शब्द पहचानें:",
        "mode": "mcq_text",
        "target": "opt_suraj",
        "options": [
            {
                "id": "opt_suraj",
                "text": "सूरज ☀️"
            },
            {
                "id": "opt_surj",
                "text": "सुरज"
            },
            {
                "id": "opt_sooraj",
                "text": "सोरज"
            },
            {
                "id": "opt_sraj",
                "text": "स्रज"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "वाक्य क्रम सही करें: \"खेलते / मैदान / में / बच्चे / हैं\"",
        "mode": "mcq_text",
        "target": "opt_s1",
        "options": [
            {
                "id": "opt_s1",
                "text": "बच्चे मैदान में खेलते हैं।"
            },
            {
                "id": "opt_s2",
                "text": "मैदान में बच्चे खेलते हैं।"
            },
            {
                "id": "opt_s3",
                "text": "खेलते हैं मैदान में बच्चे।"
            },
            {
                "id": "opt_s4",
                "text": "हैं बच्चे मैदान खेलते में।"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "\"मित्र\" शब्द का पर्यायवाची (समानार्थी) शब्द क्या है?",
        "mode": "mcq_text",
        "target": "opt_dost",
        "options": [
            {
                "id": "opt_dost",
                "text": "दोस्त 🤝"
            },
            {
                "id": "opt_shatru",
                "text": "शत्रु"
            },
            {
                "id": "opt_raja",
                "text": "राजा 👑"
            },
            {
                "id": "opt_guru",
                "text": "गुरु"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "स्वतंत्र पठन: \"हमें सदा सच बोलना चाहिए।\" इस वाक्य से हमें क्या सीख मिलती है?",
        "mode": "mcq_text",
        "target": "opt_truth",
        "options": [
            {
                "id": "opt_truth",
                "text": "सच्चाई का पालन करना"
            },
            {
                "id": "opt_lie",
                "text": "झूठ बोलना"
            },
            {
                "id": "opt_fight",
                "text": "झगड़ा करना"
            },
            {
                "id": "opt_sleep",
                "text": "सोते रहना"
            }
        ]
    }
]
};

export default function HiCh6Sub2Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
