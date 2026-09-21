import { Round2MCQQuestion } from '../types';

export const ROUND2_MCQ_QUESTIONS: Round2MCQQuestion[] = [
  // ==========================================
  // SQL VULNERABILITIES (5 QUESTIONS)
  // ==========================================
  {
    id: 1,
    language: 'sql',
    topic: 'Dynamic SQL Stored Procedure Injection',
    cwe: 'CWE-89: Improper Neutralization of Special Elements used in an SQL Command',
    title: 'Task 1: SQL Injection in Stored Procedure Dynamic Query',
    code: `CREATE PROCEDURE dbo.GetUserRecords
    @UserRole NVARCHAR(50),
    @SearchKeyword NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    -- Dynamic SQL string concatenation with unvalidated parameters
    DECLARE @SqlStatement NVARCHAR(MAX);
    SET @SqlStatement = N'SELECT UserID, Username, Email, Role FROM dbo.AppUsers ' +
                        N'WHERE Role = ''' + @UserRole + ''' AND Username LIKE ''%' + @SearchKeyword + '%''';
    
    -- Direct execution of concatenated SQL string
    EXEC(@SqlStatement);
END;`,
    question: 'What is the primary security flaw in this stored procedure, and what is the most effective remediation?',
    options: [
      'SQL Injection via dynamic SQL string concatenation in EXEC(); remediate by replacing with sp_executesql and strongly-typed parameter definitions.',
      'Denial of Service via unindexed table scan; remediate by adding a clustered index on dbo.AppUsers(Role).',
      'Privilege Escalation via SET NOCOUNT ON; remediate by executing with WITH EXECUTE AS CALLER.',
      'Cross-Site Scripting (XSS) via stored user attributes; remediate with REPLACE(@SearchKeyword, \'<\', \'&lt;\').'
    ],
    correctAnswer: 0,
    hint: 'Analyze how query parameters are combined into the string variable before execution and compare EXEC() with parameterized execution mechanisms.',
    hints: [
      'Inspection: Examine lines 17-18. Notice how user variables @UserRole and @SearchKeyword are concatenated directly into the query string using string addition (+).',
      'Execution Mechanism: In line 21, EXEC(@SqlStatement) compiles and evaluates the assembled string as raw T-SQL text, allowing injected SQL delimiters (e.g. \' OR 1=1--) to escape the data context.',
      'Remediation Approach: Parameterized dynamic SQL using sp_executesql allows passing parameters separately with explicit types, ensuring user inputs are treated strictly as data literals.'
    ],
    explanation: 'Concatenating unvalidated user inputs directly into dynamic T-SQL strings executed via EXEC() causes SQL Injection (CWE-89). Even within stored procedures, dynamic SQL string concatenation is vulnerable. The proper remediation is using sp_executesql with explicit parameter lists (@params) or native parameterized static queries.'
  },
  {
    id: 2,
    language: 'sql',
    topic: 'Second-Order SQL Injection in Profile Updates',
    cwe: 'CWE-89: Second-Order SQL Injection',
    title: 'Task 2: Second-Order SQL Injection in Audit Logging',
    code: `-- Step 1: User profile nickname is saved via parameterized insert
INSERT INTO dbo.UserProfile (UserID, NickName) VALUES (@UserID, @SanitizedNickName);

-- Step 2: Downstream batch audit process retrieves stored nickname
SELECT @StoredNick = NickName FROM dbo.UserProfile WHERE UserID = @UserID;

-- Step 3: Audit logger executes dynamic SQL using retrieved value
DECLARE @AuditQuery NVARCHAR(MAX);
SET @AuditQuery = N'INSERT INTO dbo.AuditLog (Event, Details) VALUES (''PROFILE_UPDATE'', ''' + @StoredNick + ''')';
EXEC(@AuditQuery);`,
    question: 'Why does this implementation introduce a Second-Order SQL Injection vulnerability despite Step 1 using a parameterized query?',
    options: [
      'Data stored safely in the database is subsequently trusted and concatenated into dynamic SQL without parameterization in Step 3.',
      'The UserProfile table lacks a foreign key constraint to dbo.AuditLog, allowing orphaned audit entries.',
      'The INSERT statement in Step 1 does not use the OUTPUT clause to capture generated primary keys.',
      'SQL Server automatically runs all audit queries under the system administrator (sa) security context.'
    ],
    correctAnswer: 0,
    hint: 'Trace the lifecycle of the user input across multiple operations: from initial storage to subsequent retrieval and dynamic execution.',
    hints: [
      'Data Flow: While Step 1 safely stores the payload via parameterized INSERT, the database now holds raw, unescaped user input (such as admin\'); DROP TABLE AuditLog;--).',
      'Flaw Mechanism: In Step 3, the developer assumes that data retrieved from their own database is trustworthy and safe to concatenate directly into dynamic SQL.',
      'Defense Principle: Every SQL query that incorporates variable data must use parameterization, regardless of whether the data originated from an HTTP request or a database row.'
    ],
    explanation: 'Second-Order SQL Injection occurs when user input is safely stored in a database but later retrieved and concatenated into a dynamic SQL query without parameterization. Developers frequently assume database records are trusted, leading to injection when the stored payload executes in downstream procedures.'
  },
  {
    id: 3,
    language: 'sql',
    topic: 'Dynamic ORDER BY Clause Injection',
    cwe: 'CWE-89: SQL Injection via Dynamic Sorting Identifier',
    title: 'Task 3: SQL Injection in Dynamic ORDER BY Clause',
    code: `CREATE PROCEDURE dbo.GetProductsSorted
    @CategoryID INT,
    @SortColumn NVARCHAR(50),
    @SortOrder NVARCHAR(4)
AS
BEGIN
    -- Parameterized WHERE clause, but dynamic ORDER BY concatenation
    DECLARE @Sql NVARCHAR(MAX);
    SET @Sql = N'SELECT ProductID, Name, Price, Stock FROM dbo.Products ' +
               N'WHERE CategoryID = @CatID ORDER BY ' + @SortColumn + N' ' + @SortOrder;
               
    EXEC sp_executesql @Sql, N'@CatID INT', @CatID = @CategoryID;
END;`,
    question: 'Standard SQL parameterization cannot bind column names or sort directions in an ORDER BY clause. Which approach securely mitigates injection in dynamic sorting?',
    options: [
      'Implement strict allow-list validation checking @SortColumn against predefined valid column names (or use a static CASE expression in SQL).',
      'Enclose @SortColumn in single quotes: ORDER BY \'\' + @SortColumn + \'\' within the dynamic string.',
      'Pass @SortColumn as a string parameter to sp_executesql: sp_executesql @Sql, N\'@SortColumn NVARCHAR(50)\', @SortColumn.',
      'Prepend a SQL comment delimiter (--) to @SortOrder before dynamic concatenation.'
    ],
    correctAnswer: 0,
    hint: 'Consider how RDBMS query engines treat parameter markers versus schema identifiers, and how to restrict user input to a known-safe set.',
    hints: [
      'Grammar Limitation: SQL standards do not allow parameter markers (?) for schema identifiers like table names, column names, or ASC/DESC keywords.',
      'Exploitation Vector: Attackers can inject boolean or time-based expressions into ORDER BY (e.g., (CASE WHEN (SELECT IS_SRVROLEMEMBER(\'sysadmin\'))=1 THEN Price ELSE Name END)).',
      'Remediation Strategy: Use strict allow-list validation (e.g. IF @SortColumn IN (\'Name\', \'Price\', \'Stock\')) or a parameterized CASE statement directly in static SQL.'
    ],
    explanation: 'Because column names and ASC/DESC keywords cannot be parameterized in standard SQL, concatenating them directly allows attackers to inject conditional logic or subqueries into the ORDER BY clause. Secure remediation requires strict allow-list validation against a set of known column identifiers or using a static CASE expression.'
  },
  {
    id: 4,
    language: 'sql',
    topic: 'Dangerous Extended Stored Procedure Execution',
    cwe: 'CWE-78: Improper Neutralization of Special Elements used in an OS Command (via CWE-89)',
    title: 'Task 4: Remote OS Command Execution via SQL Stored Procedures',
    code: `CREATE PROCEDURE dbo.BackupAndNotify
    @BackupName NVARCHAR(100),
    @NotificationEmail NVARCHAR(100)
AS
BEGIN
    DECLARE @Cmd NVARCHAR(MAX);
    -- Formatting an OS shell command using user input
    SET @Cmd = N'echo Backup ' + @BackupName + N' completed | mail -s "Backup Notice" ' + @NotificationEmail;
    
    -- Executing host command shell via SQL Server extended stored procedure
    EXEC master.dbo.xp_cmdshell @Cmd;
END;`,
    question: 'What critical danger does invoking xp_cmdshell with dynamic input introduce, and what is the primary architectural remediation?',
    options: [
      'Arbitrary Operating System Command Execution (RCE) with the database service account privileges; disable xp_cmdshell and execute tasks out-of-band.',
      'Database memory buffer exhaustion in TempDB; remediate by increasing maximum server memory allocation.',
      'Cross-Site Request Forgery (CSRF) on the SQL Server listener port 1433; remediate with anti-forgery tokens.',
      'TLS protocol downgrade in the TDS database connection stream; remediate by enforcing TLS 1.3.'
    ],
    correctAnswer: 0,
    hint: 'Identify the subsystem being invoked by xp_cmdshell and consider the risk of delegating operating system shell execution to a database procedure.',
    hints: [
      'Subsystem Scope: xp_cmdshell spawns a Windows command shell (cmd.exe) running under the SQL Server service account context.',
      'Metacharacter Injection: An input containing shell operators like & or | or ; allows attackers to chain arbitrary OS commands (e.g., whoami, certutil, net user).',
      'Architecture Defense: Administrative notifications and file operations should be decoupled from the database engine and handled by dedicated application services.'
    ],
    explanation: 'xp_cmdshell executes operating system commands directly from SQL Server. When combined with unvalidated string concatenation, attackers gain Remote Code Execution (RCE) on the database host. xp_cmdshell should be disabled in SQL Server surface area configuration, and system tasks should be handled by dedicated application services.'
  },
  {
    id: 5,
    language: 'sql',
    topic: 'Blind Time-Based SQL Injection in Conditional Branching',
    cwe: 'CWE-89: Blind SQL Injection',
    title: 'Task 5: Time-Based Blind SQL Injection Vulnerability',
    code: `CREATE PROCEDURE dbo.CheckUserStatus
    @Username NVARCHAR(50)
AS
BEGIN
    DECLARE @Query NVARCHAR(MAX);
    SET @Query = N'SELECT COUNT(*) FROM dbo.Users WHERE Username = ''' + @Username + N''' AND IsActive = 1';
    
    DECLARE @Count INT;
    -- Executing dynamic query to determine user activity
    EXEC sp_executesql @Query, N'@Count INT OUTPUT', @Count OUTPUT;
    
    IF @Count > 0
        SELECT 'ACTIVE' AS Status;
    ELSE
        SELECT 'INACTIVE' AS Status;
END;`,
    question: 'An attacker provides the input: admin\' WAITFOR DELAY \'0:0:5\'-- and observes a 5-second response latency. What vulnerability allows them to exfiltrate data byte-by-byte?',
    options: [
      'Time-Based Blind SQL Injection, where execution delay enables inferring confidential data one character at a time using conditional expressions.',
      'Denial of Service caused by unindexed table locking in the database transaction manager.',
      'Memory leakage in the SQL Server plan cache caused by dynamic string fragmentation.',
      'Reflected Cross-Site Scripting (XSS) due to unencoded status string returns in the API output.'
    ],
    correctAnswer: 0,
    hint: 'Consider how an attacker can extract data from a database when the application returns no error messages and only a binary response.',
    hints: [
      'Observation: The application only outputs "ACTIVE" or "INACTIVE", giving no direct query output or database error messages.',
      'Side-Channel: By injecting conditional time delays (e.g. IF (ASCII(SUBSTRING(Password,1,1))=97) WAITFOR DELAY \'0:0:5\'), an attacker measures HTTP response times.',
      'Remediation: Parameterizing the dynamic query (@Username passed as an @param to sp_executesql) eliminates the injection vector entirely.'
    ],
    explanation: 'Time-Based Blind SQL Injection occurs when an attacker uses time-delay commands (such as WAITFOR DELAY or pg_sleep) to infer data through response latency when no error or data is returned. The vulnerability is resolved by parameterizing the query so that user inputs cannot alter query syntax.'
  },

  // ==========================================
  // JAVASCRIPT (NODE.JS / EXPRESS) VULNERABILITIES (5 QUESTIONS)
  // ==========================================
  {
    id: 6,
    language: 'javascript',
    topic: 'Prototype Pollution in Object Merger',
    cwe: 'CWE-1321: Improperly Controlled Modification of Object Prototype Attributes',
    title: 'Task 6: Prototype Pollution in Node.js Deep Merge Utility',
    code: `function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target) {
      deepMerge(target[key], source[key]);
    } else {
      // Unvalidated property assignment allows prototype pollution
      target[key] = source[key];
    }
  }
  return target;
}

app.post('/api/user/settings', (req, res) => {
  const userSettings = req.body;
  const updatedConfig = deepMerge(defaultConfig, userSettings);
  res.json({ status: 'ok', config: updatedConfig });
});`,
    question: 'How can an attacker exploit this unvalidated recursive merge utility, and what is the resulting impact?',
    options: [
      'By submitting a JSON payload with "__proto__" or "constructor.prototype" keys to modify Object.prototype, altering properties globally across all runtime objects.',
      'By sending a 10MB payload to trigger an out-of-memory heap crash in the V8 garbage collector.',
      'By supplying circular object references to cause an unhandled SQL syntax error in the database layer.',
      'By passing URL-encoded Unicode characters to bypass the Express routing table.'
    ],
    correctAnswer: 0,
    hint: 'Examine how JavaScript objects inherit properties through their prototype chain and what occurs when special property names are recursively copied.',
    hints: [
      'Prototype Chain: In JavaScript, standard objects inherit from Object.prototype via the hidden __proto__ reference.',
      'Unchecked Keys: If source contains {"__proto__": {"isAdmin": true}}, target[key] accesses Object.prototype directly, poisoning all newly created objects.',
      'Mitigation: Filter out dangerous keys (__proto__, constructor, prototype) or use Object.create(null) and Map structures.'
    ],
    explanation: 'Recursive object merger functions that do not sanitize special keys like "__proto__", "constructor", or "prototype" allow attackers to modify Object.prototype. This causes Prototype Pollution (CWE-1321), which can lead to privilege escalation, security bypasses, or even Remote Code Execution (RCE) via gadget properties.'
  },
  {
    id: 7,
    language: 'javascript',
    topic: 'Server-Side Request Forgery (SSRF)',
    cwe: 'CWE-918: Server-Side Request Forgery (SSRF)',
    title: 'Task 7: Server-Side Request Forgery (SSRF) in Outbound Webhook',
    code: `const express = require('express');
const axios = require('axios');
const app = express();

app.post('/api/webhook/test', async (req, res) => {
  const { webhookUrl } = req.body;
  
  // Directly issuing an outbound HTTP GET to a user-supplied URL
  try {
    const response = await axios.get(webhookUrl, { timeout: 4000 });
    res.json({ delivered: true, responseData: response.data });
  } catch (err) {
    res.status(500).json({ error: 'Webhook dispatch failed' });
  }
});`,
    question: 'Why is this webhook testing endpoint vulnerable to Server-Side Request Forgery (SSRF), and how is it commonly exploited in cloud environments?',
    options: [
      'The server makes unvalidated outbound requests to user-supplied URLs, allowing attackers to access internal cloud metadata (e.g. 169.254.169.254) or private microservices.',
      'The axios.get call lacks an Authorization Bearer header, causing the client browser to drop its session cookie.',
      'The request timeout of 4000ms is too short, causing unhandled promise rejections that crash the Node.js event loop.',
      'Axios automatically evaluates and executes client-side scripts returned in the destination server response body.'
    ],
    correctAnswer: 0,
    hint: 'Analyze where the network request originates from and consider what internal services or metadata endpoints are accessible from the server host.',
    hints: [
      'Origin of Request: The HTTP request is performed by the backend Node.js server, not the user\'s browser.',
      'Internal Network Reachability: The server can reach internal network interfaces, localhost (127.0.0.1), and cloud link-local metadata services (169.254.169.254).',
      'Remediation: Validate protocols (only http/https), resolve hostnames, block private IP ranges (RFC 1918, loopback, link-local), and restrict access via an outbound proxy.'
    ],
    explanation: 'Issuing outbound HTTP requests using untrusted user-supplied URLs causes Server-Side Request Forgery (SSRF, CWE-918). Attackers can target loopback addresses, internal RFC 1918 subnets, or cloud instance metadata (e.g., http://169.254.169.254/latest/meta-data/) to extract IAM credentials or compromise internal services.'
  },
  {
    id: 8,
    language: 'javascript',
    topic: 'Command Injection in Child Process Execution',
    cwe: 'CWE-78: Improper Neutralization of Special Elements used in an OS Command',
    title: 'Task 8: Command Injection via child_process.exec()',
    code: `const express = require('express');
const { exec } = require('child_process');
const app = express();

app.get('/api/network/ping', (req, res) => {
  const host = req.query.host;
  
  // Invoking system shell with concatenated user parameter
  exec(\`ping -c 4 \${host}\`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: stderr || 'Execution error' });
    }
    res.json({ output: stdout });
  });
});`,
    question: 'What is the security flaw in using child_process.exec() with concatenated input, and what is the recommended defense?',
    options: [
      'exec() spawns an operating system shell that evaluates shell metacharacters (;, |, &&); use execFile() or spawn() without a shell and pass arguments as an array.',
      'exec() runs synchronously and blocks the Node.js event loop; replace it with fs.readFileSync().',
      'The ping utility requires root privileges; configure sudo in package.json execution scripts.',
      'Child process stdout buffers are limited to 256 bytes and will crash Node.js on larger output streams.'
    ],
    correctAnswer: 0,
    hint: 'Consider the difference between running an executable directly versus running an executable through an intermediate system command shell.',
    hints: [
      'Shell Evaluation: child_process.exec() invokes /bin/sh (or cmd.exe on Windows) to parse the command string.',
      'Metacharacter Injection: If host is 127.0.0.1; id; uname -a, the shell executes each command sequentially.',
      'Remediation: child_process.execFile(\'ping\', [\'-c\', \'4\', host], ...) bypasses the shell entirely, passing host strictly as a single command-line argument.'
    ],
    explanation: 'child_process.exec() passes commands to a system shell, allowing attackers to inject shell metacharacters (e.g., ;, &&, |) to execute arbitrary commands (CWE-78). The fix is to use child_process.execFile() or spawn() with shell: false, passing arguments in a strongly typed array.'
  },
  {
    id: 9,
    language: 'javascript',
    topic: 'Regular Expression Denial of Service (ReDoS)',
    cwe: 'CWE-1333: Inefficient Regular Expression Complexity',
    title: 'Task 9: Regular Expression Denial of Service (ReDoS)',
    code: `const express = require('express');
const app = express();

// Vulnerable regex with overlapping nested quantifiers
const emailRegex = /^([a-zA-Z0-9_.-]+)+@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,6})$/;

app.post('/api/validate-email', (req, res) => {
  const { email } = req.body;
  
  const isValid = emailRegex.test(email);
  res.json({ valid: isValid });
});`,
    question: 'What security vulnerability is present in this email validation regular expression, and what causes the server to freeze?',
    options: [
      'Catastrophic backtracking (ReDoS) due to nested quantifiers ([a-zA-Z0-9_.-]+)+, causing exponential evaluation time on non-matching inputs.',
      'SQL Injection caused by unescaped @ symbols in the regular expression character class.',
      'Cross-Site Scripting (XSS) because angle brackets <> are not explicitly disallowed in the regex pattern.',
      'Buffer overflow in the V8 regex compiler when matching input strings exceeding 64 characters in length.'
    ],
    correctAnswer: 0,
    hint: 'Look closely at the grouping pattern ([a-zA-Z0-9_.-]+)+. Notice the multiple nested repetition quantifiers.',
    hints: [
      'Nested Quantifiers: The inner group has a + quantifier, and the outer group also has a + quantifier: ([pattern]+)+.',
      'Pathological Backtracking: When a long string matching the character class ends with an invalid character (e.g. aaaaaaaaaaaaaaaaaaaa!), the regex engine evaluates all exponential permutations.',
      'Event Loop Impact: Because regex evaluation runs synchronously on the Node.js main thread, catastrophic backtracking completely blocks the event loop for all users.'
    ],
    explanation: 'Nested quantifiers like ([a-zA-Z0-9_.-]+)+ cause catastrophic backtracking (ReDoS, CWE-1333). When evaluated against non-matching strings with repeated prefix characters, the Non-deterministic Finite Automaton (NFA) engine performs exponential matching attempts, freezing the Node.js event loop.'
  },
  {
    id: 10,
    language: 'javascript',
    topic: 'Path Traversal in File Serving',
    cwe: 'CWE-22: Improper Limitation of a Pathname to a Restricted Directory',
    title: 'Task 10: Path Traversal in Static File Serving',
    code: `const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

app.get('/api/download', (req, res) => {
  const filename = req.query.file;
  
  // path.join normalizes relative paths but does not prevent directory traversal
  const filePath = path.join(__dirname, 'public', filename);
  
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(404).send('File not found');
    res.send(data);
  });
});`,
    question: 'An attacker requests /api/download?file=../../../../etc/passwd. Why does path.join() fail to prevent directory traversal?',
    options: [
      'path.join() resolves relative "../" segments, producing a normalized path that escapes the intended public directory; verify the resolved path starts with the base directory.',
      'path.join() converts forward slashes to backslashes, which crashes Linux-based production servers.',
      'fs.readFile() requires filenames to be explicitly declared in an environment variable.',
      'Express routing middleware automatically prepends http://localhost/ to all filesystem operations.'
    ],
    correctAnswer: 0,
    hint: 'Trace how path.join calculates the output path when provided relative parent directory sequences (..).',
    hints: [
      'Normalization vs Boundary Check: path.join(\'/app/public\', \'../../etc/passwd\') evaluates to \'/etc/passwd\'. It resolves dot-dot segments but enforces no directory boundaries.',
      'Filesystem Access: When fs.readFile receives \'/etc/passwd\', it reads arbitrary system files outside the application\'s intended directory.',
      'Remediation: Use path.resolve() and verify that the target path begins with the canonical base directory using path.resolve(filePath).startsWith(publicDir).'
    ],
    explanation: 'path.join() resolves relative directory segments (../) but does not restrict paths within a target folder (CWE-22). An attacker can supply traversal sequences to access arbitrary files on the system. Safe implementations resolve the absolute path and verify it begins with the canonical base directory.'
  },

  // ==========================================
  // C# (ASP.NET CORE) VULNERABILITIES (5 QUESTIONS)
  // ==========================================
  {
    id: 11,
    language: 'csharp',
    topic: 'Insecure JSON Deserialization (RCE)',
    cwe: 'CWE-502: Deserialization of Untrusted Data',
    title: 'Task 11: Insecure JSON Deserialization in ASP.NET Core',
    code: `[HttpPost("api/session/restore")]
public IActionResult RestoreSession([FromBody] string base64Payload)
{
    string jsonPayload = Encoding.UTF8.GetString(Convert.FromBase64String(base64Payload));
    
    // TypeNameHandling.All allows JSON payloads to specify arbitrary .NET types to instantiate
    var settings = new JsonSerializerSettings
    {
        TypeNameHandling = TypeNameHandling.All
    };
    
    object sessionObj = JsonConvert.DeserializeObject(jsonPayload, settings);
    return Ok(new { status = "restored", type = sessionObj.GetType().Name });
}`,
    question: 'Why is configuring TypeNameHandling.All in Newtonsoft.Json considered critical, and what risk does it introduce?',
    options: [
      'It allows incoming JSON payloads to specify arbitrary .NET types via the $type property, enabling Remote Code Execution (RCE) via gadget chains.',
      'It disables JSON schema validation, causing unhandled NullReferenceExceptions on numeric properties.',
      'It stores serialized sessions in plaintext client cookies instead of encrypted ASP.NET Core session memory.',
      'It forces the Kestrel web server to downgrade incoming HTTPS connections to unencrypted HTTP/1.0.'
    ],
    correctAnswer: 0,
    hint: 'Analyze the TypeNameHandling setting and consider what occurs when a deserializer instantiates classes specified by untrusted input.',
    hints: [
      'Type Metadata: With TypeNameHandling.All or Auto, the serializer reads the "$type" field (e.g. "$type": "System.Diagnostics.Process, System") and dynamically instantiates it.',
      'Gadget Chains: Attackers leverage existing .NET classes (like ObjectDataProvider or WindowsIdentity) to invoke arbitrary methods like Process.Start.',
      'Remediation: Set TypeNameHandling = TypeNameHandling.None and deserialize strictly into predefined, strongly-typed DTO classes.'
    ],
    explanation: 'TypeNameHandling.All in Newtonsoft.Json instructs the deserializer to instantiate arbitrary types specified by the JSON payload\'s $type metadata. Attackers construct gadget chains (e.g., ObjectDataProvider or Process.Start) to achieve Remote Code Execution (CWE-502). The remediation is setting TypeNameHandling = TypeNameHandling.None and deserializing strictly into concrete DTOs.'
  },
  {
    id: 12,
    language: 'csharp',
    topic: 'XML External Entity (XXE) Injection',
    cwe: 'CWE-611: Improper Restriction of XML External Entity Reference',
    title: 'Task 12: XML External Entity (XXE) in XmlDocument',
    code: `[HttpPost("api/xml/process")]
public IActionResult ProcessXml([FromBody] string rawXml)
{
    // Enabling XmlUrlResolver allows external DTD and entity resolution
    XmlDocument doc = new XmlDocument();
    doc.XmlResolver = new XmlUrlResolver();
    
    doc.LoadXml(rawXml);
    
    string result = doc.SelectSingleNode("//data")?.InnerText;
    return Ok(new { extracted = result });
}`,
    question: 'What attack vector is opened by enabling XmlUrlResolver on untrusted XML input in .NET, and how should it be secured?',
    options: [
      'XML External Entity (XXE) injection leading to arbitrary local file disclosure or SSRF; remediate by setting XmlResolver = null and DtdProcessing = DtdProcessing.Prohibit.',
      'Cross-Site Scripting (XSS) in developer console logs; remediate by encoding XML attributes with WebUtility.HtmlEncode().',
      'SQL Injection in the Entity Framework database cache; remediate by invoking context.Database.EnsureCreated().',
      'Stack overflow exception caused by XML comments exceeding 1024 characters in length.'
    ],
    correctAnswer: 0,
    hint: 'Examine the XmlResolver configuration and consider what happens when untrusted XML includes a DOCTYPE with an external SYSTEM entity.',
    hints: [
      'External Entities: An attacker can submit an XML document with a custom DTD: <!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///c:/windows/win.ini"> ]>.',
      'Parser Behavior: XmlUrlResolver instructs the parser to resolve the URI, reading the file or making outbound network requests (SSRF).',
      'Remediation: Disable DTD processing entirely using DtdProcessing.Prohibit and set XmlResolver = null.'
    ],
    explanation: 'XmlDocument with XmlUrlResolver enabled resolves XML External Entities (XXE, CWE-611). Attackers can define external entities pointing to sensitive files (file:///etc/passwd) or internal network endpoints (SSRF). Remediation requires setting XmlResolver = null and configuring DtdProcessing.Prohibit.'
  },
  {
    id: 13,
    language: 'csharp',
    topic: 'Mass Assignment / Over-Posting in Model Binding',
    cwe: 'CWE-915: Improperly Controlled Modification of Dynamically-Determined Object Attributes',
    title: 'Task 13: Mass Assignment (Over-Posting) in ASP.NET Core',
    code: `public class User
{
    public int Id { get; set; }
    public string Username { get; set; }
    public string Bio { get; set; }
    public bool IsAdmin { get; set; } // Privileged administrative flag
    public decimal AccountBalance { get; set; }
}

[HttpPost("api/profile/update")]
public async Task<IActionResult> UpdateProfile([FromBody] User model)
{
    // Binding directly to the database entity model
    _context.Users.Update(model);
    await _context.SaveChangesAsync();
    return Ok(model);
}`,
    question: 'The User entity model contains sensitive fields like IsAdmin and AccountBalance. What vulnerability exists when binding untrusted JSON directly to the database model?',
    options: [
      'Mass Assignment (Over-Posting), enabling malicious clients to submit unexpected fields like {"IsAdmin": true} and alter privileged database attributes; remediate with dedicated DTOs.',
      'Server-Side Request Forgery (SSRF) because Entity Framework Core attempts to ping the database host asynchronously.',
      'Insecure Direct Object Reference caused by missing CORS preflight headers on the ASP.NET Core controller.',
      'Memory fragmentation in Entity Framework\'s change tracker leading to thread exhaustion.'
    ],
    correctAnswer: 0,
    hint: 'Compare the properties the user should be allowed to edit (Username, Bio) with the full set of properties on the User class.',
    hints: [
      'Model Binder Scope: ASP.NET Core\'s default model binder automatically maps every matching JSON property to the target object\'s setters.',
      'Over-Posting: If an attacker sends {"Bio": "Hello", "IsAdmin": true, "AccountBalance": 99999}, the framework happily assigns those properties.',
      'Remediation: Never bind directly to domain entities. Use dedicated request Data Transfer Objects (DTOs) exposing only user-editable fields.'
    ],
    explanation: 'Mass Assignment (Over-Posting, CWE-915) occurs when model binders bind client-supplied request fields directly to sensitive domain entities. Attackers can modify properties like IsAdmin or AccountBalance. Secure applications use dedicated view models / DTOs containing only intended properties.'
  },
  {
    id: 14,
    language: 'csharp',
    topic: 'Path Traversal in File Streaming Action',
    cwe: 'CWE-22: Improper Limitation of a Pathname to a Restricted Directory',
    title: 'Task 14: Path Traversal in PhysicalFile Streaming Controller',
    code: `[HttpGet("api/reports/download")]
public IActionResult DownloadReport(string fileName)
{
    // Path.Combine does not prevent directory traversal sequences like ../
    var filePath = Path.Combine(_env.WebRootPath, "reports", fileName);
    
    if (!System.IO.File.Exists(filePath))
    {
        return NotFound("Report not found");
    }
    
    return PhysicalFile(filePath, "application/octet-stream");
}`,
    question: 'How can an attacker exploit this report download action, and what is the proper defense in C# / .NET?',
    options: [
      'Pass relative path traversal sequences (e.g. ../../appsettings.json); defend by sanitizing with Path.GetFileName(fileName) and verifying the canonical path starts with the base directory.',
      'Supply an empty string to trigger an unhandled 500 server exception; defend by adding the [Required] attribute.',
      'Inject URL encoding (%20) to bypass ASP.NET Core routing; defend by replacing spaces with plus signs.',
      'Request files with uppercase extensions; defend by converting fileName to lowercase.'
    ],
    correctAnswer: 0,
    hint: 'Examine how Path.Combine handles arguments containing relative traversal tokens like "..".',
    hints: [
      'Path Resolution: Path.Combine("C:\\App\\reports", "..\\appsettings.json") evaluates to "C:\\App\\appsettings.json".',
      'Target Exposure: An attacker can download sensitive files such as appsettings.json (containing DB connection strings and secrets) or source code.',
      'Defense: Use Path.GetFileName(fileName) to strip any directory paths, and verify Path.GetFullPath(filePath).StartsWith(baseDirectory, StringComparison.OrdinalIgnoreCase).'
    ],
    explanation: 'Path.Combine() does not prevent relative path traversal (../), allowing attackers to access arbitrary files like appsettings.json (CWE-22). The fix is to strip path separators using Path.GetFileName() or verify that Path.GetFullPath() resides strictly within the authorized directory.'
  },
  {
    id: 15,
    language: 'csharp',
    topic: 'Insecure Cryptographic Cipher Mode & Hardcoded Keys',
    cwe: 'CWE-327: Use of a Broken or Risky Cryptographic Algorithm',
    title: 'Task 15: Insecure Cryptographic Cipher Mode (ECB) in AES',
    code: `public byte[] EncryptSensitiveData(byte[] plainText)
{
    using (var aes = Aes.Create())
    {
        // Insecure Electronic Codebook (ECB) mode and static hardcoded key
        aes.Mode = CipherMode.ECB;
        aes.Padding = PaddingMode.PKCS7;
        aes.Key = Encoding.UTF8.GetBytes("HardcodedSecretK"); // 16 bytes
        
        using (var encryptor = aes.CreateEncryptor())
        {
            return encryptor.TransformFinalBlock(plainText, 0, plainText.Length);
        }
    }
}`,
    question: 'What cryptographic weaknesses are present in this AES implementation, and how should it be modernized?',
    options: [
      'ECB mode does not provide semantic security (identical plaintext blocks yield identical ciphertext blocks) and the key is hardcoded; use authenticated encryption (AES-GCM) with random IVs and secure key storage.',
      'AES does not support 128-bit keys; the key must be expanded to 512 bits using SHA-1 hashing.',
      'PKCS7 padding is obsolete and causes SQL injection in cryptographic providers; replace it with ZeroPadding.',
      'Aes.Create() requires a Hardware Security Module (HSM) connection or it throws a CryptographicException at runtime.'
    ],
    correctAnswer: 0,
    hint: 'Consider how Electronic Codebook (ECB) mode processes repeating data blocks and where encryption keys should be managed.',
    hints: [
      'Pattern Preservation: ECB mode encrypts each 16-byte block independently with no Initialization Vector (IV). Identical plaintext blocks produce identical ciphertext blocks, revealing patterns.',
      'Lack of Integrity: Unauthenticated encryption modes are vulnerable to bit-flipping and padding oracle attacks.',
      'Remediation: Use modern authenticated encryption like AES-GCM (AesGcm in .NET Core), generate unique random nonces for each encryption, and store keys in Azure Key Vault or AWS KMS.'
    ],
    explanation: 'CipherMode.ECB encrypts each block independently without an IV, preserving plaintext patterns and failing semantic security (CWE-327). Additionally, hardcoding cryptographic keys in source code (CWE-798) compromises confidentiality. Modern applications should use Authenticated Encryption (e.g. AesGcm) with random nonces and secure key management.'
  }
];
