"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-math-ch3-major-quiz',
  subject: 'Maths',
  chapterNumber: 3,
  chapterName: 'जोड़ की अवधारणा',
  isMajorMilestone: true,
  milestoneLevel: 13,
  title: '🏆 जोड़ महा-मूल्यांकन (Maths Chapter 3 Assessment)',
  thresholdScore: 90,
  questions: [
    {
      id: 'q1',
      prompt: 'हल करें: 24 + 15 = ?',
      mode: 'mcq_text',
      target: 'opt_39',
      options: [
        { id: 'opt_39', text: '39' },
        { id: 'opt_49', text: '49' },
        { id: 'opt_38', text: '38' },
        { id: 'opt_40', text: '40' }
      ]
    },
    {
      id: 'q2',
      prompt: 'हासिल वाला जोड़: 38 + 27 = ?',
      mode: 'mcq_text',
      target: 'opt_65',
      options: [
        { id: 'opt_65', text: '65' },
        { id: 'opt_55', text: '55' },
        { id: 'opt_66', text: '66' },
        { id: 'opt_75', text: '75' }
      ]
    },
    {
      id: 'q3',
      prompt: 'रोहन के पास 12 गेंदें थीं और रिया ने उसे 8 गेंदें और दीं। कुल कितनी गेंदें हुईं?',
      mode: 'mcq_text',
      target: 'opt_20',
      options: [
        { id: 'opt_20', text: '20' },
        { id: 'opt_18', text: '18' },
        { id: 'opt_22', text: '22' },
        { id: 'opt_19', text: '19' }
      ]
    },
    {
      id: 'q4',
      prompt: 'मेंढक संख्या 4 पर है और वह 5 कदम आगे कूदता है। वह किस संख्या पर पहुंचेगा?',
      mode: 'mcq_text',
      target: 'opt_9',
      options: [
        { id: 'opt_9', text: '9' },
        { id: 'opt_8', text: '8' },
        { id: 'opt_10', text: '10' },
        { id: 'opt_7', text: '7' }
      ]
    },
    {
      id: 'q5',
      prompt: '50 + 50 = ?',
      mode: 'mcq_text',
      target: 'opt_100',
      options: [
        { id: 'opt_100', text: '100' },
        { id: 'opt_90', text: '90' },
        { id: 'opt_150', text: '150' },
        { id: 'opt_80', text: '80' }
      ]
    }
  ]
};

export default function MathCh3ChapterAssessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}

