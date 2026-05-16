import { App, FuzzySuggestModal, Notice, TFolder } from "obsidian";
import { getRuntimeRequire, isMobileRuntime, normalizeAbsoluteFolderPath, normalizeStoredOutputPathValue } from "./helpers/desktop-paths";

export async function pickFolderPath(): Promise<string | null> {
  if (isMobileRuntime()) {
    new Notice("System folder selection is available on desktop only.", 5000);
    return null;
  }

  try {
    const requireFn = getRuntimeRequire();
    if (!requireFn) {
      throw new Error("Runtime require is unavailable.");
    }
    const electron = requireFn("electron") as { remote?: { dialog?: { showOpenDialog?: (options: unknown) => Promise<unknown> } } };
    const dialog = (
      electron?.remote?.dialog ||
      (() => { try { return (requireFn("@electron/remote") as { dialog?: unknown }).dialog; } catch { return null; } })()
    ) as { showOpenDialog?: (options: { title: string; properties: string[] }) => Promise<{ canceled?: boolean; filePaths?: string[] }> } | null;

    if (dialog?.showOpenDialog) {
      const result = await dialog.showOpenDialog({
        title: "Choose output folder",
        properties: ["openDirectory", "createDirectory"],
      });
      if (result?.canceled) return null;
      const selected = result?.filePaths?.[0];
      return selected ? normalizeAbsoluteFolderPath(String(selected)) : null;
    }
  } catch (error) {
    console.debug("[canvas-html-exporter] Electron folder picker unavailable", error);
  }

  if (typeof activeDocument === "undefined") {
    new Notice("System folder selection is available on desktop only.", 5000);
    return null;
  }

  return await new Promise((resolve) => {
    const input = createEl("input");
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
        resolve(normalizeAbsoluteFolderPath(selectedPath.replace(/[/\\][^/\\]+$/, "")));
      },
      { once: true },
    );

    input.click();
  });
}

export function normalizeStoredOutputPath(raw: string): string {
  return normalizeStoredOutputPathValue(raw);
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
