import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CandidateInfo, MCQQuestion, Round2MCQQuestion, CTFChallenge } from '../types';

/**
 * Captures an HTML element (like the certificate) and downloads it as a high-resolution PDF.
 */
export async function downloadElementAsPDF(
  element: HTMLElement,
  filename: string,
  orientation: 'portrait' | 'landscape' = 'landscape'
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2.5, // High resolution for print clarity
    useCORS: true,
    logging: false,
    backgroundColor: '#090d16',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 10;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;

  let imgWidth = maxWidth;
  let imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight > maxHeight) {
    imgHeight = maxHeight;
    imgWidth = (canvas.width * imgHeight) / canvas.height;
  }

  const x = (pageWidth - imgWidth) / 2;
  const y = (pageHeight - imgHeight) / 2;

  pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
  pdf.save(filename);
}

/**
 * Generates a clean, multi-page vector PDF for the complete Assessment & Audit Report.
 */
export function generateAuditReportPDF(data: {
  candidate: CandidateInfo;
  r1Questions: MCQQuestion[];
  r1Answers: Record<number, number>;
  r1ScorePercent: number;
  r1TimeSpent: number;
  r2Questions: Round2MCQQuestion[];
  r2Answers: Record<number, number>;
  r2ScorePercent: number;
  r2TimeSpent: number;
  r3Challenges: CTFChallenge[];
  r3Flags: Record<string, boolean>;
  r3Submissions: Record<string, string>;
  r3ScorePercent: number;
  r3TimeSpent: number;
  allPassed: boolean;
  aggregatePercent: number;
}): void {
  const {
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
  } = data;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
      drawHeaderFooter();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const drawHeaderFooter = () => {
    pdf.setFontSize(8);
    pdf.setTextColor(140, 150, 170);
    pdf.text('SecResearch Board of Examiners · Official Audit Report', margin, 24);
    pdf.text(`Candidate ID: ${candidate.id}`, pageWidth - margin, 24, { align: 'right' });
    pdf.setDrawColor(220, 225, 235);
    pdf.line(margin, 28, pageWidth - margin, 28);
  };

  // Header banner
  pdf.setFillColor(15, 23, 42); // Slate 900
  pdf.rect(0, 0, pageWidth, 90, 'F');

  pdf.setFontSize(18);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('SECRESEARCH ENGINEER ASSESSMENT', margin, 42);

  pdf.setFontSize(10);
  pdf.setTextColor(56, 189, 248); // Cyan 400
  pdf.text('Comprehensive Technical Competency & Audit Diagnostic Log', margin, 60);

  pdf.setFontSize(9);
  pdf.setTextColor(148, 163, 184); // Slate 400
  pdf.text(`Issued: ${candidate.date}  |  Verification ID: ${candidate.id}`, margin, 76);

  y = 110;

  // Candidate Information Card
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, y, contentWidth, 72, 6, 6, 'FD');

  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'normal');
  pdf.text('CANDIDATE:', margin + 14, y + 20);
  pdf.text('EMAIL:', margin + 14, y + 36);
  pdf.text('ORGANIZATION:', margin + 14, y + 52);

  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.text(candidate.name, margin + 85, y + 20);
  pdf.text(candidate.email, margin + 85, y + 36);
  pdf.text(candidate.organization, margin + 85, y + 52);

  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'normal');
  pdf.text('TRACK:', margin + 270, y + 20);
  pdf.text('OVERALL STATUS:', margin + 270, y + 36);
  pdf.text('AGGREGATE:', margin + 270, y + 52);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(candidate.track, margin + 375, y + 20);

  if (allPassed) {
    pdf.setTextColor(16, 185, 129); // Emerald 500
    pdf.text('PASSED (QUALIFIED)', margin + 375, y + 36);
  } else {
    pdf.setTextColor(225, 29, 72); // Rose 600
    pdf.text('FAILED (BELOW 35%)', margin + 375, y + 36);
  }

  pdf.setTextColor(15, 23, 42);
  pdf.text(`${aggregatePercent}% Composite`, margin + 375, y + 52);

  y += 88;

  // 3-Round Summary Scoreboard
  const colWidth = (contentWidth - 16) / 3;

  // R1 box
  pdf.setFillColor(r1ScorePercent >= 35 ? 240 : 255, r1ScorePercent >= 35 ? 253 : 241, r1ScorePercent >= 35 ? 244 : 242);
  pdf.setDrawColor(r1ScorePercent >= 35 ? 167 : 254, r1ScorePercent >= 35 ? 243 : 205, r1ScorePercent >= 35 ? 208 : 211);
  pdf.roundedRect(margin, y, colWidth, 54, 4, 4, 'FD');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(71, 85, 105);
  pdf.text('ROUND 1: THEORY MCQ', margin + 10, y + 16);
  pdf.setFontSize(14);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`${r1ScorePercent}%`, margin + 10, y + 34);
  pdf.setFontSize(8);
  pdf.setTextColor(r1ScorePercent >= 35 ? 5 : 225, r1ScorePercent >= 35 ? 150 : 29, r1ScorePercent >= 35 ? 105 : 72);
  pdf.text(`${r1ScorePercent >= 35 ? 'PASS' : 'FAIL'} (Req: 35%)`, margin + 10, y + 46);

  // R2 box
  const r2X = margin + colWidth + 8;
  pdf.setFillColor(r2ScorePercent >= 35 ? 240 : 255, r2ScorePercent >= 35 ? 253 : 241, r2ScorePercent >= 35 ? 244 : 242);
  pdf.setDrawColor(r2ScorePercent >= 35 ? 167 : 254, r2ScorePercent >= 35 ? 243 : 205, r2ScorePercent >= 35 ? 208 : 211);
  pdf.roundedRect(r2X, y, colWidth, 54, 4, 4, 'FD');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(71, 85, 105);
  pdf.text('ROUND 2: CODE REVIEW MCQ', r2X + 10, y + 16);
  pdf.setFontSize(14);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`${r2ScorePercent}%`, r2X + 10, y + 34);
  pdf.setFontSize(8);
  pdf.setTextColor(r2ScorePercent >= 35 ? 5 : 225, r2ScorePercent >= 35 ? 150 : 29, r2ScorePercent >= 35 ? 105 : 72);
  pdf.text(`${r2ScorePercent >= 35 ? 'PASS' : 'FAIL'} (Req: 35%)`, r2X + 10, y + 46);

  // R3 box
  const r3X = margin + (colWidth + 8) * 2;
  pdf.setFillColor(r3ScorePercent >= 35 ? 240 : 255, r3ScorePercent >= 35 ? 253 : 241, r3ScorePercent >= 35 ? 244 : 242);
  pdf.setDrawColor(r3ScorePercent >= 35 ? 167 : 254, r3ScorePercent >= 35 ? 243 : 205, r3ScorePercent >= 35 ? 208 : 211);
  pdf.roundedRect(r3X, y, colWidth, 54, 4, 4, 'FD');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(71, 85, 105);
  pdf.text('ROUND 3: LABS & CTF', r3X + 10, y + 16);
  pdf.setFontSize(14);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`${r3ScorePercent}%`, r3X + 10, y + 34);
  pdf.setFontSize(8);
  pdf.setTextColor(r3ScorePercent >= 35 ? 5 : 225, r3ScorePercent >= 35 ? 150 : 29, r3ScorePercent >= 35 ? 105 : 72);
  pdf.text(`${r3ScorePercent >= 35 ? 'PASS' : 'FAIL'} (Req: 35%)`, r3X + 10, y + 46);

  y += 74;

  // SECTION: Round 1 Questions Table
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text('Round 1: Theory Examination Audit', margin, y);
  y += 12;

  r1Questions.forEach((q, idx) => {
    checkPageBreak(56);
    const candAnswer = r1Answers[q.id];
    const isCorrect = candAnswer === q.correctAnswer;

    pdf.setFillColor(isCorrect ? 248 : 254, isCorrect ? 250 : 242, isCorrect ? 252 : 242);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin, y, contentWidth, 50, 4, 4, 'FD');

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(isCorrect ? 16 : 225, isCorrect ? 185 : 29, isCorrect ? 129 : 72);
    pdf.text(isCorrect ? `[Q${idx + 1}] CORRECT` : `[Q${idx + 1}] INCORRECT`, margin + 8, y + 12);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    const splitQuestion = pdf.splitTextToSize(q.question, contentWidth - 100);
    pdf.text(splitQuestion[0] || '', margin + 80, y + 12);

    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text('Selected:', margin + 8, y + 24);
    pdf.setTextColor(isCorrect ? 15 : 225, isCorrect ? 23 : 29, isCorrect ? 42 : 72);
    const candText = candAnswer !== undefined ? q.options[candAnswer] : 'Unanswered';
    pdf.text(pdf.splitTextToSize(candText, contentWidth - 80)[0] || '', margin + 50, y + 24);

    pdf.setTextColor(100, 116, 139);
    pdf.text('Correct:', margin + 8, y + 36);
    pdf.setTextColor(16, 185, 129);
    pdf.text(pdf.splitTextToSize(q.options[q.correctAnswer], contentWidth - 80)[0] || '', margin + 50, y + 36);

    y += 56;
  });

  // SECTION: Round 2 Code Review Questions
  checkPageBreak(50);
  y += 10;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text('Round 2: Code Review & Vulnerability Analysis Audit', margin, y);
  y += 14;

  r2Questions.forEach((q, idx) => {
    checkPageBreak(60);
    const candAnswer = r2Answers[q.id];
    const isCorrect = candAnswer === q.correctAnswer;

    pdf.setFillColor(isCorrect ? 248 : 254, isCorrect ? 250 : 242, isCorrect ? 252 : 242);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin, y, contentWidth, 54, 4, 4, 'FD');

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(isCorrect ? 16 : 225, isCorrect ? 185 : 29, isCorrect ? 129 : 72);
    pdf.text(isCorrect ? `[Task ${idx + 1}] (${q.language.toUpperCase()}) PASS` : `[Task ${idx + 1}] (${q.language.toUpperCase()}) FAIL`, margin + 8, y + 12);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text(`${q.title} (${q.cwe})`, margin + 110, y + 12);

    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text('Candidate:', margin + 8, y + 26);
    pdf.setTextColor(isCorrect ? 15 : 225, isCorrect ? 23 : 29, isCorrect ? 42 : 72);
    const candText = candAnswer !== undefined ? q.options[candAnswer] : 'Unanswered';
    pdf.text(pdf.splitTextToSize(candText, contentWidth - 80)[0] || '', margin + 55, y + 26);

    pdf.setTextColor(100, 116, 139);
    pdf.text('Remedy:', margin + 8, y + 40);
    pdf.setTextColor(16, 185, 129);
    pdf.text(pdf.splitTextToSize(q.options[q.correctAnswer], contentWidth - 80)[0] || '', margin + 55, y + 40);

    y += 60;
  });

  // SECTION: Round 3 Labs
  checkPageBreak(50);
  y += 10;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text('Round 3: Practical Sandbox Labs Audit', margin, y);
  y += 14;

  r3Challenges.forEach((c, idx) => {
    checkPageBreak(38);
    const isSolved = !!r3Flags[c.id];

    pdf.setFillColor(isSolved ? 240 : 255, isSolved ? 253 : 241, isSolved ? 244 : 242);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin, y, contentWidth, 32, 4, 4, 'FD');

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(isSolved ? 16 : 225, isSolved ? 185 : 29, isSolved ? 129 : 72);
    pdf.text(isSolved ? `[Lab ${idx + 1}] SOLVED` : `[Lab ${idx + 1}] UNSOLVED`, margin + 8, y + 14);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text(`${c.title} (${c.category})`, margin + 95, y + 14);

    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Submission: ${r3Submissions[c.id] || 'None'}  |  Target Flag: ${c.flag}`, margin + 8, y + 25);

    y += 38;
  });

  const safeName = candidate.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  pdf.save(`SecResearch_Audit_Report_${safeName}.pdf`);
}
