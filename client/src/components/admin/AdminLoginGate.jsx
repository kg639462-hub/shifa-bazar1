import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, AlertCircle, CheckCircle, ArrowRight, LogOut, Terminal, Key } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function AdminLoginGate({ currentUser, onLoginSuccess, onSignOut }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const handleAdminSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error('Supabase client is not configured in this environment.');
      }

      // 1. Sign in via Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError) {
        if (signInError.message.toLowerCase().includes('email not confirmed')) {
          throw new Error('Your email address has not been verified in Supabase yet. Please click the confirmation link sent to your inbox, or verify this user in your Supabase Auth dashboard.');
        }
        if (signInError.message.toLowerCase().includes('invalid login credentials')) {
          throw new Error('Invalid administrator email or password. Please verify your credentials.');
        }
        throw signInError;
      }

      const user = data.user;

      // 2. Strict Requirement: Verified Email Check
      const isEmailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);
      if (!isEmailVerified) {
        // Sign out right away if email is unverified
        await supabase.auth.signOut();
        throw new Error('Email verification required: Your email address is registered, but has not yet been verified in Supabase. Please verify your email via the confirmation link or in the Supabase Authentication dashboard.');
      }

      // 3. Strict Requirement: Approved Admin in Supabase Check
      let isAdmin = false;
      try {
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile && profile.role === 'admin') {
          isAdmin = true;
        }
      } catch (err) {
        console.warn('Profile fetch notice in AdminLoginGate:', err.message);
      }

      if (!isAdmin && (user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin')) {
        isAdmin = true;
      }

      if (!isAdmin) {
        await supabase.auth.signOut();
        throw new Error(
          `Access Denied: The account "${user.email}" is verified, but not approved as an administrator in Supabase. Only users with role = 'admin' in the "profiles" table are permitted.`
        );
      }

      // Store token and trigger callback
      if (data.session?.access_token) {
        localStorage.setItem('ash_shifa_token', data.session.access_token);
      }
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your administrator email first to resend verification.');
      return;
    }
    try {
      setError(null);
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      if (resendErr) throw resendErr;
      setInfo(`A new verification link has been dispatched to ${email}. Please check your inbox.`);
    } catch (err) {
      setError(err.message || 'Failed to resend confirmation email.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#d6e8dd] shadow-2xl p-8 space-y-6 relative overflow-hidden">
        {/* Top Decorative Pill */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-[#0a2e1e] text-white rounded-2xl shadow-md mb-2">
            <ShieldCheck className="w-8 h-8 text-emerald-300" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#0a2e1e]">
            Dispensary Administration
          </h1>
          <p className="text-xs text-[#4b6356] max-w-xs mx-auto">
            Restricted portal for authorized personnel. Requires a <span className="font-semibold text-[#0a2e1e]">verified email</span> approved in Supabase.
          </p>
        </div>

        {/* Current logged-in state if user is logged in as non-admin */}
        {currentUser && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Signed in as non-admin:</span>
            </div>
            <p className="text-gray-700 truncate font-mono text-[11px] bg-white p-1.5 rounded border border-amber-200">
              {currentUser.email}
            </p>
            <p className="text-[11px] text-amber-800">
              This account does not have administrator privileges. Please sign in with an approved Supabase admin account.
            </p>
            <button
              onClick={onSignOut}
              className="w-full mt-1 py-1.5 bg-amber-200/80 hover:bg-amber-200 font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Current Account</span>
            </button>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block">Authentication Blocked</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {info && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{info}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleAdminSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0a2e1e] mb-1.5">
              Verified Administrator Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ash-shifa.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0a2e1e] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#0a2e1e]">
                Password
              </label>
              <button
                type="button"
                onClick={handleResendConfirmation}
                className="text-[11px] text-emerald-700 hover:underline font-semibold"
              >
                Resend verification?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0a2e1e] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0a2e1e] hover:bg-[#072417] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <span>Verifying with Supabase...</span>
            ) : (
              <>
                <Key className="w-4 h-4 text-emerald-300" />
                <span>Authenticate & Access Admin Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Security Requirements Note */}
        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-[11px] text-gray-600">
          <span className="font-bold text-[#0a2e1e] block uppercase tracking-wider text-[10px]">
            Security Requirements:
          </span>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-800">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Email must be verified in Supabase Auth.</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-800">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Role must be set to <code className="bg-emerald-100/70 px-1 py-0.5 rounded font-mono font-bold text-[#0a2e1e]">'admin'</code> in Supabase.</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-500">
            <span className="font-semibold text-gray-700">How to approve an admin in Supabase SQL Editor:</span>
            <pre className="mt-1 p-1.5 bg-white rounded border border-gray-200 text-gray-800 font-mono text-[9px] overflow-x-auto">
{`UPDATE profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
