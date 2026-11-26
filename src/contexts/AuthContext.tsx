import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import {
  createUserProfile,
  deleteAllUserData,
  subscribeUserProfile,
  updateUserProfileDoc,
} from '../lib/db';
import { deleteMediaAsset } from '../lib/storage';
import type { CurrencyCode, ThemePreference, UserProfile } from '../types/xtrip';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (fullName: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: {
    fullName?: string;
    avatarUrl?: string;
    preferredCurrency?: CurrencyCode;
    themePreference?: ThemePreference;
  }) => Promise<void>;
  changeUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (currentPassword?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function formatAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code || '';
  const message = (error as { message?: string })?.message || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completing.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection and try again.';
    case 'auth/requires-recent-login':
      return 'For your security, please verify your recent login before completing this action.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Authentication yet. You can enable it in the Firebase Console (Authentication → Sign-in method) or sign in instantly with Google.';
    default:
      return message || 'Authentication failed. Please try again.';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileReady, setProfileReady] = useState(false);
  const creatingProfileRef = useRef(false);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (!firebaseUser) {
        setProfile(null);
        setProfileReady(true);
        setLoading(false);
        return;
      }

      setProfileReady(false);
      unsubProfile = subscribeUserProfile(
        firebaseUser.uid,
        async (existingProfile) => {
          if (!existingProfile && !creatingProfileRef.current) {
            creatingProfileRef.current = true;
            try {
              await createUserProfile({
                uid: firebaseUser.uid,
                fullName:
                  firebaseUser.displayName ||
                  firebaseUser.email?.split('@')[0] ||
                  'Explorer',
                email: firebaseUser.email || 'explorer@xtrip.app',
                avatarUrl: firebaseUser.photoURL || '',
                preferredCurrency: 'USD',
                themePreference: 'dark',
              });
            } catch (err) {
              console.error('Failed to bootstrap profile:', err);
            } finally {
              creatingProfileRef.current = false;
            }
          } else {
            setProfile(existingProfile);
            setProfileReady(true);
            setLoading(false);
          }
        },
        (err) => {
          console.error('Profile subscription error:', err);
          setProfileReady(true);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      profileReady,
      signInWithGoogle: async () => {
        try {
          await signInWithPopup(auth, googleAuthProvider);
        } catch (err) {
          throw new Error(formatAuthError(err));
        }
      },
      signInWithEmail: async (email: string, password: string) => {
        try {
          await signInWithEmailAndPassword(auth, email.trim(), password);
        } catch (err) {
          throw new Error(formatAuthError(err));
        }
      },
      registerWithEmail: async (fullName: string, email: string, password: string) => {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
          await updateProfile(cred.user, { displayName: fullName.trim() });
          creatingProfileRef.current = true;
          await createUserProfile({
            uid: cred.user.uid,
            fullName: fullName.trim(),
            email: email.trim(),
            avatarUrl: '',
            preferredCurrency: 'USD',
            themePreference: 'dark',
          });
          creatingProfileRef.current = false;
        } catch (err) {
          creatingProfileRef.current = false;
          throw new Error(formatAuthError(err));
        }
      },
      resetPassword: async (email: string) => {
        try {
          await sendPasswordResetEmail(auth, email.trim());
        } catch (err) {
          throw new Error(formatAuthError(err));
        }
      },
      updateUserProfile: async (updates) => {
        if (!user || !profile) throw new Error('Not signed in.');
        const prevAvatar = profile.avatarUrl;
        const nextFullName = (updates.fullName ?? profile.fullName).trim() || profile.fullName;
        const nextAvatar = updates.avatarUrl ?? profile.avatarUrl;
        const nextCurrency = updates.preferredCurrency ?? profile.preferredCurrency;
        const nextTheme = updates.themePreference ?? profile.themePreference;

        if (updates.fullName && updates.fullName.trim() !== user.displayName) {
          await updateProfile(user, { displayName: nextFullName });
        }

        await updateUserProfileDoc(user.uid, {
          fullName: nextFullName,
          email: profile.email || user.email || '',
          avatarUrl: nextAvatar,
          preferredCurrency: nextCurrency,
          themePreference: nextTheme,
        });

        if (updates.avatarUrl !== undefined && prevAvatar && prevAvatar !== nextAvatar) {
          await deleteMediaAsset(prevAvatar);
        }
      },
      changeUserPassword: async (currentPassword: string, newPassword: string) => {
        if (!user || !user.email) throw new Error('No email credentials associated with this account.');
        try {
          const credential = EmailAuthProvider.credential(user.email, currentPassword);
          await reauthenticateWithCredential(user, credential);
          await updatePassword(user, newPassword);
        } catch (err) {
          throw new Error(formatAuthError(err));
        }
      },
      logout: async () => {
        await signOut(auth);
      },
      deleteAccount: async (currentPassword?: string) => {
        if (!user) throw new Error('Not signed in.');
        try {
          const isPasswordUser = user.providerData.some((p) => p.providerId === 'password');
          if (isPasswordUser && currentPassword && user.email) {
            const cred = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, cred);
          } else if (!isPasswordUser) {
            await reauthenticateWithPopup(user, googleAuthProvider);
          }
          await deleteAllUserData(user.uid);
          await deleteUser(user);
        } catch (err) {
          throw new Error(formatAuthError(err));
        }
      },
    }),
    [user, profile, loading, profileReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
