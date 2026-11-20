import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  HeartPulse,
  Lock,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  FileText,
  HelpCircle,
  Truck,
  RotateCcw,
  Sparkles,
  X,
  Pill,
  Headphones,
} from 'lucide-react';
import DispensaryLogo from './DispensaryLogo';

// Professional Legal, Clinical & Regulatory Disclosures
const POLICY_CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    badge: 'Data Protection & Security',
    icon: Lock,
    lastUpdated: 'November 2026',
    sections: [
      {
        heading: '1. Patient Data Confidentiality',
        body: 'Ash-Shifa Herbal Dispensary collects patient information strictly to dispense verified herbal regimens, manage courier delivery, and comply with state pharmaceutical regulations. We never monetize, sell, or disclose personal health information to third-party marketing brokers.',
      },
      {
        heading: '2. Payment Security & Encryption',
        body: 'All online financial transactions are executed through bank-grade 256-Bit SSL encryption via RBI-licensed payment aggregators (Razorpay). Card details, CVVs, and banking credentials are never retained on our internal servers.',
      },
      {
        heading: '3. Digital Records Access',
        body: 'Patients retain complete authority to review, update, or request purging of their profile and dispensatory order logs by contacting our privacy compliance liaison at privacy@ashshifa.in.',
      },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    badge: 'Pharmaceutical Commerce Agreement',
    icon: FileText,
    lastUpdated: 'November 2026',
    sections: [
      {
        heading: '1. Acceptance of Pharmacopeia Protocols',
        body: 'By placing an order through Ash-Shifa Herbal Dispensary, you acknowledge that formulations are curated by certified herbalists and classical Unani/Ayurvedic pharmacopeia practitioners under regulatory licensing.',
      },
      {
        heading: '2. Order Fulfillment & Dispatch',
        body: 'Orders are bottled in amber miron glass and dispatched via temperature-managed clinical couriers. Dispatch timelines vary from 24 to 48 hours following prescription and batch verification.',
      },
      {
        heading: '3. Pricing & Taxation',
        body: 'All investment prices displayed on the portal are inclusive of applicable GST. We reserve the right to rectify unintentional pricing anomalies prior to batch shipping.',
      },
    ],
  },
  disclaimer: {
    title: 'Medical & Botanical Disclaimer',
    badge: 'Regulatory Healthcare Notice',
    icon: AlertCircle,
    lastUpdated: 'November 2026',
    sections: [
      {
        heading: '1. Clinical Guidance Notice',
        body: 'The botanical products, monographs, and medicinal compounds displayed on this website are formulated to support holistic wellness. Content presented herein is for informational purposes and is not intended to replace personalized clinical diagnosis by an allopathic or licensed medical physician.',
      },
      {
        heading: '2. Drug-Botanical Interactions',
        body: 'If you are pregnant, nursing, taking synthetic anticoagulants, or undergoing active chronic therapy, consult your primary physician or our dispensary herbalists prior to beginning any high-potency extract regimen.',
      },
      {
        heading: '3. Statutory AYUSH Advisory',
        body: 'Products are manufactured in GMP-certified apothecary facilities and verified through third-party lab Certificates of Analysis (COA) conforming to Ministry of AYUSH botanical parameters.',
      },
    ],
  },
  prescription: {
    title: 'Prescription Policy',
    badge: 'Clinical Verification Protocol',
    icon: Pill,
    lastUpdated: 'November 2026',
    sections: [
      {
        heading: '1. Regimen Verification',
        body: 'Schedule-E and high-potency therapeutic botanical tinctures require a valid prescription or clinical assessment uploaded during checkout or verified via dispensary liaison consultation.',
      },
      {
        heading: '2. Dosage Alignment',
        body: 'Our dispensary pharmacists reserve the right to withhold dispatch if the ordered volume significantly conflicts with recommended pharmacopeial safe limits until verbal or written clarification is established.',
      },
      {
        heading: '3. Prescription Validity',
        body: 'Prescriptions remain valid for a maximum duration of 6 months from issue date for ongoing herbal refill orders.',
      },
    ],
  },
  cancellation: {
    title: 'Cancellation Policy',
    badge: 'Pre-Dispatch Guarantee',
    icon: RotateCcw,
    lastUpdated: 'November 2026',
    sections: [
      {
        heading: '1. Pre-Dispatch Cancellation Guarantee',
        body: 'Patients may cancel any order directly through their portal dashboard prior to cold-pack packaging and courier handover. Once an order enters shipping status, cancellations cannot be accepted.',
      },
      {
        heading: '2. Instant Processing for Prepaid Orders',
        body: 'When a prepaid Razorpay order is cancelled prior to shipping, our dispensary administration immediately reviews and issues a direct refund to the original payment source.',
      },
      {
        heading: '3. Zero Cancellation Fees',
        body: 'No administrative penalty or restocking fees apply to orders cancelled before clinical dispatch.',
      },
    ],
  },
  refund: {
    title: 'Return & Refund Policy',
    badge: 'Direct Customer Settlement',
    icon: RotateCcw,
    lastUpdated: 'November 2026',
    sections: [
      {
        heading: '1. Direct Admin Refund Processing',
        body: 'For cancelled prepaid online orders, our dispensary admin issues refunds directly to your original payment method (UPI / Net Banking / Debit Card) with a verified bank UTR reference.',
      },
      {
        heading: '2. Damaged or Tampered Shipments',
        body: 'If a miron glass bottle or security seal arrives compromised, report it to support@ashshifa.in within 48 hours of doorstep delivery with an unboxing photograph for an immediate complimentary batch replacement or full refund.',
      },
      {
        heading: '3. Turnaround Timelines',
        body: 'Banking refunds typically reflect in your account within 24 to 72 bank operating hours post-settlement by our dispensary administrative station.',
      },
    ],
  },
  shipping: {
    title: 'Shipping & Delivery Policy',
    badge: 'Cold-Pack Courier Transit',
    icon: Truck,
    lastUpdated: 'November 2026',
    sections: [
      {
        heading: '1. Nationwide Courier Network',
        body: 'We deliver across all PIN codes in India utilizing priority temperature-controlled courier partners (Bluedart, Delhivery, DTDC).',
      },
      {
        heading: '2. Transit Timelines',
        body: 'Metro cities receive doorstep delivery within 2 to 4 business days. Regional and interior destinations are typically fulfilled within 4 to 6 business days.',
      },
      {
        heading: '3. Real-Time Tracking',
        body: 'Every dispatched order includes a live consignment tracking number accessible directly on the "Track Your Order" portal dashboard.',
      },
    ],
  },
  faqs: {
    title: 'Frequently Asked Questions (FAQs)',
    badge: 'Dispensary Guidance',
    icon: HelpCircle,
    lastUpdated: 'November 2026',
    sections: [
      {
        heading: 'Q: How do I track my active dispensary order?',
        body: 'A: Simply navigate to "Track Your Order" or your "Dispensary Orders" page from the main menu to view live preparation stages (Placed → Prep → Shipped → Out for Delivery → Delivered).',
      },
      {
        heading: 'Q: Are your herbal tinctures and extracts authentic?',
        body: 'A: Yes. Every batch is bottled from verified botanical harvests and undergoes third-party heavy metal, microbial, and potency testing with batch-specific Certificates of Analysis.',
      },
      {
        heading: 'Q: What payment methods are supported?',
        body: 'A: We support all major UPI applications (GPay, PhonePe, Paytm), Credit/Debit cards, Net Banking via Razorpay, as well as Cash on Delivery (COD).',
      },
      {
        heading: 'Q: How does the cancellation and refund flow work?',
        body: 'A: You can cancel un-shipped orders directly online with one click. For prepaid online orders, the dispensary admin processes your refund directly with a bank reference UTR.',
      },
    ],
  },
};

