"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-math-ch2-major-quiz',
  subject: 'Maths',
  chapterNumber: 2,
  chapterName: 'गिनती व स्थानीय मान',
  isMajorMilestone: true,
  milestoneLevel: 8,
  title: '🏆 100 तक संख्या ज्ञान महा-मूल्यांकन (Maths Chapter 2 Assessment)',
  thresholdScore: 90,
  questions: [
    {
      id: 'q1',
      prompt: 'संख्या 45 में दहाई (Tens) का अंक क्या है?',
      mode: 'mcq_text',
      target: 'opt_4',
      options: [
        { id: 'opt_4', text: '4 दहाई' },
        { id: 'opt_5', text: '5 दहाई' },
        { id: 'opt_40', text: '40 दहाई' },
        { id: 'opt_9', text: '9 दहाई' }
      ]
    },
    {
      id: 'q2',
      prompt: '3 दहाई और 7 इकाई मिलकर कौन-सी संख्या बनाते हैं?',
      mode: 'mcq_text',
      target: 'opt_37',
      options: [
        { id: 'opt_37', text: '37' },
        { id: 'opt_73', text: '73' },
        { id: 'opt_10', text: '10' },
        { id: 'opt_30', text: '30' }
      ]
    },
    {
      id: 'q3',
      prompt: 'संख्या 99 के ठीक बाद कौन-सी संख्या आती है?',
      mode: 'mcq_text',
      target: 'opt_100',
      options: [
        { id: 'opt_100', text: '100' },
        { id: 'opt_98', text: '98' },
        { id: 'opt_90', text: '90' },
        { id: 'opt_101', text: '101' }
      ]
    },
    {
      id: 'q4',
      prompt: '10-10 के 6 बंडल में कुल कितनी तीलियाँ होंगी?',
      mode: 'mcq_text',
      target: 'opt_60',
      options: [
        { id: 'opt_60', text: '60' },
        { id: 'opt_16', text: '16' },
        { id: 'opt_6', text: '6' },
        { id: 'opt_600', text: '600' }
      ]
    },
    {
      id: 'q5',
      prompt: 'संख्या 82 में इकाई (Units) का स्थान क्या है?',
      mode: 'mcq_text',
      target: 'opt_2',
      options: [
        { id: 'opt_2', text: '2 इकाई' },
        { id: 'opt_8', text: '8 इकाई' },
        { id: 'opt_80', text: '80 इकाई' },
        { id: 'opt_10', text: '10 इकाई' }
      ]
    }
  ]
};

export default function MathCh2ChapterAssessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}

