#!/etc/profiles/per-user/r1ca18/bin/node

// Required parameters:
// @raycast.schemaVersion 1
// @raycast.title search in default browser
// @raycast.mode silent

// Optional parameters:
// @raycast.icon 🔎
// @raycast.argument1 { "type": "text", "placeholder": "Input Search words or URL", "optional": true }

// Documentation:
// @raycast.author r1cA18
// @raycast.authorURL https://raycast.com/r1cA18

const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

async function main() {
  try {
    let input = (process.argv[2] || "").trim();

    // もし引数が空ならクリップボードから
    if (!input) {
      const { stdout } = await execAsync("pbpaste");
      input = stdout.trim();
      if (input) {
        console.log("📋 クリップボードから取得しました");
      }
    }

    if (!input) {
      console.error("Input not found.");
      process.exit(1);
    }

    let url;
    if (/^https?:\/\//i.test(input)) {
      url = input;
    } else {
      url = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
    }

    await execAsync(`open "${url}"`)
  } catch (e) {
    console.error("Error:", e.message);
    process.exit(1);
  }
}

main();