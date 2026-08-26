import { App, Component, MarkdownRenderer, Modal } from "obsidian";
import { CURRENT_RELEASE_NOTES_MARKDOWN } from "../release-notes-content";

class ReleaseNotesModal extends Modal {
  private readonly renderComponent = new Component();
  private resolved = false;

  constructor(app: App, private readonly resolveClosed: () => void) {
    super(app);
  }

  onOpen(): void {
    this.setTitle("Canvas HTML exporter: What's new");
    this.modalEl.addClass("canvas-html-exporter-release-notes-modal");
    this.renderComponent.load();
    const markdownEl = this.contentEl.createDiv({ cls: "markdown-rendered" });

    void MarkdownRenderer.render(
      this.app,
      CURRENT_RELEASE_NOTES_MARKDOWN,
      markdownEl,
      "",
      this.renderComponent,
    ).catch((error: unknown) => {
      console.error("[canvas-html-exporter] Could not render release notes", error);
      markdownEl.setText(CURRENT_RELEASE_NOTES_MARKDOWN);
    });

    const actions = this.contentEl.createDiv({
      cls: "canvas-html-exporter-release-notes-actions",
    });
    const closeButton = actions.createEl("button", {
      text: "Close",
      cls: "mod-cta",
    });
    closeButton.addEventListener("click", () => this.close());
  }

  onClose(): void {
    this.renderComponent.unload();
    this.contentEl.empty();
    if (this.resolved) return;
    this.resolved = true;
    this.resolveClosed();
  }
}

export function openCurrentReleaseNotes(app: App): Promise<void> {
  return new Promise((resolve) => {
    new ReleaseNotesModal(app, resolve).open();
  });
}
