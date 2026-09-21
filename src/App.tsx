/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { CandidateRegister } from './components/CandidateRegister';
import { Round1Theory } from './components/Round1Theory';
import { Round2CodeReview } from './components/Round2CodeReview';
import { Round3Labs } from './components/Round3Labs';
import { ReportAndCertificate } from './components/ReportAndCertificate';
import { ROUND1_QUESTIONS } from './data/round1Questions';
import { ROUND2_MCQ_QUESTIONS } from './data/round2MCQ';
import { ROUND3_CHALLENGES } from './data/round3Challenges';
import { CandidateInfo } from './types';

export default function App() {
  const [step, setStep] = useState<number>(0);
  const [candidate, setCandidate] = useState<CandidateInfo | null>(null);

  // Round 1 State
  const [r1Answers, setR1Answers] = useState<Record<number, number>>({});
  const [r1TimeSpent, setR1TimeSpent] = useState<number>(0);

  // Round 2 State
  const [r2Answers, setR2Answers] = useState<Record<number, number>>({});
  const [r2TimeSpent, setR2TimeSpent] = useState<number>(0);

  // Round 3 State
  const [r3Flags, setR3Flags] = useState<Record<string, boolean>>({});
  const [r3Submissions, setR3Submissions] = useState<Record<string, string>>({});
  const [r3TimeSpent, setR3TimeSpent] = useState<number>(0);

  // Handlers
  const handleStart = (c: CandidateInfo) => {
    setCandidate(c);
    setStep(1); // Proceed to Round 1
  };

  const handleR1Submit = (answers: Record<number, number>, time: number) => {
    setR1Answers(answers);
    setR1TimeSpent(time);
    setStep(2); // Proceed to Round 2
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleR2Submit = (answers: Record<number, number>, time: number) => {
    setR2Answers(answers);
    setR2TimeSpent(time);
    setStep(3); // Proceed to Round 3
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleR3Submit = (
    flags: Record<string, boolean>,
    submissions: Record<string, string>,
    time: number
  ) => {
    setR3Flags(flags);
    setR3Submissions(submissions);
    setR3TimeSpent(time);
    setStep(4); // Proceed to Certificate & Report
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#0f172a] selection:bg-[#0071e3] selection:text-white font-sans antialiased">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Top Header & Navigation Stepper */}
        <Header
          currentStep={step}
          candidate={candidate}
          onNavigateStep={(targetStep) => setStep(targetStep)}
        />

        {/* Step 0: Registration */}
        {step === 0 && <CandidateRegister onStart={handleStart} />}

        {/* Step 1: Round 1 Theory MCQ */}
        {step === 1 && (
          <Round1Theory
            questions={ROUND1_QUESTIONS}
            initialAnswers={r1Answers}
            onSubmit={handleR1Submit}
          />
        )}

        {/* Step 2: Round 2 Code Review & Vulnerability Analysis (MCQ) */}
        {step === 2 && (
          <Round2CodeReview
            questions={ROUND2_MCQ_QUESTIONS}
            initialAnswers={r2Answers}
            onSubmit={handleR2Submit}
          />
        )}

        {/* Step 3: Round 3 Simulated Labs & CTF */}
        {step === 3 && (
          <Round3Labs
            challenges={ROUND3_CHALLENGES}
            initialFlags={r3Flags}
            initialSubmissions={r3Submissions}
            onSubmit={handleR3Submit}
          />
        )}

        {/* Step 4: Diagnostic Audit Report & Verified Certificate */}
        {step === 4 && candidate && (
          <ReportAndCertificate
            candidate={candidate}
            r1Questions={ROUND1_QUESTIONS}
            r1Answers={r1Answers}
            r1TimeSpent={r1TimeSpent}
            r2Questions={ROUND2_MCQ_QUESTIONS}
            r2Answers={r2Answers}
            r2TimeSpent={r2TimeSpent}
            r3Challenges={ROUND3_CHALLENGES}
            r3Flags={r3Flags}
            r3Submissions={r3Submissions}
            r3TimeSpent={r3TimeSpent}
          />
        )}
      </div>
    </div>
  );
}
