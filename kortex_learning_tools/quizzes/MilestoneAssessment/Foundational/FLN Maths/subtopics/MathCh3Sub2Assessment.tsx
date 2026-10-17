"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-math-ch3-sub2-quiz',
  subject: 'Maths',
  chapterNumber: 3,
  chapterName: 'Ch 3: Numbers Upto 99',
  subtopicOrder: 2,
  subtopicName: 'Addition Upto 100',
  isMajorMilestone: false,
  milestoneLevel: 2,
  title: 'Addition Upto 100 Subtopic Assessment',
  thresholdScore: 90,
  questions: [
    {
      id: 'q1',
      prompt: 'Solve: Assessment for Addition Upto 100',
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

export default function MathCh3Sub2Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
