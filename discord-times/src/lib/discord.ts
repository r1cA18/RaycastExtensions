import { readFile } from "fs/promises";
import { basename } from "path";

// Discord allows up to 10 attachments per message. Total payload size is limited
// by the channel's upload limit (~10MB without server boost). Oversized uploads
// are rejected by Discord with a 4xx, which we surface to the caller.
const MAX_ATTACHMENTS = 10;

export async function sendToDiscord(webhookUrl: string, content: string, files: string[]): Promise<void> {
  const trimmed = content.trim();

  if (files.length === 0) {
    await post(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: trimmed }),
    });
    return;
  }

  if (files.length > MAX_ATTACHMENTS) {
    throw new Error(`Too many attachments: ${files.length} (Discord allows up to ${MAX_ATTACHMENTS}).`);
  }

  const form = new FormData();
  // content can be empty when only attachments are sent.
  form.append("payload_json", JSON.stringify({ content: trimmed }));

  await Promise.all(
    files.map(async (filePath, index) => {
      const buffer = await readFile(filePath);
      form.append(`files[${index}]`, new Blob([Uint8Array.from(buffer)]), basename(filePath));
    }),
  );

  // Let fetch set the multipart boundary in the content-type header.
  await post(webhookUrl, { method: "POST", body: form });
}

async function post(url: string, init: RequestInit): Promise<void> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Discord returned ${res.status} ${res.statusText}${body ? `: ${body}` : ""}`);
  }
}
