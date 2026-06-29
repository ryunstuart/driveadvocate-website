'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cal, { getCalApi } from '@calcom/embed-react';
import { signUp, signIn, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { dataClient } from '@/app/lib/amplify-data';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Eye, EyeOff } from 'lucide-react';

const CALCOM_LINK = 'driveadvocate/driveadvocate-discovery-call';


type Step = 'profile' | 'calendar' | 'confirmed';

export default function BookPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [zip, setZip] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(async () => {
        try {
          const attrs = await fetchUserAttributes();
          setFirstName(attrs.given_name || '');
          setLastName(attrs.family_name || '');
          setEmail(attrs.email || '');
          setPhone(attrs.phone_number || '');
          setStep('calendar');
        } catch {
          setStep('calendar');
        }
      })
      .catch(() => {})
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();

      await signUp({
        username: normalizedEmail,
        password,
        options: {
          userAttributes: {
            email: normalizedEmail,
            given_name: firstName,
            family_name: lastName,
          },
        },
      });

      await dataClient.mutations.confirmClientSignup(
        { email: normalizedEmail },
        { authMode: 'apiKey' },
      );

      await signIn({ username: normalizedEmail, password });
      await getCurrentUser();

      try {
        await dataClient.models.Client.create({
          email: normalizedEmail,
          firstName, lastName, phone, zipCode: zip,
          profileCompleted: true, onboardingCompleted: false, emailNotifications: true,
        });
      } catch {}

      localStorage.setItem('currentUser', JSON.stringify({
        email: email.trim().toLowerCase(), firstName, isAdvocate: false, hasActiveDeal: false,
      }));
      localStorage.setItem('profileData', JSON.stringify({
        firstName, lastName, email: email.trim().toLowerCase(), phone, zipCode: zip, city, state,
        searchRadius: '100', budget: '', timeline: '', notes: '',
      }));

      setStep('calendar');
    } catch (err: any) {
      if (err.name === 'UsernameExistsException') {
        setError('An account with this email already exists. Please log in instead.');
      } else {
        setError(err.message || 'Failed to create account.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const cal = await getCalApi();
      cal('on', {
        action: 'bookingSuccessful',
        callback: () => {
          localStorage.setItem('justBooked', 'true');
          setTimeout(() => {
            window.location.href = '/dashboard?booked=true';
          }, 2000);
        },
      });
    })();
  }, []);

  useEffect(() => {
    if (step === 'calendar') {
      localStorage.setItem('justBooked', 'true');
      localStorage.setItem('bookedEmail', email);
    }
    if (step === 'confirmed') {
      setTimeout(() => router.push('/dashboard'), 4000);
    }
  }, [step, router]);

  const stepIndex = { profile: 0, calendar: 1, confirmed: 2 };
  const progressSteps = [
    { key: 'profile', label: 'Your Profile' },
    { key: 'calendar', label: 'Pick a Time' },
    { key: 'confirmed', label: 'Confirmed' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="public" />
      <div className="max-w-2xl mx-auto px-6 py-10 flex-1 w-full">

        {/* Progress */}
        <div className="flex items-center gap-4 mb-10">
          {progressSteps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                step === s.key ? 'bg-emerald-600 text-white' :
                stepIndex[step] > i ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'
              }`}>
                {stepIndex[step] > i ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium ${step === s.key ? 'text-slate-800' : 'text-slate-400'}`}>{s.label}</span>
              {i < 2 && <div className="w-8 h-0.5 bg-slate-200" />}
            </div>
          ))}
        </div>

        {/* Step 1 — Profile */}
        {step === 'profile' && !checkingAuth && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Book Your Free Discovery Call</h1>
            <p className="text-slate-500 mb-8">Tell us about yourself, then pick a time.</p>

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="bg-white rounded-3xl shadow p-8 space-y-5">
                <h2 className="font-semibold text-slate-800">Your Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label><input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required className="w-full p-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 transition" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label><input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required className="w-full p-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 transition" /></div>
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 transition" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="(636) 555-0123" className="w-full p-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 transition" /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">ZIP *</label><input type="text" value={zip} onChange={e => setZip(e.target.value)} required maxLength={5} className="w-full p-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 transition" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">City</label><input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full p-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 transition" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">State</label><input type="text" value={state} onChange={e => setState(e.target.value)} maxLength={2} placeholder="MO" className="w-full p-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 transition" /></div>
                </div>
              </div>

              {/* Password */}
              <div className="bg-white rounded-3xl shadow p-8 space-y-5">
                <h2 className="font-semibold text-slate-800">Create Your Password</h2>
                <p className="text-sm text-slate-500">Access your DriveAdvocate dashboard to track your deal.</p>
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="Minimum 8 characters" className="w-full p-3 pr-12 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 transition" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-9 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label><input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full p-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 transition" /></div>
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">{error}</div>}

              <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-semibold text-lg transition">
                {loading ? 'Creating your account...' : 'Continue to Schedule →'}
              </button>

              <p className="text-center text-sm text-slate-500">Already have an account? <a href="/login" className="text-emerald-600 hover:underline">Log in</a></p>
            </form>
          </div>
        )}

        {/* Step 2 — Cal.com Calendar */}
        {step === 'calendar' && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Pick Your Time</h1>
            <p className="text-slate-500 mb-8">Choose a time for your free 30-minute discovery call.</p>

            <div className="bg-white rounded-3xl shadow overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-lg">📞</div>
                  <div>
                    <div className="font-semibold">DriveAdvocate Discovery Call</div>
                    <div className="text-sm text-slate-500">30 minutes · Free · Phone call</div>
                  </div>
                </div>
              </div>
              <Cal
                calLink={CALCOM_LINK}
                config={{
                  name: `${firstName} ${lastName}`,
                  email: email,
                  'Attendee Phone Number': phone,
                }}
                style={{ width: '100%', height: '700px', overflow: 'scroll' }}
              />
            </div>
          </div>
        )}

        {/* Step 3 — Confirmed */}
        {step === 'confirmed' && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold mb-2">You're Booked!</h1>
            <p className="text-slate-500 mb-2">Check your email for a confirmation with the call details.</p>
            <p className="text-sm text-slate-400">Redirecting to your dashboard...</p>
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mt-6" />
          </div>
        )}

        {/* Reassurance — only on profile step */}
        {step === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 text-center">
            <div><div className="text-2xl mb-2">🆓</div><h3 className="font-semibold text-sm mb-1">Free Call</h3><p className="text-xs text-slate-500">No obligation — just a conversation</p></div>
            <div><div className="text-2xl mb-2">⏱</div><h3 className="font-semibold text-sm mb-1">30 Minutes</h3><p className="text-xs text-slate-500">Quick and focused</p></div>
            <div><div className="text-2xl mb-2">🔒</div><h3 className="font-semibold text-sm mb-1">No Pressure</h3><p className="text-xs text-slate-500">We'll only work together if it's the right fit</p></div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
