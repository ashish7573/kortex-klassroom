"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-math-ch2-sub3-quiz',
  subject: 'Maths',
  chapterNumber: 2,
  chapterName: 'Ch 2: Beginning with Numbers',
  subtopicOrder: 3,
  subtopicName: 'Subtraction Upto 10',
  isMajorMilestone: false,
  milestoneLevel: 3,
  title: 'Subtraction Upto 10 Subtopic Assessment',
  thresholdScore: 90,
  questions: [
    {
      id: 'q1',
      prompt: 'Solve: Assessment for Subtraction Upto 10',
      mode: 'mcq_text',
      target: 'opt_1',
      options: [
        { id: 'opt_1', text: 'Option A (Correct)' },
        { id: 'opt_2', text: 'Option B' },
        { id: 'opt_3', text: 'Option C' },
        { id: 'opt_4', text: 'Option D' }
      ]
    }
  ]
};

export default function MathCh2Sub3Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
