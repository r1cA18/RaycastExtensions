import {
  Action,
  ActionPanel,
  closeMainWindow,
  Form,
  getPreferenceValues,
  Icon,
  popToRoot,
  showToast,
  Toast,
} from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { basename } from "path";
import { useState } from "react";
import { getClipboardFile } from "./lib/clipboard";
import { sendToDiscord } from "./lib/discord";
import { chooseFiles } from "./lib/files";

interface Preferences {
  webhookUrl: string;
  label?: string;
}

interface FormValues {
  message: string;
  files: string[];
}

export default function SendForm() {
  const { webhookUrl, label } = getPreferenceValues<Preferences>();
  const target = label ?? "Send to Times";
  const [files, setFiles] = useState<string[]>([]);

  function addFiles(paths: string[]) {
    setFiles((current) => {
      const next = [...current];
      for (const path of paths) {
        if (!next.includes(path)) next.push(path);
      }
      return next;
    });
  }

  async function handleSubmit(values: FormValues) {
    if (!values.message.trim() && values.files.length === 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Nothing to send",
        message: "Enter a message or attach a file",
      });
      return;
    }

    const toast = await showToast({ style: Toast.Style.Animated, title: `Sending to ${target}...` });
    try {
      await sendToDiscord(webhookUrl, values.message, values.files);
      toast.style = Toast.Style.Success;
      toast.title = "Sent";
      await closeMainWindow();
      await popToRoot();
    } catch (error) {
      await showFailureToast(error, { title: "Failed to send" });
    }
  }

  async function addFromDialog() {
    const paths = await chooseFiles();
    if (paths.length === 0) return;
    addFiles(paths);
    await showToast({
      style: Toast.Style.Success,
      title: paths.length === 1 ? "Added 1 file" : `Added ${paths.length} files`,
    });
  }

  async function pasteFromClipboard() {
    const path = await getClipboardFile();
    if (!path) {
      await showToast({ style: Toast.Style.Failure, title: "Clipboard has no image or file" });
      return;
    }
    addFiles([path]);
    await showToast({ style: Toast.Style.Success, title: "Added from clipboard", message: basename(path) });
  }

  const attachmentSummary =
    files.length === 0
      ? "No attachments. Add files or paste from the clipboard."
      : `${files.length} attachment${files.length === 1 ? "" : "s"}: ${files.map((f) => basename(f)).join(", ")}`;

  return (
    <Form
      navigationTitle={target}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.SubmitForm icon={Icon.Upload} title="Send" onSubmit={handleSubmit} />
          </ActionPanel.Section>
          <ActionPanel.Section title="Attachments">
            <Action
              icon={Icon.Paperclip}
              title="Add Files"
              shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
              onAction={addFromDialog}
            />
            <Action
              icon={Icon.Clipboard}
              title="Paste from Clipboard"
              shortcut={{ modifiers: ["cmd", "shift"], key: "v" }}
              onAction={pasteFromClipboard}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="message"
        title="Message"
        placeholder="Type your message, then press Enter to send"
        autoFocus
        enableMarkdown={false}
      />
      <Form.FilePicker
        id="files"
        title="Attachments"
        value={files}
        onChange={setFiles}
        canChooseDirectories={false}
        info="Cmd+Shift+A to add files, Cmd+Shift+V to paste from clipboard"
      />
      <Form.Description title=" " text={attachmentSummary} />
    </Form>
  );
}