export default function Footer() {
  const navigate = useNavigate();

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false);
  const [newsletterFeedback, setNewsletterFeedback] = useState(null);

  // Active Policy Modal State
  const [activePolicyKey, setActivePolicyKey] = useState(null);

  const activePolicy = activePolicyKey ? POLICY_CONTENT[activePolicyKey] : null;

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    setNewsletterFeedback(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = newsletterEmail.trim();

    if (!cleanEmail) {
      setNewsletterFeedback({
        type: 'error',
        message: 'Please enter your email address to subscribe.',
      });
      return;
    }

    if (!emailRegex.test(cleanEmail)) {
      setNewsletterFeedback({
        type: 'error',
        message: 'Please enter a valid email address (e.g. yourname@domain.com).',
      });
      return;
    }

    setSubmittingNewsletter(true);

    // Simulated robust subscription with clinical confirmation
    setTimeout(() => {
      setSubmittingNewsletter(false);
      setNewsletterFeedback({
        type: 'success',
        message: '✓ Welcome to Ash-Shifa Health Updates! Your subscription has been confirmed.',
      });
      setNewsletterEmail('');
      setTimeout(() => {
        setNewsletterFeedback(null);
      }, 7000);
    }, 800);
  };

  const handleLinkClick = (path) => {
    if (path.startsWith('/#')) {
      navigate('/');
      setTimeout(() => {
        const id = path.replace('/#', '');
        const elem = document.getElementById(id);
        if (elem) elem.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      navigate(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="mt-auto bg-gradient-to-b from-[#092218] via-[#061811] to-[#04120d] text-slate-200 border-t border-teal-900/50 relative overflow-hidden font-sans selection:bg-teal-500 selection:text-white">
      {/* Subtle ambient lighting gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ==================================================================== */}
      {/* 4. TRUST & SECURITY SECTION                                         */}
      {/* ==================================================================== */}
      <section aria-labelledby="trust-indicators-heading" className="border-b border-white/10 bg-white/[0.02]">
        <h2 id="trust-indicators-heading" className="sr-only">
          Dispensary Trust and Security Standards
        </h2>
        <div className="w-full max-w-[1440px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* 1. Secure Payments */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-teal-500/30 hover:bg-white/[0.05] transition-all duration-300 group">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 group-hover:bg-teal-500 group-hover:text-[#061811] transition-all duration-300 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-white group-hover:text-teal-300 transition-colors">
                  Secure Payments
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  256-Bit SSL Encrypted & Verified Razorpay Payment Gateway
                </p>
              </div>
            </div>

            {/* 2. Customer Support */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-teal-500/30 hover:bg-white/[0.05] transition-all duration-300 group">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 group-hover:bg-teal-500 group-hover:text-[#061811] transition-all duration-300 shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-white group-hover:text-teal-300 transition-colors">
                  Customer Support
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Dedicated Clinical Herbalists & Order Assistance Liaison
                </p>
              </div>
            </div>

            {/* 3. Genuine Products */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-teal-500/30 hover:bg-white/[0.05] transition-all duration-300 group">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 group-hover:bg-teal-500 group-hover:text-[#061811] transition-all duration-300 shrink-0">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-white group-hover:text-teal-300 transition-colors">
                  100% Genuine Products
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Pure Botanical Extracts Verified by Certificates of Analysis
                </p>
              </div>
            </div>

            {/* 4. Licensed Pharmacy */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-teal-500/30 hover:bg-white/[0.05] transition-all duration-300 group">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 group-hover:bg-teal-500 group-hover:text-[#061811] transition-all duration-300 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-white group-hover:text-teal-300 transition-colors">
                  Licensed Pharmacy
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Ayush Licensed Herbal Dispensary • Lic: AYUR/DISP/2026/089
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. NEWSLETTER SECTION                                               */}
      {/* ==================================================================== */}
      <section aria-labelledby="newsletter-heading" className="border-b border-white/10 relative">
        <div className="w-full max-w-[1440px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="relative rounded-3xl p-6 sm:p-10 bg-gradient-to-r from-teal-950/70 via-emerald-950/60 to-[#061e15] border border-teal-500/30 shadow-2xl overflow-hidden backdrop-blur-md">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              {/* Left Column: Heading & Description */}
              <div className="lg:col-span-7 space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11px] font-semibold uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Healthcare Compendium</span>
                </div>
                <h2 id="newsletter-heading" className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Stay Healthy, Stay Updated!
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                  Subscribe to receive health updates, exclusive offers, and the latest healthcare news directly from our licensed pharmacopeia herbalists.
                </p>
              </div>

              {/* Right Column: Input & Subscribe Button */}
              <div className="lg:col-span-5">
                <form onSubmit={handleNewsletterSubmit} className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={newsletterEmail}
                        onChange={(e) => {
                          setNewsletterEmail(e.target.value);
                          if (newsletterFeedback) setNewsletterFeedback(null);
                        }}
                        placeholder="Enter your active email address..."
                        aria-label="Email address for newsletter"
                        className="w-full bg-black/40 border border-white/20 focus:border-teal-400 focus:bg-black/60 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none transition-all shadow-inner"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingNewsletter}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-[#061811] font-bold text-xs sm:text-sm shadow-lg shadow-teal-500/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                    >
                      {submittingNewsletter ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#061811] border-t-transparent rounded-full animate-spin" />
                          <span>Joining...</span>
                        </>
                      ) : (
                        <>
                          <span>Subscribe</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Feedback Validation Alerts */}
                  {newsletterFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150 ${
                        newsletterFeedback.type === 'success'
                          ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
                          : 'bg-red-950/80 border border-red-500/40 text-red-200'
                      }`}
                    >
                      {newsletterFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span>{newsletterFeedback.message}</span>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 flex items-center gap-1.5 pl-1">
                    <Lock className="w-3 h-3 text-teal-400" />
                    <span>We respect your clinical privacy. Unsubscribe at any time with zero spam.</span>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. FOOTER LAYOUT (4 COLUMNS)                                        */}
      {/* ==================================================================== */}
      <section aria-labelledby="footer-navigation-heading">
        <h2 id="footer-navigation-heading" className="sr-only">
          Dispensary Navigation and Contact Details
        </h2>
        <div className="w-full max-w-[1440px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
            
            {/* COLUMN 1 – BRAND INFORMATION (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-5">
              <DispensaryLogo variant="footer" />
              <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed max-w-sm">
                Your trusted online destination for healthcare and pharmaceutical products. We make healthcare essentials accessible with convenience, care, and trust.
              </p>

              {/* Social Media Icons */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-400 block">
                  Connect With Our Clinical Team
                </span>
                <div className="flex items-center gap-2.5">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Ash-Shifa on Facebook"
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-teal-400 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 transition-all duration-200 group active:scale-95"
                  >
                    <Facebook className="w-4 h-4 transition-transform group-hover:scale-110" />
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Ash-Shifa on Instagram"
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-teal-400 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 transition-all duration-200 group active:scale-95"
                  >
                    <Instagram className="w-4 h-4 transition-transform group-hover:scale-110" />
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Ash-Shifa on LinkedIn"
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-teal-400 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 transition-all duration-200 group active:scale-95"
                  >
                    <Linkedin className="w-4 h-4 transition-transform group-hover:scale-110" />
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Ash-Shifa on YouTube"
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-teal-400 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 transition-all duration-200 group active:scale-95"
                  >
                    <Youtube className="w-4 h-4 transition-transform group-hover:scale-110" />
                  </a>
                </div>
              </div>

              {/* Regulatory Notice Card */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-teal-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Licensed Botanical Pharmacopeia</span>
                </div>
                <p className="leading-snug">
                  Ayush Dispensary License: <strong className="text-slate-200 font-mono">AYUR/DISP/2026/089</strong>
                </p>
              </div>
            </div>

            {/* COLUMN 2 – QUICK LINKS (lg:col-span-2) */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-serif font-bold text-sm sm:text-base text-white tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-4 bg-teal-400 rounded-full inline-block" />
                <span>Quick Links</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li>
                  <button
                    onClick={() => handleLinkClick('/')}
                    className="hover:text-teal-300 transition-colors flex items-center gap-1.5 group cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Home</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActivePolicyKey('disclaimer')}
                    className="hover:text-teal-300 transition-colors flex items-center gap-1.5 group cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>About Us</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLinkClick('/#products')}
                    className="hover:text-teal-300 transition-colors flex items-center gap-1.5 group cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Shop Medicines</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLinkClick('/#products')}
                    className="hover:text-teal-300 transition-colors flex items-center gap-1.5 group cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Healthcare Products</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLinkClick('/#products')}
                    className="hover:text-teal-300 transition-colors flex items-center gap-1.5 group cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Offers & Discounts</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLinkClick('/contact')}
                    className="hover:text-teal-300 transition-colors flex items-center gap-1.5 group cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Contact Us</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* COLUMN 3 – CUSTOMER SUPPORT (lg:col-span-3) */}
            <div className="lg:col-span-3 space-y-4">
              <h3 className="font-serif font-bold text-sm sm:text-base text-white tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-4 bg-emerald-400 rounded-full inline-block" />
                <span>Customer Support</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li>
                  <button
                    onClick={() => handleLinkClick('/orders')}
                    className="hover:text-teal-300 transition-colors flex items-center gap-1.5 group cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>My Account</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLinkClick('/orders')}
                    className="hover:text-teal-300 transition-colors flex items-center gap-1.5 group cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Track Your Order</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLinkClick('/cart')}
                    className="hover:text-teal-300 transition-colors flex items-center gap-1.5 group cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Shopping Cart</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActivePolicyKey('refund')}
                    className="hover:text-teal-300 transition-colors flex items-center gap-1.5 group cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Return & Refund Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActivePolicyKey('shipping')}
                    className="hover:text-teal-300 transition-colors flex items-center gap-1.5 group cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Shipping Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActivePolicyKey('faqs')}
                    className="hover:text-teal-300 transition-colors flex items-center gap-1.5 group cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>FAQs</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLinkClick('/contact')}
                    className="hover:text-teal-300 transition-colors flex items-center gap-1.5 group cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Help & Support</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* COLUMN 4 – IMPORTANT INFORMATION (lg:col-span-3) */}
            <div className="lg:col-span-3 space-y-4">
              <h3 className="font-serif font-bold text-sm sm:text-base text-white tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-4 bg-teal-400 rounded-full inline-block" />
                <span>Important Information</span>
              </h3>
              
              {/* Policy Quick Access Links */}
              <ul className="space-y-2 text-xs text-slate-300 pb-2">
                <li>
                  <button
                    onClick={() => setActivePolicyKey('privacy')}
                    className="hover:text-teal-300 transition-colors flex items-center gap-1.5 group cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Privacy Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActivePolicyKey('terms')}
                    className="hover:text-teal-300 transition-colors flex items-center gap-1.5 group cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Terms & Conditions</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActivePolicyKey('disclaimer')}
                    className="hover:text-teal-300 transition-colors flex items-center gap-1.5 group cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Disclaimer</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActivePolicyKey('prescription')}
                    className="hover:text-teal-300 transition-colors flex items-center gap-1.5 group cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Prescription Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActivePolicyKey('cancellation')}
                    className="hover:text-teal-300 transition-colors flex items-center gap-1.5 group cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    <span>Cancellation Policy</span>
                  </button>
                </li>
              </ul>

              {/* Direct Contact Information Box */}
              <div className="pt-3 border-t border-white/10 space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Emergency & Orders</span>
                    <a href="tel:+918899903777" className="font-bold text-white hover:text-teal-300 transition-colors">
                      +91 8899903777
                    </a>{' '}
                    •{' '}
                    <a href="tel:+919123456789" className="text-slate-300 hover:text-teal-300 transition-colors">
                      +91 91234 56789
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Clinical Support Email</span>
                    <a href="mailto:support@ashshifa.in" className="text-white hover:text-teal-300 transition-colors font-medium">
                      support@ashshifa.in
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-400 leading-snug">
                    <span className="text-[10px] text-slate-300 block uppercase font-semibold">Physical Dispensary</span>
                    Flat No. 64 Lodhi Tola, Bareilly, Uttar Pradesh 243005
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. BOTTOM COPYRIGHT BAR                                             */}
      {/* ==================================================================== */}
      <section aria-labelledby="footer-bottom-heading" className="border-t border-teal-900/60 bg-black/40">
        <h2 id="footer-bottom-heading" className="sr-only">
          Copyright, Agency Credits and Legal Attributions
        </h2>
        <div className="w-full max-w-[1440px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 text-center md:text-left">
            
            {/* Left Side: Copyright */}
            <div className="space-y-1">
              <p className="text-slate-300">
                © 2026 <strong className="text-white font-serif">Ash-Shifa Herbal Dispensary</strong>. All Rights Reserved.
              </p>
              <p className="text-[11px] text-slate-500">
                Pure classical botanical pharmacotherapy curated by licensed Ayurvedic and Unani practitioners.
              </p>
            </div>

            {/* Right Side: Geetanjali Digital Solutions Agency Credit */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Website Designed &amp; Developed by</span>
              <a
                href="https://geetanjalidigitalsolution.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Geetanjali Digital Solutions - Web Development & Digital Strategy"
                className="font-bold text-teal-300 hover:text-teal-200 transition-all duration-200 inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-teal-950/60 hover:bg-teal-900/80 border border-teal-500/30 hover:border-teal-400/60 group shadow-xs active:scale-95 cursor-pointer"
              >
                <span className="underline decoration-teal-400/60 underline-offset-4 group-hover:decoration-teal-200">
                  Geetanjali Digital Solutions
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-teal-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* MODAL: CLINICAL & LEGAL POLICY VIEWER                                */}
      {/* ==================================================================== */}
      {activePolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#0b241b] text-slate-100 rounded-3xl w-full max-w-2xl border border-teal-500/30 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-[#071912] px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <activePolicy.icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-teal-400 uppercase">
                    {activePolicy.badge}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-white">
                    {activePolicy.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setActivePolicyKey(null)}
                aria-label="Close dialog"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              <div className="flex items-center justify-between text-[11px] text-teal-300/80 border-b border-white/10 pb-3">
                <span>Ash-Shifa Herbal Dispensary Standards</span>
                <span>Effective: {activePolicy.lastUpdated}</span>
              </div>

              {activePolicy.sections.map((sec, idx) => (
                <div key={idx} className="space-y-1.5">
                  <h4 className="font-serif font-bold text-white text-sm sm:text-base text-teal-200">
                    {sec.heading}
                  </h4>
                  <p className="text-slate-300 leading-relaxed text-xs sm:text-[13px]">
                    {sec.body}
                  </p>
                </div>
              ))}

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-slate-400 space-y-1">
                <span className="font-semibold text-teal-300 block">Pharmacist Inquiries & Compliance</span>
                <p>
                  For inquiries or official verification regarding our clinical policies, email our compliance team at{' '}
                  <a href="mailto:support@ashshifa.in" className="text-teal-300 underline font-medium">
                    support@ashshifa.in
                  </a>{' '}
                  or phone <strong className="text-white">+91 8899903777</strong>.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#071912] px-6 py-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                AYUR/DISP/2026/089
              </span>
              <button
                onClick={() => setActivePolicyKey(null)}
                className="px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-[#061811] text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
              >
                Close Document
              </button>
            </div>

          </div>
        </div>
      )}
    </footer>
  );
}
