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
    question: 'What is the primary vulnerability in this stored procedure and how should it be fixed?',
    options: [
      'SQL Injection via string concatenation in EXEC(); fix by using sp_executesql with parameterized parameters.',
      'Denial of Service via unindexed table scan; fix by adding a clustered index on AppUsers.',
      'Privilege Escalation via SET NOCOUNT ON; fix by using WITH EXECUTE AS CALLER.',
      'Cross-Site Scripting (XSS) via user strings; fix by encoding angle brackets.'
    ],
    correctAnswer: 0,
    hint: 'Examine how variables @UserRole and @SearchKeyword are joined into @SqlStatement before EXEC().',
    hints: [
      'Step 1: Check lines 10-11 where user variables are concatenated directly into SQL text using string addition (+).',
      'Step 2: Notice that EXEC(@SqlStatement) executes unvalidated string text as a SQL command.',
      'Step 3: Fix this by binding variables with sp_executesql using explicit parameter definitions.'
    ],
    explanation: 'Concatenating user inputs into dynamic T-SQL strings causes SQL Injection. Fix it by using sp_executesql with parameterized parameter lists.'
  },
  {
    id: 2,
    language: 'sql',
    topic: 'Second-Order SQL Injection in Profile Updates',
    cwe: 'CWE-89: Second-Order SQL Injection',
    title: 'Task 2: Second-Order SQL Injection in Audit Logging',
    code: `-- Step 1: User profile nickname is saved via parameterized insert
INSERT INTO dbo.UserProfile (UserID, NickName) VALUES (@UserID, @SanitizedNickName);

-- Step 2: Downstream batch process retrieves stored nickname
SELECT @StoredNick = NickName FROM dbo.UserProfile WHERE UserID = @UserID;

-- Step 3: Audit logger executes dynamic SQL using retrieved value
DECLARE @AuditQuery NVARCHAR(MAX);
SET @AuditQuery = N'INSERT INTO dbo.AuditLog (Event, Details) VALUES (''PROFILE_UPDATE'', ''' + @StoredNick + ''')';
EXEC(@AuditQuery);`,
    question: 'Why is Step 3 vulnerable to Second-Order SQL Injection even though Step 1 used parameters?',
    options: [
      'Stored database values are untrusted input and concatenated directly into dynamic SQL in Step 3.',
      'UserProfile table lacks a foreign key constraint to AuditLog.',
      'Step 1 does not return generated primary keys.',
      'SQL Server executes audit queries as sa administrator.'
    ],
    correctAnswer: 0,
    hint: 'Follow the data from initial storage in Step 1 to its dynamic string execution in Step 3.',
    hints: [
      'Step 1: Even if stored safely in Step 1, the database now holds the raw user payload.',
      'Step 2: Step 3 retrieves that string and treats it as trusted internal data.',
      'Step 3: Concatenating @StoredNick directly into @AuditQuery allows stored injection payloads to execute.'
    ],
    explanation: 'Second-Order SQL Injection happens when stored database records are retrieved and concatenated into dynamic SQL without parameterization.'
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
    question: 'Standard SQL parameters cannot bind column names in ORDER BY clauses. How should this be safely handled?',
    options: [
      'Use strict allow-list validation checking @SortColumn against known column names (or use a static CASE expression).',
      'Enclose @SortColumn in single quotes in the string.',
      'Pass @SortColumn as a string parameter in sp_executesql.',
      'Prepend SQL comment dashes (--) to @SortOrder.'
    ],
    correctAnswer: 0,
    hint: 'Consider that SQL query engines do not accept parameter markers (?) for column names or ASC/DESC keywords.',
    hints: [
      'Step 1: Standard SQL parameter markers cannot bind column identifiers.',
      'Step 2: Concatenating unvalidated column strings lets attackers inject subqueries or conditional timing into ORDER BY.',
      'Step 3: Validate column inputs against a hardcoded list of allowed column names.'
    ],
    explanation: 'Because column names cannot be parameterized, validate inputs against an explicit allow-list or use static CASE statements.'
  },
  {
    id: 4,
    language: 'sql',
    topic: 'Dangerous Extended Stored Procedure Execution',
    cwe: 'CWE-78: Improper Neutralization of Special Elements used in an OS Command',
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
    question: 'What danger does calling xp_cmdshell with concatenated user input create?',
    options: [
      'Arbitrary OS Command Execution (RCE) with database service account privileges; disable xp_cmdshell.',
      'TempDB memory exhaustion from table scans.',
      'Cross-Site Request Forgery on SQL Server port 1433.',
      'TLS protocol downgrade in connection streams.'
    ],
    correctAnswer: 0,
    hint: 'Identify what xp_cmdshell does on the underlying operating system.',
    hints: [
      'Step 1: xp_cmdshell runs commands directly in the host OS command shell.',
      'Step 2: Concatenating user inputs allows attackers to chain additional commands using shell characters like ; or |.',
      'Step 3: This grants Remote Code Execution (RCE) on the database host server.'
    ],
    explanation: 'xp_cmdshell runs host OS commands. Concatenating untrusted inputs allows arbitrary command execution (RCE).'
  },
  {
    id: 5,
    language: 'sql',
    topic: 'Blind Time-Based SQL Injection',
    cwe: 'CWE-89: Blind SQL Injection',
    title: 'Task 5: Time-Based Blind SQL Injection Vulnerability',
    code: `CREATE PROCEDURE dbo.CheckUserStatus
    @Username NVARCHAR(50)
AS
BEGIN
    DECLARE @Query NVARCHAR(MAX);
    SET @Query = N'SELECT COUNT(*) FROM dbo.Users WHERE Username = ''' + @Username + N''' AND IsActive = 1';
    
    DECLARE @Count INT;
    -- Executing dynamic query
    EXEC sp_executesql @Query, N'@Count INT OUTPUT', @Count OUTPUT;
    
    IF @Count > 0
        SELECT 'ACTIVE' AS Status;
    ELSE
        SELECT 'INACTIVE' AS Status;
END;`,
    question: 'An attacker inputs: admin\' WAITFOR DELAY \'0:0:5\'-- and notices a 5-second delay. What vulnerability is present?',
    options: [
      'Time-Based Blind SQL Injection, allowing data extraction character-by-character via server delays.',
      'Denial of Service caused by unindexed locks.',
      'Memory leakage in SQL plan cache.',
      'Reflected XSS in status output.'
    ],
    correctAnswer: 0,
    hint: 'Think about how an attacker extracts data when the server only returns "ACTIVE" or "INACTIVE".',
    hints: [
      'Step 1: The application output is a binary "ACTIVE" or "INACTIVE".',
      'Step 2: Injecting WAITFOR DELAY causes the server to pause when a condition is true.',
      'Step 3: Measuring response time lets attackers exfiltrate data one character at a time.'
    ],
    explanation: 'Time-Based Blind SQL Injection uses time delays (e.g. WAITFOR DELAY) to infer database contents when no direct output is returned.'
  },

  // ==========================================
  // JAVASCRIPT (NODE.JS / EXPRESS) VULNERABILITIES (5 QUESTIONS)
  // ==========================================
  {
    id: 6,
    language: 'javascript',
    topic: 'Prototype Pollution in Object Merger',
    cwe: 'CWE-1321: Improper Modification of Object Prototype Attributes',
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
    question: 'How can an attacker exploit this unvalidated recursive merge function?',
    options: [
      'By sending JSON with "__proto__" or "constructor.prototype" keys to modify Object.prototype globally.',
      'By sending a 10MB payload to trigger V8 garbage collection crashes.',
      'By passing circular references to cause SQL syntax errors.',
      'By passing Unicode characters to bypass Express routing.'
    ],
    correctAnswer: 0,
    hint: 'Look at how key names are assigned without filtering special property keys.',
    hints: [
      'Step 1: In JavaScript, objects inherit from Object.prototype via __proto__.',
      'Step 2: Merging objects with a key named "__proto__" writes properties directly to Object.prototype.',
      'Step 3: This pollutes all runtime objects, causing privilege escalation or security bypasses.'
    ],
    explanation: 'Failing to filter "__proto__" keys in object merge utilities allows Prototype Pollution, altering Object.prototype globally.'
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
    question: 'Why is this webhook test endpoint vulnerable to SSRF?',
    options: [
      'The server makes unvalidated HTTP requests to user-supplied URLs, allowing access to internal cloud metadata (169.254.169.254) or microservices.',
      'The axios call lacks a Bearer token, dropping session cookies.',
      'The 4000ms timeout crashes the Node event loop.',
      'Axios automatically executes scripts in response bodies.'
    ],
    correctAnswer: 0,
    hint: 'Consider where the HTTP request originates and what internal addresses the server can reach.',
    hints: [
      'Step 1: The request is sent by the backend Node.js server, not the client browser.',
      'Step 2: The server can access localhost and cloud metadata (169.254.169.254).',
      'Step 3: An attacker providing internal URLs can read private data or cloud keys.'
    ],
    explanation: 'Allowing untrusted user input as the URL target for server-side HTTP requests leads to Server-Side Request Forgery (SSRF).'
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
    question: 'What security flaw exists in using child_process.exec() with string concatenation, and what is the fix?',
    options: [
      'exec() invokes a system shell that evaluates metacharacters (;, |, &&); fix by using execFile() or spawn() with argument arrays.',
      'exec() runs synchronously and blocks the main thread.',
      'ping requires root privileges.',
      'Child process stdout buffers are limited to 256 bytes.'
    ],
    correctAnswer: 0,
    hint: 'Notice that exec() runs a shell string, whereas execFile() runs binaries directly with argument arrays.',
    hints: [
      'Step 1: exec() executes commands inside /bin/sh or cmd.exe.',
      'Step 2: Chaining characters like ; or | lets attackers execute additional commands.',
      'Step 3: Use execFile() or spawn() without a shell, passing parameters in an array.'
    ],
    explanation: 'child_process.exec() invokes a shell, enabling command injection via shell metacharacters. Use execFile() with an argument array instead.'
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
    question: 'What causes the server to freeze when evaluating this regular expression?',
    options: [
      'Catastrophic backtracking (ReDoS) from nested quantifiers ([a-zA-Z0-9_.-]+)+ on invalid input strings.',
      'SQL Injection from unescaped @ symbols.',
      'Cross-Site Scripting because angle brackets are allowed.',
      'V8 regex engine buffer overflow on long strings.'
    ],
    correctAnswer: 0,
    hint: 'Look at the nested repetition pattern ([a-zA-Z0-9_.-]+)+.',
    hints: [
      'Step 1: The regex contains nested plus quantifiers: ([pattern]+)+.',
      'Step 2: On non-matching strings, the regex engine calculates exponential permutations.',
      'Step 3: This catastrophic backtracking blocks Node.js\'s single-threaded event loop.'
    ],
    explanation: 'Nested quantifiers cause catastrophic backtracking (ReDoS), consuming CPU and blocking the Node.js event loop.'
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
    question: 'Why does path.join() fail to stop path traversal when file=../../../../etc/passwd is requested?',
    options: [
      'path.join() resolves ../ relative segments, creating a path outside the public directory; verify the final path starts with the base directory.',
      'path.join() converts slashes to backslashes, breaking Linux servers.',
      'fs.readFile requires filenames declared in environment variables.',
      'Express prepends http://localhost/ to file paths.'
    ],
    correctAnswer: 0,
    hint: 'Trace what path.join("/app/public", "../../../../etc/passwd") evaluates to.',
    hints: [
      'Step 1: path.join resolves relative dot-dot segments (..).',
      'Step 2: The resolved result is /etc/passwd, which escapes the intended public folder.',
      'Step 3: Prevent this by checking that path.resolve(filePath).startsWith(publicDir).'
    ],
    explanation: 'path.join() resolves relative traversal segments without enforcing folder boundaries. Verify that resolved paths remain within the intended directory.'
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
    question: 'Why is setting TypeNameHandling.All in Newtonsoft.Json dangerous?',
    options: [
      'It allows JSON payloads to specify arbitrary .NET types via $type, enabling Remote Code Execution (RCE) via gadget chains.',
      'It disables JSON schema checks and throws NullReferenceException.',
      'It stores session tokens in plaintext client cookies.',
      'It forces Kestrel to downgrade HTTPS connections.'
    ],
    correctAnswer: 0,
    hint: 'Think about what happens when JSON $type metadata instructs the serializer to create system process objects.',
    hints: [
      'Step 1: TypeNameHandling.All tells Newtonsoft.Json to instantiate any class named in the $type property.',
      'Step 2: Attackers specify gadget classes (e.g., Process.Start) inside the payload.',
      'Step 3: This leads to arbitrary Remote Code Execution (RCE).'
    ],
    explanation: 'TypeNameHandling.All allows incoming JSON payloads to specify arbitrary .NET types to instantiate, leading to RCE gadget attacks.'
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
    question: 'What vulnerability is created by setting XmlResolver = new XmlUrlResolver() when parsing untrusted XML?',
    options: [
      'XML External Entity (XXE) injection leading to local file disclosure or SSRF; fix by setting XmlResolver = null.',
      'Cross-Site Scripting in log files.',
      'SQL Injection in Entity Framework cache.',
      'Stack overflow exception from long XML comments.'
    ],
    correctAnswer: 0,
    hint: 'Consider what happens when XML input contains DOCTYPE ENTITY SYSTEM definitions.',
    hints: [
      'Step 1: XmlUrlResolver instructs the parser to fetch external DTDs and SYSTEM entities.',
      'Step 2: Attackers pass entity references like file:///c:/windows/win.ini.',
      'Step 3: Fix by setting XmlResolver = null and DtdProcessing = Prohibit.'
    ],
    explanation: 'XmlUrlResolver enables XML External Entity (XXE) resolution, allowing attackers to read local files or make SSRF requests.'
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
    question: 'What vulnerability occurs when binding untrusted JSON directly to the database domain model?',
    options: [
      'Mass Assignment (Over-Posting), allowing clients to send unexpected properties like {"IsAdmin": true}; fix using dedicated DTOs.',
      'Server-Side Request Forgery because Entity Framework pings the database.',
      'Insecure Direct Object Reference from missing CORS headers.',
      'Memory fragmentation in Entity Framework change tracking.'
    ],
    correctAnswer: 0,
    hint: 'Compare the fields a user should edit (Bio) versus sensitive fields on the User class (IsAdmin).',
    hints: [
      'Step 1: ASP.NET Core model binding automatically maps incoming JSON fields to model properties.',
      'Step 2: Clients can send {"IsAdmin": true} during profile updates.',
      'Step 3: Fix this by binding requests to dedicated DTOs containing only user-editable fields.'
    ],
    explanation: 'Binding requests directly to database entities causes Mass Assignment (Over-Posting), letting clients modify sensitive fields.'
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
    question: 'How can an attacker exploit this file download endpoint, and what is the proper fix?',
    options: [
      'Pass path traversal sequences (e.g. ../../appsettings.json); fix with Path.GetFileName() and path canonicalization checks.',
      'Send an empty string to trigger 500 server errors.',
      'Inject URL encoding (%20) to bypass routing.',
      'Request uppercase file extensions.'
    ],
    correctAnswer: 0,
    hint: 'Examine how Path.Combine handles relative path sequences like "..".',
    hints: [
      'Step 1: Path.Combine("C:\\app\\reports", "..\\appsettings.json") evaluates to "C:\\app\\appsettings.json".',
      'Step 2: Attackers can download sensitive files like appsettings.json.',
      'Step 3: Fix by stripping paths using Path.GetFileName(fileName) or checking Path.GetFullPath().'
    ],
    explanation: 'Path.Combine does not block ../ traversal sequences. Strip path separators with Path.GetFileName() or verify folder boundaries.'
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
    question: 'What weaknesses are present in this AES implementation, and how should it be modernized?',
    options: [
      'ECB mode lacks semantic security (identical blocks yield identical ciphertext) and key is hardcoded; use AES-GCM with random nonces and Key Vault storage.',
      'AES does not support 128-bit keys.',
      'PKCS7 padding is obsolete and causes SQL injection.',
      'Aes.Create() requires a Hardware Security Module (HSM).'
    ],
    correctAnswer: 0,
    hint: 'Think about how Electronic Codebook (ECB) processes identical 16-byte blocks.',
    hints: [
      'Step 1: ECB mode encrypts each block independently without an IV, exposing data patterns.',
      'Step 2: Hardcoding encryption keys in source code compromises secrets.',
      'Step 3: Modernize by using Authenticated Encryption (AES-GCM) with random IVs and secure key management.'
    ],
    explanation: 'ECB mode lacks semantic security and hardcoded keys compromise confidentiality. Use authenticated encryption (AES-GCM).'
  }
];
