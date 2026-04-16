declare module "obsidian" {
  export class ButtonComponent {
    buttonEl: HTMLElement;
    setButtonText(text: string): ButtonComponent;
    onClick(fn: () => void | Promise<void>): ButtonComponent;
  }

  export class TextComponent {
    inputEl: HTMLInputElement;
    setPlaceholder(value: string): TextComponent;
    setValue(value: string): TextComponent;
    onChange(fn: (value: string) => void | Promise<void>): TextComponent;
  }

  type DropdownComponent = {
    addOption(value: string, label: string): DropdownComponent;
    setValue(value: string): {
      onChange(fn: (value: string) => void | Promise<void>): void;
    };
  };

  export class TAbstractFile {
    path: string;
    name: string;
    parent: TFolder | null;
  }

  export class TFolder extends TAbstractFile {
    children: TAbstractFile[];
  }

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
    getRoot(): TFolder;
    adapter: {
      exists(path: string): Promise<boolean>;
      getBasePath?(): string;
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

  export class FuzzySuggestModal<T> {
    app: App;
    constructor(app: App);
    setPlaceholder(value: string): void;
    open(): void;
    getItems(): T[];
    getItemText(item: T): string;
    onChooseItem(item: T, evt?: MouseEvent | KeyboardEvent): void;
  }

  export class Notice {
    constructor(message: string, timeout?: number);
  }

  export class Setting {
    constructor(containerEl: unknown);
    setName(name: string): this;
    setDesc(desc: string): this;
    addToggle(cb: (toggle: { setValue(value: boolean): { onChange(fn: (value: boolean) => void | Promise<void>): void } }) => void): this;
    addDropdown(cb: (dropdown: DropdownComponent) => void): this;
    addText(cb: (text: TextComponent) => void): this;
    addButton(cb: (button: ButtonComponent) => void): this;
  }

  export function normalizePath(path: string): string;
}
