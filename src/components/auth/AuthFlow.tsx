import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Compass, Eye, EyeOff, Loader2, MailCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { WELCOME_HERO_IMAGE } from '../../lib/constants';
import { RedPandaEmblem } from '../common/RedPandaEmblem';
import { SmartImage } from '../common/SmartImage';

type AuthMode = 'welcome' | 'login' | 'register' | 'forgot';

function GoogleMark() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.6-5.4 3.6-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}

export function AuthFlow() {
  const { signInWithGoogle, signInWithEmail, registerWithEmail, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('welcome');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const switchMode = (next: AuthMode) => {
    setError(null);
    setInfoMessage(null);
    setMode(next);
  };

  const handleGoogle = async () => {
    setError(null);
    setInfoMessage(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (fullName.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await registerWithEmail(fullName, email, password);
      setInfoMessage('Account created. Entering your travel workspace...');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter the email address associated with your account.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email);
      setInfoMessage(`Password reset link sent to ${email.trim()}. Check your inbox and spam folder.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send password reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#081411] text-[#F5F3EC] relative overflow-hidden flex flex-col">
      {/* Cinematic full-bleed backdrop */}
      <div className="absolute inset-0">
        <SmartImage
          src={WELCOME_HERO_IMAGE}
          alt="Twilight alpine mountain fjord"
          className="w-full h-full object-cover object-center scale-[1.02]"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#081411] via-[#081411]/78 to-[#081411]/35"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#081411]/90 via-[#081411]/55 to-transparent"
          aria-hidden="true"
        />
      </div>

      {/* Top brand bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => switchMode('welcome')}
          className="inline-flex items-center gap-3 text-left cursor-pointer group"
        >
          <RedPandaEmblem size={36} className="transition-transform duration-200 group-hover:scale-105" />
          <span className="font-display text-xl font-semibold tracking-tight text-[#F5F3EC]">
            XTRIP
          </span>
        </button>

        {mode === 'welcome' ? (
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="min-h-[44px] px-4 py-2 text-sm font-medium text-[#F5F3EC] hover:text-[#C5A776] transition-colors cursor-pointer whitespace-nowrap"
          >
            Log In
          </button>
        ) : (
          <button
            type="button"
            onClick={() => switchMode('welcome')}
            className="min-h-[44px] px-3 py-2 text-sm font-medium text-[#A8B3AC] hover:text-[#F5F3EC] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 pb-10 pt-4 flex items-end lg:items-center">
        <AnimatePresence mode="wait">
          {mode === 'welcome' ? (
            <motion.section
              key="welcome"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-2xl space-y-7 pb-4 lg:pb-0"
            >
              <div className="space-y-4">
                <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#C5A776]">
                  Extreme Trip Companion
                </p>
                <h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.06] text-[#F5F3EC] [text-wrap:balance]">
                  Escape the ordinary.
                </h1>
                <p className="text-base sm:text-xl text-[#D6DDD8] max-w-xl leading-relaxed">
                  Your journeys. Your memories. Your budget.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="min-h-[48px] px-7 py-3 rounded-xl bg-[#C5A776] text-[#081411] font-semibold text-sm hover:bg-[#d1b689] active:scale-[0.99] transition-all cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Compass className="w-4 h-4" />
                  Get Started
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="min-h-[48px] px-7 py-3 rounded-xl bg-[#10211B]/85 backdrop-blur-md border border-[#F5F3EC]/15 text-[#F5F3EC] font-medium text-sm hover:bg-[#152820] transition-colors cursor-pointer inline-flex items-center justify-center whitespace-nowrap"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  className="min-h-[48px] px-5 py-3 rounded-xl bg-[#10211B]/75 backdrop-blur-md border border-[#F5F3EC]/15 text-[#F5F3EC] font-medium text-sm hover:bg-[#152820] transition-colors cursor-pointer inline-flex items-center justify-center gap-2.5 whitespace-nowrap"
                >
                  {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleMark />}
                  Continue with Google
                </button>
              </div>

              {error ? (
                <p className="text-sm text-[#E88B8B] bg-[#2a1416]/80 border border-[#D96B6B]/30 rounded-xl px-4 py-3">
                  {error}
                </p>
              ) : null}

              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#A8B3AC]">
                <span>Multi-currency trip budgets</span>
                <span aria-hidden="true">·</span>
                <span>Expense & receipt tracking</span>
                <span aria-hidden="true">·</span>
                <span>Places & photo journals</span>
              </div>
            </motion.section>
          ) : (
            <motion.section
              key={mode}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md mx-auto lg:mx-0 rounded-2xl bg-[#10211B]/92 backdrop-blur-xl border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="space-y-1.5">
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#F5F3EC]">
                  {mode === 'login' && 'Welcome back'}
                  {mode === 'register' && 'Start your expedition'}
                  {mode === 'forgot' && 'Reset password'}
                </h2>
                <p className="text-sm text-[#A8B3AC]">
                  {mode === 'login' && 'Sign in to access your trips, budgets, and travel journal.'}
                  {mode === 'register' && 'Create your XTRIP account to organize every journey.'}
                  {mode === 'forgot' && 'Enter your email and we will send a password reset link.'}
                </p>
              </div>

              {error ? (
                <div
                  role="alert"
                  className="rounded-xl bg-[#2a1416]/90 border border-[#D96B6B]/35 px-4 py-3 text-sm text-[#F4B4B4] leading-relaxed"
                >
                  {error}
                </div>
              ) : null}

              {infoMessage ? (
                <div
                  role="status"
                  className="rounded-xl bg-[#122a20]/90 border border-[#5FB382]/35 px-4 py-3 text-sm text-[#B7E4C7] flex items-start gap-2.5 leading-relaxed"
                >
                  <MailCheck className="w-4 h-4 text-[#5FB382] shrink-0 mt-0.5" />
                  <span>{infoMessage}</span>
                </div>
              ) : null}

              {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <label htmlFor="login-email" className="block text-sm font-medium text-[#F5F3EC]">
                      Email
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full min-h-[44px] rounded-xl bg-[#081411]/90 border border-white/12 px-3.5 py-2.5 text-sm text-[#F5F3EC] placeholder:text-[#A8B3AC]/50 focus:outline-none focus:border-[#C5A776]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="login-password" className="block text-sm font-medium text-[#F5F3EC]">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs font-medium text-[#C5A776] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full min-h-[44px] rounded-xl bg-[#081411]/90 border border-white/12 pl-3.5 pr-11 py-2.5 text-sm text-[#F5F3EC] placeholder:text-[#A8B3AC]/50 focus:outline-none focus:border-[#C5A776]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[#A8B3AC] hover:text-[#F5F3EC] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || googleLoading}
                    className="w-full min-h-[48px] rounded-xl bg-[#C5A776] text-[#081411] font-semibold text-sm hover:bg-[#d1b689] transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {submitting ? 'Signing in...' : 'Log In'}
                  </button>
                </form>
              )}

              {mode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <label htmlFor="reg-name" className="block text-sm font-medium text-[#F5F3EC]">
                      Full Name
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="w-full min-h-[44px] rounded-xl bg-[#081411]/90 border border-white/12 px-3.5 py-2.5 text-sm text-[#F5F3EC] placeholder:text-[#A8B3AC]/50 focus:outline-none focus:border-[#C5A776]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="reg-email" className="block text-sm font-medium text-[#F5F3EC]">
                      Email
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full min-h-[44px] rounded-xl bg-[#081411]/90 border border-white/12 px-3.5 py-2.5 text-sm text-[#F5F3EC] placeholder:text-[#A8B3AC]/50 focus:outline-none focus:border-[#C5A776]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="reg-password" className="block text-sm font-medium text-[#F5F3EC]">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full min-h-[44px] rounded-xl bg-[#081411]/90 border border-white/12 pl-3.5 pr-11 py-2.5 text-sm text-[#F5F3EC] placeholder:text-[#A8B3AC]/50 focus:outline-none focus:border-[#C5A776]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[#A8B3AC] hover:text-[#F5F3EC] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="reg-confirm" className="block text-sm font-medium text-[#F5F3EC]">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="reg-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="w-full min-h-[44px] rounded-xl bg-[#081411]/90 border border-white/12 pl-3.5 pr-11 py-2.5 text-sm text-[#F5F3EC] placeholder:text-[#A8B3AC]/50 focus:outline-none focus:border-[#C5A776]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[#A8B3AC] hover:text-[#F5F3EC] cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || googleLoading}
                    className="w-full min-h-[48px] rounded-xl bg-[#C5A776] text-[#081411] font-semibold text-sm hover:bg-[#d1b689] transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {submitting ? 'Creating account...' : 'Create Account'}
                  </button>
                </form>
              )}

              {mode === 'forgot' && (
                <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <label htmlFor="reset-email" className="block text-sm font-medium text-[#F5F3EC]">
                      Email
                    </label>
                    <input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full min-h-[44px] rounded-xl bg-[#081411]/90 border border-white/12 px-3.5 py-2.5 text-sm text-[#F5F3EC] placeholder:text-[#A8B3AC]/50 focus:outline-none focus:border-[#C5A776]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full min-h-[48px] rounded-xl bg-[#C5A776] text-[#081411] font-semibold text-sm hover:bg-[#d1b689] transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {submitting ? 'Sending link...' : 'Send Reset Link'}
                  </button>
                </form>
              )}

              {mode !== 'forgot' && (
                <>
                  <div className="relative flex items-center py-1">
                    <div className="flex-grow border-t border-white/10" />
                    <span className="mx-3 text-xs text-[#A8B3AC]">or</span>
                    <div className="flex-grow border-t border-white/10" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={googleLoading || submitting}
                    className="w-full min-h-[46px] rounded-xl bg-[#152820] border border-white/12 text-[#F5F3EC] font-medium text-sm hover:bg-[#1a3329] transition-colors cursor-pointer inline-flex items-center justify-center gap-2.5"
                  >
                    {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleMark />}
                    Continue with Google
                  </button>
                </>
              )}

              <div className="pt-2 text-center text-sm text-[#A8B3AC]">
                {mode === 'login' ? (
                  <>
                    New to XTRIP?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="font-semibold text-[#C5A776] hover:underline cursor-pointer"
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="font-semibold text-[#C5A776] hover:underline cursor-pointer"
                    >
                      Log in
                    </button>
                  </>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
