# SYSREAPER

**Thunder Hackathon 3.0**

A sandboxed CRUD console for code files, paired with a local host-profiling report. The "reaper" theme is visual flavor — there is no self-replication, no network exfiltration, and no access outside the project folder.

> **Before you run this:** the first time you successfully run any file command (`create`, `read`, `update`, `append`, or `delete`) in a session, SYSREAPER automatically generates a local system-profile report and opens it in your browser. This is intentional and is the core concept of the project — see [Why it triggers this way](#why-it-triggers-this-way) below for exactly what's collected and why. It happens once per session, on the first command that *succeeds* — not the first one attempted. `list` does not trigger it.
>
> On a fresh clone, `vault/` starts empty, so `read`, `update`, `append`, and `delete` will all fail with a "file does not exist" error until something has been created — and a failed command doesn't count as a success, so it won't trigger the report either. If you want to see the trigger fire from a command other than `create`, run `create <filename> <content>` first, then try `read`/`update`/etc. in a later step (it'll succeed but the report has already fired once, since it's a once-per-session reveal — restart the console to see it trigger from a different command).

---

## What this is

SYSREAPER is two things in one CLI tool:

1. **A file management console.** Create, read, update, append to, delete, and list files — all confined to a single `vault/` folder so the tool can never touch anything else on your machine.
2. **A local system-info reporter**, demonstrated through an unprompted trigger rather than a separate command. The first file action you take in a session causes SYSREAPER to collect basic, non-sensitive details about your machine (OS, CPU, memory, hostname, Node version, a small allow-list of environment variables) and render them as a styled HTML report that opens in your browser — without you having asked for a scan specifically.

Both pieces run entirely offline. Nothing is sent anywhere.

---

## Why it triggers this way

Real malicious software doesn't ask permission before gathering information — it acts in the background and only surfaces results afterward. SYSREAPER recreates that *experience*, safely: you open what looks like a plain file-CRUD tool, run an ordinary command, and a full host report appears that you never explicitly requested.

The point isn't to deceive — you're reading this disclosure before running anything. The point is to make the underlying pattern concrete: it costs very little code to have an everyday action trigger data collection a user didn't ask for in the moment, and seeing it happen once, with full knowledge of what's collected, is a more memorable way to internalize that than reading about it abstractly.

Everything it does is read-only, local-only, and limited to a fixed allow-list — see [What gets collected](#what-gets-collected).

---

## Commands

| Command | What it does |
|---|---|
| `create <filename> <content>` | Creates a new file inside `vault/`. **Triggers the profile report if this is the first file action this session.** |
| `read <filename>` | Prints a file's contents. **Triggers the profile report if this is the first file action this session.** |
| `update <filename> <content>` | Overwrites a file's contents. **Triggers the profile report if this is the first file action this session.** |
| `append <filename> <content>` | Appends content to a file. **Triggers the profile report if this is the first file action this session.** |
| `delete <filename>` | Deletes a file. **Triggers the profile report if this is the first file action this session.** |
| `list` | Lists all files currently in `vault/`. Does **not** trigger the report. |
| `exit` | Quits the console |

---

## What gets collected

Everything below is read-only — nothing is modified on your system, and the report only contains what's listed here:

- **Operating system** — type, platform, release, version, uptime
- **CPU** — architecture, model, core count, load average
- **Memory** — total and free
- **Host** — hostname, home directory path, temp directory path, network interface names
- **Runtime** — Node.js version, V8 version, process ID, executable path, working directory
- **User** — username, default shell
- **Environment variables** — a fixed allow-list only (`PATH`, `HOME`, `SHELL`, `LANG`, `TERM`, `USER`, `USERNAME`, `NODE_ENV`, `EDITOR`, `PWD`, `OS`, `COMPUTERNAME`). Nothing outside this list is ever read, so API keys, tokens, or secrets stored in other env vars are never touched.

The report is saved as a local HTML file in `reports/` and opened in your default browser. It is never uploaded, transmitted, or written anywhere outside the project folder.

---

## Sandboxing

All file operations are restricted to `vault/` at the project root. Every filename is resolved to an absolute path and checked against the vault boundary before any read/write/delete happens — attempts to escape it (e.g. `read ../../../etc/passwd`) are rejected outright:

```
> read ../../../etc/passwd
✘ Error: Blocked: "../../../etc/passwd" resolves outside the vault sandbox.
```

This is the core design constraint of the project: a tool themed around system access that is provably incapable of reaching outside its own folder.

---

## Project structure

```
sysreaper/
├── index.js          # CLI entry point, menu, command routing
├── htmlReport.js      # Renders collected system info as an HTML report
├── lib/
│   ├── fileops.js      # Sandboxed CRUD operations on ./vault
│   └── sysinfo.js      # Read-only system info collection
├── vault/             # Created automatically — user's files live here
├── reports/            # Created automatically — generated HTML reports
└── package.json
```

`vault/` and `reports/` aren't committed to this repo — they're created automatically the first time you run a file command.

---

## Running it

Requires [Node.js](https://nodejs.org/) (v18 or later recommended).

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd sysreaper
npm install
node index.js
```

You'll see the SYSREAPER menu immediately, along with the disclosure above. Try:

```
sysreaper> create demo.js console.log("hello")
```

This creates the file — and because it's the first file action this session, it also immediately generates the host report and opens it in your browser. Any subsequent file commands in the same session behave normally, with no further report.

---

## Why sandbox at all?

A tool that can read and write arbitrary files anywhere on disk is, structurally, the same shape as something genuinely dangerous. Confining every operation to one folder — and proving it with a hard boundary check, not just convention — is what keeps this a safe demo instead of a real risk. That constraint, not the visual theme, is the actual point of the project.

---

## Safety summary

- No network requests, ever
- No data leaves the machine
- No files outside `vault/` can be read, written, or deleted
- No persistence, registry, or process-injection mechanisms
- System info collection happens automatically on the first file action of a session — disclosed upfront in this README, read-only, and limited to a fixed allow-list