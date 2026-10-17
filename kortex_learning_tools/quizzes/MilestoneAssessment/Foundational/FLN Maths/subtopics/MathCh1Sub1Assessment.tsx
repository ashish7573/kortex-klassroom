"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-math-ch1-sub1-quiz',
  subject: 'Maths',
  chapterNumber: 1,
  chapterName: 'पूर्व-संख्या ज्ञान',
  subtopicOrder: 1,
  subtopicName: 'क्रमबद्धता व ऊँचाई',
  isMajorMilestone: false,
  milestoneLevel: 1,
  title: 'क्रमबद्धता व ऊँचाई उपविषय मूल्यांकन',
  thresholdScore: 90,
  questions: [
    {
      id: 'q1',
      prompt: 'इनमें से सबसे लंबा/ऊँचा कौन-सा है?',
      mode: 'mcq_text',
      target: 'opt_gir',
      options: [
        { id: 'opt_gir', text: 'जिराफ़ 🦒' },
        { id: 'opt_dog', text: 'कुत्ता 🐕' },
        { id: 'opt_rat', text: 'चूहा 🐁' },
        { id: 'opt_cat', text: 'बिल्ली 🐈' }
      ]
    },
    {
      id: 'q2',
      prompt: 'इनमें से सबसे छोटा कौन-सा है?',
      mode: 'mcq_text',
      target: 'opt_chinti',
      options: [
        { id: 'opt_chinti', text: 'चींटी 🐜' },
        { id: 'opt_hathi', text: 'हाथी 🐘' },
        { id: 'opt_ghoda', text: 'घोड़ा 🐎' },
        { id: 'opt_sher', text: 'शेर 🦁' }
      ]
    },
    {
      id: 'q3',
      prompt: 'सिक्कों के टॉवर में सबसे ऊँचा टॉवर कौन-सा है?',
      mode: 'mcq_text',
      target: 'opt_10',
      options: [
        { id: 'opt_10', text: '10 सिक्कों का टॉवर' },
        { id: 'opt_5', text: '5 सिक्कों का टॉवर' },
        { id: 'opt_3', text: '3 सिक्कों का टॉवर' },
        { id: 'opt_1', text: '1 सिक्के का टॉवर' }
      ]
    },
    {
      id: 'q4',
      prompt: 'आकारों को छोटे से बड़े क्रम (Ascending order) में व्यवस्थित करना क्या कहलाता है?',
      mode: 'mcq_text',
      target: 'opt_seriation',
      options: [
        { id: 'opt_seriation', text: 'क्रमबद्धता (Seriation)' },
        { id: 'opt_ghatav', text: 'घटाव' },
        { id: 'opt_guna', text: 'गुणा' },
        { id: 'opt_bhag', text: 'भाग' }
      ]
    },
    {
      id: 'q5',
      prompt: 'पेड़ और पौधे में किसकी ऊँचाई अधिक होती है?',
      mode: 'mcq_text',
      target: 'opt_ped',
      options: [
        { id: 'opt_ped', text: 'पेड़ 🌳' },
        { id: 'opt_paudha', text: 'पौधा 🌱' },
        { id: 'opt_ghas', text: 'घास 🌿' },
        { id: 'opt_equal', text: 'दोनों बराबर' }
      ]
    }
  ]
};

export default function MathCh1Sub1Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}

