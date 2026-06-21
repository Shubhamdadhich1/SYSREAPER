/**
 * lib/htmlReport.js
 * -----------------------------------------------------------------------
 * Renders a collected system-info object (from lib/sysinfo.js) as a
 * single self-contained HTML file. No external assets, no network
 * calls, no CDN fetches.
 *
 * This module does NOT collect any data itself — it only formats data
 * already gathered elsewhere and handed to it.
 * -----------------------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '..', 'reports');

const STYLE = `
  :root {
    --bg: #F7F8FA;
    --surface: #FFFFFF;
    --border: #E1E5EA;
    --ink: #1B2430;
    --muted: #6B7684;
    --accent: #2D6CDF;
    --accent-soft: #EAF1FD;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--ink);
    font-family: -apple-system, 'Segoe UI', Inter, Arial, sans-serif;
    line-height: 1.5;
  }
  .wrap { max-width: 840px; margin: 0 auto; padding: 56px 24px 80px; }

  header { margin-bottom: 32px; }
  .eyebrow {
    color: var(--accent);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  h1 { font-size: 26px; font-weight: 700; }
  .timestamp { color: var(--muted); font-size: 13px; margin-top: 6px; }

  table {
    width: 100%;
    border-collapse: collapse;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 28px;
  }
  caption {
    text-align: left;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--accent);
    background: var(--accent-soft);
    padding: 10px 16px;
  }
  tr { border-top: 1px solid var(--border); }
  tr:first-child { border-top: none; }
  td {
    padding: 10px 16px;
    font-size: 14px;
    vertical-align: top;
  }
  td.label { color: var(--muted); width: 38%; }
  td.value { color: var(--ink); text-align: right; word-break: break-word; }

  .notice {
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: 6px;
    background: var(--surface);
    padding: 18px 20px;
    margin-bottom: 28px;
  }
  .notice h2 {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 10px;
  }
  .notice ul { list-style: none; font-size: 13.5px; color: var(--muted); }
  .notice li { padding: 3px 0; }
  .notice li::before { content: "— "; color: var(--accent); }

  footer { color: var(--muted); font-size: 12px; padding-top: 20px; border-top: 1px solid var(--border); }
`;

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tableRows(pairs) {
  return pairs
    .map(([label, value]) => `<tr><td class="label">${esc(label)}</td><td class="value">${esc(value)}</td></tr>`)
    .join('');
}

function table(caption, pairs) {
  return `<table><caption>${esc(caption)}</caption>${tableRows(pairs)}</table>`;
}

function buildHtml(info) {
  const osTable = table('Operating System', [
    ['Type', info.operatingSystem.type],
    ['Platform', info.operatingSystem.platform],
    ['Release', info.operatingSystem.release],
    ['Version', info.operatingSystem.version],
    ['Uptime (hrs)', info.operatingSystem.uptimeHours]
  ]);

  const cpuTable = table('CPU', [
    ['Architecture', info.cpu.architecture],
    ['Model', info.cpu.model],
    ['Core Count', info.cpu.coreCount],
    ['Load Average', Array.isArray(info.cpu.loadAverage) ? info.cpu.loadAverage.join(', ') : info.cpu.loadAverage]
  ]);

  const memTable = table('Memory', [
    ['Total', info.memory.total],
    ['Free', info.memory.free]
  ]);

  const hostTable = table('Host', [
    ['Hostname', info.host.hostname],
    ['Home Directory', info.host.homeDirectory],
    ['Temp Directory', info.host.tempDirectory],
    ['Network Interfaces', Array.isArray(info.host.networkInterfaces) ? info.host.networkInterfaces.join(', ') : info.host.networkInterfaces]
  ]);

  const runtimeTable = table('Runtime', [
    ['Node Version', info.runtime.nodeVersion],
    ['V8 Version', info.runtime.v8Version],
    ['PID', info.runtime.pid],
    ['Exec Path', info.runtime.execPath],
    ['CWD', info.runtime.cwd]
  ]);

  const userTable = table('User', [
    ['Username', info.user.username],
    ['Shell', info.user.shell]
  ]);

  const envTable = table('Environment (allow-listed only)', Object.entries(info.environment || {}));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SYSREAPER :: Host Profile</title>
<style>${STYLE}</style>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="eyebrow">SYSREAPER — Host Profile Report</div>
      <h1>Local System Reconnaissance</h1>
      <div class="timestamp">Generated ${esc(info.timestamp)}</div>
    </header>

    ${osTable}
    ${cpuTable}
    ${memTable}
    ${hostTable}
    ${runtimeTable}
    ${userTable}
    ${envTable}

    <div class="notice">
      <h2>What this report does not do</h2>
      <ul>
        <li>No network requests were made during collection</li>
        <li>No data left this machine</li>
        <li>No files outside ./vault were read, written, or modified</li>
        <li>No secrets or non-allow-listed environment variables were accessed</li>
      </ul>
    </div>

    <footer>SYSREAPER · Thunder Hackathon 3.0 — saved locally, viewable offline.</footer>
  </div>
</body>
</html>`;
}

function saveHtmlReport(info) {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  const safeStamp = info.timestamp.replace(/[:.]/g, '-');
  const filePath = path.join(REPORTS_DIR, `system-report-${safeStamp}.html`);
  fs.writeFileSync(filePath, buildHtml(info), 'utf8');
  return filePath;
}

module.exports = { buildHtml, saveHtmlReport };
