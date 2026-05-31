import { Clipboard } from "@raycast/api";
import { execFile } from "child_process";
import { stat } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/**
 * Resolve a file path from the clipboard for attaching to a message.
 *
 * 1. A file reference (e.g. copied in Finder) is returned directly via Clipboard.read().
 * 2. Raw image data (e.g. a screenshot copied with Cmd+Ctrl+Shift+4) has no file
 *    reference, so we dump the clipboard PNG to a temp file via osascript.
 *
 * Returns undefined when the clipboard holds neither a file nor an image.
 */
export async function getClipboardFile(): Promise<string | undefined> {
  const { file } = await Clipboard.read();
  if (file) {
    return file.startsWith("file://") ? decodeURIComponent(new URL(file).pathname) : file;
  }

  return writeClipboardImageToTemp();
}

async function writeClipboardImageToTemp(): Promise<string | undefined> {
  // A monotonic counter would need module state across calls; the AppleScript
  // path overwrites the same temp file per process, which is fine for a single
  // paste action. Use a per-process suffix to avoid clobbering other sessions.
  const target = join(tmpdir(), `raycast-discord-clip-${process.pid}.png`);

  const script = [
    `set tmpPath to "${target}"`,
    "try",
    "  set pngData to (the clipboard as «class PNGf»)",
    "on error",
    '  return "no-image"',
    "end try",
    "set fh to open for access POSIX file tmpPath with write permission",
    "set eof fh to 0",
    "write pngData to fh",
    "close access fh",
    'return "ok"',
  ].join("\n");

  try {
    const { stdout } = await execFileAsync("osascript", ["-e", script]);
    if (stdout.trim() !== "ok") {
      return undefined;
    }
    const info = await stat(target);
    return info.size > 0 ? target : undefined;
  } catch {
    return undefined;
  }
}
