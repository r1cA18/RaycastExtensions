#!/usr/bin/env node

// Required parameters:
// @raycast.schemaVersion 1
// @raycast.title Open in Dia
// @raycast.mode silent

// Optional parameters:
// @raycast.icon 🌐
// @raycast.argument1 { "type": "text", "placeholder": "URL or search term (optional)", "optional": true }

// Documentation:
// @raycast.description Open URL or search in Dia browser
// @raycast.author ryo20061018
// @raycast.authorURL https://raycast.com/ryo20061018

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function main() {
  try {
    let url = process.argv[2]; // Raycastからの引数
    
    // 引数がない場合はクリップボードから取得
    if (!url) {
      const { stdout } = await execAsync('pbpaste');
      url = stdout.trim();
    }
    
    // URLかどうかチェック
    if (url.match(/^https?:\/\//)) {
      // そのまま開く
      await execAsync(`open -a "Dia" "${url}"`);
    } else if (url) {
      // URLじゃない場合は検索
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      await execAsync(`open -a "Dia" "${searchUrl}"`);
    } else {
      console.log("No URL or search term provided");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();