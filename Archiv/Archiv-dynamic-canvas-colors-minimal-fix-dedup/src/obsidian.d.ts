declare module "obsidian" {
  export class TAbstractFile {
    path: string;
    name: string;
    parent: TFolder | null;
  }

  export class TFolder extends TAbstractFile {}

  export class TFile extends TAbstractFile {
    basename: string;
    extension: string;
  }

  export class Vault {
    read(file: TFile): Promise<string>;
    readBinary(file: TFile): Promise<ArrayBuffer>;
    create(path: string, data: string): Promise<TFile>;
    createBinary(path: string, data: ArrayBuffer): Promise<TFile>;
    createFolder(path: string): Promise<void>;
    modify(file: TFile, data: string): Promise<void>;
    modifyBinary(file: TFile, data: ArrayBuffer): Promise<void>;
    getAbstractFileByPath(path: string): TAbstractFile | null;
    adapter: {
      exists(path: string): Promise<boolean>;
    };
  }

  export class Workspace {
    getActiveFile(): TFile | null;
  }

  export class MetadataCache {
    getFirstLinkpathDest(linkpath: string, sourcePath: string): TFile | null;
  }

  export class App {
    vault: Vault;
    workspace: Workspace;
    metadataCache: MetadataCache;
  }

  export class Plugin {
    app: App;
    addRibbonIcon(icon: string, title: string, callback: () => void | Promise<void>): void;
    addCommand(command: { id: string; name: string; callback: () => void | Promise<void> }): void;
    addSettingTab(tab: PluginSettingTab): void;
    loadData(): Promise<unknown>;
    saveData(data: unknown): Promise<void>;
  }

  export class PluginSettingTab {
    app: App;
    containerEl: {
      empty(): void;
      createEl(tag: string, options?: { text?: string }): void;
    };
    constructor(app: App, plugin: Plugin);
    display(): void;
  }

  export class Notice {
    constructor(message: string, timeout?: number);
  }

  export class Setting {
    constructor(containerEl: unknown);
    setName(name: string): this;
    setDesc(desc: string): this;
    addToggle(cb: (toggle: { setValue(value: boolean): { onChange(fn: (value: boolean) => void | Promise<void>): void } }) => void): this;
    addText(cb: (text: { setPlaceholder(value: string): { setValue(value: string): { onChange(fn: (value: string) => void | Promise<void>): void } } }) => void): this;
  }

  export function normalizePath(path: string): string;
}
