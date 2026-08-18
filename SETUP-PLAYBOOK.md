---
title: Setup Playbook
type: playbook
tags: [onboarding, setup]
---

# Build Your Own AI OS, Setup Playbook

> Powered by **Otium AI Consultant**: *"Get Your Time Back."*
> This playbook turns Claude Code into your personal **AI Operating System**: a single brain that knows your business, remembers your decisions, lives inside your Obsidian notes, and can act in your Google Workspace.

> **🚀 Fastest path, you barely touch this file.**
> 1. Do the two installs in **`INSTALL-FIRST.md`** (Claude Code + Node.js).
> 2. Open this folder in Claude Code and type anything, the **`onboard`** skill runs the rest
>    *for* you: it installs its plugins, connects Google in your browser, and asks you to open this folder as an Obsidian vault.
>
> This playbook is the manual `onboard` follows, read it for the background, to do a step by
> hand, or if you get stuck. Almost nothing here needs a terminal.

---

## Before you start (Prerequisites)

Just two, both covered step-by-step in **`INSTALL-FIRST.md`**:

| Need | What it is | Get it |
|---|---|---|
| **Claude Code** | The app your AI runs in (Desktop app = no terminal) | claude.com/download |
| **Node.js 18+** | Plugins need it (and the optional Obsidian REST API), installer included | `setup.sh` / `setup.ps1`, or nodejs.org → **LTS** |

You'll also want **Obsidian** (obsidian.md) for the graph view, and a **Google account** on a
Claude plan that includes connectors (e.g. Pro / Max / Team) for the Google step.

> **Tip:** this folder is both your AI OS **and** your Obsidian vault. In Obsidian choose
> *"Open folder as vault"* and point it at **this folder**.

---

## Part A: Install the Claude Code plugins (5 min)

**You barely do this, `onboard` runs it for you.** When you open the folder and start, your AI
installs the plugins using the **`claude plugin` command line**: *not* the interactive `/plugin`
browser, which often isn't ready on a fresh install (the #1 thing that trips people up).

Doing it by hand? Paste these into your **terminal**:
```bash
claude plugin marketplace add anthropics/claude-plugins-official   # ignore "already added"
claude plugin install superpowers@claude-plugins-official
claude plugin install skill-creator@claude-plugins-official
claude plugin marketplace add thedotmack/claude-mem
claude plugin install claude-mem@thedotmack
claude plugin marketplace add mksglu/context-mode
claude plugin install context-mode@context-mode
```

Then **restart Claude Code** and run `claude plugin list` to confirm they're installed.

> Fallback only: the same can be typed as `/plugin marketplace add …` / `/plugin install …@…`
> slash commands in the chat, but the CLI above is the reliable path.

**What each one does:**
- **Superpowers**: a library of disciplined workflows (planning, debugging, review). Better habits, not just answers.
- **Skill Creator**: package any repeatable workflow of yours into a reusable skill. This is how your OS grows.
- **claude-mem**: long-term memory. Remembers past sessions, decisions, and work across days/weeks.
- **context-mode**: processes big files, web pages, and long command output off to the side, so they don't crowd out your conversation.

`/code-review` is built into Claude Code, no install needed. Run it to have your AI hunt bugs in code changes. On version 2.1.223 and later, `/review` is an alias for it.

---

## Part B: Obsidian (2 min, native by default, live REST API optional)

**Default: nothing to connect.** Your AI reads and writes your notes **directly as files**, so it
works whether Obsidian is open or closed. You just want Obsidian for the graph view:

1. Open **Obsidian** → **"Open folder as vault"** → choose **this folder**.
2. Open **Graph view** to watch your notes link up as the OS fills in.

That's it for most people, no plugin, no key, no terminal.

### Optional power-up: live Local REST API
Want the AI to use **live Obsidian features** (Dataview, Obsidian's own search, surgical frontmatter
edits)? Connect the Local REST API, the trade-off is you must **keep Obsidian open** whenever you use the OS.

The plugin ships its own MCP server, so there is no npm package to install. The kit ships the one
piece Claude Code is missing: a tiny stdio bridge at `.claude/scripts/obsidian-mcp-bridge.mjs`.
It exists because the plugin serves HTTPS with a **self-signed certificate** that Claude Code's
built-in HTTP transport refuses (`DEPTH_ZERO_SELF_SIGNED_CERT`). The bridge trusts that one
certificate for that one connection, and nothing else on your machine changes.

1. In Obsidian: **Settings → Community plugins → Browse →** install + enable **"Local REST API"**
   (listed as *Local REST API with MCP*), then copy its **API Key**.
2. Save the plugin's certificate somewhere outside this folder:
```bash
curl -sk https://127.0.0.1:27124/obsidian-local-rest-api.crt -o ~/.claude/obsidian-local-rest-api.crt
```
3. Paste the key into the chat, your AI runs this for you (or run it yourself). Use the full path
   to `node` if it is not on your PATH:
```bash
claude mcp add obsidian -s local -e OBSIDIAN_MCP_URL=https://127.0.0.1:27124/mcp/ -e OBSIDIAN_API_KEY=<YOUR_OBSIDIAN_API_KEY> -e OBSIDIAN_CA_FILE=$HOME/.claude/obsidian-local-rest-api.crt -- node .claude/scripts/obsidian-mcp-bridge.mjs
```
   `-s local` keeps the key in your private per-project config, never in this repo.
4. Restart Claude Code (Obsidian still open) and ask *"list my Obsidian notes"* to verify.

