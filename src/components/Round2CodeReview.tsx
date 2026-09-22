import React, { useState } from 'react';
import {
  Code2,
  AlertTriangle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  FileCode,
  Check,
  Copy
} from 'lucide-react';
import { Round2MCQQuestion } from '../types';

interface Round2CodeReviewProps {
  questions: Round2MCQQuestion[];
  initialAnswers?: Record<number, number>;
  onSubmit: (answers: Record<number, number>, timeSpent: number) => void;
}

export const Round2CodeReview: React.FC<Round2CodeReviewProps> = ({
  questions,
  initialAnswers = {},
  onSubmit
}) => {
  const [answers, setAnswers] = useState<Record<number, number>>(initialAnswers);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [langFilter, setLangFilter] = useState<'all' | 'sql' | 'javascript' | 'csharp'>('all');
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [proctorError, setProctorError] = useState('');

  const getLanguageLabel = (lang: string) => {
    if (lang === 'csharp') return 'C# (.NET)';
    if (lang === 'javascript') return 'JavaScript (Node.js)';
    if (lang === 'sql') return 'SQL (T-SQL)';
    return lang.toUpperCase();
  };

  const getLanguageBadgeStyle = (lang: string) => {
    if (lang === 'csharp') return 'border-purple-500/40 bg-purple-500/15 text-purple-300';
    if (lang === 'javascript') return 'border-amber-500/40 bg-amber-500/15 text-amber-300';
    if (lang === 'sql') return 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300';
    return 'border-slate-700 bg-slate-800 text-slate-300';
  };

  const filteredQuestions = questions.filter((q) =>
    langFilter === 'all' ? true : q.language === langFilter
  );

  const currentQuestion = filteredQuestions[activeIdx] || filteredQuestions[0] || questions[0];

  const answeredCount = Object.keys(answers).length;
  const answeredPercent = Math.round((answeredCount / questions.length) * 100);
  const isEstimatedPassing = answeredCount >= Math.ceil(questions.length * 0.35);

  const handleSelectOption = (optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex
    }));
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleProctorFill = () => {
    if (passwordInput === '123456') {
      setProctorError('');
      const filled: Record<number, number> = {};
      questions.forEach((q, idx) => {
        // Set correct answer for first 11 questions, mix for others
        filled[q.id] = idx < 12 ? q.correctAnswer : (q.correctAnswer + 1) % q.options.length;
      });
      setAnswers(filled);
      setShowPasswordPrompt(false);
      setPasswordInput('');
    } else {
      setProctorError('Incorrect password.');
    }
  };

  const handleFinalSubmit = () => {
    onSubmit(answers, 0);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-700 font-bold text-xs border border-amber-100">
                R2
              </span>
              <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                Round 2 · Code Review & Vulnerability Analysis
              </span>
            </div>
            <h1 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Real-World Code Review (MCQ)
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-700 font-medium max-w-2xl">
              Evaluate real-world code snippets across <strong className="text-slate-900 font-bold">SQL</strong>,{' '}
              <strong className="text-slate-900 font-bold">JavaScript</strong>, and{' '}
              <strong className="text-slate-900 font-bold">C#</strong> to identify root-cause vulnerabilities,
              exploit vectors, and secure remediations. Passing requirement: ≥ 35%.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Fast proctor autofill button for testing */}
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
                      handleProctorFill();
                    }
                  }}
                />
                {proctorError && <p className="text-red-500 text-xs">{proctorError}</p>}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleProctorFill}
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
                title="Fast proctor simulation for review"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 hover:border-slate-400 active:scale-[0.98]"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#0071e3]" />
                <span className="hidden sm:inline">Proctor Fill</span>
              </button>
            )}
          </div>
        </div>

        {/* Language Filter Tabs & Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 ml-2 mr-1">Filter:</span>
            <button
              type="button"
              onClick={() => {
                setLangFilter('all');
                setActiveIdx(0);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                langFilter === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              All ({questions.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setLangFilter('sql');
                setActiveIdx(0);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                langFilter === 'sql'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              SQL ({questions.filter((q) => q.language === 'sql').length})
            </button>
            <button
              type="button"
              onClick={() => {
                setLangFilter('javascript');
                setActiveIdx(0);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                langFilter === 'javascript'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              JavaScript ({questions.filter((q) => q.language === 'javascript').length})
            </button>
            <button
              type="button"
              onClick={() => {
                setLangFilter('csharp');
                setActiveIdx(0);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                langFilter === 'csharp'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              C# ({questions.filter((q) => q.language === 'csharp').length})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-700 font-medium">
                Answered: <strong className="text-slate-950 font-bold">{answeredCount}</strong> / {questions.length}
              </span>
              <span className={`block text-[11px] font-bold ${isEstimatedPassing ? 'text-emerald-700' : 'text-amber-700'}`}>
                {isEstimatedPassing ? '✓ Pass Requirement Met (≥35%)' : `Need ${Math.ceil(questions.length * 0.35) - answeredCount} more answers`}
              </span>
            </div>
            <div className="w-24 h-2 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
              <div
                className="h-full bg-[#0071e3] transition-all duration-300 rounded-full"
                style={{ width: `${answeredPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Question Navigator Sidebar + Active MCQ Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Question Selector List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Question Index ({filteredQuestions.length})
              </span>
              <span className="text-[11px] text-slate-700 font-semibold">
                {langFilter === 'all' ? 'All Languages' : getLanguageLabel(langFilter)}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-5 gap-2">
              {filteredQuestions.map((q, idx) => {
                const isSelected = idx === activeIdx;
                const isAnswered = answers[q.id] !== undefined;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className={`relative flex flex-col items-center justify-center rounded-xl p-2 text-xs font-bold transition border ${
                      isSelected
                        ? 'border-[#0071e3] bg-blue-50 text-[#0071e3] ring-2 ring-blue-500/30 font-extrabold'
                        : isAnswered
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-extrabold'
                        : 'border-slate-300 bg-slate-50/70 text-slate-700 hover:border-slate-400 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>#{q.id}</span>
                    <span className="text-[9px] font-bold uppercase opacity-85">
                      {q.language === 'csharp' ? 'C#' : q.language === 'javascript' ? 'JS' : 'SQL'}
                    </span>
                    {isAnswered && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600">
                        <Check className="h-2 w-2 text-white stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick stats note */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-700 space-y-1.5 font-medium">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" /> Answered
                </span>
                <span className="font-bold text-slate-900">
                  {filteredQuestions.filter((q) => answers[q.id] !== undefined).length} / {filteredQuestions.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-400" /> Remaining
                </span>
                <span className="font-bold text-slate-800">
                  {filteredQuestions.filter((q) => answers[q.id] === undefined).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Question MCQ Card (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-xs">
            {/* Header: Task title, Language tag, CWE */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-[#0071e3] border border-blue-100">
                  Q{currentQuestion.id}
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {currentQuestion.title}
                  </h2>
                  <span className="text-xs text-slate-700 font-semibold block font-mono">
                    {currentQuestion.cwe}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800">
                  {getLanguageLabel(currentQuestion.language)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setShowHint((prev) => ({
                      ...prev,
                      [currentQuestion.id]: !prev[currentQuestion.id]
                    }))
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                  <span>{showHint[currentQuestion.id] ? 'Hide Guidance' : '💡 Detailed Hints'}</span>
                </button>
              </div>
            </div>

            {/* Multi-step Progressive Hint Accordion */}
            {showHint[currentQuestion.id] && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 space-y-2">
                <div>
                  <span className="font-bold text-amber-900">Core Objective: </span>
                  <span className="text-amber-900 font-medium">{currentQuestion.hint}</span>
                </div>

                {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                  <div className="pt-2 border-t border-amber-200 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                      Investigation & Security Clues:
                    </span>
                    <ul className="space-y-1 text-[11px] text-amber-900 font-medium">
                      {currentQuestion.hints.map((h, hIdx) => (
                        <li key={hIdx} className="flex items-start gap-1.5">
                          <span className="font-mono text-amber-800 font-bold shrink-0">{hIdx + 1}.</span>
                          <span className="leading-relaxed">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Code Snippet Box (macOS Style) */}
            <div className="mt-4">
              <div className="flex items-center justify-between rounded-t-2xl border border-b-0 border-slate-300 bg-slate-100 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
                  <span className="h-3 w-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
                  <span className="h-3 w-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
                  <span className="ml-2 text-xs font-mono text-slate-800 font-bold">
                    {currentQuestion.language.toUpperCase()} · Security Audit Snippet
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(currentQuestion.code)}
                  className="flex items-center gap-1 text-[11px] text-slate-700 hover:text-slate-950 font-semibold transition"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="max-h-72 overflow-x-auto overflow-y-auto rounded-b-2xl border border-slate-800 bg-[#1a1b26] p-4 font-mono text-xs text-slate-100 leading-relaxed shadow-inner">
                <code>{currentQuestion.code}</code>
              </pre>
            </div>

            {/* Question prompt */}
            <div className="mt-5 rounded-xl border border-slate-300 bg-slate-50/90 p-4">
              <h3 className="text-sm font-bold text-slate-950 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{currentQuestion.question}</span>
              </h3>
            </div>

            {/* Multiple Choice Options */}
            <div className="mt-4 space-y-2.5">
              {currentQuestion.options.map((opt, optIdx) => {
                const isSelected = answers[currentQuestion.id] === optIdx;
                const letter = String.fromCharCode(65 + optIdx);

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full flex items-start gap-3 rounded-xl border p-3.5 text-left text-xs sm:text-sm transition ${
                      isSelected
                        ? 'border-[#0071e3] bg-blue-50/70 text-[#0071e3] ring-1 ring-[#0071e3] font-semibold'
                        : 'border-slate-300 bg-slate-50/50 text-slate-900 font-medium hover:border-slate-400 hover:bg-slate-100/70'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                        isSelected
                          ? 'bg-[#0071e3] text-white'
                          : 'border border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="flex-1 leading-relaxed text-slate-900">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation & Submit Controls */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={activeIdx === 0}
                  onClick={() => setActiveIdx((prev) => Math.max(0, prev - 1))}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  disabled={activeIdx === filteredQuestions.length - 1}
                  onClick={() => setActiveIdx((prev) => Math.min(filteredQuestions.length - 1, prev + 1))}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleFinalSubmit}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-500/20 transition active:scale-[0.99]"
              >
                <span>Submit Round 2 & Proceed to Labs</span>
                <CheckCircle2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
