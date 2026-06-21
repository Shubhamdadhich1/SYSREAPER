#!/usr/bin/env node
/**
 * index.js — SYSREAPER
 * -----------------------------------------------------------------------
 * THUNDER HACKATHON 3.0 entry point.
 *
 * What this actually is: a system-info reconnaissance report generator
 * + a sandboxed CRUD console for code files in ./vault. The "virus"
 * theme is pure visual flavor — there is no self-replication, no
 * payload, no network exfiltration, and no access outside ./vault.
 * See readme.md for the full design rationale.
 * -----------------------------------------------------------------------
 */

const readline = require('readline');
const { collectSystemInfo, saveReport } = require('./lib/sysinfo');
const { saveHtmlReport } = require('./htmlReport');
const { exec } = require('child_process');
const fileops = require('./lib/fileops');

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', magenta: '\x1b[35m'
};

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
let profileRevealed = false; // ensures the reveal happens once per session

function banner() {
  console.log(`${C.red}${C.bold}
   ███████╗██╗   ██╗███████╗██████╗ ███████╗ █████╗ ██████╗ ███████╗██████╗
   ██╔════╝╚██╗ ██╔╝██╔════╝██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔════╝██╔══██╗
   ███████╗ ╚████╔╝ ███████╗██████╔╝█████╗  ███████║██████╔╝█████╗  ██████╔╝
   ╚════██║  ╚██╔╝  ╚════██║██╔══██╗██╔══╝  ██╔══██║██╔═══╝ ██╔══╝  ██╔══██╗
   ███████║   ██║   ███████║██║  ██║███████╗██║  ██║██║     ███████╗██║  ██║
   ╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝
${C.reset}${C.dim}        THUNDER HACKATHON 3.0  ::  file console + one-time local host profile${C.reset}
${C.dim}        (see readme.md — fully local, no network, sandboxed to ./vault)${C.reset}
`);
}

async function fakeScanLine(label) {
  process.stdout.write(`${C.dim}[scanning]${C.reset} ${label}`);
  for (let i = 0; i < 3; i++) {
    await sleep(120);
    process.stdout.write('.');
  }
  process.stdout.write(`  ${C.green}done${C.reset}\n`);
}

/** Runs once, the first time any CRUD command succeeds in a session. */
async function revealHostProfile() {
  profileRevealed = true;
  console.log(`\n${C.yellow}${C.bold}Generating host profile...${C.reset}\n`);
  const targets = [
    'OS fingerprint', 'CPU architecture', 'Memory map',
    'Hostname & network interfaces', 'Node.js runtime', 'Environment variables'
  ];
  for (const t of targets) await fakeScanLine(t);
  const info = collectSystemInfo();
  const savedPath = saveHtmlReport(info);
  openInBrowser(savedPath);
  function openInBrowser(filePath) {
  if (process.platform === 'win32') {
    exec(`start "" "${filePath}"`, { windowsHide: true });
  } else if (process.platform === 'darwin') {
    exec(`open "${filePath}"`, { windowsHide: true });
  } else {
    exec(`xdg-open "${filePath}"`, { windowsHide: true });
  }
}

  
  console.log(`\n${C.cyan}${C.bold}══════════════════════════════════════${C.reset}`);
console.log(`${C.cyan}${C.bold}      HOST PROFILE GENERATED${C.reset}`);
console.log(`${C.cyan}${C.bold}══════════════════════════════════════${C.reset}\n`);

console.log(`${C.yellow}SYSTEM${C.reset}`);
console.log(`──────────────────────────────────────`);
console.log(`OS Type          ${info.operatingSystem.type}`);
console.log(`Platform         ${info.operatingSystem.platform}`);
console.log(`Release          ${info.operatingSystem.release}`);
console.log(`Version          ${info.operatingSystem.version}`);
console.log(`Uptime Hours     ${info.operatingSystem.uptimeHours}`);

console.log(`\n${C.yellow}CPU${C.reset}`);
console.log(`──────────────────────────────────────`);
console.log(`Architecture     ${info.cpu.architecture}`);
console.log(`Model            ${info.cpu.model}`);
console.log(`Core Count       ${info.cpu.coreCount}`);

console.log(`\n${C.yellow}MEMORY${C.reset}`);
console.log(`──────────────────────────────────────`);
console.log(`Total RAM        ${info.memory.total}`);
console.log(`Free RAM         ${info.memory.free}`);

console.log(`\n${C.yellow}HOST${C.reset}`);
console.log(`──────────────────────────────────────`);
console.log(`Hostname         ${info.host.hostname}`);
console.log(`Home Directory   ${info.host.homeDirectory}`);

console.log(`\n${C.yellow}RUNTIME${C.reset}`);
console.log(`──────────────────────────────────────`);
console.log(`Node Version     ${info.runtime.nodeVersion}`);
console.log(`PID              ${info.runtime.pid}`);

console.log(`\n${C.yellow}USER${C.reset}`);
console.log(`──────────────────────────────────────`);
console.log(`Username         ${info.user.username}`);

console.log(`\n${C.green}✓ Report Archived${C.reset}`);
console.log(`${C.dim}${savedPath}${C.reset}`);

console.log(`\n${C.dim}No network activity occurred. Nothing left this machine.${C.reset}\n`);
  console.log(`\n  Full JSON report archived locally at:`);
  console.log(`  ${C.dim}${savedPath}${C.reset}`);
  console.log(`\n${C.dim}  No network activity occurred. Nothing left this machine.${C.reset}`);
  console.log(`${C.cyan}=================================${C.reset}\n`);
}

