#!/etc/profiles/per-user/r1ca18/bin/node

// Required parameters:
// @raycast.schemaVersion 1
// @raycast.title Notion Quick Inbox
// @raycast.mode silent
// Optional parameters:
// @raycast.icon N
// @raycast.argument1 { "type": "text", "placeholder": "Title Memo or URL", "optional": true }
// Documentation:
// @raycast.description Quick add pages to Notion inbox database
// @raycast.author ryo20061018
// @raycast.authorURL https://raycast.com/ryo20061018

const { readFileSync } = require("fs");
const { join } = require("path");
const { execFileSync } = require("child_process");

// -- env --

function loadEnv() {
  const candidates = [join(__dirname, ".env"), join(process.cwd(), ".env")];
  for (const p of candidates) {
    try {
      const content = readFileSync(p, "utf-8");
      const env = {};
      for (const line of content.split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const i = t.indexOf("=");
        if (i === -1) continue;
        env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
      }
      return env;
    } catch {}
  }
  throw new Error(`.env not found (searched: ${candidates.join(", ")})`);
}

const env = loadEnv();
const NOTION_API_KEY = env.NOTION_API_KEY;
const DATABASE_ID = env.NOTION_DATABASE_ID;

if (!NOTION_API_KEY) throw new Error("NOTION_API_KEY is not set in .env");
if (!DATABASE_ID) throw new Error("NOTION_DATABASE_ID is not set in .env");

const API_VERSION = "2022-06-28";
const BASE_URL = "https://api.notion.com/v1";
const FETCH_TIMEOUT_MS = 10_000;

// -- util --

function isURL(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function decodeHTMLEntities(str) {
  const entities = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&#x27;": "'",
    "&#x2F;": "/",
    "&nbsp;": " ",
  };
  let result = str;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replaceAll(entity, char);
  }
  return result.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function getClipboard() {
  try {
    return execFileSync("pbpaste", { encoding: "utf-8", timeout: 3000 }).trim();
  } catch {
    return "";
  }
}

// -- fetch with timeout --

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// -- title extraction --

async function fetchTitle(url) {
  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      },
      redirect: "follow",
    });
    if (!res.ok) return url;
    const html = await res.text();

    const ogMatch =
      html.match(
        /<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i,
      );
    if (ogMatch) return decodeHTMLEntities(ogMatch[1].trim());

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      const decoded = decodeHTMLEntities(titleMatch[1].trim());
      if (decoded) return decoded;
    }

    return url;
  } catch {
    return url;
  }
}

// -- notion api --

async function notionRequest(path, method, body) {
  const res = await fetchWithTimeout(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": API_VERSION,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion API ${res.status}: ${text}`);
  }
  return res.json();
}

async function createPage({ title, memo, url }) {
  const properties = {
    Name: { title: [{ text: { content: title } }] },
  };
  if (memo) {
    properties.Memo = { rich_text: [{ text: { content: memo } }] };
  }

  const page = await notionRequest("/pages", "POST", {
    parent: { database_id: DATABASE_ID },
    properties,
  });

  if (url) {
    await notionRequest(`/blocks/${page.id}/children`, "PATCH", {
      children: [{ type: "bookmark", bookmark: { url } }],
    });
  }

  return page.id;
}

// -- input parsing --

function parseInput(raw) {
  const input = raw.trim();
  if (isURL(input)) {
    return { type: "url", url: input };
  }
  const spaceIdx = input.indexOf(" ");
  if (spaceIdx === -1) {
    return { type: "text", title: input, memo: null };
  }
  return {
    type: "text",
    title: input.slice(0, spaceIdx),
    memo: input.slice(spaceIdx + 1),
  };
}

// -- main --

async function main() {
  let input = (process.argv[2] || "").trim();

  if (!input) {
    input = getClipboard();
  }

  if (!input) {
    console.error("No input provided");
    process.exit(1);
  }

  const parsed = parseInput(input);

  if (parsed.type === "url") {
    const title = await fetchTitle(parsed.url);
    await createPage({ title, memo: null, url: parsed.url });
    console.log(`Created: ${title}`);
  } else {
    await createPage({ title: parsed.title, memo: parsed.memo, url: null });
    console.log(`Created: ${parsed.title}`);
  }
}

main().catch((e) => {
  console.error(`Error: ${e.message}`);
  process.exit(1);
});
