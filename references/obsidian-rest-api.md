---
title: Obsidian Local REST API MCP
type: reference
tags: [reference, obsidian, mcp, api, tooling]
---

# Obsidian Local REST API MCP

How the `obsidian` MCP server is wired, why it needs a bridge, and how to fix it when it breaks.
Status lives in [[connections]]; this note holds the mechanics.

## What is running

- Obsidian plugin **Local REST API with MCP**, v5.1.0 (`obsidian-local-rest-api`).
- Endpoint: **`https://127.0.0.1:27124/mcp/`**, streamable HTTP transport, protocol `2025-06-18`.
- Claude Code talks to it through a small stdio bridge:
  `.claude/scripts/obsidian-mcp-bridge.mjs`.
- Registered as MCP server `obsidian`, scope **local**, so the config and the token live in
  `~/.claude.json` outside this repo and are never committed.
- Vault served is this folder, confirmed against `vault_list`.

## Why the bridge exists

The plugin signs 27124 with its own self-signed certificate. Claude Code's native HTTP transport
is Node and rejects it outright with `DEPTH_ZERO_SELF_SIGNED_CERT`. There is no per-server way to
hand that transport a CA.

The bridge speaks stdio to Claude Code and HTTPS to the plugin, loading the plugin's CA into an
`https.Agent` used for that one connection. Certificate verification stays **on**. Nothing else on
the machine gains any new trust.

Rejected alternatives, both tested rather than assumed:

- **`NODE_EXTRA_CA_CERTS` in `.claude/settings.json`.** Does not work. Node caches root
  certificates at startup, so a value set after launch is ignored.
- **`NODE_EXTRA_CA_CERTS` as a user environment variable.** Works, but makes *every* Node process
  on the machine trust that CA, and the CA private key sits in plaintext in the plugin's
  `data.json`. Too broad for the benefit.
- **Plain HTTP on port 27123** (`enableInsecureServer`). Works and is simple, but drops TLS and
  opens a second listener. Used briefly during setup, then reverted. The port is closed again.
- **`npx mcp-remote`.** Same shape as the bridge but pulls an npm package and an extra process,
  and needs the CA anyway.

## Files and env

| Thing | Path |
|---|---|
| Bridge script | `.claude/scripts/obsidian-mcp-bridge.mjs` (tracked, no secrets) |
| Plugin CA cert | `~/.claude/obsidian-local-rest-api.crt` (outside the repo) |
| Server config + token | `~/.claude.json`, project-scoped, gitignored by living outside the repo |

The bridge reads three environment variables, all set in the MCP server entry:
`OBSIDIAN_MCP_URL`, `OBSIDIAN_API_KEY`, `OBSIDIAN_CA_FILE`.

## The 16 tools

`search_query`, `search_simple`, `tag_list`, `command_list`, `command_execute`, `open_file`,
`active_file_get_path`, `vault_patch`, `vault_get_document_map`, `vault_list`, `vault_read`,
`vault_write`, `vault_append`, `vault_move`, `vault_copy`, `vault_delete`.

Worth reaching for: **`search_query`** (Dataview / JsonLogic across the vault), **`tag_list`**,
**`vault_patch`** (surgical edit into a named heading, block, or frontmatter field instead of
rewriting a file), and **`command_execute`** (run any Obsidian command, including `app:reload`).

## Native path vs MCP path

Use **native file editing** by default. It works with Obsidian closed and has no moving parts.

Reach for **MCP** when the job needs Obsidian itself: vault-wide search and tag queries, patching
into a heading, reading which file is currently open, or driving an Obsidian command.

## When it breaks

- **`obsidian` fails to connect.** Obsidian is closed. Open it. The plugin only serves while the
  app is running.
- **Config check:** `claude mcp get obsidian`
- **Liveness check:** `curl -sk https://127.0.0.1:27124/ -H "Authorization: Bearer <token>"`
  A healthy reply is JSON with `"authenticated": true`.
- **`OBSIDIAN_CA_FILE not found`.** Re-download it:
  `curl -sk https://127.0.0.1:27124/obsidian-local-rest-api.crt -o ~/.claude/obsidian-local-rest-api.crt`
- **`DEPTH_ZERO_SELF_SIGNED_CERT` again.** The plugin regenerated its certificate. Re-download the
  CA as above.
- **Token rotated in the plugin UI.** Re-register the server, see the command in
  [[SETUP-PLAYBOOK]] Part B.
- **New MCP servers are not visible mid-session.** Claude Code loads them at startup. Restart the
  session after registering one.
- **Debugging the bridge itself.** It logs to stderr, which Claude Code surfaces in MCP server
  logs. To test it by hand, pipe JSON-RPC lines into
  `node .claude/scripts/obsidian-mcp-bridge.mjs` with the three env vars set.

## Token handling

The token lives in exactly two places, both outside version control: the plugin's
`.obsidian/plugins/obsidian-local-rest-api/data.json` (gitignored) and `~/.claude.json` (outside
the repo). Never paste it into a tracked file.

## Connected
- [[connections]]
- [[CLAUDE]]
- [[SETUP-PLAYBOOK]]
- [[build-with-claude-code]]
- [[OS-INDEX]]
