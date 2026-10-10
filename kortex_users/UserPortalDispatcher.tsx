"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile } from '../types/user';
import ParentDashboard from './parent/ParentDashboard';
import StudentDashboard from './student/StudentDashboard';
import TeacherPortal from './teacher/TeacherPortal';
import OrgAdminDashboard from './org_admin/OrgAdminDashboard';
import KrewDashboard from './krew/KrewDashboard';
import KortexAdminDashboard from './kortex_admin/KortexAdminDashboard';

interface UserPortalDispatcherProps {
  profile: UserProfile;
  onNavigateHome?: () => void;
  onExploreTier?: (tierId: string) => void;
  onOpenCMS?: () => void;
}

export default function UserPortalDispatcher({
  profile,
  onNavigateHome,
  onExploreTier,
  onOpenCMS
}: UserPortalDispatcherProps) {
  const router = useRouter();
  const [isClientGuarded, setIsClientGuarded] = useState(false);

  useEffect(() => {
    // RBAC Route Guard Interceptor
    if (profile.role === 'parent') {
      if (profile.phoneVerified === false || profile.phoneVerified === undefined || profile.onboardingStatus === 'PENDING_PHONE') {
        router.replace('/onboarding/verify-phone');
        return;
      }
    }
    
    // Bypass for all other roles (kortex_admin, teacher, organization, student)
    setIsClientGuarded(true);
  }, [profile, router]);

  // Trap render while guarding
  if (!isClientGuarded) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-800 rounded-full"></div>
      </div>
    );
  }

  switch (profile.role) {
    case 'parent':
      return <ParentDashboard profile={profile} />;

    case 'student':
      return <StudentDashboard profile={profile} onExploreTier={onExploreTier} />;

    case 'teacher':
      return <TeacherPortal profile={profile} onExploreTier={onExploreTier} />;

    case 'org_admin':
      return <OrgAdminDashboard profile={profile} />;

    case 'krew':
      return <KrewDashboard profile={profile} onOpenCMS={onOpenCMS} />;

    case 'admin':
      // The nodes will be populated by page.tsx if rendered directly, but here we just return the shell if loaded standalone.
      return <KortexAdminDashboard profile={profile} />;

    default:
      return (
        <div className="max-w-md mx-auto my-16 p-8 bg-white border-2 border-slate-100 rounded-3xl text-center shadow-lg">
          <div className="text-3xl mb-3">⚠️</div>
          <h3 className="text-xl font-black text-slate-800 mb-1">Unrecognized Profile Role</h3>
          <p className="text-sm text-slate-400 mb-6">
            We could not resolve an authorized portal for this account.
          </p>
          {onNavigateHome && (
            <button
              type="button"
              onClick={onNavigateHome}
              className="px-6 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl shadow-md"
            >
              Return to Home
            </button>
          )}
        </div>
      );
  }
}
