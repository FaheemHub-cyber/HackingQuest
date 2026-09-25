import React, { useState } from 'react';
import { ShieldCheck, BookOpen, Code2, Terminal, Award, ArrowRight, UserCheck, Sparkles } from 'lucide-react';
import { AssessmentTrack, CandidateInfo } from '../types';

interface CandidateRegisterProps {
  onStart: (candidate: CandidateInfo) => void;
}

export const CandidateRegister: React.FC<CandidateRegisterProps> = ({ onStart }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [track, setTrack] = useState<AssessmentTrack>('Web Application Security');
  const [error, setError] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [proctorError, setProctorError] = useState('');

  const tracks: AssessmentTrack[] = [
    'Web Application Security',
    'Cloud Security',
    'AI + Security',
    'SOC / Blue Team',
    'Penetration Testing'
  ];

  const handleFillSample = () => {
    if (passwordInput === '123456') {
      setProctorError('');
      setName('Aditi Sharma');
      setEmail('aditi.sharma@example.edu');
      setOrganization('IIT Bombay / Cyber Lab');
      setTrack('Web Application Security');
      setError('');
      setShowPasswordPrompt(false);
      setPasswordInput('');
    } else {
      setProctorError('Incorrect password.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide candidate full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid candidate email address.');
      return;
    }

    const candidateId = `SR-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    onStart({
      name: name.trim(),
      email: email.trim(),
      organization: organization.trim() || 'Independent Researcher',
      track,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      id: candidateId
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Registration Card */}
      <div className="relative overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-7 sm:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-20 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/80 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0071e3]">
                <ShieldCheck className="h-3.5 w-3.5" /> Hubstream Security Interview Test
              </span>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
                Hubstream Security Interview Test — Registration
              </h2>
              <p className="mt-1 text-sm text-slate-700 font-medium max-w-2xl leading-relaxed">
                Please enter candidate details to start the test. The test has 3 simple rounds.
                A score of at least <strong className="text-emerald-700 font-bold">35% in each round</strong> is required to pass and get your certificate.
              </p>
            </div>
            {showPasswordPrompt ? (
              <div className="flex flex-col gap-2 items-end">
                <input
                  type="password"
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800"
                  placeholder="Enter password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleFillSample();
                    }
                  }}
                />
                {proctorError && <p className="text-red-500 text-xs">{proctorError}</p>}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFillSample}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-[#0071e3] transition hover:bg-blue-100 active:scale-[0.98]"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordPrompt(false);
                      setPasswordInput('');
                      setProctorError('');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 hover:border-slate-400 active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPasswordPrompt(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 hover:border-slate-400 active:scale-[0.98]"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#0071e3]" /> Auto-fill Sample Candidate
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aditi Sharma"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-500 transition focus:bg-white focus:border-[#0071e3] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Email Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@organization.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-500 transition focus:bg-white focus:border-[#0071e3] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  University / College / Organization
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. IIT Bombay / Security Department"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-500 transition focus:bg-white focus:border-[#0071e3] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Primary Specialization Track
                </label>
                <select
                  value={track}
                  onChange={(e) => setTrack(e.target.value as AssessmentTrack)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-2.5 text-sm font-medium text-slate-900 transition focus:bg-white focus:border-[#0071e3] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                >
                  {tracks.map((t) => (
                    <option key={t} value={t} className="bg-white text-slate-900 font-medium">
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] px-6 py-3 text-sm font-bold text-white shadow-sm shadow-blue-500/20 transition active:scale-[0.99]"
              >
                <UserCheck className="h-4 w-4" /> Begin Round 1: Theory Exam <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Assessment Syllabus & Format Cards */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">
          Assessment Architecture & Passing Criteria
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Round 1 Card */}
          <div className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-xs transition hover:border-slate-300">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0071e3] border border-blue-100">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#0071e3]">
                Round 1 · Theory
              </span>
            </div>
            <h4 className="mt-3 font-bold text-slate-900">Round 1: Theory Questions</h4>
            <p className="mt-1 text-xs text-slate-700 leading-relaxed font-medium">
              20 simple multiple choice questions on web security, cloud, and penetration testing basics.
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="text-slate-700 font-semibold">Passing Score:</span>
              <span className="font-bold text-emerald-700">≥ 35% (7 / 20 correct)</span>
            </div>
          </div>

          {/* Round 2 Card */}
          <div className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-xs transition hover:border-slate-300">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Code2 className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                Round 2 · Code Review
              </span>
            </div>
            <h4 className="mt-3 font-bold text-slate-900">Round 2: Code Review</h4>
            <p className="mt-1 text-xs text-slate-700 leading-relaxed font-medium">
              15 questions analyzing security bugs in easy SQL, JavaScript, and C# code snippets.
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="text-slate-700 font-semibold">Passing Score:</span>
              <span className="font-bold text-emerald-700">≥ 35% (6 / 15 correct)</span>
            </div>
          </div>

          {/* Round 3 Card */}
          <div className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-xs transition hover:border-slate-300">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                <Terminal className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-purple-100 bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-800">
                Round 3 · Practical Labs
              </span>
            </div>
            <h4 className="mt-3 font-bold text-slate-900">Round 3: Hands-On Labs</h4>
            <p className="mt-1 text-xs text-slate-700 leading-relaxed font-medium">
              10 simple security tasks including XSS, SQL injection, AI prompt injection, and Linux shell commands.
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="text-slate-700 font-semibold">Passing Score:</span>
              <span className="font-bold text-emerald-700">≥ 35% (4 / 10 flags)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Certification Notice */}
      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4">
        <div className="flex items-start gap-3">
          <Award className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <strong className="text-emerald-800 font-semibold">Automated Results & Certificate:</strong>{' '}
            When you complete Round 3, your result PDF will be downloaded automatically. You can view all correct answers, explanations, and your official Hubstream Security certificate.
          </div>
        </div>
      </div>
    </div>
  );
};
