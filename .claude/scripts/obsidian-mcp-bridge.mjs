#!/usr/bin/env node
// stdio <-> streamable-HTTP bridge for the Obsidian Local REST API MCP server.
//
// Why this exists: the plugin serves MCP over HTTPS on 127.0.0.1:27124 with a self-signed
// certificate. Claude Code's native HTTP transport rejects it (DEPTH_ZERO_SELF_SIGNED_CERT) and
// there is no per-server way to hand it a CA. This bridge speaks stdio to Claude Code and HTTPS
// to the plugin, trusting the plugin's own CA for this one connection only. No global trust, no
// NODE_TLS_REJECT_UNAUTHORIZED, no third-party package.
//
// Env:
//   OBSIDIAN_MCP_URL   full MCP endpoint (default https://127.0.0.1:27124/mcp/)
//   OBSIDIAN_API_KEY   bearer token from the plugin settings (required)
//   OBSIDIAN_CA_FILE   path to the plugin's CA cert (required)

import fs from "node:fs";
import https from "node:https";
import readline from "node:readline";

const ENDPOINT = process.env.OBSIDIAN_MCP_URL || "https://127.0.0.1:27124/mcp/";
const TOKEN = process.env.OBSIDIAN_API_KEY;
const CA_FILE = process.env.OBSIDIAN_CA_FILE;

function die(msg) {
  process.stderr.write(`obsidian-mcp-bridge: ${msg}\n`);
  process.exit(1);
}

if (!TOKEN) die("OBSIDIAN_API_KEY is not set");
if (!CA_FILE || !fs.existsSync(CA_FILE)) die(`OBSIDIAN_CA_FILE not found: ${CA_FILE}`);

const url = new URL(ENDPOINT);
const agent = new https.Agent({ ca: fs.readFileSync(CA_FILE), keepAlive: true });

let sessionId = null;

function write(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

// Turn one SSE event block into stdout lines.
function emitEvent(block) {
  const data = block
    .split("\n")
    .filter((l) => l.startsWith("data:"))
    .map((l) => l.slice(5).trimStart())
    .join("\n");
  if (!data) return;
  try {
    write(JSON.parse(data));
  } catch {
    process.stderr.write(`obsidian-mcp-bridge: unparsable SSE data: ${data.slice(0, 200)}\n`);
  }
}

// Read an SSE body, splitting on blank lines.
function consumeSse(res, onDone) {
  let buf = "";
  res.setEncoding("utf8");
  res.on("data", (chunk) => {
    buf += chunk.replace(/\r\n/g, "\n");
    let i;
    while ((i = buf.indexOf("\n\n")) !== -1) {
      emitEvent(buf.slice(0, i));
      buf = buf.slice(i + 2);
    }
  });
  res.on("end", () => {
    if (buf.trim()) emitEvent(buf);
    if (onDone) onDone();
  });
}

function post(message) {
  return new Promise((resolve) => {
    const body = JSON.stringify(message);
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${TOKEN}`,
      "Content-Length": Buffer.byteLength(body),
    };
    if (sessionId) headers["mcp-session-id"] = sessionId;

    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: "POST",
        headers,
        agent,
      },
      (res) => {
        const sid = res.headers["mcp-session-id"];
        if (sid) sessionId = sid;

        // 202 with no body: notification accepted, nothing to relay.
        if (res.statusCode === 202) {
          res.resume();
          res.on("end", resolve);
          return;
        }

        const ct = String(res.headers["content-type"] || "");
        if (ct.includes("text/event-stream")) {
          consumeSse(res, resolve);
          return;
        }

        let buf = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (buf += c));
        res.on("end", () => {
          const text = buf.trim();
          if (text) {
            try {
              const parsed = JSON.parse(text);
              if (Array.isArray(parsed)) parsed.forEach(write);
              else write(parsed);
            } catch {
              process.stderr.write(
                `obsidian-mcp-bridge: HTTP ${res.statusCode} non-JSON body: ${text.slice(0, 300)}\n`,
              );
              if (message.id !== undefined) {
                write({
                  jsonrpc: "2.0",
                  id: message.id,
                  error: { code: -32000, message: `HTTP ${res.statusCode} from ${ENDPOINT}` },
                });
              }
            }
          }
          resolve();
        });
      },
    );

    req.on("error", (err) => {
      process.stderr.write(`obsidian-mcp-bridge: request failed: ${err.code || err.message}\n`);
      if (message.id !== undefined) {
        write({
          jsonrpc: "2.0",
          id: message.id,
          error: { code: -32000, message: `bridge transport error: ${err.code || err.message}` },
        });
      }
      resolve();
    });

    req.end(body);
  });
}

// Server-initiated messages arrive on a long-lived GET stream. Optional: a server that does not
// support it answers 405 and we simply carry on without push notifications.
let listenerOpen = false;
function openListener() {
  if (listenerOpen || !sessionId) return;
  listenerOpen = true;
  const req = https.request(
    {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        Authorization: `Bearer ${TOKEN}`,
        "mcp-session-id": sessionId,
      },
      agent,
    },
    (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        listenerOpen = false;
        return;
      }
      consumeSse(res, () => {
        listenerOpen = false;
      });
    },
  );
  req.on("error", () => {
    listenerOpen = false;
  });
  req.end();
}

// Requests are relayed one at a time so the session id from initialize is in place before
// anything else goes out.
let chain = Promise.resolve();

const rl = readline.createInterface({ input: process.stdin, terminal: false });

rl.on("line", (line) => {
  const text = line.trim();
  if (!text) return;
  let message;
  try {
    message = JSON.parse(text);
  } catch {
    process.stderr.write(`obsidian-mcp-bridge: bad JSON on stdin: ${text.slice(0, 200)}\n`);
    return;
  }
  chain = chain.then(() => post(message)).then(openListener);
});

rl.on("close", () => {
  chain.then(() => process.exit(0));
});
