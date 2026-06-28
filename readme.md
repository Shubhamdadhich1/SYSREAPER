# SYSREAPER

**Thunder Hackathon 3.0**

A CLI tool that combines full system-access file management with an automatic local host-profiling report. The "reaper" theme is visual flavor — there is no self-replication, no network exfiltration, and no malicious payload.

> **Before you run this:** the first time you successfully run any file command (`create`, `read`, `update`, `append`, or `delete`) in a session, SYSREAPER automatically generates a local system-profile report and opens it in your browser. This is intentional and is the core concept of the project. It happens once per session. `list` does not trigger it.

---

## What this is

SYSREAPER is two things in one CLI tool:

1. **A file management console.** Create, read, update, append to, delete, and list files — anywhere on your system using absolute or relative paths.
2. **A local system-info reporter**, demonstrated through an unprompted trigger. The first file action you take in a session causes SYSREAPER to collect basic details about your machine (OS, CPU, memory, hostname, Node version, a small allow-list of environment variables) and render them as a styled HTML report that opens in your browser — without you having asked for a scan specifically.

Both pieces run entirely offline. Nothing is sent anywhere.

---

## Why it triggers this way

Real malicious software doesn't ask permission before gathering information — it acts in the background and only surfaces results afterward. SYSREAPER recreates that experience, safely: you open what looks like a plain file tool, run an ordinary command, and a full host report appears that you never explicitly requested.

The point is to make the underlying pattern concrete — it costs very little code to have an everyday action trigger data collection a user didn't ask for in the moment. Seeing it happen once is a more memorable way to internalize that than reading about it abstractly.

Everything collected is read-only, local-only, and limited to a fixed allow-list — see [What gets collected](#what-gets-collected).

---

## Commands

| Command | What it does |
|---|---|
| `create <filepath> <content>` | Creates a new file at the given path. **Triggers the profile report if this is the first file action this session.** |
| `read <filepath>` | Prints a file's contents. **Triggers the profile report if this is the first file action this session.** |
| `update <filepath> <content>` | Overwrites a file's contents. **Triggers the profile report if this is the first file action this session.** |
| `append <filepath> <content>` | Appends content to the end of a file. **Triggers the profile report if this is the first file action this session.** |
| `delete <filepath>` | Deletes a file. **Triggers the profile report if this is the first file action this session.** |
| `list` | Lists files in the current vault directory. Does **not** trigger the report. |
| `exit` | Quits the console. |

Files can now be created or modified anywhere on the system using full paths:

```
sysreaper> create C:\Users\yourname\Desktop\test.txt hello from sysreaper
```

---

## What gets collected

Everything below is read-only — nothing is modified on your system:

- **Operating system** — type, platform, release, version, uptime
- **CPU** — architecture, model, core count, load average
- **Memory** — total and free
- **Host** — hostname, home directory path, temp directory path, network interface names
- **Runtime** — Node.js version, V8 version, process ID, executable path, working directory
- **User** — username, default shell
- **Environment variables** — a fixed allow-list only (`PATH`, `HOME`, `SHELL`, `LANG`, `TERM`, `USER`, `USERNAME`, `NODE_ENV`, `EDITOR`, `PWD`, `OS`, `COMPUTERNAME`). Nothing outside this list is ever read, so API keys, tokens, or secrets stored in other env vars are never touched.

The report is saved as a local HTML file in `reports/` and opened in your default browser. It is never uploaded, transmitted, or written anywhere outside the project folder.

---

## Project structure

```
sysreaper/
├── index.js          # CLI entry point, menu, command routing
├── htmlReport.js     # Renders collected system info as an HTML report
├── lib/
│   ├── fileops.js    # CRUD file operations
│   └── sysinfo.js    # Read-only system info collection
├── vault/            # Created automatically — default working directory
├── reports/          # Created automatically — generated HTML reports
└── package.json
```

`vault/` and `reports/` are not committed to this repo — they are created automatically the first time you run the program.

---

## Running it

Requires [Node.js](https://nodejs.org/) v18 or later.

```bash
git clone https://github.com/Shubhamdadhich1/SYSREAPER.git
cd SYSREAPER
npm install
node index.js
```

Try:

```
sysreaper> create C:\Users\yourname\Desktop\demo.txt hello world
```

The file is created on your Desktop — and because it's the first file action this session, the host profile report also generates and opens in your browser automatically.

---

## Safety summary

- No network requests, ever
- No data leaves the machine
- No persistence, registry modification, or process-injection mechanisms
- System info collection is automatic on first file action — disclosed upfront in this README, read-only, and limited to a fixed allow-list
