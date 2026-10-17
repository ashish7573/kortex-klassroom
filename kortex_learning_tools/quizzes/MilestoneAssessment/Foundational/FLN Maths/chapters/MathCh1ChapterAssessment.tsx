"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-math-ch1-major-quiz',
  subject: 'Maths',
  chapterNumber: 1,
  chapterName: 'पूर्व-संख्या ज्ञान',
  isMajorMilestone: true,
  milestoneLevel: 4,
  title: '🏆 1 से 10 महा-मूल्यांकन (Maths Chapter 1 Assessment)',
  thresholdScore: 90,
  questions: [
    {
      id: 'q1',
      prompt: 'गिनकर बताएं: 🍎 🍎 🍎 कितने सेब हैं?',
      mode: 'mcq_text',
      target: 'opt_3',
      options: [
        { id: 'opt_3', text: '3' },
        { id: 'opt_2', text: '2' },
        { id: 'opt_4', text: '4' },
        { id: 'opt_5', text: '5' }
      ]
    },
    {
      id: 'q2',
      prompt: 'संख्या 7 के ठीक बाद कौन-सी संख्या आती है?',
      mode: 'mcq_text',
      target: 'opt_8',
      options: [
        { id: 'opt_8', text: '8' },
        { id: 'opt_6', text: '6' },
        { id: 'opt_9', text: '9' },
        { id: 'opt_5', text: '5' }
      ]
    },
    {
      id: 'q3',
      prompt: 'इनमें से कौन-सा समूह सबसे अधिक है?',
      mode: 'mcq_text',
      target: 'opt_grp10',
      options: [
        { id: 'opt_grp10', text: '10 तारे ⭐' },
        { id: 'opt_grp5', text: '5 तारे ⭐' },
        { id: 'opt_grp7', text: '7 तारे ⭐' },
        { id: 'opt_grp2', text: '2 तारे ⭐' }
      ]
    },
    {
      id: 'q4',
      prompt: 'संख्या 5 के ठीक पहले कौन-सी संख्या आती है?',
      mode: 'mcq_text',
      target: 'opt_4',
      options: [
        { id: 'opt_4', text: '4' },
        { id: 'opt_6', text: '6' },
        { id: 'opt_3', text: '3' },
        { id: 'opt_7', text: '7' }
      ]
    },
    {
      id: 'q5',
      prompt: 'एक हाथ में कितनी उँगलियाँ होती हैं?',
      mode: 'mcq_text',
      target: 'opt_5',
      options: [
        { id: 'opt_5', text: '5' },
        { id: 'opt_4', text: '4' },
        { id: 'opt_10', text: '10' },
        { id: 'opt_6', text: '6' }
      ]
    }
  ]
};

export default function MathCh1ChapterAssessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}

