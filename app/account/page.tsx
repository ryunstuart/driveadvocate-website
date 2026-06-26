'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchUserAttributes, fetchAuthSession,
  updateUserAttributes, updatePassword, getCurrentUser,
  fetchMFAPreference, updateMFAPreference,
} from 'aws-amplify/auth';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Eye, EyeOff } from 'lucide-react';

export default function AccountSettings() {
  const router = useRouter();

  useEffect(() => { getCurrentUser().catch(() => router.push('/login')); }, [router]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [groups, setGroups] = useState<string[]>([]);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [attrs, session] = await Promise.all([
          fetchUserAttributes(),
          fetchAuthSession(),
        ]);
        setFirstName(attrs.given_name || '');
        setLastName(attrs.family_name || '');
        setPhone(attrs.phone_number || '');
        setEmail(attrs.email || '');

        const userGroups = (session.tokens?.accessToken?.payload?.['cognito:groups'] as string[]) || [];
        setGroups(userGroups);

        try {
          const mfaPref = await fetchMFAPreference();
          setMfaEnabled(mfaPref.preferred === 'TOTP');
        } catch {}
      } catch (err) {
        console.error('Failed to load user attributes', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg('');
    setProfileError('');
    try {
      await updateUserAttributes({
        userAttributes: {
          given_name: firstName,
          family_name: lastName,
          ...(phone ? { phone_number: phone } : {}),
        },
      });

      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      currentUser.firstName = firstName;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));

      setProfileMsg('Profile updated successfully.');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }

    setChangingPassword(true);
    try {
      await updatePassword({ oldPassword, newPassword });
      setPasswordMsg('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(''), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header variant="authenticated" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Loading settings...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header variant="authenticated" />
      <div className="max-w-2xl mx-auto px-6 py-10 flex-1 w-full">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-slate-500 mt-1">Manage your profile and security</p>
        </div>

        {/* Role badge */}
        <div className="bg-white rounded-3xl shadow p-6 mb-6 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">Signed in as</div>
            <div className="font-semibold mt-0.5">{email}</div>
          </div>
          <div className="flex gap-2">
            {groups.map(g => (
              <span key={g} className={`text-xs px-3 py-1 rounded-full font-medium ${
                g === 'admins' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </span>
            ))}
          </div>
        </div>

        {/* Profile */}
        <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl shadow p-8 mb-6">
          <h2 className="text-lg font-semibold mb-6">Profile</h2>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">First Name</label>
                <input
                  type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 transition text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Last Name</label>
                <input
                  type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 transition text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Phone Number</label>
              <input
                type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+16365550100"
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 transition text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">Include country code (e.g., +1 for US)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Email</label>
              <input
                type="email" value={email} disabled
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
            </div>
          </div>

          {profileMsg && <div className="mt-5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-2xl">{profileMsg}</div>}
          {profileError && <div className="mt-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">{profileError}</div>}

          <button
            type="submit" disabled={saving}
            className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-3 rounded-2xl font-semibold transition"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Password */}
        <form onSubmit={handleChangePassword} className="bg-white rounded-3xl shadow p-8">
          <h2 className="text-lg font-semibold mb-6">Change Password</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showOldPassword ? 'text' : 'password'} value={oldPassword} onChange={e => setOldPassword(e.target.value)} required
                  className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 transition text-sm"
                />
                <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                  {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8}
                  className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 transition text-sm"
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8}
                  className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 transition text-sm"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {passwordMsg && <div className="mt-5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-2xl">{passwordMsg}</div>}
          {passwordError && <div className="mt-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">{passwordError}</div>}

          <button
            type="submit" disabled={changingPassword}
            className="mt-6 w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white py-3 rounded-2xl font-semibold transition"
          >
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>

        {/* MFA */}
        {groups.some(g => g === 'advocates' || g === 'admins') && (
          <div className="bg-white rounded-3xl shadow p-8">
            <h2 className="text-lg font-semibold mb-4">Two-Factor Authentication</h2>
            {mfaEnabled ? (
              <div>
                <div className="flex items-center gap-2 text-emerald-600 mb-4">
                  <span className="text-lg">✓</span>
                  <span className="font-medium">Authenticator app enabled</span>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await updateMFAPreference({ totp: 'DISABLED' });
                      setMfaEnabled(false);
                    } catch (err) { console.error('Failed to disable MFA', err); }
                  }}
                  className="text-sm text-red-500 hover:underline"
                >
                  Disable 2FA
                </button>
              </div>
            ) : (
              <div>
                <p className="text-slate-500 text-sm mb-4">Add an extra layer of security to your advocate account</p>
                <button
                  onClick={() => router.push('/mfa-setup')}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-medium hover:bg-emerald-700 transition"
                >
                  Enable 2FA
                </button>
              </div>
            )}
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}
