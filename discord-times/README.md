# Discord Times

Post text, images, videos and files to a Discord channel via webhook, straight from Raycast.

Open a command, the cursor lands in the message box, type, and press Enter to post. Attach files with the
file picker, or pull the clipboard (including screenshots) into the attachments with one action.

## Commands (slots)

Three independent send commands. Each has its own webhook URL and label, so you can assign a different Raycast
alias / hotkey to each one and post to a different channel:

- **times-r1ca18** -- visible to everyone in the server
- **times-private** -- visible only to you
- **tasks** -- task registration channel

To repurpose a slot, just change its command `title` and the `webhookUrl` preference. Disable the slots you do
not use from Raycast's extension settings.

## Setup

Per command (slot), set in Raycast preferences:

- **Webhook URL** -- the Discord webhook URL for that channel (Server Settings -> Integrations -> Webhooks).
- **Label** -- a name to identify the webhook. Shown in the form title only; it does not change the Discord
  sender name (that stays whatever the webhook is configured with).

## Usage

1. Trigger a slot via its alias/hotkey.
2. The cursor is already in the message field -- type your message.
3. Optionally add attachments: the file picker, `Cmd+Shift+A` to open a file chooser, or `Cmd+Shift+V` to add
   the clipboard image/file.
4. Press Enter to post.

## Notes

- Clipboard paste handles both file references (e.g. copied in Finder) and raw image data (e.g. a screenshot
  copied with `Cmd+Ctrl+Shift+4`); the latter is dumped to a temp PNG via `osascript`.
- Discord allows up to 10 attachments per message, and the total size is bound by the channel's upload limit
  (~10MB without server boost). Oversized uploads are rejected by Discord and surfaced as a toast.
