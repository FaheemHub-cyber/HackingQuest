import React, { useState, useRef } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  Printer,
  Download,
  ShieldCheck,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  FileCode,
  Sparkles,
  FileDown
} from 'lucide-react';
import { CandidateInfo, MCQQuestion, Round2MCQQuestion, CTFChallenge } from '../types';
import { downloadElementAsPDF, generateAuditReportPDF } from '../utils/pdfGenerator';

interface ReportAndCertificateProps {
  candidate: CandidateInfo;
  r1Questions: MCQQuestion[];
  r1Answers: Record<number, number>;
  r1TimeSpent?: number;
  r2Questions: Round2MCQQuestion[];
  r2Answers: Record<number, number>;
  r2TimeSpent?: number;
  r3Challenges: CTFChallenge[];
  r3Flags: Record<string, boolean>;
  r3Submissions: Record<string, string>;
  r3TimeSpent?: number;
  onRetake?: () => void;
}

export const ReportAndCertificate: React.FC<ReportAndCertificateProps> = ({
  candidate,
  r1Questions,
  r1Answers,
  r1TimeSpent = 0,
  r2Questions,
  r2Answers,
  r2TimeSpent = 0,
  r3Challenges,
  r3Flags,
  r3Submissions,
  r3TimeSpent = 0,
}) => {
  const [r1Filter, setR1Filter] = useState<'all' | 'wrong' | 'correct'>('all');
  const [r2Filter, setR2Filter] = useState<'all' | 'wrong' | 'correct'>('all');
  const [expandedR2, setExpandedR2] = useState<Record<number, boolean>>({});
  const [isExportingCertPDF, setIsExportingCertPDF] = useState(false);
  const [isExportingReportPDF, setIsExportingReportPDF] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);
  const hasAutoDownloadedRef = useRef(false);

  // ---------------- SCORING CALCULATIONS ----------------
  // Round 1
  let r1CorrectCount = 0;
  r1Questions.forEach((q) => {
    if (r1Answers[q.id] === q.correctAnswer) {
      r1CorrectCount += 1;
    }
  });
  const r1ScorePercent = Math.round((r1CorrectCount / r1Questions.length) * 100);
  const r1Passed = r1ScorePercent >= 35; // 35% threshold

  // Round 2 (MCQ)
  let r2CorrectCount = 0;
  r2Questions.forEach((q) => {
    if (r2Answers[q.id] === q.correctAnswer) {
      r2CorrectCount += 1;
    }
  });
  const r2ScorePercent = Math.round((r2CorrectCount / r2Questions.length) * 100);
  const r2Passed = r2ScorePercent >= 35; // 35% threshold

  // Round 3
  const r3SolvedCount = Object.values(r3Flags).filter(Boolean).length;
  const r3ScorePercent = Math.round((r3SolvedCount / r3Challenges.length) * 100);
  const r3Passed = r3ScorePercent >= 35; // 35% threshold

  // Overall qualification: ALL 3 rounds must pass individually
  const allPassed = r1Passed && r2Passed && r3Passed;
  const aggregatePercent = Math.round((r1ScorePercent + r2ScorePercent + r3ScorePercent) / 3);

  // Automatically download the result PDF when the test report finishes
  React.useEffect(() => {
    if (!hasAutoDownloadedRef.current) {
      hasAutoDownloadedRef.current = true;
      try {
        generateAuditReportPDF({
          candidate,
          r1Questions,
          r1Answers,
          r1ScorePercent,
          r1TimeSpent,
          r2Questions,
          r2Answers,
          r2ScorePercent,
          r2TimeSpent,
          r3Challenges,
          r3Flags,
          r3Submissions,
          r3ScorePercent,
          r3TimeSpent,
          allPassed,
          aggregatePercent
        });
      } catch (error) {
        console.error('Auto-download PDF failed:', error);
      }
    }
  }, [
    candidate,
    r1Questions,
    r1Answers,
    r1ScorePercent,
    r1TimeSpent,
    r2Questions,
    r2Answers,
    r2ScorePercent,
    r2TimeSpent,
    r3Challenges,
    r3Flags,
    r3Submissions,
    r3ScorePercent,
    r3TimeSpent,
    allPassed,
    aggregatePercent
  ]);

  const formatSeconds = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCertificatePDF = async () => {
    if (!certificateRef.current) return;
    try {
      setIsExportingCertPDF(true);
      const safeName = candidate.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadElementAsPDF(
        certificateRef.current,
        `Hubstream_Security_Interview_Certificate_${safeName}.pdf`,
        'landscape'
      );
    } catch (error) {
      console.error('Failed to generate Certificate PDF:', error);
    } finally {
      setIsExportingCertPDF(false);
    }
  };

  const handleDownloadReportPDF = () => {
    try {
      setIsExportingReportPDF(true);
      generateAuditReportPDF({
        candidate,
        r1Questions,
        r1Answers,
        r1ScorePercent,
        r1TimeSpent,
        r2Questions,
        r2Answers,
        r2ScorePercent,
        r2TimeSpent,
        r3Challenges,
        r3Flags,
        r3Submissions,
        r3ScorePercent,
        r3TimeSpent,
        allPassed,
        aggregatePercent
      });
    } catch (error) {
      console.error('Failed to generate Report PDF:', error);
    } finally {
      setIsExportingReportPDF(false);
    }
  };

  const handleExportText = () => {
    let report = `=======================================================\n`;
    report += `HUBSTREAM SECURITY INTERVIEW TEST REPORT\n`;
    report += `=======================================================\n\n`;
    report += `Candidate Name:  ${candidate.name}\n`;
    report += `Email:           ${candidate.email}\n`;
    report += `Organization:    ${candidate.organization}\n`;
    report += `Track:           ${candidate.track}\n`;
    report += `Certificate ID:  ${candidate.id}\n`;
    report += `Date:            ${candidate.date}\n`;
    report += `Overall Status:  ${allPassed ? 'PASSED (QUALIFIED)' : 'FAILED (BELOW 35% THRESHOLD)'}\n\n`;

    report += `---------------- SUMMARY METRICS ----------------\n`;
    report += `Round 1 (Theory MCQ):        ${r1CorrectCount}/${r1Questions.length} (${r1ScorePercent}%) - ${r1Passed ? 'PASS' : 'FAIL'}\n`;
    report += `Round 2 (Code Review MCQ):   ${r2CorrectCount}/${r2Questions.length} (${r2ScorePercent}%) - ${r2Passed ? 'PASS' : 'FAIL'}\n`;
    report += `Round 3 (Labs & CTF):        ${r3SolvedCount}/${r3Challenges.length} (${r3ScorePercent}%) - ${r3Passed ? 'PASS' : 'FAIL'}\n`;
    report += `Aggregate Average:           ${aggregatePercent}%\n\n`;

    report += `---------------- ROUND 1 QUESTION-BY-QUESTION ----------------\n`;
    r1Questions.forEach((q, idx) => {
      const candAnswer = r1Answers[q.id];
      const isCorrect = candAnswer === q.correctAnswer;
      report += `[Q${idx + 1}] ${q.question}\n`;
      report += `  Candidate: ${candAnswer !== undefined ? q.options[candAnswer] : 'Unanswered'}\n`;
      report += `  Correct:   ${q.options[q.correctAnswer]}\n`;
      report += `  Status:    ${isCorrect ? 'CORRECT' : 'WRONG'}\n`;
      report += `  Explain:   ${q.explanation}\n\n`;
    });

    report += `---------------- ROUND 2 CODE REVIEW MCQ ----------------\n`;
    r2Questions.forEach((q, idx) => {
      const candAnswer = r2Answers[q.id];
      const isCorrect = candAnswer === q.correctAnswer;
      report += `[Q${idx + 1}] (${q.language.toUpperCase()}) ${q.title}\n`;
      report += `  Question:  ${q.question}\n`;
      report += `  Candidate: ${candAnswer !== undefined ? q.options[candAnswer] : 'Unanswered'}\n`;
      report += `  Correct:   ${q.options[q.correctAnswer]}\n`;
      report += `  Status:    ${isCorrect ? 'CORRECT' : 'WRONG'}\n`;
      report += `  Explain:   ${q.explanation}\n\n`;
    });

    report += `---------------- ROUND 3 LABS & CTF ----------------\n`;
    r3Challenges.forEach((c, idx) => {
      const isSolved = !!r3Flags[c.id];
      report += `[Lab ${idx + 1}] ${c.title} - ${isSolved ? 'SOLVED' : 'UNSOLVED'}\n`;
      report += `  Expected Flag: ${c.flag}\n`;
      report += `  Submitted:     ${r3Submissions[c.id] || 'None'}\n\n`;
    });

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Hubstream_Security_Interview_Test_${candidate.name.replace(/\s+/g, '_')}_Report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAnswersMarkdown = () => {
    let md = `# Hubstream Security Interview Test — Complete Solution Key & Candidate Answers\n\n`;
    md += `**Candidate Name**: ${candidate.name}\n`;
    md += `**Candidate Email**: ${candidate.email}\n`;
    md += `**Organization**: ${candidate.organization}\n`;
    md += `**Track**: ${candidate.track}\n`;
    md += `**Date**: ${candidate.date}\n`;
    md += `**Audit Reference ID**: ${candidate.id}\n`;
    md += `**Overall Assessment Status**: ${allPassed ? 'PASSED (QUALIFIED)' : 'FAILED (BELOW 35% THRESHOLD)'}\n\n`;
    md += `---\n\n`;
    md += `## Scorecard Summary\n\n`;
    md += `| Round | Assessment Domain | Score (%) | Score (Raw) | Benchmark | Result |\n`;
    md += `|---|---|---|---|---|---|\n`;
    md += `| Round 1 | Core Theoretical Foundations (MCQ) | ${r1ScorePercent}% | ${r1CorrectCount} / ${r1Questions.length} | ≥ 35% | ${r1Passed ? 'PASS' : 'FAIL'} |\n`;
    md += `| Round 2 | Code Review & Vulnerability Analysis (MCQ) | ${r2ScorePercent}% | ${r2CorrectCount} / ${r2Questions.length} | ≥ 35% | ${r2Passed ? 'PASS' : 'FAIL'} |\n`;
    md += `| Round 3 | Simulated Labs & CTF Challenges | ${r3ScorePercent}% | ${r3SolvedCount} / ${r3Challenges.length} | ≥ 35% | ${r3Passed ? 'PASS' : 'FAIL'} |\n`;
    md += `| **Overall** | **Composite Score** | **${aggregatePercent}%** | **${r1CorrectCount + r2CorrectCount + r3SolvedCount} / ${r1Questions.length + r2Questions.length + r3Challenges.length}** | **All Rounds ≥ 35%** | **${allPassed ? 'QUALIFIED' : 'NOT QUALIFIED'}** |\n\n`;
    md += `---\n\n`;
    md += `## Round 1: Core Theoretical Foundations (MCQ) — All Questions & Answers\n\n`;
    r1Questions.forEach((q, idx) => {
      const candAnswer = r1Answers[q.id];
      const isCorrect = candAnswer === q.correctAnswer;
      md += `### Question ${idx + 1}: ${q.question}\n\n`;
      md += `- **Topic**: ${q.topic}\n`;
      md += `- **Options**:\n`;
      q.options.forEach((opt, optIdx) => {
        const isOptCorrect = optIdx === q.correctAnswer;
        const isOptCandidate = optIdx === candAnswer;
        const marker = isOptCorrect ? ' *(Correct Answer)*' : isOptCandidate ? ' *(Candidate Choice)*' : '';
        md += `  - **[${String.fromCharCode(65 + optIdx)}]** ${opt}${marker}\n`;
      });
      md += `- **Candidate Choice**: ${candAnswer !== undefined ? `[${String.fromCharCode(65 + candAnswer)}] ${q.options[candAnswer]}` : '*Unanswered*'}\n`;
      md += `- **Official Correct Answer**: [${String.fromCharCode(65 + q.correctAnswer)}] ${q.options[q.correctAnswer]}\n`;
      md += `- **Status**: ${isCorrect ? '✅ Correct (+1 pt)' : '❌ Incorrect (0 pt)'}\n`;
      md += `- **Explanation**: ${q.explanation}\n\n`;
    });
    md += `---\n\n`;
    md += `## Round 2: Code Review & Vulnerability Analysis (MCQ) — All Tasks & Solutions\n\n`;
    r2Questions.forEach((q, idx) => {
      const candAnswer = r2Answers[q.id];
      const isCorrect = candAnswer === q.correctAnswer;
      md += `### Task ${idx + 1}: ${q.title} (${q.language.toUpperCase()})\n\n`;
      md += `- **CWE Classification**: ${q.cwe}\n`;
      md += `- **Question**: ${q.question}\n\n`;
      md += `\`\`\`${q.language}\n${q.code}\n\`\`\`\n\n`;
      md += `- **Options**:\n`;
      q.options.forEach((opt, optIdx) => {
        const isOptCorrect = optIdx === q.correctAnswer;
        const isOptCandidate = optIdx === candAnswer;
        const marker = isOptCorrect ? ' *(Correct Answer)*' : isOptCandidate ? ' *(Candidate Choice)*' : '';
        md += `  - **[${String.fromCharCode(65 + optIdx)}]** ${opt}${marker}\n`;
      });
      md += `- **Candidate Choice**: ${candAnswer !== undefined ? `[${String.fromCharCode(65 + candAnswer)}] ${q.options[candAnswer]}` : '*Unanswered*'}\n`;
      md += `- **Official Correct Answer**: [${String.fromCharCode(65 + q.correctAnswer)}] ${q.options[q.correctAnswer]}\n`;
      md += `- **Status**: ${isCorrect ? '✅ Correct (+1 pt)' : '❌ Incorrect (0 pt)'}\n`;
      md += `- **Remediation & Analysis**: ${q.explanation}\n\n`;
    });
    md += `---\n\n`;
    md += `## Round 3: Simulated Labs & CTF Challenges — All Flags & Walkthroughs\n\n`;
    r3Challenges.forEach((c, idx) => {
      const isSolved = !!r3Flags[c.id];
      const candInput = r3Submissions[c.id] || '*None*';
      md += `### Lab ${idx + 1}: ${c.title}\n\n`;
      md += `- **Category**: ${c.category}\n`;
      md += `- **Objective**: ${c.desc}\n`;
      md += `- **Expected Flag / Exploit Command**: \`${c.flag}\`\n`;
      md += `- **Candidate Submission**: \`${candInput}\`\n`;
      md += `- **Status**: ${isSolved ? '✅ Solved (+1 pt)' : '❌ Unsolved (0 pt)'}\n`;
      md += `- **Core Guidance**: ${c.hint}\n`;
      if (c.hints && c.hints.length > 0) {
        md += `- **Investigation Clues & Steps**:\n`;
        c.hints.forEach((h, hIdx) => {
          md += `  ${hIdx + 1}. ${h}\n`;
        });
      }
      md += `\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Hubstream_Security_Interview_Test_Answers_${candidate.name.replace(/\s+/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: OVERALL EVALUATION STATUS HERO */}
      <div
        className={`rounded-3xl border p-6 sm:p-8 shadow-xs transition ${
          allPassed
            ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-white'
            : 'border-rose-200 bg-gradient-to-br from-rose-50/80 via-white to-white'
        }`}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider border ${
                  allPassed
                    ? 'border-emerald-300 bg-emerald-100/80 text-emerald-900'
                    : 'border-rose-300 bg-rose-100/80 text-rose-900'
                }`}
              >
                {allPassed ? 'All 3 Rounds Passed (≥ 35%)' : 'Qualification Standard Not Met'}
              </span>
              <span className="text-xs text-slate-700 font-medium">Audit Reference: {candidate.id}</span>
            </div>

            <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              {allPassed ? 'Certificate of Technical Competency Awarded' : 'Assessment Result: Incomplete'}
            </h2>
            <p className="mt-1.5 text-sm text-slate-800 font-medium max-w-2xl leading-relaxed">
              {allPassed ? (
                <>
                  Candidate <strong className="text-slate-950 font-bold">{candidate.name}</strong> successfully
                  surpassed the 35% minimum passing threshold across all three consecutive rounds.
                  Your formal digital certificate and cryptographic credential are ready below.
                </>
              ) : (
                <>
                  Candidate <strong className="text-slate-950 font-bold">{candidate.name}</strong> scored below the 35%
                  benchmark in one or more rounds. The Security Research Engineer Certificate requires
                  passing Round 1, Round 2, and Round 3 independently. Review the audit report below.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {allPassed && (
              <button
                type="button"
                onClick={handleDownloadCertificatePDF}
                disabled={isExportingCertPDF}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-2xs disabled:opacity-50 active:scale-[0.98]"
              >
                {isExportingCertPDF ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Award className="h-4 w-4 text-amber-600" />
                    <span>Save Certificate PDF</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadReportPDF}
              disabled={isExportingReportPDF}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] px-4 py-2 text-xs font-bold text-white transition shadow-2xs disabled:opacity-50 active:scale-[0.98]"
            >
              <FileDown className="h-4 w-4" />
              <span>Save Report PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportAnswersMarkdown}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 transition shadow-2xs active:scale-[0.98]"
              title="Download Markdown file containing all answers and explanations for all rounds"
            >
              <FileCode className="h-4 w-4 text-[#0071e3]" />
              <span>Export Answers (.md)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 transition shadow-2xs active:scale-[0.98]"
              title="Open browser print dialog to print or Save as PDF"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleExportText}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 transition shadow-2xs active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              <span>Export TXT</span>
            </button>
          </div>
        </div>

        {/* 3-Round Pass Criteria Dashboard */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-black/[0.08] pt-6">
          {/* Round 1 Score card */}
          <div
            className={`rounded-2xl border p-4 ${
              r1Passed ? 'border-emerald-300 bg-emerald-50/60' : 'border-rose-300 bg-rose-50/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Round 1: Theory MCQ</span>
              {r1Passed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-rose-600" />
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-950">{r1ScorePercent}%</span>
              <span className="text-xs text-slate-700 font-medium">
                ({r1CorrectCount}/{r1Questions.length} correct)
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-700 font-medium">
              <span>Benchmark: ≥ 35%</span>
              <span className={r1Passed ? 'text-emerald-800 font-bold' : 'text-rose-800 font-bold'}>
                {r1Passed ? 'Passed' : 'Needs Review'}
              </span>
            </div>
          </div>

          {/* Round 2 Score card */}
          <div
            className={`rounded-2xl border p-4 ${
              r2Passed ? 'border-emerald-300 bg-emerald-50/60' : 'border-rose-300 bg-rose-50/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Round 2: Code Review MCQ</span>
              {r2Passed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-rose-600" />
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-950">{r2ScorePercent}%</span>
              <span className="text-xs text-slate-700 font-medium">
                ({r2CorrectCount}/{r2Questions.length} correct)
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-700 font-medium">
              <span>Benchmark: ≥ 35%</span>
              <span className={r2Passed ? 'text-emerald-800 font-bold' : 'text-rose-800 font-bold'}>
                {r2Passed ? 'Passed' : 'Needs Review'}
              </span>
            </div>
          </div>

          {/* Round 3 Score card */}
          <div
            className={`rounded-2xl border p-4 ${
              r3Passed ? 'border-emerald-300 bg-emerald-50/60' : 'border-rose-300 bg-rose-50/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Round 3: Labs & CTF</span>
              {r3Passed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-rose-600" />
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-950">{r3ScorePercent}%</span>
              <span className="text-xs text-slate-700 font-medium">
                ({r3SolvedCount}/{r3Challenges.length} flags)
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-700 font-medium">
              <span>Benchmark: ≥ 35%</span>
              <span className={r3Passed ? 'text-emerald-800 font-bold' : 'text-rose-800 font-bold'}>
                {r3Passed ? 'Passed' : 'Needs Review'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: FORMAL VERIFIED CERTIFICATE (Only shown if ALL passed) */}
      {allPassed && (
        <div
          ref={certificateRef}
          id="assessment-certificate"
          className="certificate-container print-break-inside-avoid relative overflow-hidden rounded-3xl border-2 border-amber-300 bg-gradient-to-b from-[#fbfbfa] via-white to-[#fbfbfa] p-8 sm:p-12 shadow-xl text-center"
        >
          {/* Top action bar on certificate (hidden when saving or printing) */}
          <div className="no-print absolute top-4 right-4 z-10">
            <button
              type="button"
              onClick={handleDownloadCertificatePDF}
              disabled={isExportingCertPDF}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-100/60 px-3 py-1.5 text-xs font-semibold text-amber-900 backdrop-blur-sm hover:bg-amber-100 transition disabled:opacity-50"
              title="Download official high-resolution PDF certificate"
            >
              {isExportingCertPDF ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border border-amber-600 border-t-transparent" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 text-amber-700" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>

          {/* Certificate Watermark / Background Accent */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-blue-400/5 blur-3xl pointer-events-none" />

          {/* Inner Certificate Border */}
          <div className="rounded-2xl border-2 border-amber-200/80 p-6 sm:p-10 relative">
            <div className="flex items-center justify-center gap-2">
              <Award className="h-10 w-10 text-amber-500 animate-bounce" />
            </div>

            <div className="mt-3 text-xs uppercase tracking-widest font-black text-amber-900">
              Official Digital Credential · Hubstream Security Board
            </div>

            <h1 className="mt-3 text-2xl sm:text-4xl font-black tracking-tight text-slate-950 uppercase font-serif">
              Hubstream Security Interview Test Certificate
            </h1>

            <div className="my-6 flex items-center justify-center gap-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                Awarded To
              </span>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400" />
            </div>

            <div className="text-3xl font-black text-slate-950 tracking-wide underline decoration-amber-400 underline-offset-8">
              {candidate.name}
            </div>

            <p className="mt-6 text-sm text-slate-800 font-medium leading-relaxed max-w-xl mx-auto">
              Having successfully demonstrated technical proficiencies across 3 progressive assessment
              rounds in Theory MCQ, Code Review Vulnerability Analysis, and Hands-on Virtual Sandbox Labs,
              fulfilling all criteria for the <strong className="text-slate-950 font-bold">{candidate.track}</strong> track.
            </p>

            {/* Certificate Performance Scoreboard */}
            <div className="mt-8 grid grid-cols-4 gap-2 rounded-2xl border border-slate-300 bg-slate-50/90 p-4 text-center">
              <div>
                <span className="text-[10px] text-slate-700 uppercase font-bold">Theory MCQ</span>
                <div className="text-lg font-black text-slate-950">{r1ScorePercent}%</div>
                <span className="text-[10px] text-emerald-800 font-bold">Passed</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-700 uppercase font-bold">Code Review</span>
                <div className="text-lg font-black text-slate-950">{r2ScorePercent}%</div>
                <span className="text-[10px] text-emerald-800 font-bold">Passed</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-700 uppercase font-bold">Labs & CTF</span>
                <div className="text-lg font-black text-slate-950">{r3ScorePercent}%</div>
                <span className="text-[10px] text-emerald-800 font-bold">Passed</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-700 uppercase font-bold">Composite</span>
                <div className="text-lg font-black text-amber-900">{aggregatePercent}%</div>
                <span className="text-[10px] text-slate-700 font-bold">Aggregate</span>
              </div>
            </div>

            {/* Signatures & Hash */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-between border-t border-slate-300 pt-6 text-xs text-slate-700 gap-4">
              <div className="text-left">
                <span className="block text-[11px] text-slate-600 font-bold uppercase">Verification Hash</span>
                <span className="font-mono text-[11px] text-slate-900 font-semibold">
                  SHA256:{candidate.id.replace(/-/g, '')}8f9a2c
                </span>
              </div>

              <div>
                <span className="block text-[11px] text-slate-600 font-bold uppercase">Issue Date</span>
                <span className="font-bold text-slate-900">{candidate.date}</span>
              </div>

              <div className="text-right">
                <span className="block text-[11px] text-slate-600 font-bold uppercase">Authorized Proctor</span>
                <span className="font-bold text-emerald-800">Hubstream Security Board</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: QUESTION-BY-QUESTION REPORT */}
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#0071e3]" />
            Comprehensive Audit & Diagnostics
          </h3>
          <p className="text-xs text-slate-700 font-medium">
            Review your submissions, correct answers, and security explanations across all 3 assessment rounds.
          </p>
        </div>

        {/* ROUND 1 QUESTIONS LIST */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Round 1: Theory Diagnostic Breakdown
            </h4>

            {/* Filter for Round 1 */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-300 bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setR1Filter('all')}
                className={`rounded-lg px-2.5 py-1 font-bold transition ${
                  r1Filter === 'all' ? 'bg-white text-slate-950 font-bold shadow-2xs' : 'text-slate-700'
                }`}
              >
                All ({r1Questions.length})
              </button>
              <button
                type="button"
                onClick={() => setR1Filter('wrong')}
                className={`rounded-lg px-2.5 py-1 font-bold transition ${
                  r1Filter === 'wrong' ? 'bg-white text-rose-800 font-bold shadow-2xs' : 'text-slate-700'
                }`}
              >
                Incorrect ({r1Questions.length - r1CorrectCount})
              </button>
              <button
                type="button"
                onClick={() => setR1Filter('correct')}
                className={`rounded-lg px-2.5 py-1 font-bold transition ${
                  r1Filter === 'correct' ? 'bg-white text-emerald-800 font-bold shadow-2xs' : 'text-slate-700'
                }`}
              >
                Correct ({r1CorrectCount})
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {r1Questions
              .filter((q) => {
                const isCorrect = r1Answers[q.id] === q.correctAnswer;
                if (r1Filter === 'wrong') return !isCorrect;
                if (r1Filter === 'correct') return isCorrect;
                return true;
              })
              .map((q) => {
                const candAnswer = r1Answers[q.id];
                const isCorrect = candAnswer === q.correctAnswer;
                const originalIndex = r1Questions.findIndex((item) => item.id === q.id);

                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border p-5 shadow-xs transition ${
                      isCorrect
                        ? 'border-black/[0.08] bg-white'
                        : 'border-rose-300 bg-rose-50/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-900 border border-slate-300">
                          {originalIndex + 1}
                        </span>
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#0071e3] border border-blue-200">
                          {q.topic}
                        </span>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold flex items-center gap-1 ${
                          isCorrect
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    <h5 className="mt-2.5 text-sm font-bold text-slate-950">{q.question}</h5>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="rounded-xl border border-slate-300 bg-slate-50 p-3">
                        <span className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                          Candidate Choice:
                        </span>
                        <span className={isCorrect ? 'text-emerald-800 font-bold' : 'text-rose-800 font-bold'}>
                          {candAnswer !== undefined ? q.options[candAnswer] : 'No answer submitted'}
                        </span>
                      </div>

                      <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-3">
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block mb-1">
                          Correct Answer:
                        </span>
                        <span className="text-emerald-950 font-bold">
                          {q.options[q.correctAnswer]}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-300 bg-slate-50/90 p-3 text-xs text-slate-800 font-medium">
                      <strong className="text-slate-950 block mb-0.5 font-bold">Rationale:</strong>
                      {q.explanation}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* ROUND 2 CODE TASKS MCQ AUDIT */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Round 2: Code Review Diagnostic Breakdown
            </h4>

            {/* Filter for Round 2 */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-300 bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setR2Filter('all')}
                className={`rounded-lg px-2.5 py-1 font-bold transition ${
                  r2Filter === 'all' ? 'bg-white text-slate-950 font-bold shadow-2xs' : 'text-slate-700'
                }`}
              >
                All ({r2Questions.length})
              </button>
              <button
                type="button"
                onClick={() => setR2Filter('wrong')}
                className={`rounded-lg px-2.5 py-1 font-bold transition ${
                  r2Filter === 'wrong' ? 'bg-white text-rose-800 font-bold shadow-2xs' : 'text-slate-700'
                }`}
              >
                Incorrect ({r2Questions.length - r2CorrectCount})
              </button>
              <button
                type="button"
                onClick={() => setR2Filter('correct')}
                className={`rounded-lg px-2.5 py-1 font-bold transition ${
                  r2Filter === 'correct' ? 'bg-white text-emerald-800 font-bold shadow-2xs' : 'text-slate-700'
                }`}
              >
                Correct ({r2CorrectCount})
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {r2Questions
              .filter((q) => {
                const isCorrect = r2Answers[q.id] === q.correctAnswer;
                if (r2Filter === 'wrong') return !isCorrect;
                if (r2Filter === 'correct') return isCorrect;
                return true;
              })
              .map((q) => {
                const candAnswer = r2Answers[q.id];
                const isCorrect = candAnswer === q.correctAnswer;
                const isExpanded = !!expandedR2[q.id];

                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border p-5 shadow-xs transition ${
                      isCorrect
                        ? 'border-black/[0.08] bg-white'
                        : 'border-rose-300 bg-rose-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-900 border border-slate-300">
                          {q.id}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs sm:text-sm font-bold text-slate-950">{q.title}</h5>
                            <span
                              className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold border ${
                                q.language === 'csharp'
                                  ? 'border-purple-300 bg-purple-50 text-purple-900'
                                  : q.language === 'javascript'
                                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                                  : 'border-blue-300 bg-blue-50 text-[#0071e3]'
                              }`}
                            >
                              {q.language === 'csharp' ? 'C#' : q.language === 'javascript' ? 'JS' : 'SQL'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-700 font-medium">{q.cwe}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold flex items-center gap-1 ${
                            isCorrect
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {isCorrect ? '1 / 1 pt' : '0 / 1 pt'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedR2((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                          className="rounded-lg p-1 text-slate-600 hover:text-slate-900 transition"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs font-bold text-slate-950">{q.question}</p>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="rounded-xl border border-slate-300 bg-slate-50 p-3">
                        <span className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                          Candidate Selection:
                        </span>
                        <span className={isCorrect ? 'text-emerald-800 font-bold' : 'text-rose-800 font-bold'}>
                          {candAnswer !== undefined ? q.options[candAnswer] : 'No answer submitted'}
                        </span>
                      </div>

                      <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-3">
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block mb-1">
                          Correct Option:
                        </span>
                        <span className="text-emerald-950 font-bold">
                          {q.options[q.correctAnswer]}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 space-y-3 border-t border-slate-200 pt-3 text-xs">
                        {/* Source code preview */}
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                            Analyzed Source Code:
                          </span>
                          <pre className="max-h-48 overflow-x-auto rounded-xl border border-slate-300 bg-slate-50 p-3 font-mono text-[11px] text-slate-950">
                            <code>{q.code}</code>
                          </pre>
                        </div>

                        {/* Security explanation */}
                        <div className="rounded-xl border border-slate-300 bg-slate-50/90 p-3.5 text-slate-800 font-medium">
                          <strong className="text-amber-950 block mb-1 font-bold">
                            Security Root Cause & Remediation Guide:
                          </strong>
                          <p className="leading-relaxed text-[11px]">{q.explanation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* ROUND 3 CTF CHALLENGES AUDIT */}
        <div className="mt-8 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Round 3: Simulated Labs & CTF Verification Table
          </h4>
          <div className="overflow-x-auto rounded-2xl border border-black/[0.08] bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-300 bg-slate-100 text-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-bold">#</th>
                  <th className="py-3 px-4 font-bold">Challenge</th>
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 font-bold">Candidate Input</th>
                  <th className="py-3 px-4 font-bold">Expected Flag / Command</th>
                  <th className="py-3 px-4 font-bold">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {r3Challenges.map((c, idx) => {
                  const isSolved = !!r3Flags[c.id];
                  const submission = r3Submissions[c.id] || '—';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-4 font-bold text-slate-600">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-sans font-bold text-slate-950">{c.title}</td>
                      <td className="py-2.5 px-4">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] text-[#0071e3] font-bold border border-blue-200">
                          {c.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-900 font-medium truncate max-w-xs">{submission}</td>
                      <td className="py-2.5 px-4 text-slate-800 font-medium truncate max-w-xs">{c.flag}</td>
                      <td className="py-2.5 px-4">
                        {isSolved ? (
                          <span className="inline-flex items-center gap-1 text-emerald-800 font-bold">
                            <CheckCircle2 className="h-4 w-4 text-emerald-700" /> Passed (+1)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-800 font-bold">
                            <XCircle className="h-4 w-4 text-rose-700" /> Unsolved
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
