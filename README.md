# SecResearch Assessment Platform

A comprehensive, interactive evaluation platform for Security Research Engineers (Fresher / Intern level) featuring:
- **Round 1: Theory Examination** (20 Multiple-Choice Questions spanning Web, Cryptography, Memory/Binaries, Networks, Cloud/Identity, and OWASP Top 10)
- **Round 2: Real-World Code Review & Patching** (SQL, JavaScript/Node.js, and C# code audits)
- **Round 3: Simulated Hands-on Security Labs & CTF** (Interactive Linux Web Terminal, XSS DOM Sandbox, SQL Injection Sandbox, AI Prompt Injection Sandbox, and JWT Signature Bypass Forge)
- **35% Per-Round Qualifying Benchmark** (Candidates must achieve at least 35% in every round to qualify)
- **Question-by-Question Diagnostic Audit Report** & Verified High-Resolution PDF Certificate Generation
- **Apple Light Aesthetic**: Clean typography, refined neutrals (`#f5f5f7`), frosted glass navigation, and macOS-style interactive toolbars.

---

## Quick Start (Local Development)

### Using Bun (Recommended)

```bash
# 1. Install dependencies
bun install

# 2. Start local development server (binds to http://localhost:3000)
bun run dev
```

### Using npm

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev
```

---

## Production Build & Deployment

The application compiles into a pure, high-performance static SPA (`dist/` directory) that can be hosted on GitHub Pages, Nginx, Apache, Cloudflare Pages, Vercel, AWS S3, or any static file server.

### 1. Production Deployment with Bun

#### Build the Static Assets
```bash
# Clean and produce optimized production bundle in dist/
bun run build
```

#### Preview the Build Locally
```bash
bun run preview
```

#### Serve in Production with Bun
You can serve the static build directly using Bun or any static file server:
```bash
# Option A: Using bunx serve
bunx serve dist -l 3000

# Option B: Run a simple high-performance Bun static file server
bun -e "Bun.serve({ port: 3000, fetch(req) { const path = new URL(req.url).pathname; const file = Bun.file('dist' + (path === '/' ? '/index.html' : path)); return file.exists().then(e => e ? new Response(file) : new Response(Bun.file('dist/index.html'))); } }); console.log('Serving on http://localhost:3000');"
```

---

### 2. Production Deployment with npm

#### Build the Static Assets
```bash
# Install exact dependencies
npm ci

# Build the production bundle in dist/
npm run build
```

#### Preview the Build Locally
```bash
npm run preview
```

#### Serve in Production with Node / npm
```bash
# Using 'serve'
npx serve dist -s -l 3000

# Using 'http-server'
npx http-server dist -p 3000 --spa
```

#### Production Nginx Configuration
If deploying via Nginx, point the `root` directive to the `dist` folder:
```nginx
server {
    listen 80;
    server_name assessment.yourdomain.com;

    root /var/www/secresearch/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Automated GitHub Actions CI/CD Pipeline

This repository includes a fully configured automated GitHub Actions workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### How the Pipeline Works
1. Whenever code is pushed to the **`main`** branch, the workflow triggers automatically.
2. It sets up the latest Bun runtime, installs frozen dependencies, and compiles the static site into `dist/`.
3. It creates a `.nojekyll` file to ensure GitHub Pages serves all assets correctly.
4. It pushes the compiled static HTML, CSS, and JS files directly to the **`page`** branch using `peaceiris/actions-gh-pages@v4`.

### Enabling GitHub Pages to Host from the `page` Branch

To host the application directly from your GitHub repository:

1. Open your repository on GitHub.
2. Go to **Settings** > **Pages** (under the "Code and automation" section in the left sidebar).
3. Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
4. Under **Branch**:
   - Select **`page`** from the branch dropdown.
   - Select **`/ (root)`** from the folder dropdown.
5. Click **Save**.
6. GitHub Pages will now automatically serve your app at:
   ```
   https://<your-github-username>.github.io/<your-repository-name>/
   ```
7. Any future commits pushed to `main` will automatically build and update the live site on GitHub Pages within 1–2 minutes!

---

## Project Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD pipeline deploying to 'page' branch
├── src/
│   ├── components/
│   │   ├── CandidateRegister.tsx # Candidate info registration & track selector
│   │   ├── Header.tsx            # Apple frosted-glass header & step navigation
│   │   ├── Round1Theory.tsx      # Round 1 (20 MCQ theory questions)
│   │   ├── Round2CodeReview.tsx  # Round 2 (Code review & vulnerability analysis)
│   │   ├── Round3Labs.tsx        # Round 3 (Terminal, Sandboxes & CTF flags)
│   │   └── ReportAndCertificate.tsx # Audit report & Apple-style PDF certificate
│   ├── data/
│   │   ├── round1Questions.ts    # 20 curated theory questions & explanations
│   │   ├── round2MCQ.ts          # 15 realistic multi-language code review challenges
│   │   └── round3Challenges.ts   # 10 CTF labs, sandboxes, and verification logic
│   ├── utils/
│   │   └── pdfGenerator.ts       # jsPDF audit report & verified certificate renderer
│   ├── App.tsx                   # Multi-step state machine & routing
│   ├── main.tsx                  # Application entry point
│   ├── types.ts                  # TypeScript interfaces & types
│   └── index.css                 # Apple system styling & print directives
├── ASSESSMENT_ANSWER_KEY.md      # Full proctor answer key and walkthrough
├── index.html                    # HTML entry point with SF Pro font stack
├── package.json                  # Scripts & dependencies
├── tsconfig.json                 # TypeScript configuration
└── vite.config.ts                # Vite config with relative base ('./') for GitHub Pages
```

---

## License

Apache-2.0
