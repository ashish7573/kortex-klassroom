"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-hi-ch6-sub1-quiz',
  subject: 'Hindi',
  chapterNumber: 6,
  chapterName: 'Ch 6: कहानियाँ (Stories)',
  subtopicOrder: 1,
  subtopicName: 'कहानियाँ (Stories)',
  isMajorMilestone: false,
  milestoneLevel: 34,
  title: 'कहानियाँ (Stories) उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
        "id": "q1",
        "prompt": "\"शेर और चूहा\" कहानी में चूहे ने शेर की मदद कैसे की?",
        "mode": "mcq_text",
        "target": "opt_jaal",
        "options": [
            {
                "id": "opt_jaal",
                "text": "शिकारी का जाल अपने दांतों से काटकर 🕸️"
            },
            {
                "id": "opt_tree",
                "text": "पेड़ हिलाकर"
            },
            {
                "id": "opt_run",
                "text": "शिकारी को डराकर"
            },
            {
                "id": "opt_call",
                "text": "हाथी को बुलाकर"
            }
        ]
    },
    {
        "id": "q2",
        "prompt": "\"प्यासा कौवा\" कहानी में कौवे ने मटके में क्या डाला?",
        "mode": "mcq_text",
        "target": "opt_kankar",
        "options": [
            {
                "id": "opt_kankar",
                "text": "कंकड़ 🪨"
            },
            {
                "id": "opt_patte",
                "text": "पत्ते 🍃"
            },
            {
                "id": "opt_phool",
                "text": "फूल 🌸"
            },
            {
                "id": "opt_fal",
                "text": "फल 🍎"
            }
        ]
    },
    {
        "id": "q3",
        "prompt": "कंकड़ डालने पर मटके का पानी क्या हुआ?",
        "mode": "mcq_text",
        "target": "opt_up",
        "options": [
            {
                "id": "opt_up",
                "text": "ऊपर आ गया 💧"
            },
            {
                "id": "opt_down",
                "text": "नीचे चला गया"
            },
            {
                "id": "opt_dry",
                "text": "सूख गया"
            },
            {
                "id": "opt_cold",
                "text": "जम गया"
            }
        ]
    },
    {
        "id": "q4",
        "prompt": "\"कछुआ और खरगोश\" की दौड़ में कौन जीता?",
        "mode": "mcq_text",
        "target": "opt_kachhua",
        "options": [
            {
                "id": "opt_kachhua",
                "text": "कछुआ 🐢"
            },
            {
                "id": "opt_khargosh",
                "text": "खरगोश 🐇"
            },
            {
                "id": "opt_sher",
                "text": "शेर 🦁"
            },
            {
                "id": "opt_mor",
                "text": "मोर 🦚"
            }
        ]
    },
    {
        "id": "q5",
        "prompt": "कछुआ क्यों जीत गया?",
        "mode": "mcq_text",
        "target": "opt_continue",
        "options": [
            {
                "id": "opt_continue",
                "text": "क्योंकि उसने बिना रुके लगातार मेहनत की"
            },
            {
                "id": "opt_fast",
                "text": "क्योंकि वह बहुत तेज भागा"
            },
            {
                "id": "opt_cheat",
                "text": "क्योंकि उसने चालाकी की"
            },
            {
                "id": "opt_fly",
                "text": "क्योंकि वह उड़ने लगा"
            }
        ]
    }
]
};

export default function HiCh6Sub1Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
