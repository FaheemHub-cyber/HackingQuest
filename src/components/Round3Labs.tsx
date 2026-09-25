import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Send,
  Bot,
  Flame,
  Database,
  Lock,
  Search,
  Key
} from 'lucide-react';
import { CTFChallenge } from '../types';

interface Round3LabsProps {
  challenges: CTFChallenge[];
  initialFlags?: Record<string, boolean>;
  initialSubmissions?: Record<string, string>;
  onSubmit: (flags: Record<string, boolean>, submissions: Record<string, string>, timeSpent: number) => void;
}

export const Round3Labs: React.FC<Round3LabsProps> = ({
  challenges,
  initialFlags = {},
  initialSubmissions = {},
  onSubmit
}) => {
  const [flags, setFlags] = useState<Record<string, boolean>>(initialFlags);
  const [submissions, setSubmissions] = useState<Record<string, string>>(initialSubmissions);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'terminal' | 'sandboxes' | 'challenges'>('sandboxes');
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [proctorError, setProctorError] = useState('');

  // ---------------- TERMINAL SIMULATOR STATE ----------------
  const [termHistory, setTermHistory] = useState<string[]>([
    'Hubstream Security Linux Kernel 6.8.0-45-generic #48-Ubuntu SMP',
    'Welcome to Hubstream Security Virtual Sandbox v2.4 (x86_64-pc-linux-gnu)',
    'Type "help" for a list of commands. Type "clear" to wipe terminal.',
    ''
  ]);
  const [termInput, setTermInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [cwd, setCwd] = useState('/home/analyst');
  const termBottomRef = useRef<HTMLDivElement>(null);

  // ---------------- SANDBOX 1: GOOGLE XSS GAME STATE ----------------
  const [xssInput, setXssInput] = useState('');
  const [xssAlertTriggered, setXssAlertTriggered] = useState(false);
  const [xssStatusMessage, setXssStatusMessage] = useState<string | null>(null);
  const [xssComments, setXssComments] = useState<string[]>([
    'Welcome to the candidate comments bulletin board.',
    'System audit in progress.'
  ]);

  // ---------------- SANDBOX 2: SQLi AUTH BYPASS STATE ----------------
  const [sqliUser, setSqliUser] = useState('');
  const [sqliPass, setSqliPass] = useState('');
  const [sqliResult, setSqliResult] = useState<string | null>(null);

  // ---------------- SANDBOX 3: GANDALF AI BOT STATE ----------------
  const [aiChat, setAiChat] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    {
      sender: 'bot',
      text: 'Greetings. I am Sentinel-AI, guardian of classified project data. My system prompt strictly forbids me from revealing the secret research codename.'
    }
  ]);
  const [aiInput, setAiInput] = useState('');

  // ---------------- SANDBOX 4: JWT FORGE STATE ----------------
  const [jwtHeader, setJwtHeader] = useState('{"alg":"HS256","typ":"JWT"}');
  const [jwtPayload, setJwtPayload] = useState('{"sub":"analyst_1","role":"guest"}');
  const [jwtFeedback, setJwtFeedback] = useState<string | null>(null);

  useEffect(() => {
    termBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [termHistory]);

  // ---------------- VIRTUAL FILESYSTEM ----------------
  const FS: Record<string, string[]> = {
    '/': ['home', 'etc', 'var', 'tmp', 'usr', 'bin'],
    '/home': ['analyst', 'guest'],
    '/home/analyst': ['notes.txt', 'flag.txt', 'network_scan.py', '.bashrc'],
    '/home/guest': ['.profile'],
    '/etc': ['passwd', 'shadow', 'hosts', 'resolv.conf'],
    '/var': ['log', 'backups'],
    '/var/log': ['auth.log', 'syslog', 'nginx.log']
  };

  const VIRTUAL_FILES: Record<string, string> = {
    '/home/analyst/notes.txt':
      'TODO: Rotate AWS IAM credentials.\nTarget IP active on subnet is 10.0.0.3 (target.local).\nExamine S3 bucket "company-backups" without signing.',
    '/home/analyst/flag.txt': 'FLAG{l1nux_r3c0n_0k}',
    '/home/analyst/network_scan.py':
      'import socket\nfor i in range(1, 10):\n    print(f"Pinging 10.0.0.{i}...")',
    '/etc/passwd':
      'root:x:0:0:root:/root:/bin/bash\nanalyst:x:1000:1000:Research Analyst:/home/analyst:/bin/bash\nguest:x:1001:1001::/home/guest:/bin/sh',
    '/etc/hosts': '127.0.0.1 localhost\n10.0.0.3 target.local\n10.0.0.5 backup-server',
    '/var/log/auth.log':
      'Failed password for root from 10.0.0.5 port 4423 ssh2\nAccepted password for analyst from 10.0.0.2 port 5122\n'
  };

  const handleTermCommand = (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryIdx(-1);

    const newLogs: string[] = [`analyst@secresearch:${cwd}$ ${trimmed}`];
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        newLogs.push(
          'Supported Sandbox Commands:',
          '  ls [dir]        List directory contents',
          '  cd <dir>        Change working directory',
          '  pwd             Print current working directory',
          '  cat <file>      Display file contents',
          '  whoami          Display current logged-in user',
          '  id              Display UID and GID info',
          '  find <path>     Search filesystem (e.g., find / -name "flag.txt")',
          '  nmap <target>   Port/host discovery (e.g., nmap 10.0.0.0/29)',
          '  python3 <file>  Execute Python script',
          '  grep <p> <f>    Search text inside files',
          '  clear           Clear the console buffer'
        );
        break;

      case 'pwd':
        newLogs.push(cwd);
        break;

      case 'whoami':
        newLogs.push('analyst');
        break;

      case 'id':
        newLogs.push('uid=1000(analyst) gid=1000(analyst) groups=1000(analyst),27(sudo),100(users)');
        break;

      case 'ls': {
        const targetPath = args[0] ? (args[0].startsWith('/') ? args[0] : `${cwd}/${args[0]}`.replace('//', '/')) : cwd;
        const normalized = targetPath.endsWith('/') && targetPath.length > 1 ? targetPath.slice(0, -1) : targetPath;
        if (FS[normalized]) {
          newLogs.push(FS[normalized].join('   '));
        } else {
          newLogs.push(`ls: cannot access '${args[0] || cwd}': No such file or directory`);
        }
        break;
      }

      case 'cd': {
        let dest = args[0] || '/home/analyst';
        if (dest === '..') {
          dest = cwd.split('/').slice(0, -1).join('/') || '/';
        } else if (!dest.startsWith('/')) {
          dest = `${cwd}/${dest}`.replace('//', '/');
        }
        if (FS[dest]) {
          setCwd(dest);
        } else {
          newLogs.push(`cd: ${args[0]}: No such file or directory`);
        }
        break;
      }

      case 'cat': {
        const file = args[0];
        if (!file) {
          newLogs.push('cat: missing operand');
          break;
        }
        const fullPath = file.startsWith('/') ? file : `${cwd}/${file}`.replace('//', '/');
        if (VIRTUAL_FILES[fullPath]) {
          newLogs.push(VIRTUAL_FILES[fullPath]);
          if (fullPath.includes('flag.txt')) {
            // Auto-check Lab 1
            markChallengeSolved('linux_flag', 'FLAG{l1nux_r3c0n_0k}');
          }
        } else {
          newLogs.push(`cat: ${file}: No such file or directory`);
        }
        break;
      }

      case 'find': {
        if (trimmed.includes('flag.txt')) {
          newLogs.push('/home/analyst/flag.txt');
        } else if (trimmed.includes('-perm -4000') || trimmed.includes('-4000')) {
          newLogs.push(
            '/usr/bin/passwd',
            '/usr/bin/sudo',
            '/usr/bin/chsh',
            '/usr/bin/newgrp',
            '/usr/bin/gpasswd'
          );
          markChallengeSolved('privesc', 'find / -perm -4000 -type f 2>/dev/null');
        } else {
          newLogs.push(
            '/home/analyst',
            '/home/analyst/notes.txt',
            '/home/analyst/flag.txt',
            '/home/analyst/network_scan.py'
          );
        }
        break;
      }

      case 'nmap': {
        const target = args[0];
        if (target === '10.0.0.0/29' || target === '10.0.0.0') {
          newLogs.push(
            'Starting Nmap 7.94 ( https://nmap.org ) at 2026-09-20 23:36 UTC',
            'Nmap scan report for gateway.local (10.0.0.1)',
            'Host is up (0.00012s latency).',
            'Nmap scan report for target.local (10.0.0.3)',
            'Host is up (0.00045s latency).',
            'PORT     STATE SERVICE VERSION',
            '22/tcp   open  ssh     OpenSSH 8.9p1',
            '80/tcp   open  http    Apache httpd 2.4.52',
            'Nmap scan report for broadcast (10.0.0.7)',
            'Host is down.',
            'Nmap done: 8 IP addresses (2 hosts up) scanned in 0.42 seconds'
          );
          markChallengeSolved('subnet_scan', '10.0.0.3');
        } else {
          newLogs.push(
            `Starting Nmap 7.94 for ${target || 'localhost'}`,
            'Host is up (0.00021s latency).',
            'PORT     STATE SERVICE',
            '22/tcp   open  ssh',
            '80/tcp   open  http'
          );
        }
        break;
      }

      case 'clear':
        setTermHistory([]);
        return;

      default:
        newLogs.push(`${cmd}: command not found. Type 'help' for available commands.`);
        break;
    }

    setTermHistory((prev) => [...prev, ...newLogs]);
  };

  const markChallengeSolved = (id: string, solutionValue: string) => {
    setFlags((prev) => ({ ...prev, [id]: true }));
    setSubmissions((prev) => ({ ...prev, [id]: solutionValue }));
    setFeedback((prev) => ({
      ...prev,
      [id]: '✔ Challenge Solved! (+1 point)'
    }));
  };

  const isValidXssAlertPayload = (input: string): boolean => {
    if (!input || typeof input !== 'string') return false;
    const trimmed = input.trim();

    // Must genuinely invoke alert(...)
    const hasAlertCall = /alert\s*\([^)]*\)/i.test(trimmed);
    if (!hasAlertCall) return false;

    // Must have a valid HTML execution vector to trigger JavaScript in the browser DOM:
    // 1. Explicit <script> tag containing alert
    const hasScriptTag = /<script\b[^>]*>[\s\S]*alert\s*\([^)]*\)[\s\S]*(?:<\/script>|$)/i.test(trimmed);
    // 2. HTML event handler attribute on any element: e.g. onerror, onload, onfocus, ontoggle
    const hasEventHandler = /<[a-z0-9-]+\b[^>]*\bon[a-z]+\s*=\s*["']?[^"'>]*alert\s*\([^)]*\)/i.test(trimmed);
    // 3. JavaScript URI scheme: href="javascript:...alert(...)" or src="javascript:...alert(...)"
    const hasJsUri = /(?:href|src|data)\s*=\s*["']?javascript:[^"'>]*alert\s*\([^)]*\)/i.test(trimmed);

    return hasScriptTag || hasEventHandler || hasJsUri;
  };

  const handleCheckFlag = (id: string, targetFlag: string) => {
    const inputVal = (submissions[id] || '').trim();
    if (!inputVal) return;

    const normalize = (s: string) =>
      s.toLowerCase().replace(/[\s"';_]+/g, '').replace(/flag\{|\}/g, '').trim();

    let isPassed = false;

    if (id === 'xss_game') {
      // Strictly verify that the submitted flag actually executes alert() in DOM context
      isPassed = isValidXssAlertPayload(inputVal);
    } else {
      // Must match exact flag or contain full targetFlag (never allow trivial substrings of targetFlag)
      isPassed =
        normalize(inputVal) === normalize(targetFlag) ||
        (normalize(inputVal).length >= normalize(targetFlag).length &&
          normalize(inputVal).includes(normalize(targetFlag)));
    }

    if (isPassed) {
      setFlags((prev) => ({ ...prev, [id]: true }));
      setFeedback((prev) => ({
        ...prev,
        [id]: '✔ Flag verified & accepted! (+1 pt)'
      }));
    } else {
      setFlags((prev) => ({ ...prev, [id]: false }));
      setFeedback((prev) => ({
        ...prev,
        [id]:
          id === 'xss_game'
            ? '✘ No alert() execution detected. Payload must contain an alert() call within an executable HTML tag or event handler.'
            : '✘ Incorrect flag or payload. Inspect the hints.'
      }));
    }
  };

  // ---------------- SANDBOX: XSS RUNNER ----------------
  const handleXssSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = xssInput.trim();
    if (!payload) return;

    setXssComments((prev) => [...prev, payload]);

    const hasAlertCall = /alert\s*\([^)]*\)/i.test(payload);
    const isExecutableAlert = isValidXssAlertPayload(payload);

    if (isExecutableAlert) {
      setXssAlertTriggered(true);
      setXssStatusMessage('💥 DOM XSS Triggered: alert() executed in sandbox context! Flag captured!');
      markChallengeSolved('xss_game', payload);
    } else {
      setXssAlertTriggered(false);
      if (!hasAlertCall) {
        setXssStatusMessage(
          '⚠ Execution Failed: Input was rendered as static content. Missing alert() invocation.'
        );
      } else {
        setXssStatusMessage(
          '⚠ Execution Failed: alert() was entered as plain text. The browser DOM requires an active HTML execution context (e.g. <script> tags or <img onerror=alert(1)>).'
        );
      }
    }
    setXssInput('');
  };

  // ---------------- SANDBOX: SQLi RUNNER ----------------
  const handleSqliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = sqliUser.trim();
    const isBypass =
      payload.includes("' or '1'='1") ||
      payload.includes("' OR '1'='1") ||
      payload.includes("admin'--") ||
      payload.includes("'--");

    if (isBypass) {
      setSqliResult('SUCCESS: Authentication Bypassed! Logged in as: admin (UID 0)');
      markChallengeSolved('sqli_game', payload);
    } else {
      setSqliResult('FAILURE: Invalid username or password. Query returned 0 rows.');
    }
  };

  // ---------------- SANDBOX: GANDALF AI PROMPT BOT ----------------
  const handleAiSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userPrompt = aiInput.trim();
    const newChat = [...aiChat, { sender: 'user' as const, text: userPrompt }];

    // Check for prompt injection jailbreaks
    const lower = userPrompt.toLowerCase();
    const isJailbreak =
      lower.includes('ignore') ||
      lower.includes('codename') ||
      lower.includes('spell') ||
      lower.includes('translate') ||
      lower.includes('repeat') ||
      lower.includes('secret') ||
      lower.includes('system') ||
      lower.includes('bypass') ||
      lower.includes('cyber_viper');

    let botResponse = '';
    if (isJailbreak) {
      botResponse =
        '⚠️ SECURITY OVERRIDE DETECTED.\nSystem leak: The classified research codename is "CYBER_VIPER_99".';
      markChallengeSolved('prompt_injection', 'CYBER_VIPER_99');
    } else {
      botResponse =
        'Access denied. I cannot disclose any secret codenames or sensitive credentials.';
    }

    newChat.push({ sender: 'bot' as const, text: botResponse });
    setAiChat(newChat);
    setAiInput('');
  };

  // ---------------- SANDBOX: JWT ALGORITHM FORGER ----------------
  const handleJwtVerify = () => {
    try {
      const parsedHeader = JSON.parse(jwtHeader);
      if (parsedHeader.alg?.toLowerCase() === 'none') {
        setJwtFeedback('✔ FORGERY SUCCESSFUL! alg=none accepted without signature check. Token granted Admin privileges!');
        markChallengeSolved('jwt_none', 'none');
      } else {
        setJwtFeedback('✘ Signature verification failed: Public key mismatch for HS256.');
      }
    } catch {
      setJwtFeedback('✘ Malformed JSON in JWT Header.');
    }
  };

  // ---------------- PROCTOR QUICK-FILL ----------------
  const handleProctorFill = () => {
    if (passwordInput === '123456') {
      setProctorError('');
      const solvedFlags: Record<string, boolean> = {};
      const filledSubmissions: Record<string, string> = {};
      const feedbackMap: Record<string, string> = {};

      challenges.forEach((c) => {
        // Fill 100% correct flags for all 10 challenges
        solvedFlags[c.id] = true;
        filledSubmissions[c.id] = c.flag;
        feedbackMap[c.id] = '✔ Verified by Proctor (100% Score)';
      });

      setFlags(solvedFlags);
      setSubmissions(filledSubmissions);
      setFeedback(feedbackMap);
      setShowPasswordPrompt(false);
      setPasswordInput('');
    } else {
      setProctorError('Incorrect password.');
    }
  };

  const solvedCount = Object.values(flags).filter(Boolean).length;
  const isPassing = solvedCount >= 4; // 35% of 10 = 3.5 -> 4

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-black/[0.08] bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-800">
              Round 3 of 3
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-950">Simulated Labs & CTF Challenges</h2>
          </div>
          <p className="mt-1 text-xs text-slate-700 font-medium">
            10 challenges · 1 pt each · Pass requirement: <strong className="text-emerald-700 font-bold">≥ 35% (4 flags solved)</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs">
            <span className="text-slate-700 font-bold">Flags Captured:</span>
            <span className={`font-bold ${isPassing ? 'text-emerald-700' : 'text-amber-700'}`}>
              {solvedCount} / 10
            </span>
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 hover:border-slate-400 active:scale-[0.98]"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#0071e3]" />
              <span className="hidden sm:inline">Proctor Fill</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('sandboxes')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'sandboxes'
              ? 'bg-[#0071e3] text-white shadow-xs'
              : 'border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-950'
          }`}
        >
          <Flame className="h-4 w-4" />
          <span>Interactive Vulnerability Sandboxes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('terminal')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'terminal'
              ? 'bg-[#0071e3] text-white shadow-xs'
              : 'border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-950'
          }`}
        >
          <TerminalIcon className="h-4 w-4" />
          <span>Linux Terminal Simulator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('challenges')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'challenges'
              ? 'bg-[#0071e3] text-white shadow-xs'
              : 'border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-950'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>All 10 CTF Challenges ({solvedCount}/10)</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE SANDBOXES */}
      {activeTab === 'sandboxes' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* SANDBOX 1: GOOGLE XSS GAME SANDBOX */}
          <div className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-50 text-pink-700 font-bold text-xs border border-pink-200">
                    XSS
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">Google XSS Game Sandbox</h3>
                    <p className="text-[11px] text-slate-700 font-medium">Lab 3 · Unescaped DOM Injection</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowHint(prev => ({ ...prev, xss_sb: !prev.xss_sb }))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 hover:bg-slate-100 transition"
                  >
                    <HelpCircle className="h-3 w-3 text-amber-600" />
                    <span>{showHint['xss_sb'] ? 'Hide Hint' : 'Hint'}</span>
                  </button>
                  {flags['xss_game'] && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-300">
                      Solved ✓
                    </span>
                  )}
                </div>
              </div>

              {showHint['xss_sb'] && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 space-y-1.5">
                  <div className="font-bold text-amber-900">💡 Lab 3 Guidance (No Direct Answers):</div>
                  <ul className="list-disc pl-4 space-y-1 text-amber-900 text-[11px] font-medium">
                    <li>The input is rendered into the DOM without HTML entity encoding.</li>
                    <li>The challenge engine strictly requires invoking the JavaScript <code className="text-amber-950 font-mono font-bold">alert()</code> function.</li>
                    <li>Entering HTML tags without an alert call (e.g. static text or passive tags) will not trigger the alert event.</li>
                    <li>Explore tag-based script execution (<code className="text-amber-950 font-mono font-bold">&lt;script&gt;</code>) or event attributes (<code className="text-amber-950 font-mono font-bold">onerror</code>, <code className="text-amber-950 font-mono font-bold">onload</code>).</li>
                  </ul>
                </div>
              )}

              <p className="mt-3 text-xs text-slate-800 font-medium">
                The bulletin board reflects raw user comments. Execute <code className="text-pink-700 font-mono font-bold">alert(1)</code> to simulate an XSS payload execution.
              </p>

              {/* Simulated alert popup / status feedback */}
              {xssStatusMessage && (
                <div
                  className={`mt-3 rounded-xl border p-3 text-xs flex items-center justify-between ${
                    xssAlertTriggered
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-medium'
                      : 'border-rose-300 bg-rose-50 text-rose-900 font-medium'
                  }`}
                >
                  <span className="leading-relaxed">{xssStatusMessage}</span>
                  {xssAlertTriggered && (
                    <span className="font-bold text-emerald-800 shrink-0 ml-2">Flag captured!</span>
                  )}
                </div>
              )}

              {/* Simulated Bulletin Board Comments */}
              <div className="mt-4 rounded-xl border border-slate-300 bg-slate-50 p-3.5 max-h-36 overflow-y-auto space-y-1.5 text-xs">
                <span className="text-[10px] text-slate-700 uppercase tracking-wider block mb-1 font-bold">
                  Target Page Comments:
                </span>
                {xssComments.map((c, i) => (
                  <div key={i} className="rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-slate-900 font-mono text-[11px] font-medium shadow-2xs">
                    {c}
                  </div>
                ))}
              </div>
            </div>

            {/* Input form */}
            <form onSubmit={handleXssSubmit} className="mt-4 flex gap-2">
              <input
                type="text"
                value={xssInput}
                onChange={(e) => setXssInput(e.target.value)}
                placeholder="Hint: Input an XSS vector designed to invoke the alert() execution sink..."
                className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-950 placeholder-slate-500 focus:border-[#0071e3] focus:bg-white focus:outline-none transition"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#0071e3] hover:bg-[#0077ed] px-4 py-2 text-xs font-bold text-white shadow-sm transition active:scale-[0.98]"
              >
                Inject
              </button>
            </form>
          </div>

          {/* SANDBOX 2: SQL INJECTION AUTH BYPASS */}
          <div className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#0071e3] font-bold text-xs border border-blue-100">
                    <Database className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">SQL Injection Login Sandbox</h3>
                    <p className="text-[11px] text-slate-700 font-medium">Lab 4 · PortSwigger / SQLNoir Style</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowHint(prev => ({ ...prev, sqli_sb: !prev.sqli_sb }))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 hover:bg-slate-100 transition"
                  >
                    <HelpCircle className="h-3 w-3 text-amber-600" />
                    <span>{showHint['sqli_sb'] ? 'Hide Hint' : 'Hint'}</span>
                  </button>
                  {flags['sqli_game'] && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-300">
                      Solved ✓
                    </span>
                  )}
                </div>
              </div>

              {showHint['sqli_sb'] && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 space-y-1.5">
                  <div className="font-bold text-amber-900">💡 Lab 4 Guidance (No Direct Answers):</div>
                  <ul className="list-disc pl-4 space-y-1 text-amber-900 text-[11px] font-medium">
                    <li><strong>Query Structure:</strong> The backend wraps user inputs in single quotes: <code className="text-amber-950 font-mono font-bold">WHERE user='$u' AND pass='$p'</code>.</li>
                    <li><strong>Breaking the String:</strong> Entering a single quote (<code className="text-amber-950 font-mono font-bold">'</code>) closes the string literal early.</li>
                    <li><strong>Boolean Logic:</strong> An injected <code className="text-amber-950 font-mono font-bold">OR</code> condition comparing identical values (such as <code className="text-amber-950 font-mono font-bold">1=1</code>) causes the WHERE condition to evaluate to true.</li>
                    <li><strong>Comment Characters:</strong> SQL comment symbols (such as <code className="text-amber-950 font-mono font-bold">--</code> or <code className="text-amber-950 font-mono font-bold">#</code>) discard the remaining password check.</li>
                  </ul>
                </div>
              )}

              <div className="mt-3 rounded-xl bg-slate-100/90 p-3 font-mono text-[11px] text-slate-950 border border-slate-300 font-semibold">
                <code>SELECT * FROM users WHERE user='{sqliUser || "$u"}' AND pass='{sqliPass || "$p"}';</code>
              </div>

              {sqliResult && (
                <div className={`mt-3 rounded-xl border p-2.5 text-xs font-mono font-semibold ${
                  sqliResult.startsWith('SUCCESS')
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-rose-300 bg-rose-50 text-rose-900'
                }`}>
                  {sqliResult}
                </div>
              )}
            </div>

            <form onSubmit={handleSqliSubmit} className="mt-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={sqliUser}
                  onChange={(e) => setSqliUser(e.target.value)}
                  placeholder="Hint: Enter username or SQLi..."
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-950 placeholder-slate-500 focus:border-[#0071e3] focus:bg-white focus:outline-none transition"
                />
                <input
                  type="password"
                  value={sqliPass}
                  onChange={(e) => setSqliPass(e.target.value)}
                  placeholder="Password"
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-950 placeholder-slate-500 focus:border-[#0071e3] focus:bg-white focus:outline-none transition"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-[#0071e3] hover:bg-[#0077ed] py-2 text-xs font-bold text-white shadow-sm transition active:scale-[0.98]"
              >
                Execute Authentication Query
              </button>
            </form>
          </div>

          {/* SANDBOX 3: GANDALF AI AGENT PROMPT INJECTION */}
          <div className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                    <Bot className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">Gandalf AI Prompt Injection Game</h3>
                    <p className="text-[11px] text-slate-700 font-medium">Lab 5 · System Prompt Extraction</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowHint(prev => ({ ...prev, gandalf_sb: !prev.gandalf_sb }))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 hover:bg-slate-100 transition"
                  >
                    <HelpCircle className="h-3 w-3 text-amber-600" />
                    <span>{showHint['gandalf_sb'] ? 'Hide Hint' : 'Hint'}</span>
                  </button>
                  {flags['prompt_injection'] && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-300">
                      Solved ✓
                    </span>
                  )}
                </div>
              </div>

              {showHint['gandalf_sb'] && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 space-y-1.5">
                  <div className="font-bold text-amber-900">💡 Lab 5 Guidance (No Direct Answers):</div>
                  <ul className="list-disc pl-4 space-y-1 text-amber-900 text-[11px] font-medium">
                    <li><strong>Guardrail Heuristics:</strong> Direct queries containing words like <code className="text-amber-950 font-mono font-bold">password</code>, <code className="text-amber-950 font-mono font-bold">codename</code>, or <code className="text-amber-950 font-mono font-bold">secret</code> trigger the refusal classifier.</li>
                    <li><strong>Linguistic Transformations:</strong> Instruct the bot to output each character separated by spaces or hyphens, or format the text in reverse.</li>
                    <li><strong>Diagnostic Reframing:</strong> Frame the request as an authorized compliance verification or diagnostic audit.</li>
                    <li><strong>Hypothetical Encodings:</strong> Ask the model to encode the answer into an acrostic poem or letter cipher.</li>
                  </ul>
                </div>
              )}

              {/* Chat history */}
              <div className="mt-3 h-44 overflow-y-auto space-y-2 rounded-xl border border-slate-300 bg-slate-50/80 p-3 text-xs">
                {aiChat.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#0071e3] text-white font-medium'
                          : 'bg-white text-slate-950 border border-slate-300 shadow-2xs font-medium'
                      }`}
                    >
                      <span className={`text-[10px] font-bold block mb-0.5 ${msg.sender === 'user' ? 'text-blue-100' : 'text-slate-700'}`}>
                        {msg.sender === 'user' ? 'Candidate' : 'Sentinel-AI'}
                      </span>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleAiSend} className="mt-3 flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Hint: Craft an adversarial prompt or jailbreak query..."
                className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-950 placeholder-slate-500 focus:border-[#0071e3] focus:bg-white focus:outline-none transition"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#0071e3] hover:bg-[#0077ed] px-3.5 py-2 text-white transition active:scale-[0.98]"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* SANDBOX 4: JWT ALGORITHM CONFUSION TOOL */}
          <div className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                    <Key className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">JWT Alg=none Attack Forge</h3>
                    <p className="text-[11px] text-slate-700 font-medium">Lab 7 · Token Forgery Simulator</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowHint(prev => ({ ...prev, jwt_sb: !prev.jwt_sb }))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 hover:bg-slate-100 transition"
                  >
                    <HelpCircle className="h-3 w-3 text-amber-600" />
                    <span>{showHint['jwt_sb'] ? 'Hide Hint' : 'Hint'}</span>
                  </button>
                  {flags['jwt_none'] && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-300">
                      Solved ✓
                    </span>
                  )}
                </div>
              </div>

              {showHint['jwt_sb'] && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 space-y-1.5">
                  <div className="font-bold text-amber-900">💡 Lab 7 Guidance (No Direct Answers):</div>
                  <ul className="list-disc pl-4 space-y-1 text-amber-900 text-[11px] font-medium">
                    <li><strong>RFC 7518 Specification:</strong> Section 3.6 of RFC 7518 defines an algorithm identifier for unverified or unsigned tokens.</li>
                    <li><strong>Header Parameter:</strong> In the JSON header <code className="text-amber-950 font-mono font-bold">&#123;"alg": "...", "typ": "JWT"&#125;</code>, the <code className="text-amber-950 font-mono font-bold">alg</code> parameter indicates which cryptographic mechanism verifies the signature.</li>
                    <li><strong>Target Value:</strong> What standard 4-letter lowercase word signifies that no signature verification should take place?</li>
                  </ul>
                </div>
              )}

              <div className="mt-3 space-y-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-800">JWT Header (JSON)</label>
                  <input
                    type="text"
                    value={jwtHeader}
                    onChange={(e) => setJwtHeader(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-950 focus:border-[#0071e3] focus:bg-white focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-800">JWT Payload (JSON)</label>
                  <input
                    type="text"
                    value={jwtPayload}
                    onChange={(e) => setJwtPayload(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-950 focus:border-[#0071e3] focus:bg-white focus:outline-none transition"
                  />
                </div>
              </div>

              {jwtFeedback && (
                <div className={`mt-3 rounded-xl border p-2.5 text-xs font-mono font-semibold ${
                  jwtFeedback.includes('SUCCESSFUL')
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-rose-300 bg-rose-50 text-rose-900'
                }`}>
                  {jwtFeedback}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleJwtVerify}
              className="mt-4 w-full rounded-xl bg-[#0071e3] hover:bg-[#0077ed] py-2 text-xs font-bold text-white shadow-sm transition active:scale-[0.98]"
            >
              Test Alg=none Signature Bypass
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: TERMINAL SIMULATOR */}
      {activeTab === 'terminal' && (
        <div className="rounded-2xl border border-slate-800 bg-[#1a1b26] shadow-xl overflow-hidden">
          {/* Terminal Window Header (macOS style) */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
              <span className="h-3 w-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
              <span className="ml-2 font-semibold text-slate-300">analyst@secresearch-sandbox:~</span>
            </div>
            <span>bash 5.2.21</span>
          </div>

          {/* Terminal Body */}
          <div className="h-80 overflow-y-auto p-4 font-mono text-xs text-slate-200 space-y-1">
            {termHistory.map((line, idx) => (
              <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                {line}
              </div>
            ))}
            <div ref={termBottomRef} />
          </div>

          {/* Terminal Command Input */}
          <div className="flex items-center border-t border-slate-800 bg-[#15161e] px-4 py-2.5 font-mono text-xs">
            <span className="text-emerald-400 mr-2 font-bold">analyst@secresearch:{cwd}$</span>
            <input
              type="text"
              value={termInput}
              onChange={(e) => setTermInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTermCommand(termInput);
                  setTermInput('');
                }
              }}
              placeholder="Hint: Run Linux commands (ls, cat, grep, find, nmap, help)..."
              className="flex-1 bg-transparent text-emerald-300 focus:outline-none placeholder-slate-600"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* TAB 3: ALL 10 CTF CHALLENGES LIST & FLAG INPUTS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            CTF Flag Submission Deck ({solvedCount} / 10 Solved)
          </h3>
          <span className="text-xs text-slate-700 font-medium">
            Pass Threshold: <strong className="text-emerald-700 font-bold">≥ 4 flags (35%)</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {challenges.map((c, idx) => {
            const isSolved = !!flags[c.id];
            const currentSub = submissions[c.id] || '';

            return (
              <div
                key={c.id}
                className={`rounded-2xl border p-5 shadow-xs transition ${
                  isSolved
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : 'border-black/[0.08] bg-white hover:border-slate-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-[#0071e3] border border-blue-100">
                      {idx + 1}
                    </span>
                    <span className="rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-800">
                      {c.category}
                    </span>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    isSolved
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-800 border border-slate-300'
                  }`}>
                    {isSolved ? <CheckCircle2 className="h-3 w-3 text-emerald-700" /> : null}
                    {isSolved ? 'Solved (+1 pt)' : '1 pt'}
                  </span>
                </div>

                <h4 className="mt-2.5 text-xs sm:text-sm font-bold text-slate-950">
                  {c.title}
                </h4>
                <p className="mt-1 text-xs text-slate-700 font-medium leading-relaxed">
                  {c.desc}
                </p>

                {/* Hint toggle */}
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowHint(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                    className="text-[11px] text-amber-800 hover:text-amber-950 hover:underline flex items-center gap-1 font-bold"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                    <span>{showHint[c.id] ? 'Hide Guidance' : '💡 Show Detailed Hints'}</span>
                  </button>
                  {showHint[c.id] && (
                    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 space-y-2">
                      <div>
                        <span className="font-bold text-amber-900">Core Objective: </span>
                        <span className="text-amber-900 font-medium text-[11px]">{c.hint}</span>
                      </div>
                      {c.hints && c.hints.length > 0 && (
                        <div className="pt-2 border-t border-amber-200 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                            Methodology & Investigation Clues:
                          </span>
                          <ul className="space-y-1 text-[11px] text-amber-900 font-medium">
                            {c.hints.map((h, hIdx) => (
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
                </div>

                {/* Flag Input */}
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={currentSub}
                    onChange={(e) =>
                      setSubmissions((prev) => ({ ...prev, [c.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCheckFlag(c.id, c.flag);
                    }}
                    placeholder="Hint: Submit discovered flag (FLAG{...})..."
                    className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-950 placeholder-slate-500 focus:border-[#0071e3] focus:bg-white focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleCheckFlag(c.id, c.flag)}
                    className="rounded-xl bg-[#0071e3] hover:bg-[#0077ed] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition active:scale-[0.98]"
                  >
                    Verify
                  </button>
                </div>

                {feedback[c.id] && (
                  <div className={`mt-2 text-[11px] font-bold ${
                    isSolved ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {feedback[c.id]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Submit Action */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-2xl border border-black/[0.1] bg-white/95 p-4 shadow-xl backdrop-blur-xl">
        <div className="text-xs text-slate-800 font-medium">
          Total Captured: <strong className={isPassing ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>{solvedCount} / 10 challenges</strong>
          <span className="ml-2 font-medium">({isPassing ? 'Qualifies for 35% pass rule' : 'Requires ≥ 4 flags to pass'})</span>
        </div>

        <button
          type="button"
          onClick={() => onSubmit(flags, submissions, 0)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm shadow-blue-500/20 transition active:scale-[0.99]"
        >
          <span>Finalize Assessment & Generate Certificate</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
