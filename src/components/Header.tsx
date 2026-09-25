import React from 'react';
import { Shield, Award, Terminal, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { CandidateInfo } from '../types';

interface HeaderProps {
  currentStep: number;
  candidate: CandidateInfo | null;
  onNavigateStep?: (step: number) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentStep, candidate, onNavigateStep }) => {
  const steps = [
    { id: 0, label: 'Registration', icon: Shield },
    { id: 1, label: 'Round 1: Theory', icon: CheckCircle2 },
    { id: 2, label: 'Round 2: Code Review', icon: FileCode },
    { id: 3, label: 'Round 3: Labs & CTF', icon: Terminal },
    { id: 4, label: 'Report & Certificate', icon: Award }
  ];

  return (
    <header className="mb-6 rounded-2xl border border-black/[0.08] bg-white/85 p-4 sm:p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0071e3] shadow-sm shadow-blue-500/20 text-white">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                Hubstream Security Interview Test
              </h1>
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800">
                v2.4
              </span>
            </div>
            <p className="text-xs text-slate-700 font-medium">
              Hubstream Security Interview Test — Technical Assessment Suite
            </p>
          </div>
        </div>

        {/* Candidate chip if registered */}
        {candidate && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50/90 px-3.5 py-1.5 text-xs text-slate-800 shadow-2xs">
            <div className="flex flex-col">
              <span className="font-bold text-slate-900">{candidate.name}</span>
              <span className="text-[11px] text-slate-700 font-medium">{candidate.track} · {candidate.organization}</span>
            </div>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#0071e3]">
              Pass: ≥ 35% / round
            </span>
          </div>
        )}
      </div>

      {/* Progress Stepper */}
      <nav aria-label="Assessment Progress" className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isDone = currentStep > step.id;
          const isClickable = onNavigateStep && (isDone || currentStep === step.id);

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onNavigateStep && onNavigateStep(step.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#0071e3] text-white shadow-xs font-bold'
                  : isDone
                  ? 'border border-slate-300 bg-slate-50 text-slate-900 hover:bg-slate-100 hover:border-slate-400'
                  : 'border border-transparent text-slate-600 hover:text-slate-800'
              } ${isClickable ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : isDone ? 'text-emerald-700 font-bold' : 'text-slate-600'}`} />
              <span>{step.label}</span>
              {isDone && <span className="text-[10px] text-emerald-700 font-black">✓</span>}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
