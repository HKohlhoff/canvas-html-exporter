import { App, Component, MarkdownRenderer, Modal } from "obsidian";

import README_MARKDOWN from "../../README.md";
import { prepareReadmeMarkdown } from "./readme-content";

const REPOSITORY_URL = "https://github.com/HKohlhoff/canvas-html-exporter";

class ReadmeModal extends Modal {
  private readonly renderComponent = new Component();

  onOpen(): void {
    this.setTitle("Canvas HTML exporter: README");
    this.modalEl.addClass("canvas-html-exporter-release-notes-modal");
    this.renderComponent.load();
    const markdownEl = this.contentEl.createDiv({ cls: "markdown-rendered" });
    const markdown = prepareReadmeMarkdown(README_MARKDOWN, REPOSITORY_URL);

    void MarkdownRenderer.render(
      this.app,
      markdown,
      markdownEl,
      "",
      this.renderComponent,
    ).catch((error: unknown) => {
      console.error("[canvas-html-exporter] Could not render README", error);
      markdownEl.setText(markdown);
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
  }
}

export function openPluginReadme(app: App): void {
  new ReadmeModal(app).open();
}
