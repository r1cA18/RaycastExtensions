# RaycastExtensions

Personal collection of [Raycast](https://www.raycast.com/) script commands and extensions.

## Script Commands

Standalone scripts that can be added to Raycast's Script Commands directory.

### Notion Quick Inbox

Quick add pages to a Notion inbox database. Accepts a title/memo as text or a URL (auto-fetches page title via `og:title` / `<title>`). Falls back to clipboard content when no argument is provided.

```
notion-quick-inbox.js
```

**Setup:** Copy `.env.example` to `.env` and fill in your Notion API key and database ID.

```
NOTION_API_KEY=secret_xxxxx
NOTION_DATABASE_ID=xxxxxxxx
```

**Usage:**

- `notion-quick-inbox <URL>` -- Creates a page with the fetched title and a bookmark block
- `notion-quick-inbox <title> <memo>` -- Creates a page with the given title and memo
- `notion-quick-inbox` (no args) -- Reads from clipboard

### Search in Default Browser

Opens a Google search (or a raw URL) in the default browser.

```
search-in-default-browser.js
```

**Usage:**

- `search-in-default-browser <query>` -- Google search
- `search-in-default-browser <URL>` -- Opens the URL directly
- No args -- Reads from clipboard

### Open in Dia

Same as above, but opens in [Dia](https://www.diabrowser.com/) browser.

```
search-in-dia.js
```

## Extensions

Full Raycast extensions built with `@raycast/api`.

### Beeper Desktop (`raycast/`)

Manage [Beeper Desktop](https://www.beeper.com/) from Raycast. Lists accounts, finds chats, and focuses the app window. Requires Beeper Desktop API to be enabled.

See [`raycast/README.md`](raycast/README.md) for setup details.

## Installation

### Script Commands

1. Clone this repository
2. Open Raycast Settings > Extensions > Script Commands
3. Add the repository root as a script directory
4. For Notion Quick Inbox, create a `.env` file from `.env.example`

### Beeper Extension

```sh
cd raycast
npm install
npm run dev
```

## License

MIT
