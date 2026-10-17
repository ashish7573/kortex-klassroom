"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-math-ch2-sub5-quiz',
  subject: 'Maths',
  chapterNumber: 2,
  chapterName: 'Ch 2: Beginning with Numbers',
  subtopicOrder: 5,
  subtopicName: 'Addition Subtraction Upto 20',
  isMajorMilestone: false,
  milestoneLevel: 5,
  title: 'Addition Subtraction Upto 20 Subtopic Assessment',
  thresholdScore: 90,
  questions: [
    {
      id: 'q1',
      prompt: 'Solve: Assessment for Addition Subtraction Upto 20',
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

export default function MathCh2Sub5Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
