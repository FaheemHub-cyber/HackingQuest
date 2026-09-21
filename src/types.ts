export type AssessmentTrack =
  | 'Web Application Security'
  | 'Cloud Security'
  | 'AI + Security'
  | 'SOC / Blue Team'
  | 'Penetration Testing';

export interface CandidateInfo {
  name: string;
  email: string;
  organization: string;
  track: AssessmentTrack;
  date: string;
  id: string;
}

export interface MCQQuestion {
  id: number;
  topic: 'Pentesting' | 'AI + SOC' | 'Threat Modeling' | 'Cloud' | 'Automation' | 'OSINT & Zero Trust';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Round1AnswerDetail {
  questionId: number;
  question: string;
  topic: string;
  chosenIndex: number;
  chosenText: string;
  correctIndex: number;
  correctText: string;
  isCorrect: boolean;
  explanation: string;
}

export interface Round2MCQQuestion {
  id: number;
  language: 'sql' | 'javascript' | 'csharp';
  topic: string;
  cwe: string;
  title: string;
  code: string;
  question: string;
  options: string[];
  correctAnswer: number;
  hint: string;
  hints?: string[];
  explanation: string;
}

export interface Round2AnswerDetail {
  questionId: number;
  title: string;
  language: 'sql' | 'javascript' | 'csharp';
  cwe: string;
  question: string;
  chosenIndex: number;
  chosenText: string;
  correctIndex: number;
  correctText: string;
  isCorrect: boolean;
  explanation: string;
}

export interface CodeTask {
  id: string;
  title: string;
  language: string;
  cwe: string;
  code: string;
  vulnSummary: string;
  exploitExample: string;
  patchCode: string;
  keywords: {
    vuln: string[];
    exploit: string[];
    patch: string[];
  };
  hint: string;
}

export interface Round2TaskAnswer {
  taskId: string;
  vuln: string;
  exploit: string;
  patch: string;
}

export interface Round2TaskDetail {
  taskId: string;
  title: string;
  vulnHit: boolean;
  vulnAnswer: string;
  vulnExpected: string;
  exploitHit: boolean;
  exploitAnswer: string;
  exploitExpected: string;
  patchHit: boolean;
  patchAnswer: string;
  patchExpected: string;
  points: number; // 0 to 3
}

export interface CTFChallenge {
  id: string;
  title: string;
  category: 'Linux' | 'Network' | 'Web XSS' | 'SQLi' | 'AI Prompt Injection' | 'OSINT' | 'JWT' | 'Cloud S3' | 'Crypto' | 'PrivEsc';
  desc: string;
  type: 'terminal' | 'xss_sandbox' | 'sqli_sandbox' | 'prompt_bot' | 'jwt_sandbox' | 'flag_input';
  flag: string;
  hint: string;
  hints?: string[];
  points: number;
}

export interface Round3ChallengeDetail {
  id: string;
  title: string;
  category: string;
  isSolved: boolean;
  points: number;
  expectedFlag: string;
  userSubmission: string;
}

export interface AssessmentState {
  candidate: CandidateInfo | null;
  currentStep: number; // 0: Register, 1: Round 1, 2: Round 2, 3: Round 3, 4: Report
  round1: {
    answers: Record<number, number>; // qId -> optionIndex
    score: number;
    total: number;
    passed: boolean;
    details: Round1AnswerDetail[];
    timeSpentSeconds: number;
  };
  round2: {
    answers: Record<number, number>; // qId -> optionIndex
    score: number;
    total: number;
    passed: boolean;
    details: Round2AnswerDetail[];
    timeSpentSeconds: number;
  };
  round3: {
    flags: Record<string, boolean>;
    submissions: Record<string, string>;
    score: number;
    total: number;
    passed: boolean;
    details: Round3ChallengeDetail[];
    timeSpentSeconds: number;
  };
  overallPassed: boolean;
}
