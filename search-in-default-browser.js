#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title search in default browser
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 🔎
# @raycast.argument1 { "type": "text", "placeholder": "Input Search words or URL", "optional": true }

# Documentation:
# @raycast.author r1cA18
# @raycast.authorURL https://raycast.com/r1cA18

set -euo pipefail

input="${1-}"
input="${input#"${input%%[![:space:]]*}"}"
input="${input%"${input##*[![:space:]]}"}"

if [[ -z "$input" ]]; then
  input="$(/usr/bin/pbpaste | /usr/bin/tr -d '\r')"
  input="${input#"${input%%[![:space:]]*}"}"
  input="${input%"${input##*[![:space:]]}"}"
fi

if [[ -z "$input" ]]; then
  echo "Input not found." >&2
  exit 1
fi

if [[ "$input" =~ ^https?:// ]]; then
  url="$input"
else
  encoded_query="$(/usr/bin/python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$input")"
  url="https://www.google.com/search?q=${encoded_query}"
fi

/usr/bin/open "$url"
