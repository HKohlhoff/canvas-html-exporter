import path from "node:path";
import { App, FuzzySuggestModal, TFolder } from "obsidian";

export async function pickFolderPath(): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const electron = require("electron");
    const dialog =
      electron?.remote?.dialog ||
      (() => { try { return require("@electron/remote").dialog; } catch { return null; } })();

    if (dialog?.showOpenDialog) {
      const result = await dialog.showOpenDialog({
        title: "Choose output folder",
        properties: ["openDirectory", "createDirectory"],
      });
      if (result?.canceled) return null;
      const selected = result?.filePaths?.[0];
      return selected ? normalizeAbsoluteFolderPath(String(selected)) : null;
    }
  } catch {
    // Fallback below.
  }

  return await new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(null);
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    (input as HTMLInputElement & { webkitdirectory?: boolean; directory?: boolean }).webkitdirectory = true;
    (input as HTMLInputElement & { webkitdirectory?: boolean; directory?: boolean }).directory = true;
    input.multiple = true;

    input.addEventListener(
      "change",
      () => {
        const files = input.files ?? [];
        if (!files.length) return resolve(null);
        const anyFile = files[0] as { path?: string };
        const selectedPath = typeof anyFile?.path === "string" ? anyFile.path : "";
        if (!selectedPath) return resolve(null);
        resolve(normalizeAbsoluteFolderPath(selectedPath.replace(/[\\/][^\\/]+$/, "")));
      },
      { once: true },
    );

    input.click();
  });
}

export function normalizeStoredOutputPath(raw: string): string {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (path.isAbsolute(value)) {
    return normalizeAbsoluteFolderPath(value);
  }
  if (value === "/" || value === ".") return "/";
  return value.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}

function normalizeAbsoluteFolderPath(raw: string): string {
  return path.normalize(raw).replace(/\\/g, "/");
}

function collectVaultFolders(app: App): TFolder[] {
  const folders: TFolder[] = [];
  const visit = (folder: TFolder) => {
    folders.push(folder);
    for (const child of folder.children ?? []) {
      if (child instanceof TFolder) {
        visit(child);
      }
    }
  };
  visit(app.vault.getRoot());
  return folders;
}

class VaultFolderPickerModal extends FuzzySuggestModal<TFolder> {
  private readonly onPick: (folder: TFolder) => void;

  constructor(app: App, onPick: (folder: TFolder) => void) {
    super(app);
    this.onPick = onPick;
    this.setPlaceholder("Type to search folders in the vault...");
  }

  getItems(): TFolder[] {
    return collectVaultFolders(this.app);
  }

  getItemText(item: TFolder): string {
    return item.path || "/";
  }

  onChooseItem(item: TFolder): void {
    this.onPick(item);
  }
}

export function openVaultFolderPicker(app: App, onPickPath: (vaultPath: string) => void): void {
  new VaultFolderPickerModal(app, (folder) => {
    const nextPath = folder.path || "/";
    onPickPath(nextPath);
  }).open();
}