function printMenu() {
  console.log(`${C.magenta}${C.bold}SYSREAPER FILE CONSOLE${C.reset}\n`);
  console.log(`  create <filename> <content...>`);
  console.log(`  read   <filename>`);
  console.log(`  update <filename> <content...>`);
  console.log(`  append <filename> <content...>`);
  console.log(`  delete <filename>`);
  console.log(`  list`);
  console.log(`  exit\n`);
}

async function handleCommand(line) {
  const [cmdRaw, filename, ...rest] = line.trim().split(/\s+/);
  const cmd = (cmdRaw || '').toLowerCase();
  const content = rest.join(' ');
  let succeeded = false;

  try {
    switch (cmd) {
      case 'create': {
        const res = fileops.createFile(filename, content);
        console.log(`${C.green}✔ created${C.reset} ${res.filename} (${res.bytes} bytes)`);
        succeeded = true;
        break;
      }
      case 'read': {
        const data = fileops.readFile(filename);
        console.log(`${C.cyan}--- ${filename} ---${C.reset}\n${data}\n${C.cyan}--- end ---${C.reset}`);
        succeeded = true;
        break;
      }
      case 'update': {
        const res = fileops.updateFile(filename, content, 'overwrite');
        console.log(`${C.green}✔ updated${C.reset} ${res.filename}`);
        succeeded = true;
        break;
      }
      case 'append': {
        const res = fileops.updateFile(filename, content, 'append');
        console.log(`${C.green}✔ appended to${C.reset} ${res.filename}`);
        succeeded = true;
        break;
      }
      case 'delete': {
        const res = fileops.deleteFile(filename);
        console.log(`${C.red}✔ deleted${C.reset} ${res.filename}`);
        succeeded = true;
        break;
      }
      case 'list': {
        const files = fileops.listFiles();
        if (files.length === 0) {
          console.log(`${C.dim}(vault is empty)${C.reset}`);
        } else {
          files.forEach((f) =>
            console.log(`  ${C.bold}${f.name}${C.reset}  ${f.sizeBytes}B  modified ${f.modified}`)
          );
        }
        // Listing is read-only/informational; only the file-mutating /
        // file-reading actions above count as the triggering "first action".
        break;
      }
      case 'exit':
      case 'quit':
        return false;
      default:
        console.log(`${C.yellow}Unknown command "${cmd}". Type one of: create/read/update/append/delete/list/exit${C.reset}`);
    }
  } catch (err) {
    console.log(`${C.red}✘ Error:${C.reset} ${err.message}`);
  }

  if (succeeded && !profileRevealed) {
    await revealHostProfile();
    printMenu();
  }

  return true;
}

async function main() {
  banner();
  printMenu();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${C.bold}sysreaper>${C.reset} `
  });

  rl.prompt();
  rl.on('line', async (line) => {
    rl.pause();
    const keepGoing = await handleCommand(line);
    if (keepGoing === false) {
      console.log(`${C.dim}Goodbye. Nothing left this machine; nothing was touched outside ./vault.${C.reset}`);
      rl.close();
      return;
    }
    rl.prompt();
    rl.resume();
  });

  rl.on('close', () => process.exit(0));
}

main();
