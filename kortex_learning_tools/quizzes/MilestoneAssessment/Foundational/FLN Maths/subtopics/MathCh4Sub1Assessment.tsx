"use client";

import React from 'react';
import MilestoneAssessmentRunner from '../../../common/MilestoneAssessmentRunner';
import { MilestoneAssessmentConfig } from '../../../common/types';

const config: MilestoneAssessmentConfig = {
  assessmentId: 'fln-math-ch4-sub1-quiz',
  subject: 'Maths',
  chapterNumber: 4,
  chapterName: 'Ch 4: Multiplication and Division',
  subtopicOrder: 1,
  subtopicName: 'Multiplication',
  isMajorMilestone: false,
  milestoneLevel: 1,
  title: 'Multiplication Subtopic Assessment',
  thresholdScore: 90,
  questions: [
    {
      id: 'q1',
      prompt: 'Solve: Assessment for Multiplication',
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

export default function MathCh4Sub1Assessment({ onComplete, lesson }: any) {
  return <MilestoneAssessmentRunner config={config} onComplete={onComplete} lesson={lesson} />;
}
