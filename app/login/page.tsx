'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  signIn, signUp, confirmSignUp, confirmSignIn, signOut, fetchAuthSession,
  resendSignUpCode, resetPassword, confirmResetPassword, fetchMFAPreference,
} from 'aws-amplify/auth';
import { dataClient } from '@/app/lib/amplify-data';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Eye, EyeOff } from 'lucide-react';

type AuthView = 'login' | 'signup' | 'confirm' | 'forgot' | 'reset' | 'mfa';

export default function Login() {
  const router = useRouter();

  useEffect(() => {
    signOut().catch(() => {});
  }, []);

  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const signInResult = await signIn({ username: normalizedEmail, password });

      if (signInResult.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
        setView('mfa');
        setLoading(false);
        return;
      }

      await completeLogin(normalizedEmail);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = async (normalizedEmail: string) => {
    const session = await fetchAuthSession({ forceRefresh: true });
    const idTokenGroups = (session.tokens?.idToken?.payload?.['cognito:groups'] as string[]) || [];
    const accessTokenGroups = (session.tokens?.accessToken?.payload?.['cognito:groups'] as string[]) || [];
    console.log('ID token groups:', idTokenGroups);
    console.log('Access token groups:', accessTokenGroups);
    const groups = idTokenGroups.length >= accessTokenGroups.length ? idTokenGroups : accessTokenGroups;
    const isAdvocate = groups.includes('advocates') || groups.includes('admins');
    const isAdmin = groups.includes('admins');

    let clientFirstName = '';
    if (!isAdvocate) {
      try {
        const { data: clients } = await dataClient.models.Client.list({ filter: { email: { eq: normalizedEmail } } });
        if (clients.length > 0) clientFirstName = clients[0].firstName;
      } catch {}
    }

    console.log('Final groups:', groups, 'isAdmin:', isAdmin, 'isAdvocate:', isAdvocate);
    const currentUser = { email: normalizedEmail, firstName: clientFirstName, isAdvocate, isAdmin, hasActiveDeal: !isAdvocate };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    console.log('Stored currentUser:', currentUser);

    if (isAdvocate) {
      try {
        const mfaPref = await fetchMFAPreference();
        if (!mfaPref.preferred && !mfaPref.enabled?.includes('TOTP')) {
          sessionStorage.setItem('mfaSetupRequired', 'true');
          router.push('/mfa-setup');
          return;
        }
      } catch {}
    }

    router.push('/dashboard');
  };

  const handleMFAChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirmSignIn({ challengeResponse: mfaCode });

      const normalizedEmail = email.trim().toLowerCase();
      const session = await fetchAuthSession({ forceRefresh: true });
      const idGroups = (session.tokens?.idToken?.payload?.['cognito:groups'] as string[]) || [];
      const accessGroups = (session.tokens?.accessToken?.payload?.['cognito:groups'] as string[]) || [];
      const groups = idGroups.length >= accessGroups.length ? idGroups : accessGroups;
      console.log('Post-MFA groups:', groups);

      const isAdmin = groups.includes('admins');
      const isAdvocate = groups.includes('advocates') || groups.includes('admins');

      const currentUser = { email: normalizedEmail, firstName: '', isAdvocate, isAdmin, hasActiveDeal: !isAdvocate };
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      console.log('Post-MFA stored:', currentUser);

      router.push('/dashboard');
    } catch (err: any) {
      setError('Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp({
        username: email.trim().toLowerCase(),
        password,
        options: {
          userAttributes: {
            email: email.trim().toLowerCase(),
            given_name: firstName,
            family_name: lastName,
          },
        },
      });
      setView('confirm');
    } catch (err: any) {
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirmSignUp({
        username: email.trim().toLowerCase(),
        confirmationCode: confirmCode,
      });
      await signIn({ username: email.trim().toLowerCase(), password });

      const normalizedEmail = email.trim().toLowerCase();
      try {
        await dataClient.models.Client.create({
          email: normalizedEmail,
          firstName,
          lastName,
          profileCompleted: false,
          onboardingCompleted: false,
        });
      } catch (clientErr) {
        console.error('Failed to create client record:', clientErr);
      }

      const currentUser = {
        email: normalizedEmail,
        firstName,
        isAdvocate: false,
        hasActiveDeal: false,
        profileCompleted: false,
      };
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      router.push('/onboarding/profile');
    } catch (err: any) {
      setError(err.message || 'Confirmation failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = useCallback(async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccess('');
    try {
      await resendSignUpCode({ username: email.trim().toLowerCase() });
      setSuccess('A new code has been sent to your email.');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    }
  }, [email, resendCooldown]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword({ username: email.trim().toLowerCase() });
      setView('reset');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirmResetPassword({
        username: email.trim().toLowerCase(),
        confirmationCode: resetCode,
        newPassword,
      });
      setSuccess('Password reset successfully. You can now log in.');
      setPassword('');
      setResetCode('');
      setNewPassword('');
      setView('login');
    } catch (err: any) {
      setError(err.message || 'Password reset failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="public" />
      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
      <div className="max-w-md w-full bg-[#f4f4f4] rounded-3xl shadow-xl p-6 md:p-10">

        <div className="text-center mb-8">
          <img src="/logo.png" alt="DriveAdvocate" className="h-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold">
            {view === 'login' ? 'Welcome Back' :
             view === 'signup' ? 'Create Account' :
             view === 'confirm' ? 'Check Your Email' :
             view === 'forgot' ? 'Forgot Password' :
             view === 'mfa' ? 'Verify Identity' :
             'Reset Password'}
          </h1>
          {view === 'confirm' && (
            <p className="text-slate-500 text-sm mt-2">
              We sent a confirmation code to <strong>{email}</strong>
            </p>
          )}
          {view === 'forgot' && (
            <p className="text-slate-500 text-sm mt-2">
              Enter your email and we'll send you a reset code.
            </p>
          )}
          {view === 'reset' && (
            <p className="text-slate-500 text-sm mt-2">
              Enter the code sent to <strong>{email}</strong> and your new password.
            </p>
          )}
        </div>

        {(view === 'login' || view === 'signup') && (
          <div className="flex mb-8 border-b border-slate-200">
            <button
              onClick={() => { setView('login'); setError(''); setSuccess(''); }}
              className={`flex-1 pb-4 text-lg font-medium transition ${view === 'login' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Log In
            </button>
            <button
              onClick={() => { setView('signup'); setError(''); setSuccess(''); }}
              className={`flex-1 pb-4 text-lg font-medium transition ${view === 'signup' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Create Account
            </button>
          </div>
        )}

        {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-2xl mb-5">{success}</div>}

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-4 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition" />
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-4 pr-12 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-semibold text-lg transition">
              {loading ? 'Signing in...' : 'Log In'}
            </button>
            <button type="button" onClick={() => { setView('forgot'); setError(''); setSuccess(''); }} className="w-full py-2 text-sm text-slate-500 hover:text-emerald-600 transition">
              Forgot your password?
            </button>
          </form>
        )}

        {view === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} required className="w-full p-4 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition" />
              <input type="text" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} required className="w-full p-4 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition" />
            </div>
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-4 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition" />
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} placeholder="Password (min 8 characters)" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} className="w-full p-4 pr-12 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-semibold text-lg transition">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {view === 'confirm' && (
          <form onSubmit={handleConfirm} className="space-y-5">
            <input type="text" placeholder="Enter confirmation code" value={confirmCode} onChange={e => setConfirmCode(e.target.value)} required className="w-full p-4 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition text-center text-2xl tracking-widest" />
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-semibold text-lg transition">
              {loading ? 'Confirming...' : 'Confirm Account'}
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendCooldown > 0}
              className="w-full py-3 text-sm text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 transition font-medium"
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Didn\'t get the code? Resend'}
            </button>
            <button type="button" onClick={() => { setView('signup'); setError(''); setSuccess(''); }} className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition">
              ← Back to sign up
            </button>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-4 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition" />
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-semibold text-lg transition">
              {loading ? 'Sending code...' : 'Send Reset Code'}
            </button>
            <button type="button" onClick={() => { setView('login'); setError(''); setSuccess(''); }} className="w-full py-3 text-sm text-slate-500 hover:text-slate-700 transition">
              ← Back to log in
            </button>
          </form>
        )}

        {view === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <input type="text" placeholder="Enter reset code" value={resetCode} onChange={e => setResetCode(e.target.value)} required className="w-full p-4 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition text-center text-2xl tracking-widest" />
            <div className="relative">
              <input type={showNewPassword ? 'text' : 'password'} placeholder="New password (min 8 characters)" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} className="w-full p-4 pr-12 border border-slate-300 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 transition" />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-semibold text-lg transition">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button type="button" onClick={() => { setView('login'); setError(''); setSuccess(''); }} className="w-full py-3 text-sm text-slate-500 hover:text-slate-700 transition">
              ← Back to log in
            </button>
          </form>
        )}

        {view === 'mfa' && (
          <form onSubmit={handleMFAChallenge} className="space-y-5">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🔐</div>
              <h2 className="text-xl font-bold">Two-Factor Authentication</h2>
              <p className="text-slate-500 text-sm mt-1">Enter the 6-digit code from your authenticator app</p>
            </div>
            <input
              type="text"
              value={mfaCode}
              onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              autoFocus
              className="w-full p-4 border border-slate-300 rounded-2xl text-center text-3xl tracking-widest font-mono bg-white focus:outline-none focus:border-emerald-500 transition"
            />
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">{error}</div>}
            <button type="submit" disabled={loading || mfaCode.length !== 6} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-semibold text-lg transition">
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}
      </div>
      </div>
      <Footer />
    </div>
  );
}
