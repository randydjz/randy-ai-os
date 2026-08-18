---
title: Connections
type: registry
tags: [connections]
---

# Connections: every system this OS can reach

`onboard` fills the **Where / Tool** column from your intake answers. You wire the actual
connections via **`SETUP-PLAYBOOK.md`** (Obsidian = Part B, Google Workspace = Part C).
Update `mechanism`, `auth`, and `last checked` as each one goes live.

| Domain | Where / Tool | Mechanism | Auth | Last checked |
|---|---|---|---|---|
| 1. Revenue / financials | TODO: not provided yet (Q4 skipped) | not yet connected | , | , |
| 2. Communications | Lark (internal + client meetings) · WhatsApp · WA group (internal) · email · phone | not yet connected | , | , |
| 3. Calendar | Lark Calendar (inferred from Q5) | not yet connected | , | , |
| 4. Customers / outside world | WhatsApp · email · phone · Lark meetings. Public channels TODO: not provided yet | not yet connected | , | , |
| 5. Tasks / work tracking | Lark, and "in my head" | not yet connected | , | , |
| 6. Documents / files | Lark Drive (general) · Google Drive (sensitive only) | not yet connected | , | , |
| 7. Knowledge / notes | Obsidian (this vault) | native files (default) + Local REST API MCP `obsidian` (live) | bearer token over TLS, loopback only | 2026-08-12 |

## Live now (after the playbook)
- **Obsidian**: two paths, both live.
  - *Native*: the OS edits the vault files directly. Always available, no setup, works with Obsidian closed.
  - *Local REST API MCP*: plugin **Local REST API with MCP v5.1.0**, MCP server registered as
    `obsidian` at `https://127.0.0.1:27124/mcp/`, reached through the stdio bridge at
    `.claude/scripts/obsidian-mcp-bridge.mjs` (the plugin's cert is self-signed and Claude Code's
    native HTTP transport refuses it). Gives 16 tools the native path does not have:
    `search_query`, `search_simple`, `tag_list`, `command_list`, `command_execute`, `open_file`,
    `active_file_get_path`, `vault_patch`, `vault_get_document_map`, plus the usual read / write /
    append / move / copy / delete / list. **Requires Obsidian to be open.** Mechanics and
    troubleshooting in [[obsidian-rest-api]]. (Part B)
- **Google Workspace**: `blocked: skipped by user during onboarding 2026-08-12`. Claude's built-in
  connectors (Gmail, Calendar, Drive) are not enabled, so the `gcal-manager` skill cannot write
  events and nothing can be read from Gmail or Drive. Re-run `/onboard` after enabling them at
  claude.ai → Settings → Connectors. (Part C)

## Known gaps, in priority order

1. **Lark is the centre of gravity and nothing reaches it.** Communications, calendar, tasks and
   most documents all live in Lark. No connector is wired, so the OS is blind to all of it.
   Highest-leverage thing to fix.
2. **Calendar is Lark, not Google.** The `gcal-manager` skill writes to Google Calendar, which is
   the wrong destination here. Until this is resolved, dated items go to `tasks/todo.md` only.
   See the standing rule in [[CLAUDE]].
3. **Revenue is unknown** (Q4 skipped). No cash, invoice, or receivables question can be answered.
4. **Tasks partly live in Randy's head.** Not connectable, only capturable. Route them into
   [[todo]] as they surface.

## Connected
- [[CLAUDE]]
- [[OS-INDEX]]
- [[SETUP-PLAYBOOK]]
- [[obsidian-rest-api]]
