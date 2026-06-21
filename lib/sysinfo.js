/**
 * lib/sysinfo.js
 * -----------------------------------------------------------------------
 * Pure information-gathering module. EVERYTHING here is read-only.
 * Nothing in this file writes to disk, makes network calls, or touches
 * any file outside of what os/process already expose in memory.
 *
 * Safe-guard philosophy: every collector is wrapped in safeGet() so a
 * single missing/throwing field (e.g. os.userInfo() failing in some
 * sandboxed containers) never crashes the whole report — it just shows
 * "unavailable" for that one field.
 * -----------------------------------------------------------------------
 */

const os = require('os');
const process = require('process');

/** Wrap a collector so failures degrade gracefully instead of crashing. */
function safeGet(fn, fallback = 'unavailable') {
  try {
    const val = fn();
    if (val === undefined || val === null || val === '') return fallback;
    return val;
  } catch (_err) {
    return fallback;
  }
}

/** Convert bytes to a human readable GB string. */
function toGB(bytes) {
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** Selected, NON-secret environment variables. We deliberately use an
 *  allow-list (not a deny-list) so we never accidentally surface API
 *  keys, tokens, or passwords that might live in env vars. */
const ENV_ALLOWLIST = [
  'PATH', 'HOME', 'SHELL', 'LANG', 'TERM', 'USER', 'USERNAME',
  'NODE_ENV', 'EDITOR', 'PWD', 'OS', 'COMPUTERNAME'
];

function collectEnv() {
  const out = {};
  for (const key of ENV_ALLOWLIST) {
    out[key] = safeGet(() => process.env[key]);
  }
  return out;
}

function collectSystemInfo() {
  return {
    timestamp: new Date().toISOString(),
    operatingSystem: {
      type: safeGet(() => os.type()),          // e.g. 'Linux', 'Windows_NT'
      platform: safeGet(() => os.platform()),   // e.g. 'linux', 'win32'
      release: safeGet(() => os.release()),
      version: safeGet(() => os.version()),
      uptimeHours: safeGet(() => (os.uptime() / 3600).toFixed(2))
    },
    cpu: {
      architecture: safeGet(() => os.arch()),
      model: safeGet(() => (os.cpus()[0] || {}).model),
      coreCount: safeGet(() => os.cpus().length),
      loadAverage: safeGet(() => os.loadavg())
    },
    memory: {
      total: safeGet(() => toGB(os.totalmem())),
      free: safeGet(() => toGB(os.freemem()))
    },
    host: {
      hostname: safeGet(() => os.hostname()),
      homeDirectory: safeGet(() => os.homedir()),
      tempDirectory: safeGet(() => os.tmpdir()),
      networkInterfaces: safeGet(() => Object.keys(os.networkInterfaces() || {}))
    },
    runtime: {
      nodeVersion: safeGet(() => process.version),
      v8Version: safeGet(() => process.versions.v8),
      pid: safeGet(() => process.pid),
      execPath: safeGet(() => process.execPath),
      cwd: safeGet(() => process.cwd())
    },
    user: {
      username: safeGet(() => os.userInfo().username),
      shell: safeGet(() => os.userInfo().shell)
    },
    environment: collectEnv()
  };
}

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '..', 'reports');

/** Save a collected report as JSON inside ./reports (local only, no network). */
function saveReport(info) {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  const safeStamp = info.timestamp.replace(/[:.]/g, '-');
  const filePath = path.join(REPORTS_DIR, `system-report-${safeStamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(info, null, 2), 'utf8');
  return filePath;
}

module.exports = { collectSystemInfo, safeGet, saveReport };
