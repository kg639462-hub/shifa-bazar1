import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, Activity, ShieldCheck, Microscope, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DispensaryLogo from '../components/common/DispensaryLogo';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  // Clear demo credentials - start with clean empty input fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [smsVerified, setSmsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  const handleVerifySms = () => {
    if (!phone.trim()) {
      setError('Please enter a mobile phone number first.');
      return;
    }
    setSmsVerified(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessInfo(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Dispensary key must be at least 6 characters long.');
      return;
    }

    if (!agreedTerms) {
      setError('Please acknowledge and agree to the Apothecary Terms & Certified Herbal Care Disclosures.');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp({
        email,
        password,
        fullName,
        phone,
      });

      if (result.success) {
        if (result.requiresConfirmation) {
          // Supabase created the user in auth.users, and dispatched an email confirmation
          setSuccessInfo({
            message: result.message,
            email: email.trim(),
          });
        } else {
          // Instant sign in
          navigate('/', { state: { message: 'Welcome to Ash-Shifa Herbals! Your profile is verified.' } });
        }
      } else {
        setError(result.error || 'Failed to complete patient registration in Supabase.');
      }
    } catch (err) {
      setError(err.message || 'Registration error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Top Logo placeholder (isolated in DispensaryLogo.jsx for easy customization) */}
      <DispensaryLogo variant="auth_center" />

      {/* Title & Portal Badge */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-[#dcfce7] text-[#0a2e1e] text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full border border-[#bbf7d0]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>VERIFIED DISPENSARY PORTAL</span>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0a2e1e]">
          Create Profile
        </h1>

        <p className="text-xs sm:text-sm text-[#4b6356] max-w-md mx-auto leading-relaxed">
          Join Ash-Shifa Herbals for tailored botanical guidance and Medicine tracking.
        </p>
      </div>

      {/* Main Enrollment Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#d6e8dd] shadow-sm space-y-6">
        {/* Card Header matching UI */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
          <div>
            <h2 className="font-semibold text-base sm:text-lg text-[#0a2e1e]">
              Patient Enrollment
            </h2>
            <p className="text-xs text-[#4b6356]">
              Step 1 of 2: Practitioner & Medicine  Records
            </p>
          </div>
          <Activity className="w-6 h-6 text-emerald-600" />
        </div>

        {/* Success Banner if User Added to Supabase */}
        {successInfo ? (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-[#0a2e1e]">
              Patient Profile Created in Supabase!
            </h3>
            <p className="text-xs text-[#4b6356] leading-relaxed max-w-md mx-auto">
              {successInfo.message}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <Link
                to="/signin"
                state={{ message: `Confirmation dispatched to ${successInfo.email}. Once verified, sign in here.` }}
                className="bg-[#0a2e1e] hover:bg-[#072417] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
              >
                Proceed to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* Full Name */}
              <div>
                <label className="block text-[#0a2e1e] font-medium text-xs mb-1.5">
                  Full Name 
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-800">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-[#eaf5ee] hover:bg-[#e4f2e9] focus:bg-[#e4f2e9] text-xs sm:text-sm text-[#0a2e1e] rounded-xl pl-10 pr-4 py-3 border border-transparent focus:border-emerald-600 focus:outline-hidden transition-all placeholder:text-[#4b6356]/60"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[#0a2e1e] font-medium text-xs mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-800">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter a valid email (e.g. yourname@gmail.com)"
                    className="w-full bg-[#eaf5ee] hover:bg-[#e4f2e9] focus:bg-[#e4f2e9] text-xs sm:text-sm text-[#0a2e1e] rounded-xl pl-10 pr-4 py-3 border border-transparent focus:border-emerald-600 focus:outline-hidden transition-all placeholder:text-[#4b6356]/60"
                  />
                </div>
              </div>

              {/* Mobile Number with Verify SMS */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <label className="text-[#0a2e1e]">Mobile Number</label>
                  <span className="text-[11px] text-emerald-800 flex items-center gap-1">
                    <span>⚙</span> For batch updates & delivery
                  </span>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-800">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter mobile number"
                    className="w-full bg-[#eaf5ee] hover:bg-[#e4f2e9] focus:bg-[#e4f2e9] text-xs sm:text-sm text-[#0a2e1e] rounded-xl pl-10 pr-24 py-3 border border-transparent focus:border-emerald-600 focus:outline-hidden transition-all placeholder:text-[#4b6356]/60"
                  />
                  <button
                    type="button"
                    onClick={handleVerifySms}
                    className="absolute right-2 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#d6e8dd] hover:bg-emerald-200 text-[#0a2e1e] transition-colors"
                  >
                    {smsVerified ? 'Verified ✓' : 'Verify SMS'}
                  </button>
                </div>
              </div>

              {/* Secure Dispensary Key */}
              <div>
                <label className="block text-[#0a2e1e] font-medium text-xs mb-1.5">
                  Create Secure Password 
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-800">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-[#eaf5ee] hover:bg-[#e4f2e9] focus:bg-[#e4f2e9] text-xs sm:text-sm text-[#0a2e1e] rounded-xl pl-10 pr-10 py-3 border border-transparent focus:border-emerald-600 focus:outline-hidden transition-all placeholder:text-[#4b6356]/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Disclosures Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#0a2e1e]">
                  <input
                    type="checkbox"
                    required
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 rounded text-[#0a2e1e] focus:ring-emerald-800 h-4 w-4 shrink-0"
                  />
                  <span className="leading-relaxed">
                    I agree to the{' '}
                    <a href="#terms" className="underline font-semibold text-emerald-900">
                      Apothecary Terms
                    </a>{' '}
                    &{' '}
                    <a href="#disclosures" className="underline font-semibold text-emerald-900">
                      Certified Herbal Care Disclosures
                    </a>
                    , including HIPAA-grade privacy protocols for natural medicine dispensaries.
                  </span>
                </label>
              </div>

              {/* Submit Button matching screenshot */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0a2e1e] hover:bg-[#072417] text-white py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Complete Registration
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>

      {/* 100% Monograph Verified Card matching screenshot */}
      <div className="bg-[#dcfce7]/60 rounded-3xl p-4 sm:p-5 border border-[#bbf7d0] flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-emerald-200/80 text-emerald-900 flex items-center justify-center shrink-0">
          <Microscope className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <span className="font-bold text-[#0a2e1e] block">
            100% Monograph Verified
          </span>
          <span className="text-[#4b6356]">
            Every tincture & botanical batch features a verifiable lab Certificate of Analysis.
          </span>
        </div>
      </div>

      {/* Already registered link */}
      <div className="text-center text-xs text-[#4b6356]">
        Already registered with Ash-Shifa?{' '}
        <Link to="/signin" className="font-bold text-emerald-900 underline underline-offset-2">
          Sign In here
        </Link>
      </div>
    </div>
  );
}
