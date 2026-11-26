import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, LogOut, Monitor, Moon, Sun, Trash2, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { CURRENCIES } from '../../lib/constants';
import type { CurrencyCode, ThemePreference, UserProfile } from '../../types/xtrip';
import { ImageUploadField } from '../common/ImageUploadField';
import { RedPandaEmblem } from '../common/RedPandaEmblem';
import { SmartImage } from '../common/SmartImage';

interface SettingsViewProps {
  profile: UserProfile;
  onNotify: (type: 'success' | 'error', text: string) => void;
}

export function SettingsView({ profile, onNotify }: SettingsViewProps) {
  const { user, updateUserProfile, changeUserPassword, logout, deleteAccount } = useAuth();
  const { setPreference } = useTheme();

  const [fullName, setFullName] = useState(profile.fullName);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [preferredCurrency, setPreferredCurrency] = useState<CurrencyCode>(profile.preferredCurrency);
  const [themePref, setThemePref] = useState<ThemePreference>(profile.themePreference);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const isPasswordProvider = Boolean(
    user?.providerData?.some((p) => p.providerId === 'password')
  );

  useEffect(() => {
    setFullName(profile.fullName);
    setAvatarUrl(profile.avatarUrl);
    setPreferredCurrency(profile.preferredCurrency);
    setThemePref(profile.themePreference);
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      onNotify('error', 'Full name cannot be empty.');
      return;
    }
    setSavingProfile(true);
    try {
      await updateUserProfile({
        fullName: fullName.trim(),
        avatarUrl,
        preferredCurrency,
        themePreference: themePref,
      });
      setPreference(themePref);
      onNotify('success', 'Profile and preferences saved.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Could not update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleThemeSelect = async (next: ThemePreference) => {
    setThemePref(next);
    setPreference(next);
    try {
      await updateUserProfile({ themePreference: next });
      onNotify('success', `Theme switched to ${next}.`);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Could not save theme preference.');
    }
  };

  const handleCurrencySelect = async (next: CurrencyCode) => {
    setPreferredCurrency(next);
    try {
      await updateUserProfile({ preferredCurrency: next });
      onNotify('success', `Default currency updated to ${next}.`);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Could not update default currency.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      onNotify('error', 'Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      onNotify('error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      onNotify('error', 'New passwords do not match.');
      return;
    }

    setChangingPw(true);
    try {
      await changeUserPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      onNotify('success', 'Password updated successfully.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Could not change password.');
    } finally {
      setChangingPw(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      onNotify('error', 'Type DELETE to confirm permanent account removal.');
      return;
    }
    if (isPasswordProvider && !deletePassword) {
      onNotify('error', 'Please enter your password to confirm account deletion.');
      return;
    }

    setDeletingAccount(true);
    try {
      await deleteAccount(isPasswordProvider ? deletePassword : undefined);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Could not delete account.');
      setDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-[var(--xt-text)]">Settings</h1>
        <p className="text-sm text-[var(--xt-text-muted)]">
          Manage your profile, theme, currency defaults, and account security.
        </p>
      </div>

      {/* Profile Section */}
      <section className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[var(--xt-surface-2)] border border-[var(--xt-border)] flex items-center justify-center shrink-0">
            {avatarUrl ? (
              <SmartImage src={avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-[var(--xt-gold)]" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold text-[var(--xt-text)] truncate">
              {profile.fullName}
            </h2>
            <p className="text-sm text-[var(--xt-text-muted)] truncate">{profile.email}</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="prof-name" className="block text-sm font-medium text-[var(--xt-text)]">
                Full Name
              </label>
              <input
                id="prof-name"
                type="text"
                maxLength={100}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full min-h-[44px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="prof-email" className="block text-sm font-medium text-[var(--xt-text)]">
                Email
              </label>
              <input
                id="prof-email"
                type="email"
                value={profile.email}
                disabled
                className="w-full min-h-[44px] rounded-xl bg-[var(--xt-surface-2)] border border-[var(--xt-border)] px-3.5 py-2 text-sm text-[var(--xt-text-muted)] cursor-not-allowed"
              />
            </div>
          </div>

          <ImageUploadField
            userId={profile.uid}
            value={avatarUrl}
            onChange={setAvatarUrl}
            label="Profile Picture"
            aspectClass="h-32"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[var(--xt-gold)] text-[#081411] font-semibold text-sm inline-flex items-center gap-2 hover:opacity-90 cursor-pointer"
            >
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Profile
            </button>
          </div>
        </form>
      </section>

      {/* Preferences Section */}
      <section className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-5 sm:p-6 space-y-5">
        <h2 className="font-display text-xl font-semibold text-[var(--xt-text)]">Preferences</h2>

        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--xt-text)]">Appearance</p>
          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-[var(--xt-surface-2)]">
            {(
              [
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'system', label: 'System', icon: Monitor },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = themePref === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleThemeSelect(item.id)}
                  className={`min-h-[44px] rounded-lg text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[var(--xt-gold)] text-[#081411] font-semibold'
                      : 'text-[var(--xt-text-muted)] hover:text-[var(--xt-text)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="pref-currency" className="block text-sm font-medium text-[var(--xt-text)]">
            Default Currency
          </label>
          <select
            id="pref-currency"
            value={preferredCurrency}
            onChange={(e) => handleCurrencySelect(e.target.value as CurrencyCode)}
            className="w-full sm:max-w-xs min-h-[44px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.symbol}) — {c.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-[var(--xt-text-muted)]">
            Used as the default currency when creating new trips. Existing trips retain their chosen currency.
          </p>
        </div>
      </section>

      {/* Account Security Section */}
      <section className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-5 sm:p-6 space-y-6">
        <h2 className="font-display text-xl font-semibold text-[var(--xt-text)]">Account</h2>

        {isPasswordProvider ? (
          <form onSubmit={handleChangePassword} className="space-y-4 pb-5 border-b border-[var(--xt-border)]">
            <h3 className="text-sm font-semibold text-[var(--xt-text)]">Change Password</h3>

            <div className="space-y-1.5">
              <label htmlFor="cur-pw" className="block text-xs font-medium text-[var(--xt-text-muted)]">
                Current Password
              </label>
              <div className="relative">
                <input
                  id="cur-pw"
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] pl-3.5 pr-11 py-2 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw((v) => !v)}
                  aria-label="Toggle current password visibility"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[var(--xt-text-muted)] cursor-pointer"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="new-pw" className="block text-xs font-medium text-[var(--xt-text-muted)]">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-pw"
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full min-h-[44px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] pl-3.5 pr-11 py-2 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw((v) => !v)}
                    aria-label="Toggle new password visibility"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[var(--xt-text-muted)] cursor-pointer"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="conf-new-pw" className="block text-xs font-medium text-[var(--xt-text-muted)]">
                  Confirm New Password
                </label>
                <input
                  id="conf-new-pw"
                  type={showNewPw ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={changingPw}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[var(--xt-surface-2)] hover:bg-[var(--xt-gold)] hover:text-[#081411] text-sm font-medium text-[var(--xt-text)] inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Update Password
            </button>
          </form>
        ) : (
          <div className="pb-5 border-b border-[var(--xt-border)] text-sm text-[var(--xt-text-muted)]">
            You are signed in with Google. Password management is handled through your Google account.
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => logout()}
            className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[var(--xt-border)] bg-[var(--xt-surface-2)] text-sm font-medium text-[var(--xt-text)] hover:border-[var(--xt-gold)] inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>

          <button
            type="button"
            onClick={() => {
              setDeletePassword('');
              setDeleteConfirmText('');
              setDeleteModalOpen(true);
            }}
            className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#B94A4A]/40 text-sm font-medium text-[var(--xt-danger)] hover:bg-[#B94A4A]/10 inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </div>
      </section>

      {/* App Information */}
      <section className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-5 sm:p-6 flex items-start gap-4">
        <RedPandaEmblem size={42} className="shrink-0" />
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--xt-text)]">
            <span>XTRIP — Extreme Trip</span>
            <span className="text-[var(--xt-text-muted)] font-normal">· Version 1.0.0</span>
          </div>
          <p className="text-sm text-[var(--xt-text-muted)] leading-relaxed">
            Built as a personal expedition companion to organize multi-currency trip budgets,
            track expenses and receipts, bookmark places visited, and preserve visual travel journals.
          </p>
        </div>
      </section>

      {/* Delete Account Modal */}
      {deleteModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-6 shadow-2xl space-y-4">
            <div className="space-y-1.5">
              <h3 className="font-display text-xl font-semibold text-[var(--xt-danger)]">
                Delete Account Permanently
              </h3>
              <p className="text-sm text-[var(--xt-text-muted)] leading-relaxed">
                This will permanently remove your profile, all trips, expenses, places visited, and uploaded photos. This action cannot be undone.
              </p>
            </div>

            <form onSubmit={handleDeleteAccount} className="space-y-3">
              {isPasswordProvider ? (
                <div className="space-y-1">
                  <label htmlFor="del-pw" className="block text-xs font-medium text-[var(--xt-text)]">
                    Current Password
                  </label>
                  <input
                    id="del-pw"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full min-h-[42px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3 text-sm text-[var(--xt-text)]"
                  />
                </div>
              ) : null}

              <div className="space-y-1">
                <label htmlFor="del-confirm" className="block text-xs font-medium text-[var(--xt-text)]">
                  Type DELETE to confirm
                </label>
                <input
                  id="del-confirm"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full min-h-[42px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3 text-sm text-[var(--xt-text)]"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deletingAccount}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--xt-border)] text-sm font-medium text-[var(--xt-text)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deletingAccount}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#B94A4A] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirm Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