Details, the full tool list, and the fix-it steps live in `references/obsidian-rest-api.md`.

> If keeping Obsidian always-open is a hassle, just skip this, the native default already does everything the OS needs.

---

## Part C: Connect Google via Claude's built-in connector (5 min), all in the browser

We use **Claude's own Google connectors**: Gmail, Google Calendar, Google Drive, authorized
in your browser. **No terminal, no Node, no Google Cloud project.**

1. In Claude Code, run **`/mcp`** and connect the **Google** tools (Gmail, Calendar, Drive), 
   or enable them under your Claude **Connectors** settings.
2. A browser window opens → **sign in to Google** → **Allow**. Done, remembered after.
3. **Verify:** ask your AI *"What's on my Google Calendar this week?"* If it answers, you're connected.

> Needs a Claude plan that includes connectors (e.g. Pro / Max / Team). On a plan without them,
> skip this for now, the OS still works, and you can connect Google later.
>
> ⚠️ If the Google tools don't appear, finish connecting in `/mcp` / Connectors, then retry. Stuck?
> Book the Otium setup call, we'll finish it with you.

---

## Part D: Build your AI OS (run `onboard`) (15 min)

If `onboard` already ran, this is what it did on your behalf, recorded here so you can check its work or repeat a step by hand.

1. In Claude Code (open in this folder), start a **fresh chat**.
2. Run the onboarding skill, type **`/onboard`** or just say **"onboard me"** (on a fresh OS it
   starts on its own). It first double-checks setup, then learns about you, **two ways, both
   optional:** answer a few questions (skip any), or just **drop a file** (company profile, bio,
   deck, past emails) into the chat and it'll read it.
3. Then ask it: **"What should I focus on this week?"**: that's the moment it clicks.

---

## Part E: Verify everything works (5 min)

- [ ] `claude plugin list` in the terminal shows **superpowers**, **skill-creator**, **claude-mem**, and **context-mode** all enabled. (Use the terminal, not the `/plugin` browser: that's the one that often isn't ready on a fresh install.)
- [ ] Obsidian → **Graph view** → your notes are connected (not scattered dots).
- [ ] *"What's on my Google Calendar this week?"* → returns events.
- [ ] After `onboard`: `CLAUDE.md` has your real name/business (no more `{{...}}` placeholders), and `context/` is filled.
- [ ] Start a **brand-new chat** → the AI greets you as your AI OS and references your business. ✅

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `/plugin` browser empty / plugins won't install | Use the **`claude plugin`** CLI instead (Part A): `claude plugin install <name>@<marketplace>` from the terminal. Make sure Claude Code is up to date (the native install auto-updates). |
| Superpowers installed but `/using-superpowers` "doesn't work" | It's **not a command**: Superpowers loads automatically at the start of each session. **Restart Claude Code.** To use it, just describe your task, or run `/brainstorm`, `/write-plan`, `/execute-plan`. Check `claude plugin list` shows it **enabled**. |
| `onboard` skill not available | Confirm you opened Claude Code **in this folder**; the skill is at `.claude/skills/onboard/SKILL.md`. |
| Plugin / memory / Obsidian errors (`npx` not found) | Make sure **Node.js** is installed, run `setup.sh` / `setup.ps1`, or see `INSTALL-FIRST.md` step 2, then restart Claude Code. |
| Google tools don't appear | Connect them via **`/mcp`** or Claude **Connectors**, and make sure your Claude plan includes connectors. Then retry the calendar question. |
| Obsidian REST API power-up returns nothing | Only relevant if you enabled it: make sure **Obsidian is running**, **Local REST API** is enabled, and the **key matches**. Restart Claude Code. (The native default needs none of this.) |
| AI forgets context next session | Confirm **claude-mem** is enabled and **CLAUDE.md** exists in the folder you opened. |

---

## What's next (Otium follow-ups)

Once the OS is alive, the real value is **automations**. Bring Otium your most repetitive weekly
task and we'll turn it into a one-command skill inside your OS (built with Skill Creator).

> Need a hand with any step? Reply to Otium and we'll jump on a screen-share.

---

## Appendix, Manual bootstrap prompt (fallback if `onboard` won't load)

If the `onboard` skill isn't available, paste this into a fresh chat instead:

```text
You are about to become my personal AI Operating System. We are in a folder that is also my
Obsidian vault. First confirm setup: the plugins (Superpowers, claude-mem, context-mode) are
installed, this folder is open as an Obsidian vault, and Google is connected via Claude's
connector. Then interview me with these 7 questions (one at a time, in my language; I can skip
any, or instead paste/attach a file about my business for you to read): 1) Who I am, what I
sell, who I sell to. 2) 1-2 things I've written recently (raw). 3) My top 2-3 priorities for
the next 90 days. 4) Where revenue lands and is tracked. 5) Where I talk to customers/team/world.
6) Where notes & docs live. 7) The task that eats my week + where I track work.
Then scaffold: CLAUDE.md, context/about-me.md, context/about-business.md, context/priorities.md,
references/voice.md, connections.md, tasks/todo.md, decisions/log.md, OS-INDEX.md. Connect notes
with [[wikilinks]] + tags. Add a standing rule: every session, read CLAUDE.md and tasks/todo.md
and surface reminders/deadlines first. Finish with a 3-line summary and tell me to ask
"what should I focus on this week?". Begin now.
```

## Connected
- [[INSTALL-FIRST]]
- [[CLAUDE]]
- [[README]]
- [[connections]]
- [[OS-INDEX]]
