import React, { useState } from 'react';
import { HelpCircle, CheckCircle, ArrowRight, Sparkles, Filter } from 'lucide-react';
import { MCQQuestion } from '../types';

interface Round1TheoryProps {
  questions: MCQQuestion[];
  initialAnswers?: Record<number, number>;
  onSubmit: (answers: Record<number, number>, timeSpent: number) => void;
}

export const Round1Theory: React.FC<Round1TheoryProps> = ({
  questions,
  initialAnswers = {},
  onSubmit
}) => {
  const [answers, setAnswers] = useState<Record<number, number>>(initialAnswers);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  const handleSelectOption = (qId: number, optionIdx: number) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  const topics = ['All', 'Pentesting', 'AI + SOC', 'Threat Modeling', 'Cloud', 'OSINT & Zero Trust'];

  const filteredQuestions = activeFilter === 'All'
    ? questions
    : questions.filter((q) => q.topic.includes(activeFilter) || activeFilter.includes(q.topic));

  const answeredCount = Object.keys(answers).length;
  const isPassingCandidate = answeredCount >= 7; // 35% of 20 = 7

  const handleDemoFill = () => {
    // Fill 16/20 correct (80%) for realistic passing demonstration
    const demoAnswers: Record<number, number> = {};
    questions.forEach((q, idx) => {
      // make most correct, a couple wrong to show detailed wrong-question analysis in the report
      if (idx === 2 || idx === 8 || idx === 14) {
        demoAnswers[q.id] = (q.correctAnswer + 1) % q.options.length;
      } else {
        demoAnswers[q.id] = q.correctAnswer;
      }
    });
    setAnswers(demoAnswers);
  };

  const executeSubmit = () => {
    onSubmit(answers, 0);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Stats */}
      <div className="flex flex-col gap-4 rounded-3xl border border-black/[0.06] bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#0071e3]">
              Round 1 of 3
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Theory MCQ Assessment</h2>
          </div>
          <p className="mt-1 text-xs text-slate-700 font-medium">
            20 single-choice questions · 1 mark each · Passing benchmark: <strong className="text-emerald-700 font-bold">≥ 35% (7 correct)</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Answered progress */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs">
            <span className="text-slate-700 font-bold">Progress:</span>
            <span className={`font-bold ${answeredCount >= 7 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {answeredCount} / {questions.length} answered
            </span>
          </div>

          {/* Quick Demo Fill */}
          <button
            type="button"
            onClick={handleDemoFill}
            title="Auto-fill passing answers for evaluation convenience"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 hover:border-slate-400 active:scale-[0.98]"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#0071e3]" />
            <span className="hidden sm:inline">Proctor Fill</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Navigator + Questions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar: Question Matrix & Topic Filter */}
        <div className="space-y-4 lg:col-span-1">
          {/* Question Matrix */}
          <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Question Matrix (20)
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`q-${q.id}`);
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className={`flex h-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                      isAnswered
                        ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 font-extrabold'
                        : 'border border-slate-300 bg-slate-50/70 text-slate-700 hover:border-slate-400 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-[11px] text-slate-700 font-semibold">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-600" /> Answered
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-slate-400" /> Pending
              </span>
            </div>
          </div>

          {/* Topic Filters */}
          <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              <Filter className="h-3.5 w-3.5 text-slate-600" />
              Filter by Domain
            </div>
            <div className="flex flex-col gap-1.5">
              {topics.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveFilter(t)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition text-left ${
                    activeFilter === t
                      ? 'border border-blue-200 bg-blue-50 text-[#0071e3] font-bold'
                      : 'border border-transparent text-slate-800 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <span>{t}</span>
                  <span className="text-[11px] text-slate-600 font-bold">
                    {t === 'All' ? questions.length : questions.filter(q => q.topic.includes(t) || t.includes(q.topic)).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Question List */}
        <div className="space-y-4 lg:col-span-3">
          {filteredQuestions.map((q) => {
            const selectedIdx = answers[q.id];
            const originalIndex = questions.findIndex(item => item.id === q.id);

            return (
              <div
                key={q.id}
                id={`q-${q.id}`}
                className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-xs transition hover:border-slate-300"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-[#0071e3] border border-blue-100">
                      {originalIndex + 1}
                    </span>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-800">
                      {q.topic}
                    </span>
                  </div>
                  {selectedIdx !== undefined ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                      <CheckCircle className="h-3 w-3 text-emerald-600" /> Answered
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                      <HelpCircle className="h-3 w-3 text-slate-500" /> Select one
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <p className="mt-3 text-sm font-bold text-slate-900 leading-relaxed">
                  {q.question}
                </p>

                {/* Options */}
                <div className="mt-4 space-y-2.5">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedIdx === optIdx;
                    const letter = String.fromCharCode(65 + optIdx);

                    return (
                      <label
                        key={optIdx}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={`flex items-start gap-3 rounded-xl border p-3.5 text-xs sm:text-sm cursor-pointer transition ${
                          isSelected
                            ? 'border-[#0071e3] bg-blue-50/70 text-[#0071e3] ring-1 ring-[#0071e3] font-semibold'
                            : 'border-slate-300 bg-slate-50/50 text-slate-900 font-medium hover:border-slate-400 hover:bg-slate-100/70'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={isSelected}
                          onChange={() => handleSelectOption(q.id, optIdx)}
                          className="mt-0.5 h-4 w-4 accent-[#0071e3]"
                        />
                        <div className="flex-1 leading-normal">
                          <span className={`font-black mr-1.5 ${isSelected ? 'text-[#0071e3]' : 'text-slate-800'}`}>
                            {letter}.
                          </span>
                          <span className="text-slate-900">{opt}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Bottom Submit Action */}
          <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-2xl border border-black/[0.1] bg-white/95 p-4 shadow-xl backdrop-blur-xl">
            <div className="text-xs text-slate-800 font-medium">
              <span>Status: </span>
              <strong className={answeredCount >= 7 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                {answeredCount} of {questions.length} questions completed
              </strong>
              {answeredCount < 7 && (
                <span className="ml-2 text-rose-700 font-bold">
                  (Needs ≥ 7 to meet 35% pass rule)
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setConfirmSubmitOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm shadow-blue-500/20 transition active:scale-[0.99]"
            >
              <span>Submit Round 1 & Proceed to Round 2</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Confirm Round 1 Submission</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              You have answered <strong className="text-slate-900">{answeredCount}</strong> out of <strong className="text-slate-900">{questions.length}</strong> questions.
              {answeredCount < 7 && (
                <span className="block mt-2 font-semibold text-rose-600">
                  Warning: You have answered fewer than 7 questions. A minimum score of 35% (7/20) is required in this round to earn the certificate.
                </span>
              )}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(false)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:border-slate-300"
              >
                Continue Reviewing
              </button>
              <button
                type="button"
                onClick={executeSubmit}
                className="rounded-xl bg-[#0071e3] hover:bg-[#0077ed] px-4 py-2 text-xs font-semibold text-white shadow-sm transition active:scale-[0.98]"
              >
                Confirm & Proceed →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
