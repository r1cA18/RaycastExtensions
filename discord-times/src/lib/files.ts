import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/**
 * Open a native macOS file chooser and return the selected POSIX paths.
 * Returns an empty array when the user cancels (osascript exits with -128).
 */
export async function chooseFiles(): Promise<string[]> {
  const script = [
    'set theFiles to choose file with prompt "Select files to attach" with multiple selections allowed',
    'set out to ""',
    "repeat with f in theFiles",
    "  set out to out & (POSIX path of f) & linefeed",
    "end repeat",
    "return out",
  ].join("\n");

  try {
    const { stdout } = await execFileAsync("osascript", ["-e", script]);
    return stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  } catch {
    // User canceled the dialog, or no selection was made.
    return [];
  }
}
