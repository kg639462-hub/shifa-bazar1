import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center max-w-xl mx-auto">
        <span className="text-[10px] font-bold tracking-widest text-emerald-900 uppercase">
          CLINICAL INQUIRIES & DISPENSARY LIAISON
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0a2e1e]">
          Consult Our Herbalists
        </h1>
        <p className="text-xs sm:text-sm text-[#4b6356]">
          Have questions regarding herbal extractions, drug-botanical interactions, or batch verification? Our licensed pharmacists are available.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Contact Info Card */}
        <div className="md:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-[#d6e8dd] shadow-xs space-y-6">
          <h2 className="font-serif text-lg font-bold text-[#0a2e1e] border-b border-[#f0f0f0] pb-3">
            OFFICE DETAILS
          </h2>

          <div className="space-y-4 text-xs text-[#4b6356]">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0a2e1e] block">Physical Address</strong>
                Flat No. 64 Lodhi Tola Bareilly<br />
                Uttar Pradesh 243005
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0a2e1e] block">Contact </strong>
                +91 8899903777
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0a2e1e] block">Mail</strong>
                info@shifabazar.in
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0a2e1e] block">Dispensing Hours</strong>
                Mon–Fri: 8:00 AM – 6:00 PM PST<br />
                {/* Cold-Pack Dispatches: Daily 11:00 AM */}
              </div>
            </div>
          </div>
        </div>

        {/* Inquiries Form */}
        <div className="md:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#d6e8dd] shadow-xs">
          {submitted ? (
            <div className="py-10 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
              <h3 className="font-serif text-xl font-bold text-[#0a2e1e]">
                Inquiry Logged into Dispensary Queue
              </h3>
              <p className="text-xs text-[#4b6356] max-w-sm mx-auto">
                Thank you{form.name ? `, ${form.name}` : ''}. An on-duty practitioner will review your inquiry and respond within 4 clinical hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold border border-[#0a2e1e] text-[#0a2e1e]"
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <h2 className="font-serif text-lg font-bold text-[#0a2e1e] border-b border-[#f0f0f0] pb-3">
                Send Practitioner Message
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4b6356] font-medium mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-[#f0faf4] border border-[#d6e8dd] rounded-xl px-3 py-2 text-[#0a2e1e] focus:outline-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-[#4b6356] font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-[#f0faf4] border border-[#d6e8dd] rounded-xl px-3 py-2 text-[#0a2e1e] focus:outline-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4b6356] font-medium mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full bg-[#f0faf4] border border-[#d6e8dd] rounded-xl px-3 py-2 text-[#0a2e1e] focus:outline-emerald-800"
                />
              </div>

              <div>
                <label className="block text-[#4b6356] font-medium mb-1">Clinical Inquiry</label>
                <textarea
                  rows={4}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-[#f0faf4] border border-[#d6e8dd] rounded-xl px-3 py-2 text-[#0a2e1e] focus:outline-emerald-800"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0a2e1e] hover:bg-[#072417] text-white py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Send className="w-4 h-4" />
                CONTACT WITH US
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
