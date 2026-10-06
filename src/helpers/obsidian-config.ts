import type { App } from "obsidian";

type VaultWithConfig = {
  getConfig?: (key: string) => unknown;
};

export function shouldShowInlineTitle(app: App): boolean {
  try {
    const value = (app.vault as unknown as VaultWithConfig).getConfig?.("showInlineTitle");
    return typeof value === "boolean" ? value : true;
  } catch {
    return true;
  }
}
