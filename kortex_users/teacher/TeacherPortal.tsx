"use client";
import React, { useState } from 'react';
import { TeacherProfile } from '../../types/user';
import TeacherDashboard from './TeacherDashboard';
import TeacherClassView from './TeacherClassView';
import { TeacherComboData } from '../../app/actions/teacher';

interface TeacherPortalProps {
  profile: TeacherProfile;
}

export default function TeacherPortal({ profile }: TeacherPortalProps) {
  const [activeCombo, setActiveCombo] = useState<TeacherComboData | null>(null);

  if (activeCombo) {
     return <TeacherClassView profile={profile} combo={activeCombo} onBack={() => setActiveCombo(null)} />;
  }

  return (
    <TeacherDashboard 
      profile={profile} 
      onComboSelect={(combo) => setActiveCombo(combo)} 
    />
  );
}
