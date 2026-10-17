"use client";

export type QuestionMode = 
  | 'mcq_audio_to_item' 
  | 'mcq_image_to_item' 
  | 'mcq_text' 
  | 'spelling_assemble' 
  | 'dictation_verify';

export interface AssessmentOption {
  id: string;
  text?: string;
  subText?: string;
  imageUrl?: string;
  audioUrl?: string;
}

export interface AssessmentQuestion {
  id: string;
  prompt: string;
  audioUrl?: string;
  imageUrl?: string;
  mode: QuestionMode;
  target: string; // The correct answer text or ID
  options: AssessmentOption[];
  explanation?: string;
}

export interface MilestoneAssessmentConfig {
  assessmentId: string;
  subject: 'Hindi' | 'Maths' | 'English' | string;
  grade?: string;
  chapterNumber: number;
  chapterName: string;
  subtopicOrder?: number;
  subtopicName?: string;
  isMajorMilestone: boolean;
  milestoneLevel: number;
  title: string;
  instructions?: string;
  thresholdScore?: number; // Defaults to 90
  questions: AssessmentQuestion[];
}

export interface AssessmentCompletionData {
  assessmentId: string;
  score: number; // 0 - 100 percentage
  maxScore: number; // 100
  passed: boolean; // score >= thresholdScore (90)
  correctCount: number;
  totalQuestions: number;
  milestoneLevel: number;
  timeSpentSeconds?: number;
}

