"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types/user';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: string | null;
  isLoggedIn: boolean;
  isPro: boolean;
  loading: boolean;
  sessionAlert: any;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  isLoggedIn: false,
  isPro: false,
  loading: true,
  sessionAlert: null,
  logout: async () => {},
  resetPassword: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionAlert, setSessionAlert] = useState<any>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }
      
      // User is logged in, attach snapshot listener to their profile
      const userRef = doc(db, 'users', firebaseUser.uid);
      const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          setProfile(profileData);
          
          // Concurrency check
          const localSessionToken = localStorage.getItem(`session_token_${firebaseUser.uid}`);
          if (profileData.session_token && localSessionToken && profileData.session_token !== localSessionToken) {
            console.warn("Session token mismatch. Logging out due to concurrent login.");
            setSessionAlert({
              title: "Session Expired",
              message: "You have been securely logged out because your account was accessed from another device.",
              type: "warning"
            });
            signOut(auth);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
      
      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);

  const logout = async () => {
    if (user) {
      localStorage.removeItem(`session_token_${user.uid}`);
    }
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const role = profile?.role || null;
  const isLoggedIn = !!user;
  const isPro = (profile as any)?.is_pro || (profile as any)?.isPro || false;

  return (
    <AuthContext.Provider value={{ 
      user, profile, role, isLoggedIn, isPro, loading, sessionAlert, logout, resetPassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

