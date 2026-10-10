"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../backend_configurations/firebase';
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
    if (profile.accountStatus === 'DELETED') {
      signOut(auth).catch(console.error);
      return;
    }

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

  if (profile.accountStatus === 'DELETED') {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center text-center p-8 animate-fade-in">
        <div className="w-16 h-16 bg-red-100 text-red-500 flex items-center justify-center rounded-2xl mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Account Deleted</h2>
        <p className="text-slate-500 font-medium max-w-md">This account has been deleted by your administrator. Please contact support to restore access.</p>
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
